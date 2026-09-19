# Monitoring & Observability Setup

## Overview

This document covers the complete monitoring and observability setup for BrewHub, including error tracking, performance monitoring, uptime monitoring, and product analytics.

---

## 📊 Monitoring Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Monitoring Stack                      │
├─────────────────────────────────────────────────────────┤
│  Error Tracking    │  Sentry                            │
│  Uptime            │  UptimeRobot                       │
│  Incidents         │  Better Stack                      │
│  Analytics         │  PostHog                           │
│  Performance       │  Web Vitals + Lighthouse           │
│  Logs              │  Supabase Logs                     │
│  Metrics           │  Vercel Analytics                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🐛 Error Tracking with Sentry

### Setup

**1. Create Sentry Project**

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Login
sentry-cli login

# Create project
sentry-cli projects create --org your-org --project brewhub
```

**2. Configure Frontend**

```typescript
// src/utils/monitoring.ts
import * as Sentry from '@sentry/react';

export function initializeSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,
      tracesSampleRate: 0.2, // 20% of transactions
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors
      
      // Performance monitoring
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/brewhub\.com/],
        }),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      
      // Before send hook
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }
        return event;
      },
      
      // Before breadcrumb
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'console' && 
            breadcrumb.message?.includes('password')) {
          return null;
        }
        return breadcrumb;
      },
    });
  }
}
```

**3. Error Boundaries**

```typescript
// src/components/ErrorBoundary.tsx
import * as Sentry from '@sentry/react';

export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Usage in App.tsx
<SentryErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, componentStack) => {
    console.error('Error caught by boundary:', error);
  }}
>
  <App />
</SentryErrorBoundary>
```

**4. Capture Errors**

```typescript
// Manual error capture
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'riskyOperation' },
    extra: { context: 'additional info' },
  });
}

// Capture message
Sentry.captureMessage('User completed checkout', {
  level: 'info',
  tags: { flow: 'checkout' },
});
```

### Alert Rules

**Critical Alerts** (Immediate):
- Error rate > 5% in 5 minutes
- Unhandled exceptions > 10 in 1 minute
- API errors > 100 in 5 minutes

**Warning Alerts** (1 hour):
- Error rate > 2% in 15 minutes
- Performance degradation > 50%
- New error types detected

**Info Alerts** (Daily):
- Daily error summary
- Performance trends
- User impact report

---

## 🌐 Uptime Monitoring with UptimeRobot

### Setup

**1. Create Monitors**

```bash
# Main website
Monitor: https://brewhub.com
Type: HTTP(s)
Interval: 5 minutes
Expected status: 200

# API health
Monitor: https://brewhub.com/api/health
Type: HTTP(s)
Interval: 1 minute
Expected status: 200

# Supabase
Monitor: https://your-project.supabase.co/rest/v1/
Type: HTTP(s)
Interval: 5 minutes
Expected status: 200 or 401

# Razorpay
Monitor: https://api.razorpay.com
Type: HTTP(s)
Interval: 5 minutes
Expected status: 200
```

**2. Configure Alerts**

```bash
# Email alerts
Alert contacts: team@brewhub.com, devops@brewhub.com

# Slack integration
Webhook URL: https://hooks.slack.com/services/xxx/yyy/zzz

# SMS for critical alerts
Phone: +91XXXXXXXXXX (on-call engineer)
```

**3. Status Page**

```bash
# Create public status page
URL: https://status.brewhub.com

# Add all monitors
# Configure custom domain
# Enable email subscriptions
```

### Monitoring Checklist

- [ ] Main website (5 min interval)
- [ ] API endpoints (1 min interval)
- [ ] Database (5 min interval)
- [ ] Payment gateway (5 min interval)
- [ ] SMS service (5 min interval)
- [ ] Email service (5 min interval)
- [ ] CDN (5 min interval)
- [ ] Third-party APIs (5 min interval)

---

## 🚨 Incident Management with Better Stack

### Setup

**1. Create Incident Rules**

```yaml
# Auto-create incidents from UptimeRobot
rules:
  - name: Website Down
    condition: monitor.brewhub.status == "down"
    severity: critical
    notify: [slack, sms, email]
    
  - name: API Errors
    condition: error_rate > 5%
    severity: high
    notify: [slack, email]
    
  - name: Performance Degradation
    condition: response_time > 5s
    severity: medium
    notify: [slack]
```

**2. Escalation Policies**

```yaml
escalation:
  - level: 1
    notify: [on-call-engineer]
    wait: 15 minutes
    
  - level: 2
    notify: [tech-lead, engineering-manager]
    wait: 30 minutes
    
  - level: 3
    notify: [cto, vp-engineering]
    wait: 1 hour
```

**3. On-Call Schedule**

```yaml
schedule:
  timezone: Asia/Kolkata
  rotation: weekly
  handoff: monday 09:00
  
  team:
    - name: Engineer A
      email: engineer.a@brewhub.com
      phone: +91XXXXXXXXXX
      
    - name: Engineer B
      email: engineer.b@brewhub.com
      phone: +91XXXXXXXXXX
```

### Incident Response

**1. Acknowledge**
```bash
# Auto-acknowledge in Slack
# Or manually in Better Stack dashboard
```

**2. Investigate**
```bash
# Check Sentry for errors
# Check Vercel logs
# Check Supabase logs
# Check UptimeRobot status
```

**3. Resolve**
```bash
# Fix the issue
# Deploy hotfix if needed
# Verify resolution
```

**4. Post-Mortem**
```markdown
# Incident Report Template

## Summary
- **Date**: 2024-01-15 14:30 IST
- **Duration**: 45 minutes
- **Impact**: 500 users affected
- **Severity**: High

## Timeline
- 14:30 - Incident detected
- 14:35 - Investigation started
- 14:45 - Root cause identified
- 15:00 - Fix deployed
- 15:15 - Incident resolved

## Root Cause
Description of what went wrong

## Resolution
Steps taken to fix the issue

## Prevention
Actions to prevent recurrence

## Lessons Learned
What we learned from this incident
```

---

## 📈 Product Analytics with PostHog

### Setup

**1. Install PostHog**

```bash
npm install posthog-js
```

**2. Initialize**

```typescript
// src/utils/analytics.ts
import posthog from 'posthog-js';

export function initializePostHog() {
  if (import.meta.env.PROD) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
    });
  }
}

// Track events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.capture(eventName, properties);
  }
}

// Identify users
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.identify(userId, properties);
  }
}
```

**3. Track Key Events**

```typescript
// Order placed
trackEvent('order_placed', {
  order_id: order.id,
  total: order.total,
  items_count: order.items.length,
  payment_method: order.payment_method,
});

// Menu item viewed
trackEvent('menu_item_viewed', {
  item_id: item.id,
  item_name: item.name,
  category: item.category,
});

// Cart updated
trackEvent('cart_updated', {
  action: 'add' | 'remove' | 'update',
  item_id: item.id,
  quantity: item.quantity,
});

// Payment completed
trackEvent('payment_completed', {
  order_id: order.id,
  amount: order.total,
  method: payment.method,
  duration: payment.duration,
});
```

**4. Feature Flags**

```typescript
// Check feature flag
if (posthog.isFeatureEnabled('new-checkout-flow')) {
  // Show new checkout
} else {
  // Show old checkout
}

// Create feature flag in PostHog dashboard
// Name: new-checkout-flow
// Rollout: 50% of users
```

### Key Metrics

**User Metrics**:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- User retention rate
- Session duration

**Order Metrics**:
- Orders per day
- Average order value
- Order conversion rate
- Payment success rate

**Menu Metrics**:
- Most viewed items
- Most ordered items
- Category popularity
- Search queries

**Performance Metrics**:
- Page load time
- API response time
- Error rate
- Cart abandonment rate

---

## 🚀 Performance Monitoring

### Web Vitals

**1. Track Core Web Vitals**

```typescript
// src/hooks/usePerformanceTracking.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function useWebVitals() {
  useEffect(() => {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);
}

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });
  
  // Send to PostHog
  posthog.capture('web_vital', body);
  
  // Send to Sentry
  Sentry.addBreadcrumb({
    message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
    category: 'web-vitals',
    level: 'info',
  });
}
```

**2. Lighthouse CI**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse
on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Audit URLs using Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://brewhub.com
            https://brewhub.com/menu
            https://brewhub.com/admin
          uploadArtifacts: true
          temporaryPublicStorage: true
```

**3. Performance Budget**

```json
// lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}
```

### Vercel Analytics

**1. Enable Analytics**

```bash
# In Vercel dashboard
# Go to Project → Analytics → Enable
```

**2. View Metrics**

- Page views
- Unique visitors
- Performance metrics
- Web Vitals
- Geographic distribution

---

## 📝 Logging

### Supabase Logs

**1. Access Logs**

```bash
# In Supabase dashboard
# Go to Project → Logs

# Filter by:
# - API requests
# - Database queries
# - Edge functions
# - Auth events
```

**2. Query Logs**

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;

-- View recent queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Application Logs

**1. Structured Logging**

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.PROD) {
      console.log(JSON.stringify({
        level: 'info',
        message,
        data,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.log(`[INFO] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (import.meta.env.PROD) {
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      }));
      
      Sentry.captureException(error);
    } else {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (import.meta.env.PROD) {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        data,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.warn(`[WARN] ${message}`, data);
    }
  },
};
```

**2. Usage**

```typescript
// Log important events
logger.info('Order created', { orderId: order.id, total: order.total });

// Log errors
try {
  await processPayment();
} catch (error) {
  logger.error('Payment failed', error);
}

// Log warnings
if (stock < minStock) {
  logger.warn('Low stock alert', { itemId: item.id, stock });
}
```

---

## 📊 Dashboards

### Sentry Dashboard

**Key Widgets**:
- Error rate over time
- Top errors by frequency
- Performance metrics
- User impact
- Release health

### PostHog Dashboard

**Key Widgets**:
- Daily active users
- Order conversion funnel
- Revenue tracking
- Feature adoption
- User retention

### UptimeRobot Dashboard

**Key Widgets**:
- Uptime percentage
- Response time trends
- Incident history
- Monitor status
- Alert history

### Better Stack Dashboard

**Key Widgets**:
- Active incidents
- Incident timeline
- On-call schedule
- Alert history
- Team performance

---

## 🔔 Alert Configuration

### Slack Integration

```bash
# Create Slack webhook
# Go to Slack → Apps → Incoming Webhooks

# Configure in monitoring tools
Webhook URL: https://hooks.slack.com/services/xxx/yyy/zzz
Channel: #alerts
Username: BrewHub Bot
Icon: :warning:
```

### Email Alerts

```bash
# Configure email recipients
team@brewhub.com - All alerts
devops@brewhub.com - Infrastructure alerts
engineering@brewhub.com - Application alerts
oncall@brewhub.com - Critical alerts only
```

### SMS Alerts

```bash
# Configure for critical alerts only
# Use Better Stack or UptimeRobot SMS feature
# Limit to on-call engineer
```

---

## 📈 Key Metrics & SLAs

### Service Level Agreements (SLAs)

**Availability**: 99.9% uptime
- Allowed downtime: 8.76 hours/year
- Allowed downtime: 43.8 minutes/month

**Performance**:
- Page load time: < 3 seconds
- API response time: < 200ms
- Error rate: < 1%

**Support**:
- Critical incidents: 15 minutes response
- High priority: 1 hour response
- Medium priority: 4 hours response
- Low priority: 24 hours response

### Monitoring Targets

**Error Rate**: < 1%
**Response Time**: < 200ms (p95)
**Uptime**: > 99.9%
**Error Budget**: 0.1% per month

---

## 🛠️ Troubleshooting

### Common Issues

**Sentry not capturing errors**:
- Check DSN is correct
- Verify environment variable is set
- Check CORS settings
- Verify project exists in Sentry

**UptimeRobot false positives**:
- Increase timeout
- Add retry logic
- Check SSL certificate
- Verify DNS resolution

**PostHog not tracking**:
- Check API key is correct
- Verify initialization code
- Check browser console for errors
- Verify network requests

**Performance metrics missing**:
- Check Web Vitals library is loaded
- Verify tracking code is running
- Check browser compatibility
- Verify analytics endpoint

---

## 📚 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot API](https://uptimerobot.com/api/)
- [Better Stack Docs](https://betterstack.com/docs/)
- [PostHog Documentation](https://posthog.com/docs)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Last Updated**: 2026  
**Maintained by**: DevOps Team  
**Contact**: devops@brewhub.app
