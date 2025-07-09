# Employee Application Portal

A modern, elegant web application for Alliance Chemical's external candidates—featuring AI-powered resume parsing, step-by-step guidance, secure digital signatures, and flexible resume intake (upload or email-forward).

## Target Audience

- **External job candidates** applying for open positions at Alliance Chemical  
- **HR & hiring managers** reviewing and processing applications

## Desired Features

### 1. Position Selection
- [x] Dropdown or searchable list of **Available Positions**  
  - [x] "Customer Service Specialist"  
  - [x] "Warehouse Associate"  
- [x] Validation: must select one before proceeding

### 2. Personal Information
- [ ] Form fields for **Full Name**, **Email**, **Phone**  
- [ ] Address block (street, city, state, zip)  
- [ ] Optional "How did you hear about us?" dropdown  

### 3. Resume Intake & AI Parsing
- [ ] **Option A: File Upload** (PDF, DOCX; max 10 MB)  
- [ ] **Option B: Email-Forward**  
  - [ ] Unique forwarding address (e.g., jobs@alliancechemical.com)  
  - [ ] Incoming attachments automatically stored to S3  
- [ ] AI-driven parsing:  
  - [ ] Extract employment history into **Experience** section  
  - [ ] Summarize key skills & accomplishments  
  - [ ] Screen for required qualifications  
- [ ] AI autosuggest: pre-fill form fields (e.g., dates, titles)

### 4. Documents & Supplementals
- [ ] Optional upload: cover letter, ID  
- [ ] File-type & size validation

### 5. Experience & Education
- [ ] **Experience** editor (populated by AI)  
  - [ ] Company, title, dates, responsibilities  
  - [ ] "Add another" entry button  
- [ ] **Education** entries (institution, degree, graduation date)  

### 6. References
- [ ] Up to three **reference** entries (name, relationship, contact info)  
- [ ] Validate email/phone formats  

### 7. Digital Signature
- [ ] **Draw-on-screen** pad or **upload signature image**  
- [ ] Store signature securely in S3 & DB  
- [ ] Log timestamp & IP for compliance  

### 8. Review & Submit
- [ ] **Stepper navigation** with icons:  
  - 💼 Position → 👤 Personal Info → 📄 Documents → 🏢 Experience → 🎓 Education → 👥 References → ✍️ Signature  
- [ ] "Previous" / "Next" controls  
- [ ] Final **Review** screen summarizing all inputs  
- [ ] "Submit" triggers:  
  - Confirmation email to candidate  
  - Notification to HR with application details

## Design Requests

- [ ] **Modern & Elegant** UI:  
  - White cards, soft shadows, 2xl rounded corners  
  - Alliance Chemical branding: logo, green/blue palette  
- [ ] **Responsive & Mobile-First** layout  
- [ ] **Accessible**: WCAG 2.1 AA compliance (keyboard nav, ARIA labels)  

## Technical & Integrations

- **Tech stack**: Next.js 14, React, Drizzle ORM, AWS S3, OpenAI embeddings  
- **Email intake**: Microsoft Graph or SES for forwarded resumes  
- **Storage**: S3 for files; PostgreSQL for metadata  
- **Notifications**: HR email via Microsoft Graph API  

## Success Metrics & Other Notes

- **Metrics**: time to complete, step drop-off rates, submission rate  
- **Security**: encryption at rest & in transit, audit logs  
- **Open Questions**:  
  - What forwarding email address should we provision?  
  - Do we need auto-reply to confirm receipt of forwarded resumes?  
  - Timeline & milestones for MVP delivery  

## Future Enhancement: Real-Time LLM-Driven Screening Call

An advanced, long-term feature enabling live conversational screening using Vercel serverless functions and generative AI:

### Core Architecture (Vercel-Based)

**Candidate Interaction via Amazon Connect**
- Connect plays initial Polly prompts (e.g., "Hi, I'd like to place an order…")
- Candidate responds; Connect records audio
- Integration with Vercel API routes via webhooks

**Real-Time Processing with Vercel Functions**
- Connect streams audio to Vercel API routes (`/api/screening/process-audio`)
- OpenAI Whisper API for low-latency transcription
- Vercel KV for conversation state management
- Vercel Edge Functions for ultra-low latency preprocessing

**LLM-Driven Conversation Generation**
- Vercel serverless functions invoke OpenAI GPT-4 API
- Dynamic prompt engineering based on conversation context
- Conversation history maintained in Vercel KV (Redis)
- Real-time scoring and evaluation

**Audio Synthesis & Playback**
- LLM output → AWS Polly synthesis → Connect plays response
- Vercel Blob storage for audio files
- Streaming audio responses for minimal latency

**Post-Call Analytics & Scoring**
- Store transcripts and metadata in Vercel Postgres
- OpenAI API for comprehensive response analysis
- Integration with existing application scoring system
- Real-time dashboard for HR teams

### Technical Implementation

**Vercel API Routes Structure:**
```
/api/screening/
├── start-call.ts          # Initialize screening session
├── process-audio.ts       # Handle audio transcription
├── generate-response.ts   # LLM conversation generation
├── synthesize-speech.ts   # Text-to-speech conversion
├── end-call.ts           # Finalize and score call
├── schedule.ts           # Schedule screening calls
└── webhook/
    └── connect.ts        # Amazon Connect webhook handler
```

**Key Technologies:**
- **Vercel Serverless Functions**: Replace AWS Lambda for processing
- **Vercel Edge Functions**: Ultra-low latency audio preprocessing
- **Vercel KV**: Redis-based conversation state management
- **Vercel Postgres**: Database for call records and scoring
- **OpenAI APIs**: Whisper (transcription) + GPT-4 (conversation)
- **AWS Services**: Connect (telephony) + Polly (speech synthesis)

### Implementation Roadmap

**Phase 1: Foundation (Weeks 1-4)**
- [ ] Set up Amazon Connect instance and basic call flow
- [ ] Create Vercel API routes for audio processing
- [ ] Implement OpenAI Whisper integration for transcription
- [ ] Set up Vercel KV for conversation state management
- [ ] Build basic conversation context tracking

**Phase 2: Core Features (Weeks 5-8)**
- [ ] Integrate OpenAI GPT-4 for conversation generation
- [ ] Add AWS Polly text-to-speech synthesis
- [ ] Implement real-time conversation loop
- [ ] Create basic scoring algorithm
- [ ] Build admin dashboard for call monitoring

**Phase 3: Advanced Features (Weeks 9-12)**
- [ ] Add comprehensive post-call analytics
- [ ] Implement candidate scheduling system
- [ ] Create HR notification system
- [ ] Build conversation quality metrics
- [ ] Add multi-position screening workflows

**Phase 4: Production Ready (Weeks 13-16)**
- [ ] Performance optimization and caching
- [ ] Security hardening and compliance features
- [ ] Comprehensive testing and QA
- [ ] Integration with existing application system
- [ ] Documentation and training materials

### Architectural Considerations

**Performance Optimization:**
- Leverage Vercel Edge Functions for <200ms processing
- Stream audio chunks for real-time processing
- Conversation context caching in Vercel KV
- Global deployment for low-latency access

**Cost Management:**
- Vercel's pay-per-use pricing model
- Efficient API usage with request batching
- Conversation state expiry (1-hour TTL)
- Optimized LLM prompt engineering

**Scalability & Reliability:**
- Vercel's automatic scaling
- Fallback to static prompts on API failures
- Circuit breaker patterns for external services
- Comprehensive error handling and logging

**Compliance & Security:**
- Explicit candidate consent for recording and AI processing
- Conversation data encryption at rest and in transit
- GDPR/CCPA compliance with data retention policies
- Audit logging for all interactions

### Success Metrics & Evaluation

**Call Quality Metrics:**
- Average call duration and completion rates
- Transcription accuracy and confidence scores
- Candidate satisfaction ratings
- HR evaluation of screening effectiveness

**Technical Performance:**
- API response times and latency measurements
- System uptime and reliability metrics
- Cost per screening call
- Scalability under load

**Business Impact:**
- Reduction in manual screening time
- Improved candidate quality scores
- Faster hiring pipeline progression
- Enhanced candidate experience ratings