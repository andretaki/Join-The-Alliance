# Employee Application Portal

A modern, elegant web application for Alliance Chemical’s external candidates—featuring AI-powered resume parsing, step-by-step guidance, secure digital signatures, and flexible resume intake (upload or email-forward).

## Target Audience

- **External job candidates** applying for open positions at Alliance Chemical  
- **HR & hiring managers** reviewing and processing applications

## Desired Features

### 1. Position Selection
- [ ] Dropdown or searchable list of **Available Positions**  
  - [ ] “Customer Service Specialist”  
  - [ ] “Warehouse Associate”  
- [ ] Validation: must select one before proceeding

### 2. Personal Information
- [ ] Form fields for **Full Name**, **Email**, **Phone**  
- [ ] Address block (street, city, state, zip)  
- [ ] Optional “How did you hear about us?” dropdown  

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
  - [ ] “Add another” entry button  
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
- [ ] “Previous” / “Next” controls  
- [ ] Final **Review** screen summarizing all inputs  
- [ ] “Submit” triggers:  
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

An advanced, long-term feature enabling live conversational screening using AWS and generative AI:

Candidate Interaction via Amazon Connect

Connect plays initial Polly prompts (e.g., “Hi, I’d like to place an order…”)

Candidate responds; Connect records audio

Real-Time Transcription & Context Assembly

Connect streams audio to a Lambda

Lambda uses Amazon Transcribe Streaming for low-latency transcripts

Maintain dialogue context in Lambda state

LLM-Driven Follow-Up Generation

Lambda invokes a streaming LLM endpoint (Amazon Bedrock, SageMaker hosting, or OpenAI GPT-4 API)

Prompt includes: previous customer script, candidate transcript, and screening objectives

Dynamic Prompt Synthesis & Playback

LLM output → Amazon Polly synthesis → Connect plays next question

Loop Until Completion

Repeat transcription → LLM → Polly cycle for each turn

Record full call for post-call analysis

Post-Call Scoring & Review

Store transcript, generated prompts, and metadata in DynamoDB/RDS

Use Amazon Comprehend or custom logic to score responses

Architectural Considerations

Latency: Leverage streaming APIs to maintain <500ms round-trip

Context Management: Keep a rolling window of recent turns

Cost Optimization: Balance model size for real-time vs. batch analysis

Fallbacks: Default to static prompts on errors/timeouts

Compliance: Inform candidates of recording and AI usage