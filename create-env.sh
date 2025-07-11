#!/bin/bash

echo "🔧 Creating .env file from template..."

cat > .env << 'ENVEOF'
# ================================
# JOIN THE ALLIANCE - Environment Variables
# ================================

# ================================
# DATABASE CONFIGURATION (Required)
# ================================
DATABASE_URL="postgresql://username:password@localhost:5432/join_the_alliance"

# ================================
# MICROSOFT GRAPH API (Required for Email)
# ================================
MICROSOFT_GRAPH_CLIENT_ID="your-azure-app-client-id"
MICROSOFT_GRAPH_CLIENT_SECRET="your-azure-app-client-secret"
MICROSOFT_GRAPH_TENANT_ID="your-azure-tenant-id"
MICROSOFT_GRAPH_USER_EMAIL="andre@alliancechemical.com"
MICROSOFT_GRAPH_WEBHOOK_SECRET="webhook-secret-123"

# ================================
# AWS S3 CONFIGURATION (Required for File Storage)
# ================================
AWS_ACCESS_KEY_ID="your-aws-access-key"
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
SIGNATURE_SECRET="signature-secret-123"
CSRF_SECRET="csrf-secret-123"
SESSION_SECRET="session-secret-123"
ENCRYPTION_KEY="encryption-key-123"

# ================================
# APPLICATION CONFIGURATION
# ================================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"

# ================================
# ADMIN CONFIGURATION
# ================================
ADMIN_EMAIL="andre@alliancechemical.com"
ADMIN_PASSWORD_HASH=""

# ================================
# TESTING
# ================================
TEST_BASE_URL="http://localhost:3000"
LOG_LEVEL="info"
ENVEOF

echo "✅ .env file created!"
echo ""
echo "🚨 IMPORTANT: You must update these values in .env:"
echo "   - DATABASE_URL (set up PostgreSQL)"
echo "   - MICROSOFT_GRAPH_CLIENT_ID (Azure App Registration)"
echo "   - MICROSOFT_GRAPH_CLIENT_SECRET (Azure App Registration)"
echo "   - MICROSOFT_GRAPH_TENANT_ID (Azure App Registration)"
echo "   - AWS_ACCESS_KEY_ID (AWS IAM User)"
echo "   - AWS_SECRET_ACCESS_KEY (AWS IAM User)"
echo "   - AWS_S3_BUCKET_NAME (Create S3 bucket)"
echo "   - OPENAI_API_KEY (OpenAI Platform)"
echo ""
echo "📚 See SETUP_ENV.md for detailed setup instructions"
echo ""
echo "🧪 Test with: node scripts/test-employee-application-flow.js"

