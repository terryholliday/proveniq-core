# ANTIGRAVITY ACADEMY
## Proveniq Core Certification Program

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗  █████╗ ██╗   ██╗██╗████████╗██╗   ██╗     ║
║    ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝ ██╔══██╗██╔══██╗██║   ██║██║╚══██╔══╝╚██╗ ██╔╝     ║
║    ███████║██╔██╗ ██║   ██║   ██║██║  ███╗██████╔╝███████║██║   ██║██║   ██║    ╚████╔╝      ║
║    ██╔══██║██║╚██╗██║   ██║   ██║██║   ██║██╔══██╗██╔══██║╚██╗ ██╔╝██║   ██║     ╚██╔╝       ║
║    ██║  ██║██║ ╚████║   ██║   ██║╚██████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║   ██║      ██║        ║
║    ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝      ╚═╝        ║
║                                                                              ║
║                    A C A D E M Y                                             ║
║                                                                              ║
║                    DEPLOYMENT SURVIVAL GUIDE                                 ║
║                    PROVENIQ CORE CERTIFICATION                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚠️ THIS IS NOT A TUTORIAL

This is a **Deployment Survival Guide**.

You will not passively read documentation. You will **operate under fire**.

Every module is a simulation. Every lab is a production incident waiting to happen.
The only way out is through.

---

## 🧬 ACADEMY DNA

```typescript
export const ACADEMY_DNA = {
  philosophy: {
    format: "Simulated Deployment",    // No passive reading. Only doing.
    failure_mode: "Hard Fail",         // Passing score is 95%.
    tone: "Google SRE / Palantir FDE"  // Clinical, precise, high-stakes.
  },
  
  certification_tiers: {
    OPERATOR: "Can deploy and maintain",
    ENGINEER: "Can extend and integrate", 
    ARCHITECT: "Can design and scale"
  },
  
  core_principle: "If you can't explain it under pressure, you don't know it."
} as const;
```

---

## 📊 CERTIFICATION TRACKS

| Track | Code | Focus | Duration | Pass Rate |
|-------|------|-------|----------|-----------|
| **The Nervous System** | C100 | Architecture | 12 hours | 95% |
| **The Iron Gate** | C200 | Security & IAM | 16 hours | 95% |
| **Orchestration Physics** | C300 | Data Flow | 14 hours | 95% |
| **Financial Gravity** | C400 | Capital Integration | 18 hours | 95% |

**Total Program Duration: 60 hours**
**Final Certification Exam: 4 hours (proctored)**

---

## 🎯 TRACK OVERVIEW

### C100: THE NERVOUS SYSTEM
*"Understand the signal paths or become noise."*

You will trace every packet, every request, every database query through the system.
When something breaks at 3 AM, you need to know exactly where to look.

**Labs:**
- Packet Tracing: Follow a request from browser to database and back
- Latency Hunting: Find the bottleneck before the SLA breaches
- Dependency Mapping: Build the complete system graph from scratch

---

### C200: THE IRON GATE
*"Security is not a feature. It's the foundation."*

You will breach your own systems. You will rotate keys under pressure.
You will understand why every security decision was made.

**Labs:**
- Breach Simulation: Attempt to exfiltrate data across tenant boundaries
- Key Rotation Drills: Rotate all secrets with zero downtime
- Permission Escalation: Find and fix RBAC vulnerabilities

---

### C300: ORCHESTRATION PHYSICS
*"Data has mass. It resists change. Respect the physics."*

You will stress-test the data pipeline until it breaks.
Then you will fix it while the queue backs up.

**Labs:**
- The Flywheel Stress Test: 10,000 concurrent verifications
- Dead Letter Queues: Process failed webhooks without data loss
- Eventual Consistency: Handle race conditions in multi-tenant writes

---

### C400: FINANCIAL GRAVITY
*"Money doesn't move. It falls. Control the trajectory."*

You will reconcile ledgers. You will trace capital flows.
You will understand why every decimal place matters.

**Labs:**
- Loan Default Waterfalls: Model cascading financial events
- Ledger Reconciliations: Find the missing $0.01 in 10M transactions
- Audit Trail Forensics: Reconstruct a financial event from logs

---

## 🏗️ PROGRAM STRUCTURE

```
docs/academy/
├── README.md                           # This file
├── SYLLABUS.md                         # Complete curriculum outline
├── PREREQUISITES.md                    # Required knowledge and setup
│
├── C100-nervous-system/
│   ├── README.md                       # Track overview
│   ├── 01-architecture-deep-dive.md    # Lesson 1
│   ├── 02-request-lifecycle.md         # Lesson 2
│   ├── 03-database-topology.md         # Lesson 3
│   ├── 04-caching-strategies.md        # Lesson 4
│   ├── labs/
│   │   ├── LAB-001-packet-tracing.md
│   │   ├── LAB-002-latency-hunting.md
│   │   └── LAB-003-dependency-mapping.md
│   └── exam/
│       └── C100-assessment.md
│
├── C200-iron-gate/
│   ├── README.md
│   ├── 01-authentication-internals.md
│   ├── 02-authorization-matrix.md
│   ├── 03-cryptographic-operations.md
│   ├── 04-incident-response.md
│   ├── labs/
│   │   ├── LAB-001-breach-simulation.md
│   │   ├── LAB-002-key-rotation.md
│   │   └── LAB-003-permission-escalation.md
│   └── exam/
│       └── C200-assessment.md
│
├── C300-orchestration-physics/
│   ├── README.md
│   ├── 01-event-driven-architecture.md
│   ├── 02-queue-mechanics.md
│   ├── 03-webhook-delivery.md
│   ├── 04-consistency-models.md
│   ├── labs/
│   │   ├── LAB-001-flywheel-stress.md
│   │   ├── LAB-002-dead-letter-queues.md
│   │   └── LAB-003-eventual-consistency.md
│   └── exam/
│       └── C300-assessment.md
│
├── C400-financial-gravity/
│   ├── README.md
│   ├── 01-ledger-fundamentals.md
│   ├── 02-transaction-integrity.md
│   ├── 03-reconciliation-patterns.md
│   ├── 04-compliance-reporting.md
│   ├── labs/
│   │   ├── LAB-001-default-waterfalls.md
│   │   ├── LAB-002-ledger-reconciliation.md
│   │   └── LAB-003-audit-forensics.md
│   └── exam/
│       └── C400-assessment.md
│
├── certification/
│   ├── FINAL-EXAM.md                   # Comprehensive assessment
│   ├── GRADING-RUBRIC.md               # Scoring criteria
│   └── CERTIFICATION-LEVELS.md         # Tier requirements
│
└── resources/
    ├── CHEATSHEETS.md                  # Quick reference
    ├── TROUBLESHOOTING.md              # Common issues
    └── GLOSSARY.md                     # Terminology
```

---

## ⚡ ASSESSMENT PHILOSOPHY

### Hard Fail Mode

```typescript
const GRADING_POLICY = {
  passing_score: 95,           // Not 70. Not 80. 95.
  partial_credit: false,       // It works or it doesn't.
  time_pressure: true,         // Real incidents don't wait.
  
  failure_consequences: {
    first_fail: "Review and retry in 48 hours",
    second_fail: "Mandatory remediation track",
    third_fail: "Program restart required"
  }
} as const;
```

### Why 95%?

In production, 95% uptime means **18 days of downtime per year**.
In financial systems, 95% accuracy means **$50,000 errors per million**.
In security, 95% coverage means **50,000 vulnerabilities per million lines**.

We don't ship 95%. We ship 99.9%.
The exam reflects reality.

---

## 🎖️ CERTIFICATION LEVELS

### Level 1: OPERATOR
*"Can deploy and maintain Proveniq Core in production."*

**Requirements:**
- Pass C100 (The Nervous System)
- Pass C200 (The Iron Gate)
- Complete 3 supervised deployments

**Privileges:**
- Production access (read)
- Incident response participation
- On-call rotation eligibility

---

### Level 2: ENGINEER
*"Can extend and integrate Proveniq Core with external systems."*

**Requirements:**
- All Level 1 requirements
- Pass C300 (Orchestration Physics)
- Build and deploy one custom integration
- Peer review 5 pull requests

**Privileges:**
- Production access (write)
- API key management
- Webhook configuration
- Custom module development

---

### Level 3: ARCHITECT
*"Can design and scale Proveniq Core for enterprise deployment."*

**Requirements:**
- All Level 2 requirements
- Pass C400 (Financial Gravity)
- Design review for one major feature
- Mentor 2 Level 1 candidates

**Privileges:**
- Infrastructure access
- Schema modification authority
- Security policy changes
- Architecture decision records

---

## 📋 PREREQUISITES

Before beginning this program, you must demonstrate:

### Technical Requirements

```typescript
const PREREQUISITES = {
  languages: {
    typescript: "Advanced",      // You will read complex types
    sql: "Intermediate",         // You will write raw queries
    bash: "Basic"                // You will debug in terminals
  },
  
  frameworks: {
    nextjs: "Working knowledge", // App Router, API routes
    prisma: "Basic",             // Schema, migrations, queries
    react: "Intermediate"        // Hooks, context, state
  },
  
  concepts: {
    http: "Deep understanding",  // Status codes, headers, methods
    authentication: "OAuth, JWT, sessions",
    databases: "Transactions, indexes, joins",
    security: "OWASP Top 10 awareness"
  },
  
  tools: {
    git: "Daily driver",
    docker: "Can run containers",
    postman: "API testing",
    browser_devtools: "Network tab fluency"
  }
} as const;
```

### Environment Setup

You must have a working local development environment:

1. **Clone the repository**
2. **Run `npm install`**
3. **Configure `.env`**
4. **Run `npx prisma migrate dev`**
5. **Start dev server with `npm run dev`**
6. **Verify all TypeScript compiles: `npx tsc --noEmit`**

If any step fails, you are not ready.

---

## 🚀 GETTING STARTED

### Step 1: Self-Assessment
Complete the prerequisite quiz in `docs/academy/PREREQUISITES.md`.
If you score below 80%, complete the remediation materials first.

### Step 2: Environment Verification
Run the environment check script:
```bash
npm run academy:verify
```
All checks must pass before proceeding.

### Step 3: Begin C100
Start with Track C100: The Nervous System.
Do not skip ahead. The tracks build on each other.

### Step 4: Complete Labs
Each lab must be completed and verified before the track exam.
Labs are not optional. They are the curriculum.

### Step 5: Pass Assessments
Each track ends with a timed assessment.
95% to pass. No exceptions.

---

## 📞 SUPPORT

### During Labs
- Check `resources/TROUBLESHOOTING.md` first
- Search existing issues in the repository
- Post in #academy-support Slack channel

### During Exams
- No external assistance permitted
- Documentation access is allowed
- Time extensions require medical documentation

### Certification Issues
- Contact certification@proveniq.com
- Include your candidate ID
- Allow 48 hours for response

---

## 📜 CODE OF CONDUCT

```typescript
const ACADEMY_CODE = {
  integrity: {
    no_cheating: "Instant disqualification",
    no_sharing: "Exam content is confidential",
    no_shortcuts: "The hard way is the only way"
  },
  
  collaboration: {
    labs: "Encouraged",
    study_groups: "Encouraged",
    exams: "Prohibited"
  },
  
  feedback: {
    curriculum: "Always welcome",
    grading: "Appeals process available",
    instructors: "Professional respect required"
  }
} as const;
```

---

## 🏁 BEGIN

You have read the overview.
You understand the stakes.
You accept the challenge.

**[→ Start with PREREQUISITES.md](./PREREQUISITES.md)**

---

*"The best time to learn the system was before the incident. The second best time is now."*

— Antigravity Academy
