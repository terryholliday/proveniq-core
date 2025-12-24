# ANTIGRAVITY ACADEMY SYLLABUS
## Complete Curriculum Outline

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗██╗   ██╗██╗     ██╗      █████╗ ██████╗ ██╗   ██╗███████╗        ║
║   ██╔════╝╚██╗ ██╔╝██║     ██║     ██╔══██╗██╔══██╗██║   ██║██╔════╝        ║
║   ███████╗ ╚████╔╝ ██║     ██║     ███████║██████╔╝██║   ██║███████╗        ║
║   ╚════██║  ╚██╔╝  ██║     ██║     ██╔══██║██╔══██╗██║   ██║╚════██║        ║
║   ███████║   ██║   ███████╗███████╗██║  ██║██████╔╝╚██████╔╝███████║        ║
║   ╚══════╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝        ║
║                                                                              ║
║   PROVENIQ CORE CERTIFICATION PROGRAM                                        ║
║   Total Duration: 60 hours + 4-hour Final Exam                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## PROGRAM OVERVIEW

| Track | Code | Focus | Duration | Prerequisites |
|-------|------|-------|----------|---------------|
| The Nervous System | C100 | Architecture | 12 hours | Prerequisites Exam |
| The Iron Gate | C200 | Security & IAM | 16 hours | C100 |
| Orchestration Physics | C300 | Data Flow | 14 hours | C100, C200 |
| Financial Gravity | C400 | Capital Integration | 18 hours | C100, C200, C300 |
| **Final Certification** | CERT | Comprehensive | 4 hours | All Tracks |

---

## TRACK C100: THE NERVOUS SYSTEM
### Architecture Track | 12 Hours

**Track Objective:** Understand every signal path in the system.

#### Lesson 01: Architecture Deep Dive (2 hours)
- Why this architecture was chosen
- Trade-offs and their consequences
- Layer-by-layer analysis
- Communication patterns
- Failure modes

**Learning Outcomes:**
- [ ] Explain the five architectural priorities
- [ ] Draw the architecture from memory
- [ ] Identify failure modes for each layer

#### Lesson 02: Request Lifecycle (2 hours)
- Complete request path tracing
- Middleware execution order
- Authentication flow
- Authorization flow
- Database query lifecycle
- Response construction

**Learning Outcomes:**
- [ ] Trace any request through all layers
- [ ] Identify where auth/authz occurs
- [ ] Calculate latency budget

#### Lesson 03: Database Topology (2 hours)
- Schema design decisions
- Index strategy
- Query optimization
- Connection pooling
- Transaction isolation

**Learning Outcomes:**
- [ ] Explain schema design choices
- [ ] Optimize slow queries
- [ ] Configure connection pools

#### Lesson 04: Caching Strategies (2 hours)
- What to cache
- Cache invalidation patterns
- Session storage
- CDN configuration

**Learning Outcomes:**
- [ ] Design caching strategy
- [ ] Implement cache invalidation
- [ ] Configure CDN rules

#### Labs (4 hours)
- **LAB-001: Packet Tracing** (1.5 hours)
  - Trace request from browser to database
  - Document timing at each stage
  - Identify bottlenecks

- **LAB-002: Latency Hunting** (1.5 hours)
  - Find source of latency increase
  - Implement and verify fix
  - Reduce P95 to target

- **LAB-003: Dependency Mapping** (1 hour)
  - Map all system dependencies
  - Identify single points of failure
  - Create degradation plan

#### Assessment
- 25 multiple choice questions
- 5 short answer questions
- 1 incident simulation
- **Passing Score: 95%**

---

## TRACK C200: THE IRON GATE
### Security & IAM Track | 16 Hours

**Track Objective:** Breach your own systems. Then fix them.

#### Lesson 01: Authentication Internals (3 hours)
- NextAuth.js deep dive
- Session management (JWT vs database)
- OAuth 2.0 flows
- Password hashing (bcrypt)
- Two-factor authentication

**Learning Outcomes:**
- [ ] Explain session token lifecycle
- [ ] Implement custom OAuth provider
- [ ] Configure 2FA

#### Lesson 02: Authorization Matrix (3 hours)
- RBAC implementation
- Global roles vs organization roles
- Permission inheritance
- Resource-level authorization
- Field-level access control

**Learning Outcomes:**
- [ ] Complete the permission matrix
- [ ] Implement custom permission
- [ ] Audit authorization paths

#### Lesson 03: Cryptographic Operations (3 hours)
- Secret management
- API key generation and hashing
- Webhook signature verification
- Token generation patterns
- Key rotation procedures

**Learning Outcomes:**
- [ ] Generate secure API keys
- [ ] Verify webhook signatures
- [ ] Rotate secrets without downtime

#### Lesson 04: Incident Response (3 hours)
- Security incident classification
- Response procedures
- Evidence preservation
- Communication protocols
- Post-incident analysis

**Learning Outcomes:**
- [ ] Classify security incidents
- [ ] Execute response runbook
- [ ] Write post-incident report

#### Labs (4 hours)
- **LAB-001: Breach Simulation** (1.5 hours)
  - Attempt tenant isolation bypass
  - Test privilege escalation
  - Document all attack vectors

- **LAB-002: Key Rotation Drills** (1.5 hours)
  - Rotate NEXTAUTH_SECRET
  - Rotate database credentials
  - Invalidate API keys

- **LAB-003: Permission Escalation** (1 hour)
  - Map permission inheritance
  - Test boundary conditions
  - Verify no escalation paths

#### Assessment
- 30 multiple choice questions
- 3 scenario analyses
- 1 code review
- 1 incident simulation
- **Passing Score: 95%**

---

## TRACK C300: ORCHESTRATION PHYSICS
### Data Flow Track | 14 Hours

**Track Objective:** Stress-test until it breaks. Then fix it.

#### Lesson 01: Event-Driven Architecture (3 hours)
- Event sourcing fundamentals
- Event vs command patterns
- Event schema design
- Idempotency
- Event ordering

**Learning Outcomes:**
- [ ] Design event schemas
- [ ] Implement idempotent handlers
- [ ] Handle out-of-order events

#### Lesson 02: Queue Mechanics (3 hours)
- Queue data structures
- Delivery guarantees
- Backpressure handling
- Priority queues
- Dead letter queues

**Learning Outcomes:**
- [ ] Choose delivery guarantee
- [ ] Handle backpressure
- [ ] Process dead letters

#### Lesson 03: Webhook Delivery (3 hours)
- Webhook architecture
- Signature verification
- Retry strategies
- Delivery tracking
- Failure handling

**Learning Outcomes:**
- [ ] Implement webhook delivery
- [ ] Configure retry logic
- [ ] Track delivery status

#### Lesson 04: Consistency Models (2 hours)
- Strong vs eventual consistency
- CAP theorem
- Conflict resolution
- Optimistic vs pessimistic locking
- Distributed transactions

**Learning Outcomes:**
- [ ] Choose consistency model
- [ ] Implement conflict resolution
- [ ] Handle distributed transactions

#### Labs (3 hours)
- **LAB-001: Flywheel Stress Test** (1.5 hours)
  - Generate 10,000 concurrent requests
  - Monitor system behavior
  - Fix breaking points

- **LAB-002: Dead Letter Queues** (1 hour)
  - Process failed deliveries
  - Retry in order
  - Alert on growth

- **LAB-003: Eventual Consistency** (0.5 hours)
  - Reproduce race condition
  - Implement resolution
  - Verify no data loss

#### Assessment
- 25 multiple choice questions
- 2 system design problems
- 1 consistency problem
- 1 stress test simulation
- **Passing Score: 95%**

---

## TRACK C400: FINANCIAL GRAVITY
### Capital Integration Track | 18 Hours

**Track Objective:** Account for every cent. No exceptions.

#### Lesson 01: Ledger Fundamentals (4 hours)
- Double-entry bookkeeping
- Chart of accounts
- Journal entries
- Trial balance
- Account reconciliation

**Learning Outcomes:**
- [ ] Create journal entries
- [ ] Balance a trial balance
- [ ] Reconcile accounts

#### Lesson 02: Transaction Integrity (4 hours)
- ACID for financial transactions
- Idempotency keys
- Optimistic locking
- Saga patterns
- Rollback strategies

**Learning Outcomes:**
- [ ] Implement idempotent transactions
- [ ] Handle partial failures
- [ ] Design saga workflows

#### Lesson 03: Reconciliation Patterns (4 hours)
- Bank reconciliation
- Inter-system reconciliation
- Variance detection
- Exception handling
- Automation strategies

**Learning Outcomes:**
- [ ] Reconcile external systems
- [ ] Detect variances
- [ ] Handle exceptions

#### Lesson 04: Compliance Reporting (3 hours)
- Regulatory requirements
- Audit trail requirements
- Report generation
- Data retention
- Evidence preservation

**Learning Outcomes:**
- [ ] Generate compliance reports
- [ ] Maintain audit trails
- [ ] Preserve evidence

#### Labs (3 hours)
- **LAB-001: Loan Default Waterfalls** (1.5 hours)
  - Model capital structure
  - Calculate loss allocation
  - Execute waterfall

- **LAB-002: Ledger Reconciliation** (1 hour)
  - Find $0.01 variance
  - Trace to source
  - Implement correction

- **LAB-003: Audit Trail Forensics** (0.5 hours)
  - Query audit logs
  - Reconstruct state
  - Generate report

#### Assessment
- 30 multiple choice questions
- 3 calculation problems
- 2 reconciliation exercises
- 1 audit simulation
- **Passing Score: 95%**

---

## FINAL CERTIFICATION EXAM
### Duration: 4 Hours | Proctored

| Section | Weight | Duration | Format |
|---------|--------|----------|--------|
| Architecture | 20% | 30 min | MC + Short Answer |
| Security | 25% | 45 min | Scenario Analysis |
| Data Flow | 20% | 30 min | System Design |
| Financial | 20% | 30 min | Calculation |
| Incident Response | 15% | 45 min | Live Simulation |

**Passing Score: 95% overall, 80% minimum per section (85% for Security)**

---

## CERTIFICATION LEVELS

| Level | Requirements | Privileges |
|-------|--------------|------------|
| **OPERATOR** | C100 + C200 + 3 supervised deployments | Production read access, on-call eligible |
| **ENGINEER** | Operator + C300 + 1 integration + 5 PR reviews | Production write access, API management |
| **ARCHITECT** | Engineer + C400 + 1 design review + 2 mentees | Infrastructure access, schema authority |

---

## SCHEDULE RECOMMENDATIONS

### Full-Time Track (2 weeks)
| Week | Mon | Tue | Wed | Thu | Fri |
|------|-----|-----|-----|-----|-----|
| 1 | C100 L1-2 | C100 L3-4 | C100 Labs | C200 L1 | C200 L2 |
| 2 | C200 L3-4 | C200 Labs | C300 | C400 | Final Exam |

### Part-Time Track (8 weeks)
| Week | Focus | Hours |
|------|-------|-------|
| 1-2 | C100: Architecture | 12 |
| 3-4 | C200: Security | 16 |
| 5-6 | C300: Data Flow | 14 |
| 7-8 | C400: Financial | 18 |
| 9 | Final Exam Prep + Exam | 8 |

---

## RESOURCES

### Required Reading
- Proveniq Core Documentation
- Prisma Documentation
- NextAuth.js Documentation
- PostgreSQL Documentation

### Recommended Reading
- "Designing Data-Intensive Applications" - Martin Kleppmann
- "The Phoenix Project" - Gene Kim
- "Site Reliability Engineering" - Google

### Tools Required
- Node.js 18+
- PostgreSQL 14+
- VS Code
- Postman/Insomnia
- Chrome DevTools

---

## SUPPORT

| Channel | Purpose | Response Time |
|---------|---------|---------------|
| #academy-support | Lab help | < 4 hours |
| #academy-discussion | Peer discussion | Community |
| certification@proveniq.com | Exam issues | < 48 hours |

---

*"The syllabus is the map. The labs are the territory. The exam is the border crossing."*

— Antigravity Academy
