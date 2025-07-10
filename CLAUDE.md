# Alliance Chemical - Employee Application System

## Project Overview

This is a comprehensive employee application system built for Alliance Chemical, a chemical distribution company. The system provides a modern, secure, and user-friendly interface for potential employees to apply for positions, with particular focus on the Customer Service Specialist role.

**Target Audience:**
- External job candidates applying for open positions at Alliance Chemical
- HR & hiring managers reviewing and processing applications

## Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom responsive design
- **Forms**: React Hook Form with Zod validation
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Microsoft Graph API integration
- **File Storage**: AWS S3 for resume and document storage
- **AI Integration**: OpenAI GPT for resume parsing and application scoring
- **Email**: Microsoft Graph for email processing
- **Testing**: Jest with React Testing Library
- **Type Safety**: TypeScript throughout

## Key Features

### 🎯 Multi-Step Application Process
The application follows a comprehensive 8-step process with stepper navigation:

1. **💼 Position Selection**: 
   - Dropdown/searchable list of available positions
   - Currently: "Customer Service Specialist" 
   - Future: "Warehouse Associate" and others
   - Validation: Must select position before proceeding

2. **📝 Role Assessment**: 
   - Comprehensive evaluation questions specific to selected role
   - Skills assessment (TMS MyCarrier, Shopify, Amazon Seller Central, Excel)
   - Scenario-based questions for customer service situations
   - Experience level ratings and motivation assessments

3. **👤 Personal Information**: 
   - Complete contact details (name, email, phone, address)
   - Personal identifiers (SSN, DOB, driver's license)
   - Emergency contact information
   - Work preferences and availability
   - Optional "How did you hear about us?" field

4. **📄 Document Upload**: 
   - **Option A**: File upload (PDF, DOCX; max 10 MB)
   - **Option B**: Email-forward capability (planned)
   - Resume and ID document handling with AI parsing
   - File type and size validation
   - Secure storage in AWS S3

5. **🏢 Work Experience**: 
   - Dynamic work history with AI-assisted data entry
   - Company, title, dates, responsibilities
   - "Add another" entry functionality
   - AI pre-fills from resume parsing

6. **🎓 Education**: 
   - Educational background collection
   - Institution, degree, graduation date, GPA
   - Multiple education entries supported

7. **👥 References**: 
   - Up to three professional references
   - Name, relationship, company, contact info
   - Email/phone format validation
   - Years known tracking

8. **✍️ Digital Signature**: 
   - Draw-on-screen signature pad or typed signature
   - Secure signature capture and verification
   - Timestamp and IP logging for compliance
   - Legal document generation

### 🤖 AI-Powered Features
- **Resume Parsing**: Automatic extraction of work experience and skills
- **Application Scoring**: AI-based candidate evaluation system
- **Content Analysis**: Smart processing of uploaded documents

### 🔒 Security & Privacy
- **Data Encryption**: All sensitive information is encrypted
- **Secure File Upload**: Validated file types and sizes
- **Digital Signatures**: Legally compliant signature collection
- **Background Check Integration**: Streamlined verification process
- **GDPR Compliance**: Privacy-focused data handling

### 📱 Modern UI/UX
- **Responsive Design**: Mobile-first approach with elegant animations
- **Progressive Enhancement**: Works without JavaScript for core functionality
- **Accessibility**: WCAG 2.1 AA compliant
- **Visual Feedback**: Clear progress indicators and validation messages
- **Smooth Animations**: Subtle hover effects and transitions

## Architecture

### Frontend Components

#### `EmployeeApplicationForm.tsx`
- Main application form with 8 distinct steps
- Form validation using Zod schema
- Dynamic field arrays for experience and education
- AI-powered resume parsing integration
- Digital signature capture
- Progress tracking and step validation

#### `Navbar.tsx`
- Responsive navigation with mobile menu
- Company branding and contact information
- Smooth animations and hover effects
- Accessibility-compliant keyboard navigation

#### `DigitalSignature.tsx`
- Canvas-based signature capture
- Typed signature option
- Signature validation and storage
- PDF generation for legal documents

### Backend APIs

#### `/api/employee-applications/route.ts`
- Application submission endpoint
- Data validation and sanitization
- Database persistence
- Email notification system

#### `/api/parse-resume/route.ts`
- AI-powered resume parsing
- Document format validation
- Structured data extraction
- Integration with OpenAI GPT

#### `/api/email-health/route.ts`
- Email system health monitoring
- Microsoft Graph API integration
- Queue status checking

### Database Schema

#### Applications Table
- Complete application data storage
- JSON fields for complex data structures
- Audit trail and timestamps
- Secure sensitive data handling

#### Employee Schema
- Structured employee information
- Work experience tracking
- Education and certification records
- Reference management

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Type checking
npm run type-check

# Security audit
npm run security-audit

# Database operations
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio

# Secure build process
npm run build-secure
```

## Environment Variables

Required environment variables (see `ENVIRONMENT_VARIABLES.md` for details):

```env
# Database
DATABASE_URL=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# OpenAI
OPENAI_API_KEY=

# Microsoft Graph
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=

# Application
NEXT_PUBLIC_APP_URL=
```

## Security Features

### Input Validation
- Zod schema validation on all forms
- File type and size restrictions
- SQL injection prevention
- XSS protection

### Data Protection
- Encryption at rest and in transit
- Secure file upload handling
- PII data anonymization options
- GDPR compliance tools

### Authentication & Authorization
- Microsoft Graph integration
- Role-based access control
- Session management
- API rate limiting

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- API endpoint testing
- Utility function testing
- Form validation testing

### Integration Tests
- End-to-end application flow
- Database integration
- External API integration
- Email system testing

### Security Tests
- Vulnerability scanning
- Input validation testing
- Authentication flow testing
- Data encryption verification

## Deployment

### Vercel Configuration
- Automated deployments from Git
- Environment variable management
- Edge function optimization
- CDN integration

### Database Migrations
- Automated schema updates
- Data migration scripts
- Rollback procedures
- Backup strategies

## Recent Improvements

### UI/UX Enhancements
- ✅ Removed "Lightning Fast" text from homepage
- ✅ Fixed mobile layout for job descriptions
- ✅ Removed "Remote Friendly" badge
- ✅ Enhanced navbar with elegant hover animations
- ✅ Added smooth transitions and micro-interactions
- ✅ Fixed dropdown text visibility issues
- ✅ Removed unnecessary Tab navigation instructions

### Performance Optimizations
- Lazy loading for non-critical components
- Image optimization with Next.js
- Code splitting for reduced bundle sizes
- API response caching

## Future Enhancements

### Planned Features
- Multi-language support
- Advanced analytics dashboard
- Video interview scheduling
- Skills assessment integration
- Automated reference checking

### Technical Improvements
- GraphQL API implementation
- Real-time notifications
- PWA capabilities
- Advanced caching strategies

## Support & Maintenance

### Monitoring
- Application performance monitoring
- Error tracking and logging
- User analytics
- Security monitoring

### Documentation
- API documentation
- Component library
- Developer guides
- User manuals

## Contact Information

For technical support or questions about this system:
- **Company**: Alliance Chemical
- **Phone**: (512) 365-6838
- **Website**: https://alliancechemical.com

## Contributing

When working on this project:

1. **Code Style**: Follow the existing TypeScript and React patterns
2. **Testing**: Write tests for new features
3. **Security**: Always validate inputs and sanitize data
4. **Performance**: Consider mobile users and slow connections
5. **Accessibility**: Ensure all features are accessible
6. **Documentation**: Update this file when adding new features

## License

This is proprietary software for Alliance Chemical. All rights reserved.