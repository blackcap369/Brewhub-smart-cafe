# Backup & Disaster Recovery Strategy

## Overview

This document outlines the backup and disaster recovery strategy for BrewHub, ensuring data integrity and business continuity.

---

## 📊 Backup Strategy Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Backup Strategy                         │
├─────────────────────────────────────────────────────────┤
│  Database Backups    │  Supabase Automatic              │
│  File Storage        │  Supabase Storage                │
│  Configuration       │  Git + Vercel                    │
│  Environment         │  Vercel Env Vars                 │
│  Code                │  GitHub Repository               │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Backups

### Automatic Backups (Supabase)

**Backup Schedule**:
- **Frequency**: Daily automatic backups
- **Retention**: 
  - Free tier: 7 days
  - Pro tier: 30 days
  - Team tier: 90 days
- **Point-in-Time Recovery**: Enabled
- **Location**: Same region as database

**Backup Contents**:
- All database tables
- Row Level Security policies
- Functions and triggers
- Indexes and constraints
- Enums and types

### Manual Backups

**Before Major Changes**:

```bash
#!/bin/bash
# backup-database.sh

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Dump database
npx supabase db dump > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz \
  s3://brewhub-backups/database/

# Verify upload
aws s3 ls s3://brewhub-backups/database/backup_$TIMESTAMP.sql.gz

# Clean up local file
rm $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

**Schedule Manual Backups**:

```bash
# Add to crontab
# Run daily at 2 AM
0 2 * * * /path/to/backup-database.sh
```

### Backup Verification

**Weekly Verification Script**:

```bash
#!/bin/bash
# verify-backup.sh

# Get latest backup
LATEST_BACKUP=$(aws s3 ls s3://brewhub-backups/database/ \
  | sort | tail -n 1 | awk '{print $4}')

# Download backup
aws s3 cp s3://brewhub-backups/database/$LATEST_BACKUP ./

# Decompress
gunzip $LATEST_BACKUP

# Restore to test database
npx supabase db push --linked

# Run verification queries
psql -f verify-queries.sql

# Check results
if [ $? -eq 0 ]; then
  echo "✅ Backup verification successful"
  # Send success notification
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Database backup verified successfully"}' \
    $SLACK_WEBHOOK
else
  echo "❌ Backup verification failed"
  # Send failure notification
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"❌ Database backup verification failed!"}' \
    $SLACK_WEBHOOK
fi

# Clean up
rm ${LATEST_BACKUP%.gz}
```

**Verification Queries** (`verify-queries.sql`):

```sql
-- Check critical tables exist
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM cafes;
SELECT COUNT(*) FROM menu_items;
SELECT COUNT(*) FROM orders;

-- Check data integrity
SELECT COUNT(*) FROM orders WHERE total < 0;
SELECT COUNT(*) FROM menu_items WHERE price < 0;

-- Check indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'orders';

-- Check RLS policies
SELECT polname FROM pg_policies WHERE tablename = 'orders';
```

---

## 📁 File Storage Backups

### Supabase Storage

**Automatic Backups**:
- Enabled by default
- Same retention as database
- Point-in-time recovery available

**Manual Backups**:

```bash
#!/bin/bash
# backup-storage.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/storage"
mkdir -p $BACKUP_DIR

# List all buckets
BUCKETS=$(npx supabase storage list | grep -oP '(?<=│ ).*(?= │)')

# Download each bucket
for BUCKET in $BUCKETS; do
  echo "Backing up bucket: $BUCKET"
  
  # Download bucket contents
  npx supabase storage download $BUCKET $BACKUP_DIR/$BUCKET
  
  # Compress
  tar -czf $BACKUP_DIR/${BUCKET}_$TIMESTAMP.tar.gz \
    -C $BACKUP_DIR $BUCKET
  
  # Upload to S3
  aws s3 cp $BACKUP_DIR/${BUCKET}_$TIMESTAMP.tar.gz \
    s3://brewhub-backups/storage/
  
  # Clean up
  rm -rf $BACKUP_DIR/$BUCKET
  rm $BACKUP_DIR/${BUCKET}_$TIMESTAMP.tar.gz
done

echo "Storage backup completed"
```

---

## 🔧 Configuration Backups

### Vercel Configuration

**Export Environment Variables**:

```bash
#!/bin/bash
# backup-vercel-env.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/vercel"
mkdir -p $BACKUP_DIR

# Export production variables
vercel env ls production > $BACKUP_DIR/prod_env_$TIMESTAMP.txt

# Export staging variables
vercel env ls staging > $BACKUP_DIR/staging_env_$TIMESTAMP.txt

# Export preview variables
vercel env ls preview > $BACKUP_DIR/preview_env_$TIMESTAMP.txt

# Upload to S3
aws s3 cp $BACKUP_DIR/ s3://brewhub-backups/vercel/ \
  --recursive

# Clean up
rm -rf $BACKUP_DIR

echo "Vercel config backup completed"
```

### Supabase Configuration

**Export Schema**:

```bash
#!/bin/bash
# backup-supabase-schema.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/supabase"
mkdir -p $BACKUP_DIR

# Export schema
npx supabase db dump --schema > $BACKUP_DIR/schema_$TIMESTAMP.sql

# Export RLS policies
npx supabase db dump --schema-only > $BACKUP_DIR/rls_$TIMESTAMP.sql

# Export functions
npx supabase functions list > $BACKUP_DIR/functions_$TIMESTAMP.txt

# Upload to S3
aws s3 cp $BACKUP_DIR/ s3://brewhub-backups/supabase/ \
  --recursive

# Clean up
rm -rf $BACKUP_DIR

echo "Supabase config backup completed"
```

---

## 💾 Backup Storage

### AWS S3 Configuration

**Create S3 Bucket**:

```bash
# Create bucket
aws s3 mb s3://brewhub-backups --region ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket brewhub-backups \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket brewhub-backups \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket brewhub-backups \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "DeleteOldBackups",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "Expiration": {"Days": 90}
      }
    ]
  }'
```

**Backup Structure**:

```
s3://brewhub-backups/
├── database/
│   ├── backup_20240115_020000.sql.gz
│   ├── backup_20240116_020000.sql.gz
│   └── ...
├── storage/
│   ├── menu-images_20240115_030000.tar.gz
│   └── ...
├── vercel/
│   ├── prod_env_20240115_040000.txt
│   └── ...
└── supabase/
    ├── schema_20240115_040000.sql
    └── ...
```

---

## 🚨 Disaster Recovery

### Recovery Time Objective (RTO)

**Target**: 1 hour

**Breakdown**:
- Detection: 5 minutes
- Assessment: 15 minutes
- Restoration: 30 minutes
- Verification: 10 minutes

### Recovery Point Objective (RPO)

**Target**: 24 hours

**Breakdown**:
- Database: Daily backups (24 hours max data loss)
- Files: Daily backups (24 hours max data loss)
- Configuration: Git version control (no data loss)

### Disaster Recovery Plan

**Phase 1: Detection & Assessment** (5-15 minutes)

```bash
# 1. Identify the issue
# Check monitoring alerts
# Review error logs
# Assess data loss

# 2. Declare disaster
# Notify team via Slack
# Activate disaster recovery team
# Start incident timeline
```

**Phase 2: Stop Services** (5 minutes)

```bash
# Pause application to prevent further data corruption
vercel pause --prod

# Notify users
# Update status page
```

**Phase 3: Restore Database** (30 minutes)

```bash
# 1. List available backups
npx supabase db list-backups

# 2. Choose appropriate backup
# Consider point-in-time if available

# 3. Restore database
npx supabase db restore --backup-id <backup-id>

# 4. Verify restoration
psql -c "SELECT COUNT(*) FROM users;"
psql -c "SELECT COUNT(*) FROM orders;"
```

**Phase 4: Restore Files** (15 minutes)

```bash
# 1. Download latest storage backup
aws s3 cp s3://brewhub-backups/storage/latest.tar.gz ./

# 2. Extract backup
tar -xzf latest.tar.gz

# 3. Upload to Supabase Storage
npx supabase storage upload menu-images ./menu-images
```

**Phase 5: Verify Data** (10 minutes)

```bash
# Run verification queries
psql -f verify-queries.sql

# Check critical data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '1 day';
SELECT COUNT(*) FROM menu_items WHERE is_available = true;

# Test application functionality
# Place test order
# Process test payment
```

**Phase 6: Resume Services** (5 minutes)

```bash
# Resume application
vercel resume --prod

# Monitor for errors
# Check Sentry
# Watch performance metrics
```

**Phase 7: Post-Recovery** (Ongoing)

```bash
# Monitor system health
# Check for data inconsistencies
# Review user reports
# Conduct post-mortem
# Update disaster recovery plan
```

---

## 📋 Disaster Recovery Runbook

### Scenario 1: Database Corruption

**Symptoms**:
- Application errors
- Data inconsistencies
- Query failures

**Recovery Steps**:

```bash
# 1. Stop application
vercel pause --prod

# 2. Identify last good backup
npx supabase db list-backups

# 3. Restore from backup
npx supabase db restore --backup-id <backup-id>

# 4. Verify data integrity
psql -f verify-queries.sql

# 5. Resume application
vercel resume --prod

# 6. Monitor for 24 hours
```

### Scenario 2: Complete Data Loss

**Symptoms**:
- Database unavailable
- All data lost
- Application non-functional

**Recovery Steps**:

```bash
# 1. Create new Supabase project
npx supabase projects create brewhub-recovery

# 2. Apply all migrations
npx supabase db push

# 3. Restore latest backup
npx supabase db restore --backup-id <backup-id>

# 4. Update environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# 5. Redeploy application
vercel --prod

# 6. Verify functionality
# Test all critical flows
```

### Scenario 3: Ransomware Attack

**Symptoms**:
- Data encrypted
- Ransom note
- System locked

**Recovery Steps**:

```bash
# 1. ISOLATE SYSTEMS IMMEDIATELY
# Disconnect from network
# Stop all services

# 2. Assess damage
# Identify affected systems
# Determine data loss

# 3. DO NOT PAY RANSOM
# Contact law enforcement
# Notify cybersecurity team

# 4. Restore from clean backup
# Verify backup is before attack
# Restore to new infrastructure

# 5. Rotate all credentials
# Database passwords
# API keys
# Service tokens

# 6. Rebuild infrastructure
# New Supabase project
# New Vercel deployment
# New service accounts

# 7. Conduct security audit
# Identify attack vector
# Patch vulnerabilities
# Update security policies
```

---

## 🔄 Backup Automation

### GitHub Actions Workflow

```yaml
# .github/workflows/backup.yml
name: Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Backup database
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          npx supabase db dump > backup_$TIMESTAMP.sql
          gzip backup_$TIMESTAMP.sql
          aws s3 cp backup_$TIMESTAMP.sql.gz \
            s3://brewhub-backups/database/

      - name: Backup configuration
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          mkdir -p config_backup
          vercel env ls production > config_backup/prod_env_$TIMESTAMP.txt
          aws s3 cp config_backup/ s3://brewhub-backups/vercel/ --recursive

      - name: Verify backup
        run: |
          LATEST=$(aws s3 ls s3://brewhub-backups/database/ \
            | sort | tail -n 1 | awk '{print $4}')
          aws s3 cp s3://brewhub-backups/database/$LATEST ./
          gunzip $LATEST
          # Add verification queries here

      - name: Notify success
        if: success()
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"✅ Daily backup completed successfully"}' \
            ${{ secrets.SLACK_WEBHOOK }}

      - name: Notify failure
        if: failure()
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"❌ Daily backup failed!"}' \
            ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📊 Backup Monitoring

### Backup Health Checks

**Daily Checks**:
- [ ] Database backup completed
- [ ] Storage backup completed
- [ ] Configuration backup completed
- [ ] Backup uploaded to S3
- [ ] Backup size within expected range

**Weekly Checks**:
- [ ] Backup verification completed
- [ ] Restore test successful
- [ ] Backup retention policy followed
- [ ] No backup failures

**Monthly Checks**:
- [ ] Full disaster recovery test
- [ ] Backup storage costs reviewed
- [ ] Recovery procedures updated
- [ ] Team trained on recovery

### Monitoring Alerts

**Critical Alerts** (Immediate):
- Backup failure
- Backup size anomaly (> 50% change)
- Backup verification failure
- S3 upload failure

**Warning Alerts** (1 hour):
- Backup delayed (> 1 hour)
- Backup size growing rapidly
- Storage quota approaching limit

**Info Alerts** (Daily):
- Backup completion summary
- Storage usage report
- Retention policy status

---

## 🧪 Testing

### Quarterly DR Test

**Test Plan**:

```markdown
# Disaster Recovery Test - Q1 2024

## Objective
Verify ability to restore from backup within RTO

## Scope
- Database restoration
- File restoration
- Application recovery
- Data verification

## Test Steps
1. Create test backup
2. Simulate disaster (delete test data)
3. Execute recovery procedure
4. Verify data integrity
5. Test application functionality
6. Document results

## Success Criteria
- Recovery completed within 1 hour
- All data restored successfully
- Application fully functional
- No data loss

## Team
- Lead: [Name]
- Database: [Name]
- Application: [Name]
- Verification: [Name]

## Schedule
- Date: 2024-03-15
- Time: 10:00 AM IST
- Duration: 2 hours
```

**Test Report Template**:

```markdown
# Disaster Recovery Test Report

## Test Details
- Date: 2024-03-15
- Duration: 1 hour 45 minutes
- Team: [Names]

## Results
- ✅ Database restored successfully
- ✅ Files restored successfully
- ✅ Application recovered
- ✅ Data verified
- ✅ Functionality tested

## Metrics
- Recovery Time: 1 hour 45 minutes (Target: 1 hour)
- Data Loss: 0 records (Target: < 24 hours)
- Verification: 100% passed

## Issues Found
1. Backup restoration took longer than expected
   - Root cause: Network bandwidth
   - Action: Optimize backup compression

2. Verification script missing some checks
   - Root cause: Outdated script
   - Action: Update verification queries

## Lessons Learned
- Test backup restoration monthly
- Keep verification scripts updated
- Document all steps clearly

## Next Steps
- [ ] Fix identified issues
- [ ] Update procedures
- [ ] Schedule next test
- [ ] Train team on updates
```

---

## 📚 Best Practices

### Backup Best Practices

1. **3-2-1 Rule**:
   - 3 copies of data
   - 2 different media
   - 1 offsite copy

2. **Regular Testing**:
   - Test backups weekly
   - Full DR test quarterly
   - Document all tests

3. **Encryption**:
   - Encrypt backups at rest
   - Encrypt backups in transit
   - Manage encryption keys securely

4. **Retention Policy**:
   - Daily backups: 30 days
   - Weekly backups: 12 weeks
   - Monthly backups: 12 months
   - Yearly backups: 7 years

5. **Automation**:
   - Automate backup creation
   - Automate backup verification
   - Automate backup cleanup

### Recovery Best Practices

1. **Document Everything**:
   - Step-by-step procedures
   - Contact information
   - System dependencies
   - Verification queries

2. **Practice Regularly**:
   - Monthly restore tests
   - Quarterly DR tests
   - Annual full simulation

3. **Keep Updated**:
   - Review procedures after changes
   - Update contact information
   - Test new backup types
   - Train new team members

4. **Monitor Continuously**:
   - Backup success rate
   - Recovery time trends
   - Storage usage
   - Cost optimization

---

## 📞 Emergency Contacts

**Primary**:
- DevOps Lead: +91-XXXXXXXXXX
- Email: devops-lead@brewhub.app

**Secondary**:
- Engineering Manager: +91-XXXXXXXXXX
- Email: eng-manager@brewhub.app

**Escalation**:
- CTO: +91-XXXXXXXXXX
- Email: cto@brewhub.app

**External**:
- Supabase Support: support@supabase.com
- Vercel Support: support@vercel.com
- AWS Support: AWS Console

---

## 📖 Resources

- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Vercel Backup](https://vercel.com/docs/concepts/deployments/backup)
- [Disaster Recovery Planning](https://www.nist.gov/publications)

---

**Last Updated**: 2026  
**Maintained by**: DevOps Team  
**Review Frequency**: Quarterly  
**Next Review**: 2026-04-01  
**Contact**: devops@brewhub.app
