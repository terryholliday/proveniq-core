# ARCHITECT CERTIFICATION EXAM
## 4-Hour Simulated Outage

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  [EXAMINER] CERTIFICATION ARTIFACT                                           ║
║  ═══════════════════════════════════════════════════════════════════════════ ║
║                                                                              ║
║  Exam:         PROVENIQ-ARCHITECT-CERT-001                                   ║
║  Title:        The Ledger Sync Crisis                                        ║
║  Duration:     4 hours (240 minutes)                                         ║
║  Format:       Live Simulated Outage                                         ║
║  Passing:      95% (with no auto-fail triggers)                              ║
║                                                                              ║
║  ⚠️  PROCTORED EXAMINATION                                                  ║
║  All actions are logged. All communications are recorded.                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🚨 INCIDENT BRIEFING

### Initial Alert

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🚨 INCIDENT ALERT: INC-2024-CERT-FINAL                                     │
│                                                                              │
│  Severity:     SEV-1 (CRITICAL)                                             │
│  Status:       ACTIVE                                                        │
│  Start Time:   [EXAM START]                                                 │
│  Duration:     00:00:00                                                      │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  INCIDENT SUMMARY:                                                           │
│  The Ledger synchronization service has failed. Core and Ledger are         │
│  out of sync. Financial transactions are being queued but not committed.    │
│  Locker hardware continues to operate, creating a growing divergence        │
│  between physical asset state and financial records.                         │
│                                                                              │
│  OBSERVED SYMPTOMS:                                                          │
│  • Ledger sync lag: 47 minutes and growing                                  │
│  • Transaction queue depth: 12,847 pending                                  │
│  • Reconciliation errors: 342 detected                                      │
│  • API error rate: 23% (normal: <1%)                                        │
│  • Customer complaints: 89 tickets in last hour                             │
│                                                                              │
│  BUSINESS IMPACT:                                                            │
│  • $2.3M in pending transactions at risk                                    │
│  • 3 enterprise customers affected                                          │
│  • Regulatory reporting deadline in 6 hours                                 │
│  • Potential audit findings if not resolved                                 │
│                                                                              │
│  YOUR ROLE: Incident Commander / Lead Architect                             │
│  YOUR MISSION: Restore Ledger sync, preserve data integrity,                │
│                communicate status appropriately                              │
│                                                                              │
│  CLOCK STARTS NOW.                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 EXAM STRUCTURE

### Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1: Triage | 0:00 - 0:30 | Assess situation, establish communication |
| Phase 2: Diagnosis | 0:30 - 1:30 | Identify root cause, develop recovery plan |
| Phase 3: Recovery | 1:30 - 3:00 | Execute recovery, restore Ledger sync |
| Phase 4: Validation | 3:00 - 3:30 | Verify data integrity, reconcile discrepancies |
| Phase 5: Closeout | 3:30 - 4:00 | Document incident, communicate resolution |

### Available Resources

```yaml
Environment:
  - Production-like sandbox environment
  - Full access to Core, Ledger, and Locker systems
  - Database read/write access
  - Log aggregation system
  - Monitoring dashboards

Documentation:
  - System architecture diagrams
  - Runbooks (may be incomplete)
  - API documentation
  - Database schema

Communication:
  - Simulated Slack channel (#incident-cert-final)
  - Simulated PagerDuty
  - API for status updates

Constraints:
  - No internet access (except documentation)
  - No AI assistance
  - No communication with other candidates
```

---

## 📊 GRADING RUBRIC

### Category 1: Ledger Sync Restoration (40%)

| Criteria | Points | Description |
|----------|--------|-------------|
| Root Cause Identification | 10 | Correctly identify why sync failed |
| Recovery Strategy | 10 | Develop appropriate recovery plan |
| Sync Restoration | 15 | Successfully restore Ledger sync |
| Queue Processing | 5 | Process pending transactions correctly |

**Detailed Rubric:**

```typescript
const LEDGER_SYNC_RUBRIC = {
  root_cause: {
    points: 10,
    criteria: {
      10: "Correctly identifies root cause with evidence",
      8: "Identifies root cause with minor gaps",
      5: "Partially correct diagnosis",
      2: "Incorrect diagnosis but reasonable approach",
      0: "No diagnosis attempted or completely wrong",
    },
  },
  
  recovery_strategy: {
    points: 10,
    criteria: {
      10: "Optimal strategy with rollback plan",
      8: "Good strategy, minor improvements possible",
      5: "Workable strategy with risks",
      2: "Risky strategy that could cause more issues",
      0: "No strategy or dangerous approach",
    },
  },
  
  sync_restoration: {
    points: 15,
    criteria: {
      15: "Full sync restored within 2 hours",
      12: "Full sync restored within 3 hours",
      8: "Partial sync restored",
      4: "Sync attempted but not successful",
      0: "No restoration achieved",
    },
  },
  
  queue_processing: {
    points: 5,
    criteria: {
      5: "All pending transactions processed correctly",
      3: "Most transactions processed, minor issues",
      1: "Some transactions processed",
      0: "Queue not addressed or data loss",
    },
  },
} as const;
```

---

### Category 2: Data Integrity Preservation (40%)

| Criteria | Points | Description |
|----------|--------|-------------|
| No Data Loss | 15 | Zero transactions lost |
| Reconciliation | 10 | All discrepancies resolved |
| Audit Trail | 10 | Complete audit log maintained |
| Rollback Safety | 5 | Safe rollback procedures used |

**Detailed Rubric:**

```typescript
const DATA_INTEGRITY_RUBRIC = {
  no_data_loss: {
    points: 15,
    criteria: {
      15: "Zero data loss, all transactions preserved",
      10: "Minimal data loss (<0.1%), documented",
      5: "Some data loss (<1%), recovery attempted",
      0: "Significant data loss or untracked loss",
    },
    auto_fail: "Any untracked data loss",
  },
  
  reconciliation: {
    points: 10,
    criteria: {
      10: "All 342 discrepancies resolved with documentation",
      8: "95%+ discrepancies resolved",
      5: "75%+ discrepancies resolved",
      2: "50%+ discrepancies resolved",
      0: "Reconciliation not attempted or <50%",
    },
  },
  
  audit_trail: {
    points: 10,
    criteria: {
      10: "Complete audit trail, every action logged",
      8: "Audit trail with minor gaps",
      5: "Partial audit trail",
      2: "Minimal logging",
      0: "No audit trail maintained",
    },
  },
  
  rollback_safety: {
    points: 5,
    criteria: {
      5: "All changes reversible, backups verified",
      3: "Most changes reversible",
      1: "Some rollback capability",
      0: "No rollback plan or irreversible changes made",
    },
  },
} as const;
```

---

### Category 3: Status Communication via API Headers (20%)

| Criteria | Points | Description |
|----------|--------|-------------|
| X-Incident-Status Header | 8 | Correct status in all responses |
| X-Degraded-Service Header | 6 | Accurate degradation indicators |
| X-Retry-After Header | 4 | Appropriate retry guidance |
| X-Request-Id Correlation | 2 | Consistent request tracing |

**Required Headers:**

```http
HTTP/1.1 503 Service Unavailable
X-Incident-Status: active
X-Incident-Id: INC-2024-CERT-FINAL
X-Degraded-Service: ledger-sync
X-Retry-After: 300
X-Request-Id: req_abc123
X-Incident-ETA: 2024-01-15T16:00:00Z
Content-Type: application/json

{
  "error": {
    "code": "SERVICE_DEGRADED",
    "message": "Ledger synchronization is currently degraded. Transactions are queued.",
    "incident_id": "INC-2024-CERT-FINAL",
    "retry_after": 300
  }
}
```

**Detailed Rubric:**

```typescript
const COMMUNICATION_RUBRIC = {
  incident_status_header: {
    points: 8,
    criteria: {
      8: "X-Incident-Status correctly set on all responses throughout incident",
      6: "Header present on most responses",
      4: "Header present but inconsistent",
      2: "Header occasionally present",
      0: "Header not implemented",
    },
    required_values: ["active", "mitigating", "resolved"],
  },
  
  degraded_service_header: {
    points: 6,
    criteria: {
      6: "X-Degraded-Service accurately reflects affected services",
      4: "Header present with correct service",
      2: "Header present but inaccurate",
      0: "Header not implemented",
    },
  },
  
  retry_after_header: {
    points: 4,
    criteria: {
      4: "X-Retry-After provides accurate, dynamic estimates",
      3: "Header present with reasonable estimates",
      2: "Header present with static value",
      0: "Header not implemented",
    },
  },
  
  request_id_correlation: {
    points: 2,
    criteria: {
      2: "X-Request-Id present and correlates across services",
      1: "Header present but not correlated",
      0: "Header not implemented",
    },
  },
} as const;
```

---

## 🚫 AUTO-FAIL CONDITIONS

### Immediate Disqualification

```typescript
const AUTO_FAIL_CONDITIONS = {
  pii_exposure: {
    trigger: "Any exposure of Personally Identifiable Information",
    examples: [
      "Logging user email addresses in plain text",
      "Including SSN/TIN in error messages",
      "Exposing customer names in API responses",
      "Dumping user data to console/logs",
    ],
    detection: "Automated log scanning + manual review",
  },
  
  private_key_exposure: {
    trigger: "Any exposure of private keys, secrets, or credentials",
    examples: [
      "Logging API keys",
      "Including database passwords in error messages",
      "Exposing JWT secrets",
      "Committing secrets to code",
      "Sharing credentials in Slack",
    ],
    detection: "Secret scanning + manual review",
  },
  
  uncontrolled_data_loss: {
    trigger: "Permanent, untracked data loss",
    examples: [
      "Deleting transactions without backup",
      "Truncating tables without snapshot",
      "Overwriting data without audit",
    ],
    detection: "Database audit + reconciliation check",
  },
  
  security_bypass: {
    trigger: "Disabling security controls without authorization",
    examples: [
      "Disabling authentication",
      "Bypassing rate limiting",
      "Removing audit logging",
    ],
    detection: "Configuration monitoring",
  },
} as const;
```

### PII Detection Rules

```json
{
  "pii_patterns": [
    {
      "name": "email",
      "pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      "context": "Must not appear in logs or error messages"
    },
    {
      "name": "ssn",
      "pattern": "\\d{3}-\\d{2}-\\d{4}",
      "context": "Must never be logged or transmitted"
    },
    {
      "name": "phone",
      "pattern": "\\+?1?[-.]?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}",
      "context": "Must be masked in logs"
    },
    {
      "name": "credit_card",
      "pattern": "\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}",
      "context": "Must never be logged"
    }
  ],
  "secret_patterns": [
    {
      "name": "api_key",
      "pattern": "(pk|sk)_[a-zA-Z0-9]{32,}",
      "context": "Must never appear in logs"
    },
    {
      "name": "jwt",
      "pattern": "eyJ[a-zA-Z0-9_-]*\\.eyJ[a-zA-Z0-9_-]*\\.[a-zA-Z0-9_-]*",
      "context": "Must not be logged in full"
    },
    {
      "name": "password",
      "pattern": "password[\"']?\\s*[:=]\\s*[\"'][^\"']+[\"']",
      "context": "Must never appear in logs"
    },
    {
      "name": "connection_string",
      "pattern": "postgresql://[^\\s]+",
      "context": "Must be redacted"
    }
  ]
}
```

---

## 📝 EXAM SCENARIO DETAILS

### System State at Incident Start

```typescript
const INITIAL_STATE = {
  core: {
    status: "degraded",
    api_error_rate: 0.23,
    active_connections: 847,
    queue_depth: 12847,
  },
  
  ledger: {
    status: "disconnected",
    last_sync: "2024-01-15T09:13:00Z", // 47 minutes ago
    pending_transactions: 12847,
    sync_lag_seconds: 2820,
  },
  
  locker: {
    status: "operational",
    active_devices: 234,
    pending_verifications: 89,
    last_heartbeat: "2024-01-15T09:59:55Z",
  },
  
  database: {
    primary: {
      status: "operational",
      cpu: 78,
      connections: 89,
      replication_lag: 0,
    },
    replica: {
      status: "operational",
      cpu: 45,
      connections: 34,
      replication_lag: 0,
    },
  },
  
  discrepancies: {
    count: 342,
    types: {
      "asset_status_mismatch": 156,
      "transaction_missing": 89,
      "duplicate_entry": 47,
      "amount_variance": 50,
    },
  },
};
```

### Root Cause (Hidden from Candidate)

```typescript
// EXAMINER ONLY - Do not reveal to candidate
const ROOT_CAUSE = {
  primary: "Connection pool exhaustion in Ledger sync service",
  trigger: "Batch job with inefficient query caused connection leak",
  contributing_factors: [
    "Missing connection timeout configuration",
    "No circuit breaker on Ledger connection",
    "Retry logic without backoff caused cascade",
  ],
  evidence_locations: [
    "logs/ledger-sync/2024-01-15.log:line 4847",
    "metrics/connection_pool_active",
    "database/pg_stat_activity",
  ],
};
```

### Expected Recovery Steps

```typescript
const EXPECTED_RECOVERY = {
  phase_1_triage: [
    "Acknowledge incident in PagerDuty",
    "Post initial status to #incident channel",
    "Set X-Incident-Status header to 'active'",
    "Assess current system state",
  ],
  
  phase_2_diagnosis: [
    "Check Ledger sync service logs",
    "Query pg_stat_activity for connection issues",
    "Identify connection pool exhaustion",
    "Trace back to batch job trigger",
  ],
  
  phase_3_recovery: [
    "Kill stuck connections safely",
    "Restart Ledger sync service with fixed config",
    "Implement circuit breaker (temporary)",
    "Begin processing queued transactions",
    "Update X-Incident-Status to 'mitigating'",
  ],
  
  phase_4_validation: [
    "Verify sync is progressing",
    "Run reconciliation report",
    "Resolve discrepancies one by one",
    "Verify no data loss",
  ],
  
  phase_5_closeout: [
    "Confirm all transactions processed",
    "Update X-Incident-Status to 'resolved'",
    "Remove X-Degraded-Service header",
    "Document incident timeline",
    "Identify follow-up actions",
  ],
};
```

---

## 🔧 CANDIDATE TOOLKIT

### Available Commands

```bash
# System Status
proveniq status                    # Overall system health
proveniq status ledger             # Ledger service status
proveniq status core               # Core service status
proveniq status locker             # Locker service status

# Logs
proveniq logs ledger-sync --tail 100
proveniq logs core-api --since 1h
proveniq logs --grep "ERROR" --service all

# Database
proveniq db query "SELECT * FROM pg_stat_activity"
proveniq db connections            # Show active connections
proveniq db kill-connection <pid>  # Kill specific connection

# Queue Management
proveniq queue status              # Show queue depths
proveniq queue inspect <queue>     # Inspect queue contents
proveniq queue replay <queue> --dry-run

# Reconciliation
proveniq reconcile status          # Show discrepancy count
proveniq reconcile report          # Generate full report
proveniq reconcile fix <id>        # Fix specific discrepancy

# Service Management
proveniq service restart ledger-sync
proveniq service config ledger-sync --show
proveniq service config ledger-sync --set key=value

# Incident Management
proveniq incident status           # Current incident status
proveniq incident update "message" # Post status update
proveniq incident header set X-Incident-Status=active
```

### API Endpoints for Status Communication

```typescript
// Set incident headers globally
POST /api/admin/incident/headers
{
  "X-Incident-Status": "active",
  "X-Incident-Id": "INC-2024-CERT-FINAL",
  "X-Degraded-Service": "ledger-sync",
  "X-Retry-After": 300
}

// Update incident status
PATCH /api/admin/incident/status
{
  "status": "mitigating",
  "message": "Ledger sync service restarted, processing queue",
  "eta": "2024-01-15T12:00:00Z"
}

// Clear incident headers (on resolution)
DELETE /api/admin/incident/headers
```

---

## 📊 SCORING WORKSHEET

### Candidate Evaluation Form

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ARCHITECT CERTIFICATION - SCORING WORKSHEET                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Candidate ID: _______________________                                       ║
║  Exam Date: _______________________                                          ║
║  Proctor: _______________________                                            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  CATEGORY 1: LEDGER SYNC RESTORATION (40%)                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Root Cause Identification          _____ / 10                               ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  Recovery Strategy                  _____ / 10                               ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  Sync Restoration                   _____ / 15                               ║
║  Time to restore: _____ minutes                                              ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  Queue Processing                   _____ / 5                                ║
║  Transactions processed: _____ / 12847                                       ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  CATEGORY 1 SUBTOTAL:               _____ / 40                               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  CATEGORY 2: DATA INTEGRITY PRESERVATION (40%)                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  No Data Loss                       _____ / 15                               ║
║  Transactions lost: _____                                                    ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  Reconciliation                     _____ / 10                               ║
║  Discrepancies resolved: _____ / 342                                         ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  Audit Trail                        _____ / 10                               ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  Rollback Safety                    _____ / 5                                ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  CATEGORY 2 SUBTOTAL:               _____ / 40                               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  CATEGORY 3: STATUS COMMUNICATION (20%)                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  X-Incident-Status Header           _____ / 8                                ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  X-Degraded-Service Header          _____ / 6                                ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  X-Retry-After Header               _____ / 4                                ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  X-Request-Id Correlation           _____ / 2                                ║
║  Notes: _______________________________________________________________     ║
║                                                                              ║
║  CATEGORY 3 SUBTOTAL:               _____ / 20                               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  AUTO-FAIL CHECK                                                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  [ ] PII Exposure Detected                                                   ║
║      Details: _________________________________________________________     ║
║                                                                              ║
║  [ ] Private Key/Secret Exposure Detected                                    ║
║      Details: _________________________________________________________     ║
║                                                                              ║
║  [ ] Uncontrolled Data Loss                                                  ║
║      Details: _________________________________________________________     ║
║                                                                              ║
║  [ ] Security Bypass                                                         ║
║      Details: _________________________________________________________     ║
║                                                                              ║
║  AUTO-FAIL TRIGGERED: [ ] YES  [ ] NO                                        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  FINAL SCORE                                                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Category 1 (Ledger Sync):          _____ / 40                               ║
║  Category 2 (Data Integrity):       _____ / 40                               ║
║  Category 3 (Communication):        _____ / 20                               ║
║  ─────────────────────────────────────────────                               ║
║  TOTAL SCORE:                       _____ / 100                              ║
║                                                                              ║
║  PASSING THRESHOLD: 95                                                       ║
║                                                                              ║
║  RESULT: [ ] PASS - ARCHITECT CERTIFIED                                      ║
║          [ ] FAIL - Score below 95                                           ║
║          [ ] FAIL - Auto-fail triggered                                      ║
║                                                                              ║
║  Proctor Signature: _______________________  Date: _____________             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📜 CERTIFICATION OUTCOME

### On Pass (95%+ with no auto-fail)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🎓 PROVENIQ CORE ARCHITECT                                ║
║                                                                              ║
║  This certifies that                                                         ║
║                                                                              ║
║                    [CANDIDATE NAME]                                          ║
║                                                                              ║
║  has successfully demonstrated mastery of:                                   ║
║                                                                              ║
║  • System Architecture & Orchestration                                       ║
║  • Incident Response & Recovery                                              ║
║  • Data Integrity Preservation                                               ║
║  • Security-First Operations                                                 ║
║  • Professional Communication                                                ║
║                                                                              ║
║  Certification ID: CERT-ARCH-2024-XXXXX                                      ║
║  Issue Date: [DATE]                                                          ║
║  Valid Until: [DATE + 2 YEARS]                                               ║
║                                                                              ║
║  Privileges Granted:                                                         ║
║  • Full infrastructure access                                                ║
║  • Schema modification authority                                             ║
║  • Incident commander eligibility                                            ║
║  • Architecture review authority                                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### On Fail

```
Retake Policy:
- First retake: 7 days waiting period
- Second retake: 30 days waiting period
- Third retake: 90 days waiting period + remediation course required

Remediation Resources:
- Review C100-C400 track materials
- Complete additional lab exercises
- Schedule 1:1 with certified architect
```

---

*[EXAMINER] Architect Certification Exam complete. Standards enforced. No exceptions.*
