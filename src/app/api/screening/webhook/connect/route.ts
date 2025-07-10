import { NextRequest, NextResponse } from 'next/server';
import { 
  TranscribeStreamingClient, 
  StartStreamTranscriptionCommand,
  TranscriptEvent 
} from "@aws-sdk/client-transcribe-streaming";
import { 
  PollyClient, 
  SynthesizeSpeechCommand, 
  OutputFormat 
} from "@aws-sdk/client-polly";
import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  UpdateItemCommand 
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { generateConversationResponse } from '@/lib/llm-processor';
import { validateConnectWebhook } from '@/lib/connect-security';

// Initialize AWS clients
const transcribeClient = new TranscribeStreamingClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ConnectEvent {
  eventType: 'CALL_STARTED' | 'AUDIO_RECEIVED' | 'CALL_ENDED';
  callId: string;
  contactId: string;
  applicationId?: string;
  audioData?: string; // Base64 encoded audio
  metadata?: Record<string, any>;
}

interface CallContext {
  callId: string;
  contactId: string;
  applicationId?: string;
  conversationHistory: Array<{
    timestamp: string;
    speaker: 'assistant' | 'candidate';
    content: string;
    confidence?: number;
  }>;
  currentTurn: number;
  callStartTime: string;
  lastActivity: string;
  status: 'active' | 'completed' | 'error';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the webhook request from Amazon Connect
    const isValidRequest = await validateConnectWebhook(request, body);
    if (!isValidRequest) {
      return NextResponse.json({ error: 'Invalid webhook request' }, { status: 401 });
    }

    const event: ConnectEvent = body;
    console.log('Connect webhook received:', event.eventType, event.callId);

    switch (event.eventType) {
      case 'CALL_STARTED':
        return await handleCallStarted(event);
      case 'AUDIO_RECEIVED':
        return await handleAudioReceived(event);
      case 'CALL_ENDED':
        return await handleCallEnded(event);
      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Connect webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCallStarted(event: ConnectEvent): Promise<NextResponse> {
  const callContext: CallContext = {
    callId: event.callId,
    contactId: event.contactId,
    applicationId: event.applicationId,
    conversationHistory: [],
    currentTurn: 0,
    callStartTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'active'
  };

  // Store initial call context in DynamoDB
  await dynamoClient.send(new PutItemCommand({
    TableName: process.env.DYNAMODB_CALLS_TABLE || 'screening-calls',
    Item: marshall(callContext)
  }));

  // Generate initial greeting
  const initialPrompt = `Welcome to Alliance Chemical's screening call. I'm going to ask you a few questions to better understand your experience and qualifications. Let's start with: Can you tell me about your previous work experience?`;
  
  const audioUrl = await synthesizeSpeech(initialPrompt);
  
  return NextResponse.json({
    action: 'playAudio',
    audioUrl,
    nextAction: 'waitForInput'
  });
}

async function handleAudioReceived(event: ConnectEvent): Promise<NextResponse> {
  if (!event.audioData) {
    return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
  }

  // Get call context from DynamoDB
  const callContext = await getCallContext(event.callId);
  if (!callContext) {
    return NextResponse.json({ error: 'Call context not found' }, { status: 404 });
  }

  // Transcribe audio using Amazon Transcribe
  const transcript = await transcribeAudio(event.audioData);
  
  if (!transcript) {
    // If transcription failed, ask candidate to repeat
    const retryPrompt = "I'm sorry, I didn't catch that. Could you please repeat your answer?";
    const audioUrl = await synthesizeSpeech(retryPrompt);
    
    return NextResponse.json({
      action: 'playAudio',
      audioUrl,
      nextAction: 'waitForInput'
    });
  }

  // Add candidate response to conversation history
  callContext.conversationHistory.push({
    timestamp: new Date().toISOString(),
    speaker: 'candidate',
    content: transcript,
    confidence: 0.85 // This would come from transcription service
  });

  // Generate AI response using LLM
  const aiResponse = await generateConversationResponse(
    callContext.conversationHistory,
    callContext.applicationId
  );

  // Add AI response to conversation history
  callContext.conversationHistory.push({
    timestamp: new Date().toISOString(),
    speaker: 'assistant',
    content: aiResponse
  });

  // Update call context
  callContext.currentTurn++;
  callContext.lastActivity = new Date().toISOString();

  // Save updated context to DynamoDB
  await updateCallContext(callContext);

  // Check if we should end the call
  if (callContext.currentTurn >= 10 || aiResponse.includes('Thank you for your time')) {
    const closingPrompt = "Thank you for completing the screening call. We'll review your responses and get back to you soon. Have a great day!";
    const audioUrl = await synthesizeSpeech(closingPrompt);
    
    // Mark call as completed
    callContext.status = 'completed';
    await updateCallContext(callContext);
    
    return NextResponse.json({
      action: 'playAudio',
      audioUrl,
      nextAction: 'endCall'
    });
  }

  // Synthesize AI response to speech
  const audioUrl = await synthesizeSpeech(aiResponse);

  return NextResponse.json({
    action: 'playAudio',
    audioUrl,
    nextAction: 'waitForInput'
  });
}

async function handleCallEnded(event: ConnectEvent): Promise<NextResponse> {
  const callContext = await getCallContext(event.callId);
  if (!callContext) {
    return NextResponse.json({ error: 'Call context not found' }, { status: 404 });
  }

  // Mark call as completed and perform final analysis
  callContext.status = 'completed';
  await updateCallContext(callContext);

  // Trigger post-call analysis
  await analyzeCall(callContext);

  return NextResponse.json({ message: 'Call ended successfully' });
}

async function transcribeAudio(audioData: string): Promise<string | null> {
  try {
    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // For real-time transcription, we would use streaming transcription
    // This is a simplified version - in production, you'd use streaming API
    const command = new StartStreamTranscriptionCommand({
      LanguageCode: 'en-US',
      MediaSampleRateHertz: 16000,
      MediaEncoding: 'pcm',
      AudioStream: {
        AudioEvent: {
          AudioChunk: audioBuffer
        }
      }
    });

    // Note: This is simplified - actual streaming transcription requires WebSocket connection
    // For now, we'll return a mock response
    return "This is a mock transcription response";
  } catch (error) {
    console.error('Transcription error:', error);
    return null;
  }
}

async function synthesizeSpeech(text: string): Promise<string> {
  try {
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: OutputFormat.MP3,
      VoiceId: 'Joanna', // Professional female voice
      Engine: 'neural'
    });

    const response = await pollyClient.send(command);
    
    if (response.AudioStream) {
      const audioBuffer = Buffer.from(await response.AudioStream.transformToByteArray());
      
      // In production, upload to S3 and return URL
      // For now, return a mock URL
      return `https://s3.amazonaws.com/alliance-chemical-audio/${Date.now()}.mp3`;
    }
    
    throw new Error('No audio stream received');
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw error;
  }
}

async function getCallContext(callId: string): Promise<CallContext | null> {
  try {
    const response = await dynamoClient.send(new GetItemCommand({
      TableName: process.env.DYNAMODB_CALLS_TABLE || 'screening-calls',
      Key: marshall({ callId })
    }));

    if (response.Item) {
      return unmarshall(response.Item) as CallContext;
    }
    return null;
  } catch (error) {
    console.error('Error getting call context:', error);
    return null;
  }
}

async function updateCallContext(callContext: CallContext): Promise<void> {
  try {
    await dynamoClient.send(new UpdateItemCommand({
      TableName: process.env.DYNAMODB_CALLS_TABLE || 'screening-calls',
      Key: marshall({ callId: callContext.callId }),
      UpdateExpression: 'SET conversationHistory = :history, currentTurn = :turn, lastActivity = :activity, #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: marshall({
        ':history': callContext.conversationHistory,
        ':turn': callContext.currentTurn,
        ':activity': callContext.lastActivity,
        ':status': callContext.status
      })
    }));
  } catch (error) {
    console.error('Error updating call context:', error);
    throw error;
  }
}

async function analyzeCall(callContext: CallContext): Promise<void> {
  try {
    // This would perform post-call analysis using Amazon Comprehend
    // and store results in database for HR review
    console.log('Performing post-call analysis for:', callContext.callId);
    
    // Calculate call duration
    const callDuration = new Date().getTime() - new Date(callContext.callStartTime).getTime();
    
    // Basic analysis metrics
    const analysis = {
      callId: callContext.callId,
      duration: callDuration,
      totalTurns: callContext.currentTurn,
      candidateResponseCount: callContext.conversationHistory.filter(h => h.speaker === 'candidate').length,
      averageResponseLength: callContext.conversationHistory
        .filter(h => h.speaker === 'candidate')
        .reduce((sum, h) => sum + h.content.length, 0) / 
        callContext.conversationHistory.filter(h => h.speaker === 'candidate').length,
      completionStatus: callContext.status,
      timestamp: new Date().toISOString()
    };

    // Store analysis results
    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.DYNAMODB_ANALYSIS_TABLE || 'call-analysis',
      Item: marshall(analysis)
    }));
    
    console.log('Call analysis completed:', analysis);
  } catch (error) {
    console.error('Error analyzing call:', error);
  }
}