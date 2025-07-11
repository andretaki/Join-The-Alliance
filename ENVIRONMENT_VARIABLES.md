# Environment Variables Documentation

This document lists all environment variables used in the Alliance Chemical application and their current status.

## Required Environment Variables

### Database Configuration
- **`DATABASE_URL`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/db.ts`, `src/lib/security-config.ts`, `drizzle.config.ts`
  - **Usage**: PostgreSQL database connection string
  - **Validation**: Required in production, validated in security config

### Microsoft Graph (Email Service)
- **`MICROSOFT_GRAPH_CLIENT_ID`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/microsoft-graph.ts`, `src/lib/security-config.ts`
  - **Usage**: Azure AD application client ID for Microsoft Graph API
  - **Validation**: Required when using Microsoft Graph, format validated (GUID)

- **`MICROSOFT_GRAPH_CLIENT_SECRET`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/microsoft-graph.ts`, `src/lib/security-config.ts`
  - **Usage**: Azure AD application client secret for Microsoft Graph API
  - **Validation**: Required when using Microsoft Graph

- **`MICROSOFT_GRAPH_TENANT_ID`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/microsoft-graph.ts`, `src/lib/security-config.ts`
  - **Usage**: Azure AD tenant ID for Microsoft Graph API
  - **Validation**: Required when using Microsoft Graph, format validated (GUID)

- **`MICROSOFT_GRAPH_WEBHOOK_SECRET`** ✅ **ADDED**
  - **Location**: `src/lib/config.ts`, `src/lib/microsoft-graph.ts`, `src/lib/security-config.ts`
  - **Usage**: Secret for verifying Microsoft Graph webhook signatures
  - **Validation**: Required when using Microsoft Graph webhooks
  - **Implementation**: Webhook verification utilities added to `src/lib/microsoft-graph.ts`

- **`MICROSOFT_GRAPH_USER_EMAIL`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/microsoft-graph.ts`
  - **Usage**: Email address for sending emails via Microsoft Graph
  - **Fallback**: Uses `EMAIL_FORM` if not set

### AWS S3 Configuration
- **`AWS_ACCESS_KEY_ID`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/security-config.ts`, `src/app/api/upload/route.ts`
  - **Usage**: AWS access key for S3 file uploads
  - **Validation**: Required in production

- **`AWS_SECRET_ACCESS_KEY`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/security-config.ts`, `src/app/api/upload/route.ts`
  - **Usage**: AWS secret key for S3 file uploads
  - **Validation**: Required in production

- **`AWS_REGION`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/security-config.ts`, `src/app/api/upload/route.ts`
  - **Usage**: AWS region for S3 operations
  - **Validation**: Required in production

- **`AWS_S3_BUCKET_NAME`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/security-config.ts`, `src/app/api/upload/route.ts`, `src/app/api/employee-applications/route.ts`
  - **Usage**: S3 bucket name for file storage
  - **Validation**: Required in production

### OpenAI Configuration
- **`OPENAI_API_KEY`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/security-config.ts`, `src/lib/ai-processor.ts`, `src/app/api/parse-resume/route.ts`
  - **Usage**: OpenAI API key for AI processing and resume parsing
  - **Validation**: Used in AI fraud detection and credit analysis

### Google API Configuration
- **`GOOGLE_API_KEY`** ✅ **ADDED**
  - **Location**: `src/lib/config.ts`, `src/lib/security-config.ts`, `src/lib/google-api.ts`
  - **Usage**: Google API key for future integrations (Places, Geocoding, Safe Browsing)
  - **Validation**: Length validation (>10 characters)
  - **Implementation**: Google API utilities added to `src/lib/google-api.ts`

## Optional Environment Variables

### Email Configuration
- **`EMAIL_FORM`** ✅ **USED**
  - **Location**: `src/lib/config.ts`, `src/lib/ai-processor.ts`, `src/lib/email.ts`, `src/app/api/email-health/route.ts`
  - **Usage**: Email address for receiving application notifications
  - **Default**: andre@alliancechemical.com

- **`BOSS_EMAIL`** ✅ **USED**
  - **Location**: `src/lib/email-service.ts`, `src/app/api/employee-applications/route.ts`
  - **Usage**: Email address of the boss/manager who should receive new employee application notifications with PDF attachments and AI summaries
  - **Default**: andre@alliancechemical.com
  - **Implementation**: Used in the employee application submission flow for automatic notifications

- **`CC_EMAIL`** ✅ **USED**
  - **Location**: `src/lib/email-service.ts`, `src/app/api/employee-applications/route.ts`
  - **Usage**: Optional email address to CC on boss notifications for new employee applications
  - **Required**: No (optional)
  - **Implementation**: When set, this email will be CC'd on all boss notification emails with PDF attachments and AI summaries

### Security Configuration
- **`SIGNATURE_SECRET`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`, `src/app/api/credit-approval/route.ts`, `middleware.ts`
  - **Usage**: Secret for signing URLs and verifying signatures
  - **Default**: Auto-generated secure secret

- **`CSRF_SECRET`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`, `src/lib/security.ts`
  - **Usage**: Secret for CSRF token generation
  - **Default**: Auto-generated secure secret

- **`SESSION_SECRET`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`
  - **Usage**: Secret for session management
  - **Default**: Auto-generated secure secret

- **`ENCRYPTION_KEY`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`
  - **Usage**: Key for encrypting sensitive data
  - **Default**: Auto-generated secure secret

### Application Configuration
- **`NEXT_PUBLIC_BASE_URL`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`, `src/app/api/credit-approval/route.ts`
  - **Usage**: Public base URL for the application
  - **Default**: http://localhost:3000

- **`NODE_ENV`** ✅ **USED**
  - **Location**: Multiple files throughout the codebase
  - **Usage**: Environment mode (development/production)
  - **Default**: development

### Admin Configuration
- **`ADMIN_EMAIL`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`
  - **Usage**: Admin email address
  - **Default**: andre@alliancechemical.com

- **`ADMIN_PASSWORD_HASH`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`
  - **Usage**: Hashed admin password
  - **Validation**: Required in production

### Vercel Configuration
- **`KV_URL`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`, `src/lib/email.ts`, `src/app/api/email-health/route.ts`
  - **Usage**: Vercel KV (Redis) connection URL for email queue

- **`VERCEL_URL`** ✅ **USED**
  - **Location**: `src/lib/ai-processor.ts`, `src/app/api/test-queue/route.ts`
  - **Usage**: Vercel deployment URL

### Monitoring and Webhooks
- **`SECURITY_WEBHOOK_URL`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`
  - **Usage**: URL for security event notifications

- **`WEBHOOK_EMAIL_URL`** ✅ **USED**
  - **Location**: `src/lib/email.ts`
  - **Usage**: Fallback webhook URL for email sending

- **`WEBHOOK_EMAIL_TOKEN`** ✅ **USED**
  - **Location**: `src/lib/email.ts`
  - **Usage**: Authentication token for webhook email service

### Testing Configuration
- **`TEST_BASE_URL`** ✅ **USED**
  - **Location**: `scripts/security-test.js`
  - **Usage**: Base URL for security testing

### Logging Configuration
- **`LOG_LEVEL`** ✅ **USED**
  - **Location**: `src/lib/security-config.ts`
  - **Usage**: Application log level
  - **Default**: info

## Environment Variable Status Summary

### ✅ **PROPERLY CONFIGURED AND USED**
- `DATABASE_URL`
- `MICROSOFT_GRAPH_CLIENT_ID`
- `MICROSOFT_GRAPH_CLIENT_SECRET`
- `MICROSOFT_GRAPH_TENANT_ID`
- `MICROSOFT_GRAPH_WEBHOOK_SECRET` (newly added)
- `MICROSOFT_GRAPH_USER_EMAIL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY` (newly added)

### ✅ **OPTIONAL BUT CONFIGURED**
- `EMAIL_FORM`
- `SIGNATURE_SECRET`
- `CSRF_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `NODE_ENV`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `KV_URL`
- `VERCEL_URL`
- `SECURITY_WEBHOOK_URL`
- `WEBHOOK_EMAIL_URL`
- `WEBHOOK_EMAIL_TOKEN`
- `TEST_BASE_URL`
- `LOG_LEVEL`

## Security Validation

All environment variables are properly validated in:
- `src/lib/config.ts` - Basic validation and error logging
- `src/lib/security-config.ts` - Comprehensive security validation
- `src/lib/microsoft-graph.ts` - Microsoft Graph specific validation
- `src/lib/google-api.ts` - Google API specific validation

## Implementation Notes

1. **Microsoft Graph Webhook Secret**: Added webhook verification utilities in `src/lib/microsoft-graph.ts`
2. **Google API Key**: Added comprehensive Google API utilities in `src/lib/google-api.ts`
3. **Security Validation**: All variables are validated in production with appropriate error messages
4. **Fallback Values**: Sensible defaults are provided for non-critical variables
5. **Type Safety**: All variables are properly typed in TypeScript

## Next Steps

1. Set up the actual environment variables in your deployment environment
2. Configure Microsoft Graph webhook endpoints if needed
3. Set up Google API services if you plan to use them
4. Test the security validation in production
5. Monitor the application logs for any missing environment variable warnings 