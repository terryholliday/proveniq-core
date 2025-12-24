# FINAL CERTIFICATION EXAM
## Proveniq Core Architect Certification

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ██████╗███████╗██████╗ ████████╗██╗███████╗██╗ ██████╗ █████╗ ████████╗  ║
║   ██╔════╝██╔════╝██╔══██╗╚══██╔══╝██║██╔════╝██║██╔════╝██╔══██╗╚══██╔══╝  ║
║   ██║     █████╗  ██████╔╝   ██║   ██║█████╗  ██║██║     ███████║   ██║     ║
║   ██║     ██╔══╝  ██╔══██╗   ██║   ██║██╔══╝  ██║██║     ██╔══██║   ██║     ║
║   ╚██████╗███████╗██║  ██║   ██║   ██║██║     ██║╚██████╗██║  ██║   ██║     ║
║    ╚═════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝     ║
║                                                                              ║
║                    F I N A L   E X A M I N A T I O N                        ║
║                                                                              ║
║   Duration: 4 hours                                                          ║
║   Passing Score: 95%                                                         ║
║   Format: Proctored, Closed Book (Documentation Allowed)                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 EXAM STRUCTURE

| Section | Weight | Duration | Format |
|---------|--------|----------|--------|
| A: Architecture | 20% | 30 min | Multiple Choice + Short Answer |
| B: Security | 25% | 45 min | Scenario Analysis |
| C: Data Flow | 20% | 30 min | System Design |
| D: Financial | 20% | 30 min | Calculation + Analysis |
| E: Incident Response | 15% | 45 min | Live Simulation |

**Total: 100% | 4 hours**

---

## 📜 EXAM RULES

```typescript
const EXAM_RULES = {
  allowed: [
    "Proveniq Core documentation",
    "Your own notes from training",
    "Calculator (non-programmable)",
    "Scratch paper (provided)",
  ],
  
  prohibited: [
    "Internet access (except documentation)",
    "Communication with others",
    "AI assistance tools",
    "Pre-written code snippets",
    "Mobile devices",
  ],
  
  violations: {
    first_offense: "Exam terminated, 6-month ban",
    second_offense: "Permanent certification revocation",
  }
} as const;
```

---

## SECTION A: ARCHITECTURE (20%)
### Time Limit: 30 minutes

### Part A1: Multiple Choice (10 questions)

**A1.1** What is the correct order of the middleware execution chain?
- a) Auth → Rate Limit → Logging → Route
- b) Rate Limit → Auth → Logging → Route
- c) Logging → Rate Limit → Auth → Route
- d) Rate Limit → Logging → Auth → Route

**A1.2** Why is the Prisma client instantiated as a singleton in development?
- a) To improve query performance
- b) To prevent connection pool exhaustion during hot reload
- c) To enable query caching
- d) To support multiple databases

**A1.3** What is the P95 latency target for synchronous API requests?
- a) 100ms
- b) 200ms
- c) 500ms
- d) 1000ms

**A1.4** Which layer is responsible for tenant isolation?
- a) Edge Layer
- b) Application Layer
- c) Service Layer
- d) All of the above

**A1.5** What happens when PostgreSQL primary fails in a Multi-AZ deployment?
- a) Manual failover required
- b) Automatic failover to replica
- c) System goes offline
- d) Read-only mode enabled

**A1.6** Which database isolation level is used for financial transactions?
- a) Read Uncommitted
- b) Read Committed
- c) Repeatable Read
- d) Serializable

**A1.7** What is the connection pool size optimized for serverless?
- a) 5 connections
- b) 10 connections
- c) 50 connections
- d) 100 connections

**A1.8** Which component is NOT on the critical path?
- a) Auth Service
- b) RBAC Guards
- c) Webhook Delivery
- d) Tenant Context

**A1.9** What is the primary reason for choosing Next.js App Router?
- a) Better SEO
- b) Server Components reduce bundle size
- c) Easier deployment
- d) Built-in authentication

**A1.10** When should Proveniq Core be split into microservices?
- a) When team size exceeds 10
- b) When a service needs independent scaling
- c) When using multiple databases
- d) Never, monolith is always better

---

### Part A2: Short Answer (5 questions)

**A2.1** Draw the complete request lifecycle from browser to database. Include timing for each stage. (5 points)

**A2.2** Explain the trade-offs of using JWT sessions vs database sessions. When would you choose each? (5 points)

**A2.3** Describe three failure modes of the system and their recovery strategies. (5 points)

**A2.4** What is the architectural priority order? Explain why features are last. (3 points)

**A2.5** How does the system handle cold starts? What mitigations are in place? (2 points)

---

## SECTION B: SECURITY (25%)
### Time Limit: 45 minutes

### Part B1: Scenario Analysis

**Scenario:** You receive an alert that a user account has accessed resources in 5 different organizations within 2 minutes, including 3 organizations where they have no membership.

**B1.1** What is your immediate response? List actions in order of priority. (5 points)

**B1.2** What logs would you examine? Provide specific log queries. (5 points)

**B1.3** How could this have happened? List possible attack vectors. (5 points)

**B1.4** What evidence would you preserve for forensics? (3 points)

**B1.5** Draft a communication to affected organization admins. (2 points)

---

### Part B2: Code Review

Review this authentication code and identify ALL security issues:

```typescript
async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  
  if (!user) {
    return { error: "User not found" };
  }
  
  if (password === user.passwordHash) {
    const token = jwt.sign({ userId: user.id }, "secret123");
    return { token };
  }
  
  return { error: "Invalid password" };
}
```

**B2.1** List all security vulnerabilities in this code. (10 points)

**B2.2** Provide corrected code that addresses all issues. (10 points)

---

### Part B3: Permission Matrix

**B3.1** Complete the permission matrix for the `documents:delete` permission:

| Global Role | Org Role | Has Permission? | Reason |
|-------------|----------|-----------------|--------|
| ADMIN | N/A | ? | ? |
| USER | OWNER | ? | ? |
| USER | ADMIN | ? | ? |
| USER | MEMBER | ? | ? |
| USER | VIEWER | ? | ? |
| AUDITOR | MEMBER | ? | ? |

(5 points)

---

## SECTION C: DATA FLOW (20%)
### Time Limit: 30 minutes

### Part C1: System Design

**Scenario:** Design a webhook delivery system that guarantees at-least-once delivery with the following requirements:
- 10,000 webhooks per minute capacity
- 5 retry attempts with exponential backoff
- Dead letter queue for permanent failures
- Delivery status tracking

**C1.1** Draw the system architecture. (5 points)

**C1.2** Define the database schema for tracking deliveries. (5 points)

**C1.3** Write pseudocode for the retry logic. (5 points)

**C1.4** How would you handle a webhook endpoint that is permanently down? (3 points)

**C1.5** What metrics would you monitor? (2 points)

---

### Part C2: Consistency Problem

**Scenario:** Two users simultaneously update the same asset:
- User A: Changes name from "Asset 1" to "Asset A"
- User B: Changes category from "equipment" to "vehicle"

Both requests arrive at the same millisecond.

**C2.1** What could go wrong without proper handling? (3 points)

**C2.2** How does optimistic locking solve this? Show the implementation. (5 points)

**C2.3** What should the user experience be when a conflict occurs? (2 points)

---

## SECTION D: FINANCIAL (20%)
### Time Limit: 30 minutes

### Part D1: Calculation

**Scenario:** A $10,000,000 loan defaults. The capital structure is:
- Senior Tranche: $6,000,000 (first loss protection)
- Mezzanine Tranche: $3,000,000 (second loss)
- Equity Tranche: $1,000,000 (first loss)

Recovery amount: $7,500,000

**D1.1** Calculate the loss allocation for each tranche. Show your work. (10 points)

**D1.2** What percentage loss does each tranche experience? (5 points)

**D1.3** If there were $50,000 in recovery costs, how would that affect the allocation? (5 points)

---

### Part D2: Reconciliation

**Scenario:** Month-end reconciliation shows:
- Internal ledger balance: $1,234,567.89
- Bank statement balance: $1,234,567.88
- Variance: $0.01

**D2.1** List possible causes for a 1-cent variance. (5 points)

**D2.2** How would you investigate this? Provide specific steps. (5 points)

**D2.3** Should this be corrected? If so, how? If not, why? (5 points)

---

### Part D3: Code Review

Review this money calculation:

```typescript
function calculateInterest(principal: number, rate: number, days: number) {
  const dailyRate = rate / 365;
  const interest = principal * dailyRate * days;
  return Math.round(interest * 100) / 100;
}

const interest = calculateInterest(1000000, 0.05, 30);
console.log(`Interest: $${interest}`);
```

**D3.1** What is wrong with this code? (5 points)

**D3.2** Provide corrected implementation using proper money handling. (5 points)

---

## SECTION E: INCIDENT RESPONSE (15%)
### Time Limit: 45 minutes

### Live Simulation

You will be presented with a live incident scenario. The clock starts when you read the incident description.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🚨 INCIDENT: PROD-2024-FINAL                              │
│                                                              │
│   Severity: SEV-1                                           │
│   Status: ACTIVE                                            │
│   Start Time: [NOW]                                         │
│                                                              │
│   ALERT SUMMARY:                                            │
│   - API error rate: 45% (normal: <1%)                       │
│   - Database CPU: 98%                                       │
│   - Response time P99: 12 seconds (normal: 500ms)           │
│   - Webhook queue depth: 150,000 (normal: <1,000)           │
│                                                              │
│   RECENT CHANGES:                                           │
│   - 2 hours ago: New report feature deployed                │
│   - 1 hour ago: Marketing email sent to 50,000 users        │
│   - 30 min ago: First alerts triggered                      │
│                                                              │
│   AVAILABLE TOOLS:                                          │
│   - Application logs                                        │
│   - Database metrics (CloudWatch)                           │
│   - APM traces (if configured)                              │
│   - Deployment history                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**E1.1** What is your first action? (2 points)

**E1.2** What is your hypothesis for the root cause? (3 points)

**E1.3** What commands/queries would you run to confirm? (5 points)

**E1.4** Describe your mitigation strategy. (5 points)

**E1.5** Draft a status update for stakeholders. (3 points)

**E1.6** What post-incident actions would you recommend? (2 points)

---

## 📊 GRADING

### Score Calculation

| Section | Your Score | Max Score | Percentage |
|---------|------------|-----------|------------|
| A: Architecture | | 100 | 20% |
| B: Security | | 100 | 25% |
| C: Data Flow | | 100 | 20% |
| D: Financial | | 100 | 20% |
| E: Incident | | 100 | 15% |
| **TOTAL** | | **500** | **100%** |

### Passing Criteria

```typescript
const PASSING_CRITERIA = {
  overall: 95,           // Must score 95% overall
  
  minimum_per_section: {
    architecture: 80,    // Cannot fail any section badly
    security: 85,        // Security has higher minimum
    data_flow: 80,
    financial: 80,
    incident: 80,
  },
  
  result: (scores) => {
    const overall = calculateWeightedAverage(scores);
    const allSectionsPass = Object.entries(scores).every(
      ([section, score]) => score >= minimum_per_section[section]
    );
    
    return overall >= 95 && allSectionsPass;
  }
} as const;
```

---

## 📜 CERTIFICATION LEVELS

Based on your exam performance:

| Score | Certification Level |
|-------|---------------------|
| 95-100% | **Proveniq Core Architect** |
| 90-94% | Proveniq Core Engineer (retake for Architect) |
| 85-89% | Proveniq Core Operator (retake for Engineer) |
| <85% | Not Certified (full retake required) |

---

## 🔄 RETAKE POLICY

```typescript
const RETAKE_POLICY = {
  waiting_period: {
    first_attempt: "48 hours",
    second_attempt: "7 days",
    third_attempt: "30 days",
    subsequent: "90 days",
  },
  
  maximum_attempts: "No limit, but waiting periods increase",
  
  fee: {
    first_retake: "Free",
    subsequent: "$150 USD",
  }
} as const;
```

---

## ✅ EXAM COMPLETION

When you have completed all sections:

1. Review all answers
2. Ensure no questions are left blank
3. Submit your exam
4. Results available within 24 hours
5. Certificate issued within 48 hours of passing

---

*"The exam is not the end. It's proof you're ready for the beginning."*

— Antigravity Academy
