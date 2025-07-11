# 🔧 Environment Variables Setup Guide

## Quick Setup

Create a `.env` file in your project root with these variables:

```bash
# ================================
# JOIN THE ALLIANCE - Environment Variables
# ================================

# ================================
# DATABASE CONFIGURATION (Required)
# ================================
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
# Example: DATABASE_URL="postgresql://andre:password123@localhost:5432/join_the_alliance"

# ================================
# MICROSOFT GRAPH API (Required for Email)
# ================================
MICROSOFT_GRAPH_CLIENT_ID="your-azure-app-client-id"
MICROSOFT_GRAPH_CLIENT_SECRET="your-azure-app-client-secret"
MICROSOFT_GRAPH_TENANT_ID="your-azure-tenant-id"
MICROSOFT_GRAPH_USER_EMAIL="andre@alliancechemical.com"
MICROSOFT_GRAPH_WEBHOOK_SECRET="your-webhook-secret-123"

# ================================
# AWS S3 CONFIGURATION (Required for File Storage)
# ================================
AWS_ACCESS_KEY_ID="AKIA123456789"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="alliance-chemical-applications"

# ================================
# OPENAI API (Required for Multi-Agent AI Analysis)
# ================================
OPENAI_API_KEY="sk-your-openai-api-key"

# ================================
# EMAIL CONFIGURATION (Required)
# ================================
BOSS_EMAIL="andre@alliancechemical.com"
CC_EMAIL="hr@alliancechemical.com"
EMAIL_FORM="andre@alliancechemical.com"

# ================================
# SECURITY CONFIGURATION (Auto-generated if not set)
# ================================
SIGNATURE_SECRET="your-signature-secret-123"
CSRF_SECRET="your-csrf-secret-123"
SESSION_SECRET="your-session-secret-123"
ENCRYPTION_KEY="your-encryption-key-123"

# ================================
# APPLICATION CONFIGURATION
# ================================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"

# ================================
# ADMIN CONFIGURATION
# ================================
ADMIN_EMAIL="andre@alliancechemical.com"
ADMIN_PASSWORD_HASH="$2b$12$your-bcrypt-hashed-password"

# ================================
# OPTIONAL SERVICES (Not required for basic functionality)
# ================================
# Vercel KV (Redis) for email queue
# KV_URL="your-vercel-kv-url"

# Google API (for future features)
# GOOGLE_API_KEY="your-google-api-key"

# Webhooks and monitoring
# SECURITY_WEBHOOK_URL="your-security-webhook-url"
# WEBHOOK_EMAIL_URL="your-webhook-email-url"
# WEBHOOK_EMAIL_TOKEN="your-webhook-token"

# Testing
TEST_BASE_URL="http://localhost:3000"

# Logging
LOG_LEVEL="info"
```

## 🚀 Critical Setup Steps

### 1. Microsoft Graph API Setup (For Email)

1. **Go to Azure Portal** → App registrations
2. **Create new app** or use existing
3. **Copy these values**:
   - Application (client) ID → `MICROSOFT_GRAPH_CLIENT_ID`
   - Directory (tenant) ID → `MICROSOFT_GRAPH_TENANT_ID`
4. **Certificates & secrets** → New client secret → Copy → `MICROSOFT_GRAPH_CLIENT_SECRET`
5. **API permissions** → Add `Mail.Send` (Application) → **Grant admin consent**
6. **Set user email** → `MICROSOFT_GRAPH_USER_EMAIL="andre@alliancechemical.com"`

### 2. AWS S3 Setup (For File Storage)

1. **Go to AWS Console** → IAM → Users
2. **Create user** with programmatic access
3. **Attach policy**: `AmazonS3FullAccess` (or custom S3 policy)
4. **Copy credentials**:
   - Access Key ID → `AWS_ACCESS_KEY_ID`
   - Secret Access Key → `AWS_SECRET_ACCESS_KEY`
5. **Create S3 bucket**:
   - Name: `alliance-chemical-applications`
   - Region: `us-east-1`
   - Copy name → `AWS_S3_BUCKET_NAME`

### 3. OpenAI API Setup (For Multi-Agent AI)

1. **Go to OpenAI Platform** → API keys
2. **Create new secret key**
3. **Copy key** → `OPENAI_API_KEY="sk-..."`

### 4. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb join_the_alliance

# Set connection string
DATABASE_URL="postgresql://username:password@localhost:5432/join_the_alliance"
```

**Option B: Cloud Database (Recommended)**
- **Neon**: Free PostgreSQL cloud database
- **Supabase**: Free PostgreSQL with dashboard
- **Railway**: Easy PostgreSQL deployment

### 5. Email Configuration

```bash
# Who receives new application notifications
BOSS_EMAIL="andre@alliancechemical.com"

# Optional: CC additional people
CC_EMAIL="hr@alliancechemical.com"

# Form notification email
EMAIL_FORM="andre@alliancechemical.com"
```

## 🧪 Test Your Setup

After setting up your `.env` file:

```bash
# Test the multi-agent AI system
node scripts/test-employee-application-flow.js
```

**Expected output:**
```
✅ All required environment variables are set
📧 Boss email: andre@alliancechemical.com
📧 CC email: hr@alliancechemical.com
🪣 S3 bucket: alliance-chemical-applications
🔗 Microsoft Graph user: andre@alliancechemical.com

✅ Application submitted successfully
🤖 5 AI agents analyze each candidate: Technical, Cultural, Experience, Risk, Industry Fit
📧 Boss and CC recipients get sophisticated multi-agent analysis!
```

## 🔒 Security Notes

1. **Never commit `.env` to git** - it's already in `.gitignore`
2. **Use strong secrets** for production
3. **Rotate keys regularly**
4. **Limit AWS S3 permissions** to your specific bucket

## 🚨 Troubleshooting

**Common Issues:**

1. **Email not sending**: Check Microsoft Graph permissions and admin consent
2. **S3 upload failing**: Verify AWS credentials and bucket permissions
3. **AI analysis failing**: Check OpenAI API key and credits
4. **Database connection**: Verify PostgreSQL is running and connection string is correct

## 💰 Cost Estimates

- **Microsoft Graph**: Free (with Office 365)
- **AWS S3**: ~$0.02/month for typical usage
- **OpenAI API**: ~$0.50-2.00 per application analysis
- **Database**: Free tier available on most platforms

## 🎯 What You Get

With this setup, every employee application will automatically:

1. **📄 Generate professional PDF**
2. **🤖 Run 5 AI agents analysis**
3. **☁️ Save securely to S3**
4. **📧 Send sophisticated emails** with recommendations
5. **📊 Provide hiring insights** and next steps

**Your boss will receive the most advanced candidate analysis available!** 🚀 