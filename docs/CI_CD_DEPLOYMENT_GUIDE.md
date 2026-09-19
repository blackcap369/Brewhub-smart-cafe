# CI/CD Pipeline & Deployment Guide

## Overview

This document provides a comprehensive guide for setting up and managing the CI/CD pipeline and deployment process for BrewHub.

---

## 🔄 CI/CD Pipeline Architecture

### Pipeline Flow

```
Code Push → GitHub Actions → Tests → Build → Deploy → Monitor
    ↓            ↓           ↓      ↓       ↓        ↓
  Git        CI/CD        Test   Bundle  Vercel  Sentry
```

### Environments

1. **Development**: Local development with Supabase CLI
2. **Staging**: `staging.brewhub.com` with test data
3. **Production**: `brewhub.com` with live services

---

## 📋 GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: Push/PR to `main` or `develop`

**Jobs**:
- **Test**: Lint, type-check, unit tests, build
- **Security**: npm audit, security tests
- **E2E**: Playwright end-to-end tests

**Steps**:
```yaml
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (npm ci)
4. Run linter
5. Type check
6. Run tests
7. Run tests with coverage
8. Upload coverage to Codecov
9. Build application
10. Upload build artifacts
11. Check bundle size
```

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers**: Push to `main` (production) or `develop` (staging)

**Jobs**:
- **Production Deploy**: Build, deploy to Vercel, smoke tests, notifications
- **Staging Deploy**: Build, deploy to Vercel staging

**Steps**:
```yaml
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Build with environment variables
5. Deploy to Vercel
6. Wait for deployment
7. Run smoke tests
8. Notify Slack (success/failure)
9. Create Sentry release
```

---

## 🚀 Vercel Configuration

### Configuration File (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

### Vercel Setup Steps

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   vercel link
   ```

2. **Configure Environment Variables**
   ```bash
   # Production
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_RAZORPAY_KEY_ID production
   vercel env add VITE_SENTRY_DSN production
   
   # Staging
   vercel env add VITE_SUPABASE_URL staging
   vercel env add VITE_SUPABASE_ANON_KEY staging
   vercel env add VITE_RAZORPAY_KEY_ID staging
   ```

3. **Configure Domains**
   - Production: `brewhub.com`
   - Staging: `staging.brewhub.com`

4. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Node Version: 18

---

## 🔧 Environment Setup

### Development Environment

**Prerequisites**:
- Node.js 18+
- npm 9+
- Supabase CLI
- Git

**Setup Steps**:

```bash
# Clone repository
git clone https://github.com/your-org/brewhub.git
cd brewhub

# Install dependencies
npm install

# Setup Supabase locally
npx supabase init
npx supabase start

# Apply migrations
npx supabase db push

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Start development server
npm run dev
```

### Staging Environment

**URL**: `https://staging.brewhub.com`

**Database**: Separate Supabase project with test data

**Features**:
- Test payment gateway (Razorpay test mode)
- Test SMS gateway (MSG91 test mode)
- Test data populated
- Debug logging enabled

### Production Environment

**URL**: `https://brewhub.com`

**Database**: Live Supabase project

**Features**:
- Live payment gateway (Razorpay live mode)
- Live SMS gateway (MSG91 live mode)
- Real customer data
- Production logging

---

## 🗄️ Supabase Migrations

### Migration Workflow

```bash
# Create new migration
npx supabase migration new add_new_feature

# Edit migration file
# supabase/migrations/20240115120000_add_new_feature.sql

# Apply to local database
npx supabase db push

# Test locally
# ... run tests ...

# Commit migration
git add supabase/migrations/
git commit -m "Add new feature migration"

# Push to GitHub
git push

# CI/CD will auto-apply to staging/production
```

### Migration Best Practices

1. **Version Control**: All migrations in `supabase/migrations/`
2. **Naming Convention**: `YYYYMMDDHHMMSS_description.sql`
3. **Idempotent**: Use `IF NOT EXISTS` and `IF EXISTS`
4. **Tested**: Test migrations locally before pushing
5. **Documented**: Add comments explaining changes
6. **Rollback Ready**: Include rollback instructions

### Rollback Procedure

```bash
# 1. Identify the migration to rollback
ls supabase/migrations/

# 2. Create rollback migration
npx supabase migration new rollback_feature_name

# 3. Write rollback SQL
# Example: Drop table, remove column, etc.

# 4. Test rollback locally
npx supabase db push

# 5. Deploy rollback
git add .
git commit -m "Rollback feature_name"
git push
```

---

## 📊 Monitoring Setup

### 1. Sentry (Error Tracking)

**Setup**:

```bash
# Install Sentry SDK
npm install @sentry/react @sentry/tracing
```

**Configuration**:

```typescript
// src/utils/monitoring.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

**Environment Variables**:
- `VITE_SENTRY_DSN`: Sentry DSN URL
- `SENTRY_AUTH_TOKEN`: For CI/CD releases
- `SENTRY_ORG`: Organization name
- `SENTRY_PROJECT`: Project name

**Features**:
- Error tracking with stack traces
- Performance monitoring
- Release tracking
- Source maps upload
- User context

### 2. UptimeRobot (Uptime Monitoring)

**Setup**:

1. Create account at [UptimeRobot](https://uptimerobot.com/)
2. Add monitors:
   - `https://brewhub.com` (Main site)
   - `https://brewhub.com/api/health` (API health)
   - `https://your-project.supabase.co` (Supabase)
   - `https://api.razorpay.com` (Payment gateway)

3. Configure alerts:
   - Email notifications
   - Slack integration
   - SMS for critical alerts

4. Set check intervals:
   - Main site: 5 minutes
   - API endpoints: 1 minute
   - Critical services: 1 minute

### 3. Better Stack (Incident Management)

**Setup**:

1. Create account at [Better Stack](https://betterstack.com/)
2. Connect integrations:
   - Slack
   - Email
   - SMS
   - PagerDuty

3. Create incident rules:
   - Auto-create incidents from UptimeRobot
   - Escalation policies
   - On-call schedules

4. Setup status page:
   - `https://status.brewhub.com`
   - Real-time status updates
   - Incident history

### 4. PostHog (Product Analytics)

**Setup**:

```bash
# Install PostHog
npm install posthog-js
```

**Configuration**:

```typescript
// src/utils/analytics.ts
import posthog from 'posthog-js';

posthog.init('your-project-api-key', {
  api_host: 'https://app.posthog.com',
});
```

**Features**:
- User behavior tracking
- Feature flags
- A/B testing
- Session recording
- Funnel analysis

---

## 💾 Backup Strategy

### Automatic Backups

**Supabase Backups**:
- **Frequency**: Daily automatic backups
- **Retention**: 7 days (free tier), 30 days (pro tier)
- **Point-in-Time Recovery**: Enabled
- **Location**: Same region as database

**Backup Verification**:
```bash
# Weekly backup verification script
#!/bin/bash

# List available backups
npx supabase db list-backups

# Verify latest backup
npx supabase db restore --backup-id latest

# Run verification queries
psql -c "SELECT COUNT(*) FROM users;"
psql -c "SELECT COUNT(*) FROM orders;"
```

### Manual Backups

**Before Major Changes**:
```bash
# Create manual backup
npx supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Commit to secure storage
aws s3 cp backup_*.sql s3://brewhub-backups/
```

### Disaster Recovery

**Recovery Time Objective (RTO)**: 1 hour
**Recovery Point Objective (RPO)**: 24 hours

**Recovery Steps**:

1. **Identify Issue**
   - Check monitoring alerts
   - Review error logs
   - Assess data loss

2. **Stop Services**
   ```bash
   # Pause application
   vercel pause --prod
   ```

3. **Restore Database**
   ```bash
   # List available backups
   npx supabase db list-backups
   
   # Restore from backup
   npx supabase db restore --backup-id <backup-id>
   ```

4. **Verify Data**
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM orders;
   SELECT COUNT(*) FROM menu_items;
   ```

5. **Resume Services**
   ```bash
   # Resume application
   vercel resume --prod
   ```

6. **Monitor**
   - Watch error rates
   - Verify functionality
   - Check user reports

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Security audit clean (`npm audit`)
- [ ] Bundle size acceptable (< 300KB gzipped)
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] DNS records configured
- [ ] SSL certificates active

### Environment Variables

**Production**:
- [ ] `VITE_SUPABASE_URL` - Production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Production anon key
- [ ] `VITE_RAZORPAY_KEY_ID` - Live Razorpay key
- [ ] `VITE_SENTRY_DSN` - Production Sentry DSN
- [ ] `RAZORPAY_KEY_SECRET` - Live Razorpay secret
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Webhook secret
- [ ] `MSG91_AUTH_KEY` - Live MSG91 key
- [ ] `FIREBASE_SERVER_KEY` - FCM server key

**Staging**:
- [ ] `VITE_SUPABASE_URL` - Staging Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Staging anon key
- [ ] `VITE_RAZORPAY_KEY_ID` - Test Razorpay key
- [ ] `VITE_SENTRY_DSN` - Staging Sentry DSN

### Services Configuration

**Razorpay**:
- [ ] Live keys activated
- [ ] Webhook URL configured: `https://brewhub.com/api/webhooks/razorpay`
- [ ] Webhook events: `payment.captured`, `payment.failed`
- [ ] Test transactions verified

**MSG91 (SMS)**:
- [ ] Live keys activated
- [ ] Sender ID approved
- [ ] Template IDs configured
- [ ] Test SMS sent successfully

**Firebase (Push Notifications)**:
- [ ] Firebase project created
- [ ] Server key generated
- [ ] FCM configuration added
- [ ] Test notification sent

**Sentry**:
- [ ] Project created
- [ ] DSN configured
- [ ] Source maps uploading
- [ ] Alert rules configured
- [ ] Team members added

### Monitoring

- [ ] UptimeRobot monitors active
- [ ] Better Stack incidents configured
- [ ] PostHog tracking enabled
- [ ] Slack notifications working
- [ ] Email alerts configured
- [ ] SMS alerts for critical issues

### Backup

- [ ] Daily backups enabled
- [ ] Point-in-time recovery enabled
- [ ] Backup verification script tested
- [ ] Disaster recovery runbook documented
- [ ] Recovery tested in staging

### Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] RLS policies verified
- [ ] API keys rotated
- [ ] Dependencies updated
- [ ] Security audit passed

### Performance

- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Caching configured
- [ ] CDN enabled
- [ ] Database indexes verified
- [ ] API response times < 200ms
- [ ] Page load time < 3s

### Final Checks

- [ ] Smoke tests passing
- [ ] User acceptance testing complete
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Monitoring alerts tested

---

## 🚀 Deployment Commands

### Deploy to Staging

```bash
# 1. Ensure on develop branch
git checkout develop

# 2. Run tests
npm test

# 3. Build
npm run build

# 4. Deploy to Vercel staging
vercel --prod

# 5. Verify deployment
curl https://staging.brewhub.com
```

### Deploy to Production

```bash
# 1. Ensure on main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Run tests
npm test

# 4. Build
npm run build

# 5. Deploy to Vercel production
vercel --prod

# 6. Verify deployment
curl https://brewhub.com

# 7. Run smoke tests
npm run test:smoke
```

### Rollback Deployment

```bash
# 1. Identify previous deployment
vercel ls

# 2. Rollback to previous deployment
vercel rollback --prod

# 3. Verify rollback
curl https://brewhub.com
```

---

## 📈 Monitoring & Alerts

### Key Metrics

**Application**:
- Error rate < 1%
- API response time < 200ms
- Page load time < 3s
- Uptime > 99.9%

**Business**:
- Orders per day
- Revenue per day
- Active users
- Conversion rate

**Infrastructure**:
- CPU usage < 70%
- Memory usage < 80%
- Database connections < 80%
- API rate limits

### Alert Thresholds

**Critical** (Immediate action):
- Error rate > 5%
- API response time > 5s
- Uptime < 99%
- Database connection failures

**Warning** (Investigate within 1 hour):
- Error rate > 2%
- API response time > 1s
- CPU usage > 80%
- Memory usage > 90%

**Info** (Review within 24 hours):
- Slow queries detected
- Unusual traffic patterns
- New error types

---

## 🔧 Troubleshooting

### Common Issues

**Build Fails**:
```bash
# Clear cache
rm -rf node_modules dist
npm ci

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

**Deployment Fails**:
```bash
# Check Vercel logs
vercel logs

# Verify environment variables
vercel env ls

# Check build output
vercel inspect
```

**Database Migration Fails**:
```bash
# Check migration syntax
cat supabase/migrations/*.sql

# Test locally
npx supabase db push

# Check for conflicts
npx supabase migration list
```

**Performance Issues**:
```bash
# Analyze bundle
npm run build -- --analyze

# Check Lighthouse
npx lighthouse https://brewhub.com

# Monitor API
curl -w "@curl-format.txt" -o /dev/null -s https://brewhub.com/api/health
```

---

## 📚 Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Sentry Documentation](https://docs.sentry.io/)

### Tools
- [Vercel CLI](https://vercel.com/cli)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Playwright](https://playwright.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Monitoring
- [UptimeRobot](https://uptimerobot.com/)
- [Better Stack](https://betterstack.com/)
- [PostHog](https://posthog.com/)
- [Sentry](https://sentry.io/)

---

**Last Updated**: 2026  
**Maintained by**: DevOps Team  
**Contact**: devops@brewhub.app
