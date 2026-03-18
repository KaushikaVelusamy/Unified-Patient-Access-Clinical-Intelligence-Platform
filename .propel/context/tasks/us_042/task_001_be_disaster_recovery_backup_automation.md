# Task - TASK_001_BE_DISASTER_RECOVERY_BACKUP_AUTOMATION

## Requirement Reference
- User Story: US_042
- Story Location: `.propel/context/tasks/us_042/us_042.md`
- Acceptance Criteria:
    - AC1: Automated backup system performs PostgreSQL database backup every 6 hours (pg_dump), compresses with gzip (70% ratio), encrypts with AES-256 using KMS keys (NFR-SEC02), uploads to offsite storage (Azure Blob/AWS S3 geo-replicated), retains backups per HIPAA (daily 30d, weekly 1y, monthly 7y), performs Redis RDB snapshots every 1 hour, backs up logs from last 90 days, verifies integrity with weekly restore test to staging, achieves RTO/RPO ≤1 hour, documents runbook in .propel/docs/disaster-recovery.md, monitors with alerts, tracks metrics (backup_duration_seconds, backup_size_bytes)
- Edge Cases:
    - Backup storage quota full: Purge oldest backups, alert admin if persistently exceeded
    - Partial backups: Fail atomically, no partial uploads, retry once, critical alert
    - Disaster during backup: Use most recent completed backup, accept up to 6h data loss worst case

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Infrastructure/DevOps) |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Shell Scripts | Bash 5.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |
| Storage | Azure Blob / AWS S3 | Cloud storage |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement disaster recovery and backup automation: (1) Database backup script (backup-db.sh): pg_dump --format=custom -h localhost -U postgres -d appointment_db > backup_$(date +%Y%m%d_%H%M%S).dump, gzip backup file (target 70% compression), encrypt with OpenSSL AES-256: openssl enc -aes-256-cbc -salt -in backup.dump.gz -out backup.dump.gz.enc -pass file:encryption-key.txt, (2) Upload to cloud storage: Azure Blob Storage with geo-replication (azure storage blob upload) or AWS S3 with cross-region replication (aws s3 cp --sse AES256), (3) Retention policy: Daily backups retained 30 days, weekly backups (Sunday) retained 1 year, monthly backups (1st of month) retained 7 years per HIPAA NFR-DR01, automated script deletes expired backups, (4) Redis backup: redis-cli --rdb /var/backups/redis/dump_$(date +%Y%m%d_%H%M%S).rdb every 1 hour, upload to cloud storage, (5) Application logs backup: tar -czf logs_$(date +%Y%m%d).tar.gz /var/log/app/*.log (last 90 days), upload to cloud storage, (6) Backup verification: Automated weekly restore test every Sunday 2AM: Spin up isolated staging environment, restore latest backup (psql < backup.dump, redis-cli --rdb restore.rdb), run health checks (SELECT COUNT(*) FROM appointments, API health endpoint responds 200), compare row counts with production, report success/failure to admin, (7) RTO/RPO guarantees: Recovery Point Objective (RPO) ≤1 hour (max 1 hour data loss), Recovery Time Objective (RTO) ≤1 hour (restore + operational ≤1 hour), (8) Disaster recovery runbook (.propel/docs/disaster-recovery.md): Step-by-step procedures (1. Assess disaster scope, 2. Download latest backup from cloud storage, 3. Restore database: psql -h new-server -U postgres -d appointment_db < backup.dump, 4. Restore Redis: redis-cli --rdb restore.rdb, 5. Redeploy application: pm2 start ecosystem.config.js, 6. Update DNS records to point to new server, 7. Warm up cache, 8. Validate: Login works, appointments visible, AI services responding, 9. Monitor metrics for 1 hour, 10. Declare recovery complete), (9) Monitoring: Backup job logs to /var/log/backups/backup.log + syslog, Prometheus metrics (backup_duration_seconds histogram, backup_size_bytes gauge, backup_success_last_timestamp gauge, restore_test_success_last_timestamp gauge), Grafana dashboard for backup health, PagerDuty critical alert on backup failure or restore test failure, (10) Cost monitoring: Track cloud storage costs (should not exceed 10% of infrastructure budget), alertbackup on cost threshold breach.

## Dependent Tasks
- US_003 Task 001: PostgreSQL database (to be backed up)
- US_004 Task 001: Redis cache (to be backed up)
- US_011 Task 001: Audit logs (included in backup)
- US_005 Task 001: Prometheus metrics (monitoring backup jobs)

## Impacted Components
**New:**
- scripts/backup-db.sh (Database backup script)
- scripts/backup-redis.sh (Redis backup script)
- scripts/backup-logs.sh (Logs backup script)
- scripts/restore-db.sh (Database restore script)
- scripts/restore-test.sh (Automated restore test)
- scripts/retention-cleanup.sh (Delete expired backups)
- .propel/docs/disaster-recovery.md (DR runbook)
- server/src/jobs/backup-monitoring.ts (Backup metrics exporter)

**Modified:**
- crontab (Add backup job schedules)

## Implementation Plan
1. Create backup-db.sh script:
   ```bash
   #!/bin/bash
   set -e
   
   BACKUP_DIR="/var/backups/postgres"
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.dump"
   ENCRYPTED_FILE="$BACKUP_FILE.gz.enc"
   
   echo "Starting database backup: $TIMESTAMP"
   
   # pg_dump with custom format
   pg_dump --format=custom -h localhost -U postgres -d appointment_db > $BACKUP_FILE
   
   # Compress (target 70% compression)
   gzip $BACKUP_FILE
   
   # Encrypt with AES-256
   openssl enc -aes-256-cbc -salt -in $BACKUP_FILE.gz -out $ENCRYPTED_FILE -pass file:/etc/backup-encryption-key.txt
   
   # Upload to Azure Blob Storage (or AWS S3)
   az storage blob upload --account-name myaccount --container-name backups --file $ENCRYPTED_FILE --name postgres/backup_$TIMESTAMP.dump.gz.enc
   
   # Cleanup local file after upload
   rm $BACKUP_FILE.gz $ENCRYPTED_FILE
   
   # Log success
   echo "Backup completed: $TIMESTAMP, Size: $(du -h $ENCRYPTED_FILE | cut -f1)" | tee -a /var/log/backups/backup.log
   
   # Export Prometheus metric
   curl -X POST http://localhost:9091/metrics \
     -d "backup_success_last_timestamp $(date +%s)" \
     -d "backup_duration_seconds $SECONDS"
   ```
2. Create backup-redis.sh (similar structure, redis-cli --rdb)
3. Create backup-logs.sh (tar application logs, upload to cloud)
4. Cron schedule (crontab -e):
   ```
   0 */6 * * * /scripts/backup-db.sh       # Every 6 hours
   0 * * * * /scripts/backup-redis.sh      # Every 1 hour
   0 2 * * * /scripts/backup-logs.sh       # Daily at 2AM
   0 2 * * 0 /scripts/restore-test.sh      # Weekly Sunday 2AM
   0 3 * * * /scripts/retention-cleanup.sh # Daily at 3AM
   ```
5. Retention policy (retention-cleanup.sh):
   ```bash
   #!/bin/bash
   # Delete daily backups older than 30 days
   find /var/backups/postgres -name "backup_*.dump.gz.enc" -mtime +30 -delete
   
   # Keep weekly backups (Sunday) for 1 year
   # (Weekly backups tagged with "weekly_" prefix)
   find /var/backups/postgres -name "weekly_*.dump.gz.enc" -mtime +365 -delete
   
   # Keep monthly backups (1st of month) for 7 years
   # (Monthly backups tagged with "monthly_" prefix)
   find /var/backups/postgres -name "monthly_*.dump.gz.enc" -mtime +2555 -delete  # 7 years = 2555 days
   
   # Same for cloud storage (Azure Blob lifecycle management policy)
   ```
6. Automated restore test (restore-test.sh):
   ```bash
   #!/bin/bash
   set -e
   
   echo "Starting restore test: $(date)"
   
   # Download latest backup from cloud storage
   LATEST_BACKUP=$(az storage blob list --account-name myaccount --container-name backups --prefix postgres/ --query "[0].name" -o tsv)
   az storage blob download --account-name myaccount --container-name backups --name $LATEST_BACKUP --file /tmp/restore_test.dump.gz.enc
   
   # Decrypt
   openssl enc -aes-256-cbc -d -in /tmp/restore_test.dump.gz.enc -out /tmp/restore_test.dump.gz -pass file:/etc/backup-encryption-key.txt
   
   # Decompress
   gunzip /tmp/restore_test.dump.gz
   
   # Restore to staging database
   psql -h staging-db-server -U postgres -d staging_appointment_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   pg_restore -h staging-db-server -U postgres -d staging_appointment_db /tmp/restore_test.dump
   
   # Health checks
   APPOINTMENT_COUNT=$(psql -h staging-db-server -U postgres -d staging_appointment_db -t -c "SELECT COUNT(*) FROM appointments;")
   echo "Restored appointment count: $APPOINTMENT_COUNT"
   
   # API health check (staging environment)
   HEALTH_STATUS=$(curl -s http://staging-api-server:3001/health | jq -r '.status')
   if [ "$HEALTH_STATUS" != "OK" ]; then
     echo "ERROR: API health check failed"
     exit 1
   fi
   
   echo "Restore test completed successfully: $(date)"
   
   # Export Prometheus metric
   curl -X POST http://localhost:9091/metrics \
     -d "restore_test_success_last_timestamp $(date +%s)"
   
   # Cleanup
   rm /tmp/restore_test.dump
   ```
7. Disaster recovery runbook (.propel/docs/disaster-recovery.md):
   ```markdown
   # Disaster Recovery Runbook
   
   ## RTO/RPO Objectives
   - **RPO (Recovery Point Objective)**: ≤1 hour (max 1 hour data loss)
   - **RTO (Recovery Time Objective)**: ≤1 hour (system restored + operational)
   
   ## Disaster Scenarios
   1. Database server failure
   2. Application server crash
   3. Cloud provider regional outage
   4. Data corruption
   
   ## Recovery Procedure
   
   ### Step 1: Assess Disaster Scope (5 minutes)
   - Identify affected systems
   - Determine backup required (database, cache, logs)
   - Notify stakeholders
   
   ### Step 2: Download Latest Backup (10 minutes)
   ```bash
   az storage blob download --account-name myaccount --container-name backups --name postgres/latest_backup.dump.gz.enc --file /tmp/backup.dump.gz.enc
   openssl enc -aes-256-cbc -d -in /tmp/backup.dump.gz.enc -out /tmp/backup.dump.gz -pass file:/etc/backup-encryption-key.txt
   gunzip /tmp/backup.dump.gz
   ```
   
   ### Step 3: Restore Database (20 minutes)
   ```bash
   psql -h new-db-server -U postgres -c "CREATE DATABASE appointment_db;"
   pg_restore -h new-db-server -U postgres -d appointment_db /tmp/backup.dump
   ```
   
   ### Step 4: Restore Redis Cache (5 minutes)
   ```bash
   redis-cli -h new-redis-server --rdb /tmp/redis_restore.rdb
   ```
   
   ### Step 5: Redeploy Application (10 minutes)
   ```bash
   git clone https://github.com/org/appointment-platform.git /app
   cd /app/server
   npm install --production
   pm2 start ecosystem.config.js
   ```
   
   ### Step 6: Update DNS Records (5 minutes)
   - Update A records to point to new server IP
   - Wait for DNS propagation (1-5 minutes)
   
   ### Step 7: Warm Up Cache (5 minutes)
   ```bash
   curl http://new-server:3001/api/admin/cache-warm-up
   ```
   
   ### Step 8: Validation Checklist (10 minutes)
   - [ ] Login works (test patient + staff accounts)
   - [ ] Appointments visible in queue
   - [ ] AI services responding (test intake chat)
   - [ ] Document upload functional
   - [ ] Admin dashboard loads
   - [ ] Prometheus metrics flowing
   
   ### Step 9: Monitor Metrics (1 hour)
   - Watch for error spikes
   - Check response times
   - Validate data integrity
   
   ### Step 10: Declare Recovery Complete
   - Notify stakeholders
   - Post-mortem meeting scheduled
   ```
8. Backup monitoring (backup-monitoring.ts):
   ```typescript
   // Prometheus metrics
   const backupDuration = new Histogram({
     name: 'backup_duration_seconds',
     help: 'Duration of backup job in seconds',
     labelNames: ['backup_type']  // postgres, redis, logs
   });
   
   const backupSize = new Gauge({
     name: 'backup_size_bytes',
     help: 'Size of backup file in bytes',
     labelNames: ['backup_type']
   });
   
   const backupSuccessTimestamp = new Gauge({
     name: 'backup_success_last_timestamp',
     help: 'Unix timestamp of last successful backup',
     labelNames: ['backup_type']
   });
   
   const restoreTestTimestamp = new Gauge({
     name: 'restore_test_success_last_timestamp',
     help: 'Unix timestamp of last successful restore test'
   });
   ```
9. PagerDuty alerts:
   - Backup failure (no successful backup in 8 hours)
   - Restore test failure (staging restore failed)
   - Storage quota exceeded (>90% capacity)
10. Cost monitoring: Track Azure Blob Storage costs via Azure Cost Management API, alert if monthly cost >10% of infrastructure budget

## Current Project State
```
ASSIGNMENT/
├── server/src/ (backend exists)
├── scripts/ (to be created)
└── (backup/DR to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | scripts/backup-db.sh | Database backup script |
| CREATE | scripts/backup-redis.sh | Redis backup script |
| CREATE | scripts/backup-logs.sh | Logs backup script |
| CREATE | scripts/restore-db.sh | Database restore script |
| CREATE | scripts/restore-test.sh | Restore test script |
| CREATE | scripts/retention-cleanup.sh | Cleanup script |
| CREATE | .propel/docs/disaster-recovery.md | DR runbook |
| CREATE | server/src/jobs/backup-monitoring.ts | Metrics exporter |
| UPDATE | crontab | Add backup schedules |

## External References
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [AWS S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [NFR-DR01 Backup Retention](../../../.propel/context/docs/spec.md#NFR-DR01)
- [NFR-DR02 RTO/RPO ≤1h](../../../.propel/context/docs/spec.md#NFR-DR02)
- [NFR-SEC02 Encrypted Backups](../../../.propel/context/docs/spec.md#NFR-SEC02)

## Build Commands
```bash
# Create scripts directory
mkdir -p scripts

# Make scripts executable
chmod +x scripts/*.sh

# Test database backup
./scripts/backup-db.sh

# Test restore (to staging)
./scripts/restore-test.sh

# Setup cron jobs
crontab -e
# (Add schedules from implementation plan)
```

## Implementation Validation Strategy
- [ ] Unit tests: N/A (shell scripts, manual validation)
- [ ] Integration tests: Run restore-test.sh → verify staging database restored
- [ ] Scripts created: backup-db.sh, backup-redis.sh, backup-logs.sh, restore-db.sh, restore-test.sh, retention-cleanup.sh exist
- [ ] Cron jobs scheduled: crontab -l shows 5 cron entries (database 6h, redis 1h, logs daily, restore test weekly, cleanup daily)
- [ ] Database backup: Run backup-db.sh → pg_dump creates backup file, gzip compresses (check size reduction ~70%), OpenSSL encrypts, uploads to Azure Blob/AWS S3
- [ ] Redis backup: Run backup-redis.sh → redis-cli --rdb creates RDB snapshot, uploads to cloud
- [ ] Logs backup: Run backup-logs.sh → tar archives last 90 days logs, uploads to cloud
- [ ] Cloud storage: List blobs/objects → see backup files uploaded with timestamps
- [ ] Retention policy: Daily backups >30 days deleted, weekly backups >1 year deleted, monthly backups >7 years deleted
- [ ] Automated restore test: Run restore-test.sh → downloads latest backup, decrypts, decompresses, restores to staging database, runs health checks, reports success
- [ ] Health checks: Staging database has same appointment count as production (±10 due to recent activity), API health endpoint responds 200
- [ ] RTO/RPO: Time restore test → complete within 60 minutes (RTO ≤1h), backup taken within 6h of disaster (RPO ≤1h with 6h backup interval, recommend 1h for stricter RPO)
- [ ] Disaster recovery runbook: .propel/docs/disaster-recovery.md exists with step-by-step procedures
- [ ] Monitoring: Prometheus metrics backup_duration_seconds, backup_size_bytes, backup_success_last_timestamp exported
- [ ] Grafana dashboard: Visualizes backup health (last backup timestamp, success/failure, backup size trend)
- [ ] PagerDuty alerts: Simulate backup failure → alert triggered "Database backup failed"
- [ ] Cost monitoring: Query Azure Cost Management API → backup storage costs <10% of infrastructure budget
- [ ] Encryption key security: /etc/backup-encryption-key.txt has 0600 permissions, stored in KMS or secure vault

## Implementation Checklist
- [ ] Create scripts/ directory for backup scripts
- [ ] Write backup-db.sh with pg_dump + gzip + OpenSSL encryption
- [ ] Write backup-redis.sh with redis-cli --rdb
- [ ] Write backup-logs.sh with tar + upload
- [ ] Write restore-db.sh with decryption + pg_restore
- [ ] Write restore-test.sh with automated validation
- [ ] Write retention-cleanup.sh with find + delete logic
- [ ] Configure Azure Blob Storage or AWS S3 bucket with geo-replication
- [ ] Setup encryption key (/etc/backup-encryption-key.txt) with 0600 permissions
- [ ] Add cron jobs for automated backups
- [ ] Test database backup + restore flow manually
- [ ] Write disaster-recovery.md runbook with all steps
- [ ] Implement backup-monitoring.ts Prometheus metrics
- [ ] Setup Grafana dashboard for backup health
- [ ] Configure PagerDuty alerts for backup failures
- [ ] Validate RTO/RPO requirements met
- [ ] Document backup/DR procedures in server/README.md
