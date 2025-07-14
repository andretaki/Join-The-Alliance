# Vercel KV Setup Guide

## Issue Fixed
The error `Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN` occurs because Vercel KV is not properly configured.

## Quick Setup Steps

### 1. Create Vercel KV Database

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** or create a new deployment
3. **Navigate to Storage tab**
4. **Click "Create Database"**
5. **Select "KV (Redis)"**
6. **Give it a name** (e.g., "alliance-email-queue")
7. **Click "Create"**

### 2. Connect to Your Project

1. **In the KV database dashboard**, click "Connect to Project"
2. **Select your project** from the dropdown
3. **Click "Connect"**
4. **This automatically adds the required environment variables:**
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 3. Deploy Your Changes

1. **Redeploy your application** (the environment variables are automatically added)
2. **Or add manually to your `.env` file for local development:**

```bash
# Get these values from your Vercel KV dashboard
KV_REST_API_URL="https://your-kv-instance.upstash.io"
KV_REST_API_TOKEN="your-token-here"
```

### 4. Test the Setup

Once configured, test the email queue system:

```bash
# Test KV connection
curl "http://localhost:3000/api/email-health"

# Test email queue
curl "http://localhost:3000/api/test-queue?action=test"

# Check queue stats
curl "http://localhost:3000/api/test-queue?action=stats"
```

## Alternative: Manual Setup

If you prefer to set up manually or use a different Redis provider:

### Using Upstash Directly

1. **Go to Upstash Console**: https://console.upstash.com/
2. **Create a new Redis database**
3. **Copy the REST API URL and Token**
4. **Add to your environment variables:**

```bash
KV_REST_API_URL="https://your-instance.upstash.io"
KV_REST_API_TOKEN="your-token"
```

### Using Redis Cloud or Other Providers

You'll need to modify the code to use a different Redis client. The current implementation uses `@vercel/kv` which is specifically for Vercel KV.

## Troubleshooting

### Common Issues

1. **"KV service unavailable"**
   - Check that KV_REST_API_URL and KV_REST_API_TOKEN are set
   - Verify the database is running in Vercel dashboard

2. **"Connection refused"**
   - Ensure the KV database is in the same region as your deployment
   - Check firewall settings if using custom Redis

3. **"Authentication failed"**
   - Regenerate the KV_REST_API_TOKEN in Vercel dashboard
   - Ensure no extra spaces in environment variables

### Testing Commands

```bash
# Test email functionality (should work without KV)
curl "http://localhost:3000/api/test-email"

# Test KV-dependent queue
curl "http://localhost:3000/api/test-queue"

# Check overall health
curl "http://localhost:3000/api/email-health"
```

## Expected Behavior

### With KV Configured
- ✅ Emails are queued for batch processing
- ✅ Better performance and reliability
- ✅ Failed emails are retried automatically
- ✅ Email statistics and monitoring

### Without KV (Fallback)
- ✅ Emails are sent directly via Microsoft Graph
- ✅ Basic functionality still works
- ⚠️ No queueing or retry mechanism
- ⚠️ Higher chance of timeouts on Vercel

## Cost Information

- **Vercel KV**: Free tier includes 10,000 commands/month
- **Upstash**: Free tier includes 10,000 requests/month
- **Perfect for email queues**: Typically uses <1,000 commands/month

## Security Notes

- KV_REST_API_TOKEN is sensitive - never expose in client-side code
- Rotate tokens regularly in production
- Use environment variables, never hardcode credentials 