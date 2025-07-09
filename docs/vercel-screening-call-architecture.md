# Vercel-Based Real-Time LLM Screening Call Architecture

## Overview
Real-time AI-powered phone screening system using Vercel's serverless functions, Amazon Connect, and edge computing for optimal performance.

## Architecture Overview

### Core Components with Vercel
```
Candidate Speech → Amazon Connect → Vercel API Routes → External APIs → Response
```

### Tech Stack
- **Vercel Serverless Functions**: Replace AWS Lambda
- **Vercel Edge Functions**: Ultra-low latency processing
- **Vercel KV**: Redis-based state management
- **Amazon Connect**: Phone system (still needed for telephony)
- **External APIs**: OpenAI, AWS Transcribe, AWS Polly
- **Vercel Postgres**: Database for call records

## Serverless Function Architecture

### API Routes Structure
```
/api/screening/
├── start-call.ts          # Initialize screening call
├── process-audio.ts       # Handle audio processing
├── generate-response.ts   # LLM conversation generation
├── synthesize-speech.ts   # Text-to-speech
├── end-call.ts           # Finalize and score call
└── webhook/
    └── connect.ts        # Amazon Connect webhook
```

### Core Processing Functions

#### `/api/screening/process-audio.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  const { contactId, audioData } = await request.json();
  
  try {
    // 1. Retrieve conversation context from Vercel KV
    const context = await kv.get(`call:${contactId}`);
    
    // 2. Transcribe audio using OpenAI Whisper API
    const transcript = await transcribeAudio(audioData);
    
    // 3. Generate LLM response
    const llmResponse = await fetch('/api/screening/generate-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, transcript })
    });
    
    const response = await llmResponse.json();
    
    // 4. Update conversation state
    await kv.set(`call:${contactId}`, {
      ...context,
      history: [...context.history, {
        timestamp: new Date(),
        speaker: 'candidate',
        content: transcript
      }, {
        timestamp: new Date(),
        speaker: 'ai',
        content: response.text
      }]
    });
    
    return NextResponse.json({
      success: true,
      audioUrl: response.audioUrl,
      shouldContinue: response.shouldContinue
    });
    
  } catch (error) {
    console.error('Audio processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

// Transcription using OpenAI Whisper
async function transcribeAudio(audioData: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'multipart/form-data'
    },
    body: new FormData().append('file', audioData).append('model', 'whisper-1')
  });
  
  const result = await response.json();
  return result.text;
}
```

#### `/api/screening/generate-response.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { context, transcript } = await request.json();
  
  try {
    const prompt = buildScreeningPrompt(context, transcript);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: SCREENING_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
      stream: false
    });
    
    const responseText = completion.choices[0].message.content;
    
    // Generate audio using AWS Polly or ElevenLabs
    const audioUrl = await synthesizeSpeech(responseText);
    
    return NextResponse.json({
      text: responseText,
      audioUrl,
      shouldContinue: !responseText.includes('[END_CALL]')
    });
    
  } catch (error) {
    console.error('LLM generation error:', error);
    return NextResponse.json(
      { error: 'Response generation failed' },
      { status: 500 }
    );
  }
}

const SCREENING_SYSTEM_PROMPT = `
You are an AI interviewer for Alliance Chemical conducting phone screenings.
You're evaluating candidates for customer service and warehouse positions.

CONVERSATION RULES:
- Keep responses under 25 seconds when spoken
- Ask one focused question at a time
- Be professional but conversational
- Probe for specific examples when relevant
- End with [END_CALL] when screening is complete

EVALUATION CRITERIA:
1. Communication clarity and professionalism
2. Customer service experience and approach
3. Problem-solving abilities
4. Availability and reliability
5. Interest in chemical/industrial work

CURRENT SCENARIO:
You're role-playing as a customer calling Alliance Chemical.
The candidate should handle your "order" professionally.
`;
```

#### `/api/screening/synthesize-speech.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const polly = new AWS.Polly({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  
  try {
    const params = {
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: 'Joanna', // Professional female voice
      Engine: 'neural'
    };
    
    const result = await polly.synthesizeSpeech(params).promise();
    
    // Upload to Vercel Blob or return as base64
    const audioBase64 = result.AudioStream?.toString('base64');
    
    return NextResponse.json({
      audioUrl: `data:audio/mp3;base64,${audioBase64}`,
      success: true
    });
    
  } catch (error) {
    console.error('Speech synthesis error:', error);
    return NextResponse.json(
      { error: 'Speech synthesis failed' },
      { status: 500 }
    );
  }
}
```

### Edge Functions for Low Latency

#### `/api/screening/edge-processor.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Ultra-fast preprocessing at the edge
  const { audioChunk, contactId } = await request.json();
  
  // Pre-process audio for better transcription
  const processedAudio = await preprocessAudio(audioChunk);
  
  // Forward to main processing
  const response = await fetch(`${request.nextUrl.origin}/api/screening/process-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactId,
      audioData: processedAudio
    })
  });
  
  return response;
}

async function preprocessAudio(audioChunk: string): Promise<string> {
  // Noise reduction, normalization, etc.
  // This runs at the edge for minimal latency
  return audioChunk;
}
```

## State Management with Vercel KV

### Conversation State Schema
```typescript
interface ConversationState {
  contactId: string;
  candidateName: string;
  candidatePhone: string;
  position: string;
  startTime: Date;
  currentPhase: 'greeting' | 'roleplay' | 'questions' | 'closing';
  history: ConversationTurn[];
  scores: {
    communication: number;
    problemSolving: number;
    experience: number;
    professionalism: number;
  };
  metadata: {
    duration: number;
    turnCount: number;
    interruptions: number;
  };
}
```

### KV Operations
```typescript
import { kv } from '@vercel/kv';

// Store conversation state
export async function saveConversationState(
  contactId: string, 
  state: ConversationState
): Promise<void> {
  await kv.set(`call:${contactId}`, state, { ex: 3600 }); // 1 hour expiry
}

// Retrieve conversation state
export async function getConversationState(
  contactId: string
): Promise<ConversationState | null> {
  return await kv.get(`call:${contactId}`);
}

// Store final results
export async function saveScreeningResults(
  contactId: string,
  results: ScreeningResults
): Promise<void> {
  await kv.set(`results:${contactId}`, results, { ex: 86400 }); // 24 hours
}
```

## Database Integration with Vercel Postgres

### Schema Updates
```sql
-- Add screening calls table
CREATE TABLE screening_calls (
  id SERIAL PRIMARY KEY,
  contact_id VARCHAR(255) UNIQUE NOT NULL,
  candidate_id INTEGER REFERENCES employee_applications(id),
  phone_number VARCHAR(20) NOT NULL,
  scheduled_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  duration_seconds INTEGER,
  conversation_transcript JSONB,
  scores JSONB,
  overall_score INTEGER,
  recommendation VARCHAR(50),
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX idx_screening_calls_contact_id ON screening_calls(contact_id);
CREATE INDEX idx_screening_calls_candidate_id ON screening_calls(candidate_id);
```

### Database Operations
```typescript
// /lib/screening-db.ts
import { sql } from '@vercel/postgres';

export async function saveScreeningCall(data: {
  contactId: string;
  candidateId: number;
  phoneNumber: string;
  transcript: any;
  scores: any;
  overallScore: number;
  recommendation: string;
  durationSeconds: number;
}) {
  const { rows } = await sql`
    INSERT INTO screening_calls (
      contact_id, candidate_id, phone_number, 
      conversation_transcript, scores, overall_score, 
      recommendation, duration_seconds, status
    ) VALUES (
      ${data.contactId}, ${data.candidateId}, ${data.phoneNumber},
      ${JSON.stringify(data.transcript)}, ${JSON.stringify(data.scores)},
      ${data.overallScore}, ${data.recommendation}, ${data.durationSeconds},
      'completed'
    )
    RETURNING id
  `;
  
  return rows[0];
}

export async function getScreeningResults(candidateId: number) {
  const { rows } = await sql`
    SELECT * FROM screening_calls 
    WHERE candidate_id = ${candidateId}
    ORDER BY created_at DESC
  `;
  
  return rows;
}
```

## Amazon Connect Integration

### Connect Contact Flow
```json
{
  "Version": "2019-10-30",
  "StartAction": "greeting",
  "Actions": {
    "greeting": {
      "Type": "MessageParticipant",
      "Parameters": {
        "Text": "Thank you for calling Alliance Chemical. This is your scheduled screening call."
      },
      "Transitions": {
        "NextAction": "initialize_screening"
      }
    },
    "initialize_screening": {
      "Type": "InvokeExternalResource",
      "Parameters": {
        "URI": "https://your-vercel-app.vercel.app/api/screening/start-call",
        "Method": "POST",
        "RequestBody": {
          "ContactId": "$.ContactId",
          "CustomerNumber": "$.CustomerEndpoint.Address"
        }
      },
      "Transitions": {
        "NextAction": "conversation_loop"
      }
    },
    "conversation_loop": {
      "Type": "GetUserInput",
      "Parameters": {
        "InputTimeLimitSeconds": 30,
        "MaxDigits": 0
      },
      "Transitions": {
        "NextAction": "process_response",
        "Timeout": "end_call"
      }
    },
    "process_response": {
      "Type": "InvokeExternalResource",
      "Parameters": {
        "URI": "https://your-vercel-app.vercel.app/api/screening/process-audio",
        "Method": "POST",
        "RequestBody": {
          "ContactId": "$.ContactId",
          "AudioData": "$.StoredUserInput"
        }
      },
      "Transitions": {
        "NextAction": "play_ai_response"
      }
    }
  }
}
```

### Webhook Handler
```typescript
// /api/screening/webhook/connect.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const connectEvent = await request.json();
  
  const { ContactId, EventType, AudioData } = connectEvent;
  
  switch (EventType) {
    case 'CALL_STARTED':
      await initializeScreeningCall(ContactId);
      break;
      
    case 'AUDIO_RECEIVED':
      await processAudioInput(ContactId, AudioData);
      break;
      
    case 'CALL_ENDED':
      await finalizeScreeningCall(ContactId);
      break;
  }
  
  return NextResponse.json({ success: true });
}
```

## Performance Optimizations

### Vercel-Specific Optimizations
```typescript
// Optimize for Vercel's 10-second timeout
export const config = {
  maxDuration: 10,
  regions: ['iad1'], // East US for low latency
};

// Use streaming for long-running operations
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Process in chunks to avoid timeout
      processInChunks(request, controller, encoder);
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

### Caching Strategy
```typescript
// Cache conversation prompts and responses
import { unstable_cache } from 'next/cache';

export const getCachedPrompt = unstable_cache(
  async (phase: string, position: string) => {
    return generatePromptTemplate(phase, position);
  },
  ['screening-prompt'],
  { revalidate: 3600 } // 1 hour
);
```

## Integration with Employee Application

### Application Form Updates
```typescript
// Add screening call scheduling to the form
const ScreeningCallStep = () => {
  const [callScheduled, setCallScheduled] = useState(false);
  
  const scheduleCall = async () => {
    const response = await fetch('/api/screening/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: applicationData.id,
        phoneNumber: applicationData.personalInfo.phone,
        preferredTime: selectedTime,
        position: applicationData.position
      })
    });
    
    if (response.ok) {
      setCallScheduled(true);
    }
  };
  
  return (
    <div className="screening-call-step">
      <h3>Final Step: Screening Call</h3>
      <p>Complete your application with a brief phone conversation.</p>
      
      {!callScheduled ? (
        <TimeSlotPicker onSchedule={scheduleCall} />
      ) : (
        <div className="call-scheduled">
          <p>✓ Your screening call is scheduled!</p>
          <p>You'll receive a call at {selectedTime}</p>
        </div>
      )}
    </div>
  );
};
```

### Scheduling API
```typescript
// /api/screening/schedule.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  const { candidateId, phoneNumber, preferredTime, position } = await request.json();
  
  // Generate unique contact ID
  const contactId = `screening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Save to database
  await sql`
    INSERT INTO screening_calls (
      contact_id, candidate_id, phone_number, 
      scheduled_time, status
    ) VALUES (
      ${contactId}, ${candidateId}, ${phoneNumber},
      ${preferredTime}, 'scheduled'
    )
  `;
  
  // Schedule the call via Amazon Connect API
  await scheduleConnectCall(contactId, phoneNumber, preferredTime);
  
  return NextResponse.json({ 
    success: true, 
    contactId,
    scheduledTime: preferredTime
  });
}
```

## Monitoring and Analytics

### Vercel Analytics Integration
```typescript
// /lib/analytics.ts
import { track } from '@vercel/analytics';

export function trackScreeningEvent(event: string, data: any) {
  track('screening_call', {
    event,
    ...data
  });
}

// Usage in API routes
trackScreeningEvent('call_started', {
  contactId,
  position,
  candidateId
});

trackScreeningEvent('call_completed', {
  contactId,
  duration: durationSeconds,
  overallScore,
  recommendation
});
```

### Real-time Monitoring Dashboard
```typescript
// /app/admin/screening-dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ScreeningDashboard() {
  const [activeCalls, setActiveCalls] = useState([]);
  const [completedCalls, setCompletedCalls] = useState([]);
  
  useEffect(() => {
    // Real-time updates via Server-Sent Events
    const eventSource = new EventSource('/api/screening/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'call_started') {
        setActiveCalls(prev => [...prev, data.call]);
      } else if (data.type === 'call_completed') {
        setActiveCalls(prev => prev.filter(call => call.id !== data.call.id));
        setCompletedCalls(prev => [data.call, ...prev]);
      }
    };
    
    return () => eventSource.close();
  }, []);
  
  return (
    <div className="screening-dashboard">
      <h1>Screening Call Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2>Active Calls ({activeCalls.length})</h2>
          {activeCalls.map(call => (
            <CallCard key={call.id} call={call} />
          ))}
        </div>
        
        <div>
          <h2>Completed Calls</h2>
          {completedCalls.map(call => (
            <CompletedCallCard key={call.id} call={call} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

This Vercel-based architecture provides the same capabilities as the AWS Lambda version but leverages Vercel's serverless infrastructure for better integration with your existing application.