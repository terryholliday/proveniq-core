# C100: THE NERVOUS SYSTEM
## Architecture Track

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗██╗  ██╗███████╗    ███╗   ██╗███████╗██████╗ ██╗   ██╗ ██████╗  ║
║   ╚══██╔══╝██║  ██║██╔════╝    ████╗  ██║██╔════╝██╔══██╗██║   ██║██╔═══██╗ ║
║      ██║   ███████║█████╗      ██╔██╗ ██║█████╗  ██████╔╝██║   ██║██║   ██║ ║
║      ██║   ██╔══██║██╔══╝      ██║╚██╗██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║   ██║ ║
║      ██║   ██║  ██║███████╗    ██║ ╚████║███████╗██║  ██║ ╚████╔╝ ╚██████╔╝ ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝  ╚═══╝   ╚═════╝  ║
║                                                                              ║
║                         U S    S Y S T E M                                   ║
║                                                                              ║
║   "Understand the signal paths or become noise."                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 TRACK OBJECTIVES

By the end of this track, you will be able to:

1. **Trace any request** from browser to database and back
2. **Map all dependencies** between system components
3. **Identify bottlenecks** before they cause incidents
4. **Explain the architecture** under pressure in an incident call
5. **Debug production issues** using only logs and metrics

---

## ⏱️ TRACK DURATION: 12 HOURS

| Lesson | Topic | Duration |
|--------|-------|----------|
| 01 | Architecture Deep Dive | 2 hours |
| 02 | Request Lifecycle | 2 hours |
| 03 | Database Topology | 2 hours |
| 04 | Caching Strategies | 2 hours |
| LAB-001 | Packet Tracing | 1.5 hours |
| LAB-002 | Latency Hunting | 1.5 hours |
| LAB-003 | Dependency Mapping | 1 hour |
| EXAM | C100 Assessment | Timed |

---

## 📐 THE SYSTEM MAP

Before we begin, memorize this. You will be tested on it.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROVENIQ CORE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   EDGE LAYER                                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         CDN / Load Balancer                          │  │
│   │                    (Vercel Edge / CloudFront)                        │  │
│   └───────────────────────────────┬─────────────────────────────────────┘  │
│                                   │                                         │
│   APPLICATION LAYER               │                                         │
│   ┌───────────────────────────────▼─────────────────────────────────────┐  │
│   │                         Next.js Runtime                              │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │
│   │  │   React     │  │  API Routes │  │  Middleware │                  │  │
│   │  │   (RSC)     │  │  (REST/GQL) │  │  (Auth/Rate)│                  │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │  │
│   │         │                │                │                          │  │
│   │         └────────────────┼────────────────┘                          │  │
│   │                          │                                           │  │
│   └──────────────────────────┼───────────────────────────────────────────┘  │
│                              │                                              │
│   SERVICE LAYER              │                                              │
│   ┌──────────────────────────▼───────────────────────────────────────────┐  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│   │  │   Auth      │  │   RBAC      │  │   Audit     │  │  Webhooks   │ │  │
│   │  │   Service   │  │   Guards    │  │   Logger    │  │  Delivery   │ │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │  │
│   │         │                │                │                │         │  │
│   └─────────┼────────────────┼────────────────┼────────────────┼─────────┘  │
│             │                │                │                │            │
│   DATA LAYER│                │                │                │            │
│   ┌─────────▼────────────────▼────────────────▼────────────────▼─────────┐  │
│   │                         Prisma ORM                                    │  │
│   │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│   │  │                    Connection Pool                               │ │  │
│   │  └─────────────────────────────┬───────────────────────────────────┘ │  │
│   └────────────────────────────────┼─────────────────────────────────────┘  │
│                                    │                                        │
│   PERSISTENCE LAYER                │                                        │
│   ┌────────────────────────────────▼─────────────────────────────────────┐  │
│   │                         PostgreSQL                                    │  │
│   │                        (AWS RDS)                                      │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│   │  │  Users   │  │  Orgs    │  │  Assets  │  │  Audit   │             │  │
│   │  │  Table   │  │  Table   │  │  Table   │  │  Table   │             │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   EXTERNAL INTEGRATIONS                                                     │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│   │  │   S3     │  │ DocuSign │  │  Sentry  │  │ Segment  │             │  │
│   │  │ Storage  │  │  E-Sign  │  │  Errors  │  │Analytics │             │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 LESSON OVERVIEW

### Lesson 01: Architecture Deep Dive
*File: `01-architecture-deep-dive.md`*

You will learn:
- Why this architecture was chosen
- Trade-offs made and their consequences
- How each layer communicates
- Failure modes and recovery patterns

**Key Concept:** The architecture is not arbitrary. Every decision has a reason.

---

### Lesson 02: Request Lifecycle
*File: `02-request-lifecycle.md`*

You will learn:
- The complete path of an HTTP request
- Where authentication happens
- Where authorization is checked
- How responses are constructed

**Key Concept:** A request touches 7+ components before returning.

---

### Lesson 03: Database Topology
*File: `03-database-topology.md`*

You will learn:
- Schema design decisions
- Index strategy and query optimization
- Connection pooling mechanics
- Transaction isolation in multi-tenant systems

**Key Concept:** The database is the source of truth. Protect it.

---

### Lesson 04: Caching Strategies
*File: `04-caching-strategies.md`*

You will learn:
- What to cache and what not to cache
- Cache invalidation patterns
- Session storage strategies
- CDN configuration

**Key Concept:** Cache invalidation is one of the two hard problems.

---

## 🔬 LABS

### LAB-001: Packet Tracing
*File: `labs/LAB-001-packet-tracing.md`*

**Scenario:** A user reports that asset creation is slow.

**Your Mission:**
1. Trace the request from browser to database
2. Identify every network hop
3. Measure latency at each layer
4. Document the complete request flow

**Success Criteria:**
- Complete request diagram with timing
- Identification of the slowest component
- Proposed optimization (if any)

---

### LAB-002: Latency Hunting
*File: `labs/LAB-002-latency-hunting.md`*

**Scenario:** P95 latency has increased from 200ms to 800ms.

**Your Mission:**
1. Identify the source of the latency increase
2. Determine if it's database, network, or application
3. Propose and implement a fix
4. Verify the fix reduces latency

**Success Criteria:**
- Root cause identified with evidence
- Fix implemented and tested
- P95 latency back under 300ms

---

### LAB-003: Dependency Mapping
*File: `labs/LAB-003-dependency-mapping.md`*

**Scenario:** You need to understand what breaks if PostgreSQL goes down.

**Your Mission:**
1. Map all system dependencies
2. Identify single points of failure
3. Document degradation behavior
4. Create a dependency matrix

**Success Criteria:**
- Complete dependency graph
- SPOF list with mitigation strategies
- Graceful degradation plan

---

## 📊 ASSESSMENT CRITERIA

The C100 exam tests:

| Category | Weight | Topics |
|----------|--------|--------|
| Architecture Knowledge | 30% | Layers, components, communication |
| Request Lifecycle | 25% | Path tracing, timing, debugging |
| Database Understanding | 25% | Schema, queries, transactions |
| Operational Readiness | 20% | Incident response, debugging |

**Passing Score: 95%**

---

## 🚨 INCIDENT SIMULATION

At the end of this track, you will face a simulated incident:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🚨 INCIDENT: PCORE-2024-001                               │
│                                                              │
│   Severity: SEV-2                                           │
│   Status: ACTIVE                                            │
│   Duration: 00:00:00                                        │
│                                                              │
│   Description:                                              │
│   Users reporting intermittent 500 errors on asset          │
│   creation. Error rate: 15%. No recent deployments.         │
│                                                              │
│   Your Role: On-call Engineer                               │
│   Your Task: Diagnose and resolve within 30 minutes         │
│                                                              │
│   Available Tools:                                          │
│   - Application logs                                        │
│   - Database metrics                                        │
│   - Network traces                                          │
│   - This documentation                                      │
│                                                              │
│   Clock starts now.                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

You will be graded on:
- Time to identify root cause
- Accuracy of diagnosis
- Quality of communication
- Effectiveness of resolution

---

## 📋 CHECKLIST

Before proceeding to the exam:

- [ ] Completed Lesson 01: Architecture Deep Dive
- [ ] Completed Lesson 02: Request Lifecycle
- [ ] Completed Lesson 03: Database Topology
- [ ] Completed Lesson 04: Caching Strategies
- [ ] Completed LAB-001: Packet Tracing
- [ ] Completed LAB-002: Latency Hunting
- [ ] Completed LAB-003: Dependency Mapping
- [ ] Can draw the architecture from memory
- [ ] Can trace a request without documentation
- [ ] Can explain every database table's purpose

---

## 🎯 BEGIN

Start with Lesson 01:

**[→ 01-architecture-deep-dive.md](./01-architecture-deep-dive.md)**

---

*"The map is not the territory, but without the map, you're lost in the territory."*

— Antigravity Academy
