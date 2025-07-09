# Real-Time LLM-Driven Screening Call Architecture

## Overview
An advanced screening system that conducts live, AI-powered phone interviews with job candidates using AWS services and generative AI.

## System Architecture

### Core Components

#### 1. Amazon Connect Integration
- **Phone System**: Amazon Connect handles inbound/outbound calls
- **Initial Prompts**: Pre-recorded Polly audio files for greeting and instructions
- **Call Recording**: Full conversation recording for compliance and analysis
- **Contact Flow**: Dynamic routing based on candidate responses

#### 2. Real-Time Processing Pipeline
```
Candidate Speech → Connect → Lambda → Transcribe → LLM → Polly → Connect → Audio Output
```

#### 3. AWS Services Stack
- **Amazon Connect**: Call management and audio streaming
- **AWS Lambda**: Real-time processing logic
- **Amazon Transcribe Streaming**: Low-latency speech-to-text
- **Amazon Polly**: Text-to-speech synthesis
- **Amazon Bedrock/OpenAI**: LLM for conversation generation
- **DynamoDB**: Session state and conversation history
- **Amazon S3**: Audio recordings and transcripts
- **Amazon Comprehend**: Post-call sentiment analysis

## Implementation Details

### Lambda Function Architecture

#### Core Processing Lambda (`screening-call-processor`)
```typescript
// Real-time conversation handler
export const handler = async (event: ConnectEvent) => {
  const conversationId = event.Details.ContactData.ContactId;
  
  // 1. Retrieve conversation context
  const context = await getConversationContext(conversationId);
  
  // 2. Process incoming audio stream
  const transcript = await transcribeAudio(event.audioStream);
  
  // 3. Generate LLM response
  const llmResponse = await generateLLMResponse(context, transcript);
  
  // 4. Synthesize audio response
  const audioUrl = await synthesizeResponse(llmResponse);
  
  // 5. Update conversation state
  await updateConversationContext(conversationId, transcript, llmResponse);
  
  return {
    audioUrl,
    nextAction: llmResponse.nextAction,
    shouldContinue: llmResponse.shouldContinue
  };
};
```

#### Transcription Handler (`audio-transcriber`)
```typescript
// Stream audio to Amazon Transcribe
export const transcribeAudio = async (audioStream: Buffer): Promise<string> => {
  const transcribeClient = new TranscribeStreamingClient({});
  
  const command = new StartStreamTranscriptionCommand({
    LanguageCode: 'en-US',
    MediaSampleRateHertz: 8000,
    MediaEncoding: 'pcm'
  });
  
  // Process streaming audio in real-time
  const response = await transcribeClient.send(command);
  return processTranscriptionStream(response.TranscriptResultStream);
};
```

#### LLM Integration (`conversation-generator`)
```typescript
// Generate dynamic conversation responses
export const generateLLMResponse = async (
  context: ConversationContext,
  candidateResponse: string
): Promise<LLMResponse> => {
  const prompt = buildConversationPrompt(context, candidateResponse);
  
  const bedrockClient = new BedrockRuntimeClient({});
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 200,
      temperature: 0.7
    })
  });
  
  const response = await bedrockClient.send(command);
  return parseAIResponse(response.body);
};
```

### Conversation Prompt Engineering

#### System Prompt Template
```typescript
const SCREENING_SYSTEM_PROMPT = `
You are conducting a phone screening interview for Alliance Chemical. 
You're evaluating candidates for customer service and warehouse positions.

CONTEXT:
- Position: {position}
- Candidate Name: {candidateName}
- Previous Responses: {conversationHistory}

SCREENING OBJECTIVES:
1. Communication skills and clarity
2. Customer service experience
3. Chemical/industrial experience (if applicable)
4. Availability and scheduling
5. Problem-solving abilities

CONVERSATION RULES:
- Keep responses under 30 seconds when spoken
- Ask one question at a time
- Be professional but conversational
- Probe for specific examples
- Transition smoothly between topics

CURRENT SITUATION:
Customer scenario: "Hi, I need to order some industrial cleaning chemicals for my facility..."

Generate your next response based on the candidate's answer: "{candidateResponse}"
`;
```

#### Dynamic Prompt Builder
```typescript
export const buildConversationPrompt = (
  context: ConversationContext,
  candidateResponse: string
): string => {
  const promptData = {
    position: context.position,
    candidateName: context.candidateName,
    conversationHistory: context.history.slice(-3), // Last 3 turns
    candidateResponse,
    currentPhase: context.currentPhase,
    timeElapsed: context.timeElapsed
  };
  
  return SCREENING_SYSTEM_PROMPT.replace(
    /{(\w+)}/g,
    (match, key) => promptData[key] || match
  );
};
```

### Amazon Connect Flow Configuration

#### Contact Flow Structure
```json
{
  "Version": "2019-10-30",
  "StartAction": "greeting",
  "Actions": {
    "greeting": {
      "Type": "MessageParticipant",
      "Parameters": {
        "Text": "Thank you for calling Alliance Chemical. This is an automated screening call."
      },
      "Transitions": {
        "NextAction": "start_screening"
      }
    },
    "start_screening": {
      "Type": "InvokeAWSLambdaFunction",
      "Parameters": {
        "FunctionArn": "arn:aws:lambda:us-east-1:123456789012:function:screening-call-processor",
        "InvocationTimeLimitSeconds": 30
      },
      "Transitions": {
        "NextAction": "process_response"
      }
    },
    "process_response": {
      "Type": "PlayPrompt",
      "Parameters": {
        "AudioPrompt": {
          "AudioSource": "S3",
          "S3Location": "$.audioUrl"
        }
      },
      "Transitions": {
        "NextAction": "wait_for_response"
      }
    }
  }
}
```

### Real-Time State Management

#### Conversation Context Schema
```typescript
interface ConversationContext {
  conversationId: string;
  candidateName: string;
  position: string;
  startTime: Date;
  currentPhase: 'introduction' | 'experience' | 'scenario' | 'closing';
  history: ConversationTurn[];
  scores: {
    communication: number;
    experience: number;
    problemSolving: number;
    overall: number;
  };
  metadata: {
    phoneNumber: string;
    timeElapsed: number;
    turnCount: number;
  };
}

interface ConversationTurn {
  timestamp: Date;
  speaker: 'ai' | 'candidate';
  content: string;
  audioUrl?: string;
  confidence?: number;
}
```

#### DynamoDB Schema
```typescript
// Conversation Sessions Table
const conversationTable = {
  TableName: 'ScreeningConversations',
  KeySchema: [
    { AttributeName: 'conversationId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'conversationId', AttributeType: 'S' },
    { AttributeName: 'candidatePhone', AttributeType: 'S' },
    { AttributeName: 'startTime', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [{
    IndexName: 'candidate-phone-index',
    KeySchema: [
      { AttributeName: 'candidatePhone', KeyType: 'HASH' },
      { AttributeName: 'startTime', KeyType: 'RANGE' }
    ]
  }]
};
```

### Post-Call Analytics

#### Scoring Algorithm
```typescript
export const calculateScreeningScores = async (
  conversationId: string
): Promise<ScreeningScores> => {
  const conversation = await getConversationHistory(conversationId);
  
  // Communication Score (0-100)
  const communicationScore = await analyzeCommunication(conversation);
  
  // Experience Score (0-100)
  const experienceScore = await analyzeExperience(conversation);
  
  // Problem-Solving Score (0-100)
  const problemSolvingScore = await analyzeProblemSolving(conversation);
  
  // Overall weighted score
  const overallScore = (
    communicationScore * 0.4 +
    experienceScore * 0.3 +
    problemSolvingScore * 0.3
  );
  
  return {
    communication: communicationScore,
    experience: experienceScore,
    problemSolving: problemSolvingScore,
    overall: overallScore,
    recommendation: overallScore >= 75 ? 'RECOMMEND' : 'REVIEW'
  };
};
```

#### Amazon Comprehend Integration
```typescript
export const analyzeCommunication = async (
  conversation: ConversationTurn[]
): Promise<number> => {
  const comprehendClient = new ComprehendClient({});
  
  const candidateResponses = conversation
    .filter(turn => turn.speaker === 'candidate')
    .map(turn => turn.content)
    .join(' ');
  
  // Sentiment Analysis
  const sentimentCommand = new DetectSentimentCommand({
    Text: candidateResponses,
    LanguageCode: 'en'
  });
  
  const sentiment = await comprehendClient.send(sentimentCommand);
  
  // Key Phrases
  const keyPhrasesCommand = new DetectKeyPhrasesCommand({
    Text: candidateResponses,
    LanguageCode: 'en'
  });
  
  const keyPhrases = await comprehendClient.send(keyPhrasesCommand);
  
  return calculateCommunicationScore(sentiment, keyPhrases);
};
```

## Performance Optimization

### Latency Considerations
- **Target**: <500ms round-trip time
- **Streaming**: Use WebSocket connections for real-time audio
- **Caching**: Pre-warm Lambda functions
- **Regional**: Deploy in multiple AWS regions

### Cost Optimization
- **Model Selection**: Balance accuracy vs. inference cost
- **Batch Processing**: Queue non-urgent analytics
- **Resource Scaling**: Auto-scale Lambda concurrency
- **Storage Tiers**: Use S3 IA for older recordings

## Security & Compliance

### Data Protection
- **Encryption**: At-rest and in-transit encryption
- **Access Control**: IAM roles and policies
- **Audit Logging**: CloudTrail for all API calls
- **Data Retention**: Configurable retention policies

### Compliance Requirements
- **Recording Disclosure**: Inform candidates of recording
- **Consent**: Explicit consent for AI processing
- **Data Residency**: Keep data in specified regions
- **GDPR/CCPA**: Right to deletion and data portability

## Monitoring & Alerting

### CloudWatch Metrics
```typescript
const metrics = {
  'CallDuration': 'Average call duration',
  'TranscriptionAccuracy': 'Transcription confidence scores',
  'LLMLatency': 'Time to generate responses',
  'ErrorRate': 'Failed call processing rate',
  'CandidateSatisfaction': 'Post-call survey scores'
};
```

### Alerting Thresholds
- **High Latency**: >1 second response time
- **Low Accuracy**: <85% transcription confidence
- **Error Rate**: >5% failed calls
- **Cost Anomalies**: Unexpected spending spikes

## Integration with Existing System

### Employee Application Portal
```typescript
// Add screening call scheduling to application form
const ScreeningCallScheduler = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const scheduleScreeningCall = async (candidateId: string, timeSlot: string) => {
    const response = await fetch('/api/screening-calls/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        timeSlot,
        position: formData.position,
        phoneNumber: formData.personalInfo.phone
      })
    });
    
    return response.json();
  };
  
  return (
    <div className="screening-scheduler">
      <h3>Schedule Your Screening Call</h3>
      <p>Complete your application with a brief phone conversation.</p>
      {/* Time slot picker UI */}
    </div>
  );
};
```

### Database Schema Updates
```sql
-- Add screening call results to applications
ALTER TABLE employee_applications 
ADD COLUMN screening_call_id VARCHAR(255),
ADD COLUMN screening_score INTEGER,
ADD COLUMN screening_recommendation VARCHAR(50),
ADD COLUMN screening_completed_at TIMESTAMP;

-- Create screening calls table
CREATE TABLE screening_calls (
  id VARCHAR(255) PRIMARY KEY,
  candidate_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  duration_seconds INTEGER,
  conversation_transcript TEXT,
  scores JSONB,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- Set up Amazon Connect instance
- Create basic Lambda functions
- Implement simple transcription pipeline
- Build DynamoDB schema

### Phase 2: Core Features (Weeks 5-8)
- Integrate LLM conversation generation
- Add Polly text-to-speech
- Implement conversation state management
- Create basic scoring algorithm

### Phase 3: Advanced Features (Weeks 9-12)
- Add real-time analytics
- Implement comprehensive scoring
- Build admin dashboard
- Add monitoring and alerting

### Phase 4: Production Ready (Weeks 13-16)
- Performance optimization
- Security hardening
- Compliance features
- Integration testing

## Future Enhancements

### Multi-Language Support
- Support for Spanish-speaking candidates
- Dynamic language detection
- Localized conversation flows

### Advanced AI Features
- Emotion detection in voice
- Personality assessment
- Predictive success modeling
- Bias detection and mitigation

### Integration Expansions
- Video call support
- Integration with ATS systems
- Multi-channel screening (SMS, chat)
- Mobile app for candidates

This architecture provides a robust foundation for implementing the real-time LLM-driven screening call system while maintaining high performance, security, and scalability.