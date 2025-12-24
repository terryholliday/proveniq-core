# GRADING RUBRIC
## Proveniq Core Certification Examination

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  [EXAMINER] GRADING ARTIFACT                                                 ║
║  ═══════════════════════════════════════════════════════════════════════════ ║
║                                                                              ║
║  Document:     Official Grading Rubric                                       ║
║  Version:      1.0.0                                                         ║
║  Classification: EXAMINER USE ONLY                                           ║
║                                                                              ║
║  Standards Applied:                                                          ║
║  • Pass Rate Threshold: 95%                                                  ║
║  • Palantir Standard: Security is paramount                                  ║
║  • Nvidia Standard: Optimization graded                                      ║
║  • Apple Standard: Precision required                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 SCORING OVERVIEW

### Weight Distribution

| Section | Weight | Duration | Min Score |
|---------|--------|----------|-----------|
| A: Architecture | 20% | 30 min | 80% |
| B: Security | 25% | 45 min | 85% |
| C: Data Flow | 20% | 30 min | 80% |
| D: Financial | 20% | 30 min | 80% |
| E: Incident Response | 15% | 45 min | 80% |
| **Black Swan Event** | Bonus | Random | N/A |

### Pass/Fail Criteria

```typescript
const GRADING_CRITERIA = {
  // Overall passing score
  passingScore: 95,
  
  // Section minimums (must pass ALL)
  sectionMinimums: {
    architecture: 80,
    security: 85,      // Higher bar for security
    dataFlow: 80,
    financial: 80,
    incident: 80,
  },
  
  // Automatic failures
  autoFail: [
    "Security vulnerability not identified in code review",
    "API key or secret leaked in any response",
    "Incorrect financial calculation (off by more than $0.01)",
    "Failed to respond to Black Swan event within 5 minutes",
    "Plagiarism or cheating detected",
  ],
  
  // Bonus opportunities
  bonusPoints: {
    exceptionalPerformance: 5,  // Perfect score on any section
    earlyCompletion: 3,         // Finish 30+ min early
    blackSwanExcellence: 5,     // Handle Black Swan perfectly
  },
} as const;
```

---

## 📝 SECTION A: ARCHITECTURE (20%)

### Multiple Choice (10 questions × 2 points = 20 points)

| Question | Correct Answer | Common Mistakes |
|----------|----------------|-----------------|
| A1 | B (Rate Limit → Auth) | Putting Auth first |
| A2 | B (Connection pool) | Confusing with caching |
| A3 | B (200ms) | Choosing 100ms or 500ms |
| A4 | C (Webhook Delivery) | Confusing async with critical |
| A5 | B (10 connections) | Choosing too high |

### Short Answer Rubric

#### A6: Request Lifecycle Diagram (10 points)

| Criteria | Points | Requirements |
|----------|--------|--------------|
| Components | 3 | All 7 stages listed |
| Timing | 3 | Realistic estimates |
| Flow | 2 | Correct sequence |
| Total | 2 | Sums to ~200ms |

**Full Credit Example:**
```
Browser (0ms) → DNS (5ms) → TLS (15ms) → Edge (25ms) → 
Middleware (35ms) → Handler (70ms) → Database (120ms) → 
Response (200ms)
```

**Deductions:**
- Missing component: -1 per component
- Unrealistic timing: -1 per stage
- Wrong sequence: -2
- Total doesn't add up: -1

#### A7: Architectural Priorities (5 points)

| Criteria | Points | Requirements |
|----------|--------|--------------|
| Correct order | 3 | All 5 in correct order |
| Explanation | 2 | Why features are last |

**Full Credit Answer:**
1. Reliability
2. Security
3. Performance
4. Maintainability
5. Features

"Features are last because a feature that compromises reliability, security, or performance is not shipped. The platform must be stable before adding capabilities."

#### A8: 8-Node Ecosystem Diagram (10 points)

| Criteria | Points | Requirements |
|----------|--------|--------------|
| All nodes | 4 | 8 nodes present |
| Dependencies | 3 | Correct arrows |
| Labels | 2 | Role descriptions |
| Layout | 1 | Clear, readable |

**Required Nodes:**
- CORE, VERIFY, INGEST, PORTAL, MOBILE, ANALYTICS, INTEGRATIONS, RDS

**Required Dependencies:**
- All apps → CORE
- CORE → RDS
- ANALYTICS → RDS
- PORTAL → ANALYTICS

---

## 🔐 SECTION B: SECURITY (25%)

### B1: Scenario Analysis (20 points)

#### B1a: Immediate Response (5 points)

| Points | Criteria |
|--------|----------|
| 5 | All actions in correct priority order |
| 4 | All actions present, minor order issue |
| 3 | Missing one critical action |
| 2 | Missing multiple actions |
| 1 | Partial understanding |
| 0 | Incorrect or dangerous response |

**Full Credit Answer:**
1. **Contain** - Disable the compromised account immediately
2. **Preserve** - Snapshot all logs before they rotate
3. **Investigate** - Query audit logs for the user's activity
4. **Communicate** - Alert affected organization admins
5. **Remediate** - Force password reset, revoke sessions

#### B1b: Log Queries (5 points)

| Points | Criteria |
|--------|----------|
| 5 | Specific queries with correct syntax |
| 4 | Correct queries, minor syntax issues |
| 3 | Right logs, vague queries |
| 2 | Some relevant logs identified |
| 1 | Generic "check the logs" |
| 0 | No relevant logs mentioned |

**Full Credit Answer:**
```sql
-- Audit log query
SELECT * FROM audit_logs 
WHERE user_id = 'suspect_user_id'
AND created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- Auth log query
SELECT * FROM auth_logs
WHERE email = 'suspect@email.com'
AND action IN ('login', 'login_failed')
ORDER BY timestamp DESC;

-- Cross-org access
SELECT DISTINCT organization_id 
FROM audit_logs
WHERE user_id = 'suspect_user_id'
AND created_at > NOW() - INTERVAL '2 hours';
```

#### B1c: Attack Vectors (5 points)

| Points | Criteria |
|--------|----------|
| 5 | 4+ plausible vectors with explanation |
| 4 | 3 vectors with explanation |
| 3 | 2 vectors |
| 2 | 1 vector |
| 0 | No plausible vectors |

**Full Credit Vectors:**
1. Credential stuffing (500 failed attempts suggests brute force)
2. Session hijacking (valid session used across orgs)
3. RBAC bypass vulnerability (accessing unauthorized orgs)
4. API key compromise (if API key was used)
5. Account takeover via phishing

#### B1d: Evidence Preservation (5 points)

| Points | Criteria |
|--------|----------|
| 5 | Comprehensive evidence list |
| 4 | Most critical evidence |
| 3 | Some evidence |
| 2 | Minimal evidence |
| 0 | No evidence mentioned |

**Full Credit Answer:**
- Complete audit log export for user
- Session records and tokens
- IP addresses and geolocation
- User agent strings
- Timestamps of all actions
- Database query logs
- Network access logs
- Any exported data records

### B2: Code Review (20 points)

#### B2a: Vulnerability Identification (10 points)

| Vulnerability | Points | Severity |
|---------------|--------|----------|
| User enumeration | 2 | High |
| Plain text comparison | 2 | Critical |
| Hardcoded secret | 2 | Critical |
| No rate limiting | 1 | High |
| No timing-safe compare | 1 | Medium |
| No token expiration | 1 | High |
| No audit logging | 1 | Medium |

**Deductions:**
- Missing critical vulnerability: -2
- Missing high vulnerability: -1
- False positive: -0.5

#### B2b: Corrected Code (10 points)

| Criteria | Points |
|----------|--------|
| bcrypt.compare used | 2 |
| Environment variable for secret | 2 |
| Generic error message | 2 |
| Token expiration | 2 |
| Audit logging | 1 |
| Rate limiting mention | 1 |

**Full Credit Code:**
```typescript
async function authenticateUser(email: string, password: string) {
  // Rate limiting should be applied at middleware level
  
  const user = await db.user.findUnique({ where: { email } });
  
  // Generic error prevents user enumeration
  const genericError = { error: "Invalid credentials" };
  
  if (!user) {
    // Timing-safe: still do a hash comparison
    await bcrypt.compare(password, "$2b$12$dummy");
    return genericError;
  }
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  
  if (!valid) {
    await createAuditLog({
      action: "login.failed",
      userId: user.id,
      metadata: { reason: "invalid_password" }
    });
    return genericError;
  }
  
  const token = jwt.sign(
    { userId: user.id },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "24h" }
  );
  
  await createAuditLog({
    action: "login.success",
    userId: user.id
  });
  
  return { token };
}
```

### B3: Permission Matrix (10 points)

| Row | Expected Answer | Points |
|-----|-----------------|--------|
| ADMIN / N/A | ✅ ADMIN has all | 1.5 |
| USER / OWNER | ✅ OWNER has delete | 1.5 |
| USER / ADMIN | ✅ ADMIN has delete | 1.5 |
| USER / MEMBER | ❌ MEMBER lacks delete | 2 |
| USER / VIEWER | ❌ VIEWER is read-only | 2 |
| AUDITOR / MEMBER | ❌ AUDITOR is read-only | 1.5 |

---

## 🔄 SECTION C: DATA FLOW (20%)

### C1: System Design (20 points)

#### C1a: Architecture Diagram (5 points)

| Component | Points |
|-----------|--------|
| Message queue | 1 |
| Worker pool | 1 |
| Dead letter queue | 1 |
| Status database | 1 |
| Retry logic | 1 |

#### C1b: Database Schema (5 points)

**Full Credit Schema:**
```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID NOT NULL,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  response_status INT,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX idx_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_deliveries_retry ON webhook_deliveries(next_retry_at) 
  WHERE status = 'pending';
```

| Criteria | Points |
|----------|--------|
| Core fields | 2 |
| Status tracking | 1 |
| Retry tracking | 1 |
| Indexes | 1 |

#### C1c: Retry Logic (5 points)

**Full Credit Pseudocode:**
```
function processDelivery(delivery):
  for attempt in 1..5:
    try:
      response = sendWebhook(delivery)
      if response.ok:
        markDelivered(delivery)
        return SUCCESS
      else:
        logFailure(delivery, response)
    catch error:
      logError(delivery, error)
    
    if attempt < 5:
      delay = calculateBackoff(attempt) // 1m, 5m, 30m, 2h, 24h
      scheduleRetry(delivery, delay)
      return RETRY_SCHEDULED
  
  moveToDeadLetter(delivery)
  alertOperations(delivery)
  return PERMANENT_FAILURE

function calculateBackoff(attempt):
  delays = [60, 300, 1800, 7200, 86400] // seconds
  return delays[attempt - 1]
```

| Criteria | Points |
|----------|--------|
| Exponential backoff | 2 |
| Max attempts | 1 |
| DLQ routing | 1 |
| Error handling | 1 |

#### C1d: Metrics (5 points)

| Metric | Points |
|--------|--------|
| Queue depth | 1 |
| Delivery latency | 1 |
| Success/error rate | 1 |
| DLQ size | 1 |
| Retry rate | 1 |

### C2: Race Condition (10 points)

#### C2a: What Could Go Wrong (3 points)

- Lost update (one change overwrites the other)
- Data inconsistency
- Last-write-wins without merge

#### C2b: Optimistic Locking (5 points)

**Full Credit Implementation:**
```typescript
// Add version field to model
model Asset {
  id      String @id
  name    String
  version Int    @default(0)
}

// Update with version check
async function updateAsset(id: string, data: Partial<Asset>, version: number) {
  const result = await db.asset.updateMany({
    where: { 
      id,
      version // Only update if version matches
    },
    data: {
      ...data,
      version: { increment: 1 }
    }
  });
  
  if (result.count === 0) {
    throw new ConflictError("Asset was modified by another user");
  }
  
  return db.asset.findUnique({ where: { id } });
}
```

| Criteria | Points |
|----------|--------|
| Version field | 1 |
| Conditional update | 2 |
| Conflict detection | 1 |
| Error handling | 1 |

#### C2c: User Experience (2 points)

- Show error message explaining conflict
- Display current (updated) data
- Allow user to retry with fresh data

---

## 💰 SECTION D: FINANCIAL (20%)

### D1: Waterfall Calculation (20 points)

#### D1a: Loss Allocation (10 points)

**Calculation:**
```
Total Loss = $10,000,000 - $7,500,000 = $2,500,000

Waterfall (losses absorbed bottom-up):
1. Equity ($1,000,000): Absorbs first $1,000,000 → WIPED OUT
2. Mezzanine ($3,000,000): Absorbs remaining $1,500,000 → $1,500,000 remaining
3. Senior ($6,000,000): No loss → $6,000,000 intact

Recovery Distribution (top-down):
1. Senior: $6,000,000 (full recovery)
2. Mezzanine: $1,500,000 (partial recovery)
3. Equity: $0 (total loss)
```

| Criteria | Points |
|----------|--------|
| Total loss correct | 2 |
| Equity allocation | 2 |
| Mezzanine allocation | 3 |
| Senior allocation | 3 |

**Deductions:**
- Math error: -2 per tranche
- Wrong direction (top-down loss): -5
- Missing work: -2

#### D1b: Percentage Loss (5 points)

| Tranche | Loss % | Points |
|---------|--------|--------|
| Equity | 100% | 2 |
| Mezzanine | 50% | 2 |
| Senior | 0% | 1 |

#### D1c: Recovery Costs (5 points)

**Calculation:**
```
Net Recovery = $7,500,000 - $50,000 = $7,450,000
Additional Loss = $50,000

New Mezzanine Recovery = $1,500,000 - $50,000 = $1,450,000
New Mezzanine Loss % = $1,550,000 / $3,000,000 = 51.67%
```

| Criteria | Points |
|----------|--------|
| Net recovery correct | 2 |
| Correct tranche affected | 2 |
| Calculation correct | 1 |

### D2: Money Code Review (10 points)

#### D2a: Issues (5 points)

| Issue | Points |
|-------|--------|
| Floating point for money | 2 |
| Precision loss | 2 |
| No currency handling | 1 |

#### D2b: Corrected Code (5 points)

**Full Credit Code:**
```typescript
function calculateInterest(
  principalCents: bigint,
  ratePercent: number,
  days: number
): bigint {
  // Convert rate to basis points for precision
  const rateBasisPoints = BigInt(Math.round(ratePercent * 10000));
  const daysBI = BigInt(days);
  
  // Interest = principal * rate * days / 365 / 10000
  const interest = (principalCents * rateBasisPoints * daysBI) / 
                   (365n * 10000n);
  
  return interest;
}

// Usage
const principalCents = 100000000n; // $1,000,000.00 in cents
const interest = calculateInterest(principalCents, 5, 30);
console.log(`Interest: $${(Number(interest) / 100).toFixed(2)}`);
// Output: Interest: $4109.59
```

| Criteria | Points |
|----------|--------|
| Integer/BigInt | 2 |
| Correct calculation | 2 |
| Proper formatting | 1 |

---

## 🚨 SECTION E: INCIDENT RESPONSE (15%)

### E1: Simulation (20 points)

#### E1a: First Action (2 points)

| Points | Answer |
|--------|--------|
| 2 | Acknowledge alert, assess severity, page on-call |
| 1 | Only one of the above |
| 0 | Incorrect action |

#### E1b: Hypothesis (3 points)

| Points | Answer |
|--------|--------|
| 3 | New feature + traffic spike causing DB overload |
| 2 | Partial correct hypothesis |
| 1 | Vague hypothesis |
| 0 | Incorrect hypothesis |

#### E1c: Diagnostic Commands (5 points)

**Full Credit:**
```sql
-- Database CPU investigation
SELECT query, calls, mean_time, total_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

-- Connection pool status
SELECT count(*) FROM pg_stat_activity;

-- Recent slow queries
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
AND query_start < NOW() - INTERVAL '5 seconds';
```

```bash
# Application logs
grep "ERROR\|WARN" /var/log/app.log | tail -100

# Queue depth
redis-cli LLEN webhook_queue
```

| Criteria | Points |
|----------|--------|
| Database queries | 2 |
| Log queries | 1 |
| Metrics queries | 1 |
| Correct syntax | 1 |

#### E1d: Mitigation Strategy (5 points)

| Action | Points |
|--------|--------|
| Rollback new feature | 2 |
| Scale database/add read replicas | 1 |
| Enable rate limiting | 1 |
| Drain webhook queue | 1 |

#### E1e: Status Update (3 points)

**Full Credit:**
```
INCIDENT UPDATE - SEV-1 - 14:35 UTC

IMPACT: 45% of API requests failing. Users experiencing slow response times.

STATUS: Investigating. Root cause identified as database overload from new 
report feature combined with marketing email traffic spike.

ACTIONS IN PROGRESS:
- Rolling back report feature deployment
- Scaling database resources
- Draining webhook queue

ETA: Expect improvement within 15 minutes.

NEXT UPDATE: 14:50 UTC or sooner if status changes.
```

| Criteria | Points |
|----------|--------|
| Impact stated | 1 |
| Actions listed | 1 |
| ETA provided | 0.5 |
| Next update time | 0.5 |

#### E1f: Post-Incident Actions (2 points)

- Post-mortem meeting
- Load testing before deployment
- Improved monitoring/alerting
- Runbook update

---

## 🦢 BLACK SWAN EVENT (Bonus)

### Grading Criteria

| Metric | Points | Criteria |
|--------|--------|----------|
| Detection | 2 | Notice within 2 minutes |
| Diagnosis | 2 | Correct root cause |
| Response | 2 | Appropriate actions |
| Communication | 1 | Clear status update |

**Maximum Bonus: 5 points**

---

## 📋 FINAL SCORE CALCULATION

```typescript
function calculateFinalScore(sections: SectionScore[]): ExamResult {
  // Calculate weighted score
  const weightedScore = sections.reduce((sum, s) => {
    return sum + (s.score * s.weight / 100);
  }, 0);
  
  // Check section minimums
  const allSectionsPassed = sections.every(s => 
    s.score >= SECTION_MINIMUMS[s.id]
  );
  
  // Check for auto-fail conditions
  const hasAutoFail = checkAutoFailConditions(sections);
  
  // Add bonus points
  const bonusPoints = calculateBonus(sections);
  
  const finalScore = Math.min(100, weightedScore + bonusPoints);
  
  return {
    score: finalScore,
    passed: finalScore >= 95 && allSectionsPassed && !hasAutoFail,
    level: determineLevel(finalScore, allSectionsPassed),
  };
}
```

---

## 🎓 CERTIFICATION LEVELS

| Score | Sections Passed | Level |
|-------|-----------------|-------|
| 95%+ | All 5 | **ARCHITECT** |
| 90-94% | 4/5 | ENGINEER |
| 85-89% | 3/5 | OPERATOR |
| <85% | <3 | NOT CERTIFIED |

---

*[EXAMINER] Grading rubric complete. Standards enforced.*
