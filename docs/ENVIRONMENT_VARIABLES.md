# Environment Variables Configuration

## Overview

This document lists all environment variables required for BrewHub across different environments.

---

## 📋 Environment Variables Template

### Frontend Variables (Vite)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Monitoring
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_POSTHOG_KEY=your-posthog-key
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_URL=https://api.brewhub.com
VITE_CDN_URL=https://cdn.brewhub.com
```

### Backend Variables (Supabase Edge Functions)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# MSG91 (SMS)
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=BREWHP

# Firebase (Push Notifications)
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-project-id

# Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=brewhub
```

---

## 🌍 Environment-Specific Configuration

### Development (.env.local)

```bash
# Supabase (Local)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Razorpay (Test Mode)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Monitoring (Disabled)
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=

# API (Local)
VITE_API_URL=http://localhost:3000
VITE_CDN_URL=http://localhost:3000
```

### Staging (.env.staging)

```bash
# Supabase (Staging Project)
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key

# Razorpay (Test Mode)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Monitoring (Staging)
VITE_SENTRY_DSN=https://staging-dsn@xxxxx.ingest.sentry.io/xxxxx
VITE_POSTHOG_KEY=staging-posthog-key
VITE_APP_VERSION=1.0.0-staging

# API (Staging)
VITE_API_URL=https://staging-api.brewhub.com
VITE_CDN_URL=https://staging-cdn.brewhub.com
```

### Production (.env.production)

```bash
# Supabase (Production Project)
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key

# Razorpay (Live Mode)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# Monitoring (Production)
VITE_SENTRY_DSN=https://production-dsn@xxxxx.ingest.sentry.io/xxxxx
VITE_POSTHOG_KEY=production-posthog-key
VITE_APP_VERSION=1.0.0

# API (Production)
VITE_API_URL=https://api.brewhub.com
VITE_CDN_URL=https://cdn.brewhub.com
```

---

## 🔐 Vercel Environment Variables

### Setup Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add production variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_RAZORPAY_KEY_ID production
vercel env add VITE_SENTRY_DSN production
vercel env add VITE_POSTHOG_KEY production
vercel env add VITE_APP_VERSION production
vercel env add VITE_API_URL production
vercel env add VITE_CDN_URL production

# Add staging variables
vercel env add VITE_SUPABASE_URL staging
vercel env add VITE_SUPABASE_ANON_KEY staging
vercel env add VITE_RAZORPAY_KEY_ID staging
vercel env add VITE_SENTRY_DSN staging
vercel env add VITE_POSTHOG_KEY staging
vercel env add VITE_APP_VERSION staging
vercel env add VITE_API_URL staging
vercel env add VITE_CDN_URL staging

# Add preview variables (for PR deployments)
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_ANON_KEY preview
vercel env add VITE_RAZORPAY_KEY_ID preview
```

### List Environment Variables

```bash
# List all environments
vercel env ls

# List production variables
vercel env ls production

# List staging variables
vercel env ls staging
```

### Remove Environment Variables

```bash
# Remove variable
vercel env rm VITE_OLD_VARIABLE production
```

---

## 🔑 Service Configuration

### Supabase

**Get Credentials**:
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy Project URL and anon/public key

**Service Role Key** (Backend only):
1. Go to Settings → API
2. Copy service_role key (secret)
3. ⚠️ Never expose in frontend

### Razorpay

**Get Credentials**:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live keys
4. Copy Key ID and Key Secret

**Webhook Configuration**:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://brewhub.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `payment.failed`
4. Copy webhook secret

### MSG91 (SMS)

**Get Credentials**:
1. Go to [MSG91 Dashboard](https://control.msg91.com/)
2. Go to Settings → API Key
3. Copy Authentication Key
4. Go to Sender ID → Create sender ID (e.g., BREWHP)

### Firebase (Push Notifications)

**Get Server Key**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Cloud Messaging
4. Copy Server Key

**Project ID**:
1. Go to Project Settings → General
2. Copy Project ID

### Sentry

**Get DSN**:
1. Go to [Sentry Dashboard](https://sentry.io/)
2. Select your project
3. Go to Settings → Client Keys (DSN)
4. Copy DSN

**Auth Token** (CI/CD):
1. Go to Settings → Auth Tokens
2. Create new token with `project:releases` scope
3. Copy token

### PostHog

**Get API Key**:
1. Go to [PostHog Dashboard](https://app.posthog.com/)
2. Go to Project Settings
3. Copy Project API Key

---

## 🔄 GitHub Secrets

### Setup in GitHub

1. Go to repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

**Vercel**:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

**Sentry**:
```
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=brewhub
```

**Notifications**:
```
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz
```

**Environment Variables** (for CI/CD):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Get Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/)
2. Go to Settings → Tokens
3. Create new token
4. Copy token

### Get Vercel Project IDs

```bash
# Link project
vercel link

# Check .vercel/project.json
cat .vercel/project.json
```

---

## 🛡️ Security Best Practices

### DO ✅

- Use environment variables for all secrets
- Rotate keys regularly (every 90 days)
- Use different keys for staging and production
- Enable 2FA on all service accounts
- Use service role keys only in backend
- Store secrets in GitHub Secrets
- Use Vercel environment variables
- Audit access logs regularly

### DON'T ❌

- Never commit secrets to Git
- Never expose service role keys in frontend
- Never use production keys in development
- Never share keys via email/chat
- Never hardcode secrets in code
- Never log sensitive data
- Never use default passwords

---

## 📝 Environment Variable Validation

### Validation Script

```typescript
// src/utils/envValidation.ts
export function validateEnvironment() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_RAZORPAY_KEY_ID',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    throw new Error('Missing required environment variables');
  }
}

// Call in main.tsx
validateEnvironment();
```

---

## 🔍 Debugging

### Check Environment Variables

```bash
# In development
console.log(import.meta.env);

# In Vercel
vercel env ls

# In GitHub Actions
echo $VITE_SUPABASE_URL
```

### Common Issues

**Issue**: `VITE_SUPABASE_URL is undefined`
- **Solution**: Check `.env.local` exists and has the variable

**Issue**: `Cannot connect to Supabase`
- **Solution**: Verify URL and anon key are correct

**Issue**: `Razorpay checkout not opening`
- **Solution**: Verify key ID is correct and not expired

**Issue**: `Sentry not capturing errors`
- **Solution**: Verify DSN is correct and project exists

---

## 📚 Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Razorpay API Keys](https://razorpay.com/docs/api/)

---

**Last Updated**: 2026  
**Maintained by**: DevOps Team  
**Contact**: devops@brewhub.app
