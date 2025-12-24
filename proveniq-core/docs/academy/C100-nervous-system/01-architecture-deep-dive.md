# Lesson 01: Architecture Deep Dive
## C100: The Nervous System

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   LESSON 01                                                  │
│   ARCHITECTURE DEEP DIVE                                     │
│                                                              │
│   Duration: 2 hours                                          │
│   Difficulty: ████████░░ 80%                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 LESSON OBJECTIVES

By the end of this lesson, you will be able to:

1. Explain why each architectural layer exists
2. Describe the trade-offs made in the design
3. Identify communication patterns between components
4. Predict failure modes for each layer

---

## 1. THE PHILOSOPHY

### Why This Architecture?

Proveniq Core is not a standalone application. It is **infrastructure**.

Every application in the Proveniq ecosystem depends on it:
- Authentication flows through Core
- Authorization is enforced by Core
- Data models are defined in Core
- Audit trails are recorded by Core

This means:
- **Downtime is multiplied** - If Core is down, everything is down
- **Bugs are amplified** - A bug in Core affects all applications
- **Performance is critical** - Slow Core means slow everything

The architecture was designed with these constraints:

```typescript
const ARCHITECTURAL_PRIORITIES = {
  1: "Reliability",      // Must not go down
  2: "Security",         // Must not leak data
  3: "Performance",      // Must be fast
  4: "Maintainability",  // Must be changeable
  5: "Features"          // Must do things
} as const;
```

**Note the order.** Features are last. A feature that compromises reliability is not shipped.

---

## 2. LAYER-BY-LAYER ANALYSIS

### Layer 1: Edge (CDN / Load Balancer)

```
┌─────────────────────────────────────────────────────────────┐
│                         EDGE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Responsibilities:                                         │
│   • SSL termination                                         │
│   • DDoS protection                                         │
│   • Geographic routing                                      │
│   • Static asset caching                                    │
│   • Request filtering                                       │
│                                                             │
│   Technology: Vercel Edge Network / CloudFront              │
│                                                             │
│   Failure Mode: Total outage (rare, provider-managed)       │
│   Recovery: Automatic failover to secondary region          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why Vercel Edge?**
- Automatic SSL certificate management
- Global distribution (reduces latency)
- Built-in DDoS protection
- Zero configuration for Next.js

**Trade-off:** Vendor lock-in for edge features. Acceptable because:
- Edge is stateless (can migrate)
- Core functionality doesn't depend on edge-specific features

---

### Layer 2: Application (Next.js Runtime)

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                    MIDDLEWARE                        │  │
│   │  • Rate limiting                                     │  │
│   │  • Authentication check                              │  │
│   │  • Request logging                                   │  │
│   │  • CORS handling                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│              ┌────────────┼────────────┐                   │
│              │            │            │                    │
│              ▼            ▼            ▼                    │
│   ┌──────────────┐ ┌──────────┐ ┌──────────────┐          │
│   │    React     │ │   API    │ │   GraphQL    │          │
│   │    (RSC)     │ │  Routes  │ │   Endpoint   │          │
│   │              │ │          │ │              │          │
│   │ • Pages      │ │ • REST   │ │ • Queries    │          │
│   │ • Components │ │ • CRUD   │ │ • Mutations  │          │
│   │ • Layouts    │ │ • Auth   │ │ • Subscript. │          │
│   └──────────────┘ └──────────┘ └──────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why Next.js 15 with App Router?**

1. **Server Components** - Reduce client bundle size
2. **API Routes** - No separate backend needed
3. **Middleware** - Request interception at edge
4. **TypeScript Native** - Type safety throughout

**The Middleware Chain:**

```typescript
// middleware.ts execution order
const MIDDLEWARE_CHAIN = [
  "1. Rate Limiting",      // Reject if over limit
  "2. Authentication",     // Validate session/token
  "3. Locale Detection",   // Set language
  "4. Request Logging",    // Audit trail
  "5. Route Matching"      // Forward to handler
] as const;
```

**Trade-off:** Serverless cold starts. Mitigated by:
- Keeping functions small
- Using edge runtime where possible
- Connection pooling for database

---

### Layer 3: Service (Business Logic)

```
┌─────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │    Auth     │  │    RBAC     │  │   Tenant    │        │
│   │   Service   │  │   Guards    │  │   Context   │        │
│   │             │  │             │  │             │        │
│   │ • Sessions  │  │ • Roles     │  │ • Org ID    │        │
│   │ • Tokens    │  │ • Perms     │  │ • Isolation │        │
│   │ • 2FA       │  │ • Checks    │  │ • Scoping   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   Audit     │  │  Webhook    │  │   Search    │        │
│   │   Logger    │  │  Delivery   │  │   Index     │        │
│   │             │  │             │  │             │        │
│   │ • Actions   │  │ • Queue     │  │ • Full-text │        │
│   │ • Entities  │  │ • Retry     │  │ • Filters   │        │
│   │ • Metadata  │  │ • Signing   │  │ • Ranking   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Service Layer Principles:**

```typescript
const SERVICE_PRINCIPLES = {
  // Each service has ONE responsibility
  single_responsibility: true,
  
  // Services don't call each other directly
  no_circular_deps: true,
  
  // All services are stateless
  stateless: true,
  
  // All services are testable in isolation
  testable: true
} as const;
```

**Key Services Explained:**

| Service | Purpose | Critical Path? |
|---------|---------|----------------|
| Auth | Session management | Yes |
| RBAC | Permission checks | Yes |
| Tenant | Organization scoping | Yes |
| Audit | Compliance logging | No (async) |
| Webhook | External notifications | No (async) |
| Search | Content discovery | No |

**Trade-off:** No microservices. Everything in one deployment.

Why? Because:
- Simpler deployment
- No network latency between services
- Easier debugging
- Appropriate for current scale

When to split: When a service needs independent scaling or different SLAs.

---

### Layer 4: Data (Prisma ORM)

```
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                    Prisma Client                     │  │
│   │                                                      │  │
│   │  • Type-safe queries                                │  │
│   │  • Automatic migrations                             │  │
│   │  • Connection pooling                               │  │
│   │  • Query logging                                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                  Connection Pool                     │  │
│   │                                                      │  │
│   │  Pool Size: 10 connections (serverless optimized)   │  │
│   │  Timeout: 10 seconds                                │  │
│   │  Idle Timeout: 60 seconds                           │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why Prisma?**

1. **Type Safety** - Queries are type-checked at compile time
2. **Migrations** - Schema changes are versioned and reversible
3. **Performance** - Query engine is optimized Rust
4. **DX** - Excellent developer experience

**The Singleton Pattern:**

```typescript
// lib/db.ts - CRITICAL: Understand this pattern

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

**Why?** In development, hot reloading creates new instances. Without the singleton, you'd exhaust database connections.

**Trade-off:** ORM overhead vs raw SQL performance.

Acceptable because:
- Most queries are simple CRUD
- Complex queries use `$queryRaw`
- Type safety prevents bugs

---

### Layer 5: Persistence (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────┐
│                     PERSISTENCE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                   PostgreSQL 15                      │  │
│   │                    (AWS RDS)                         │  │
│   │                                                      │  │
│   │  Instance: db.t3.medium (2 vCPU, 4GB RAM)           │  │
│   │  Storage: 100GB gp3 SSD                             │  │
│   │  Multi-AZ: Yes (automatic failover)                 │  │
│   │  Backups: Daily, 7-day retention                    │  │
│   │  Encryption: At rest (AES-256)                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Key Tables:                                               │
│   ┌──────────┬──────────┬──────────┬──────────┐           │
│   │  users   │   orgs   │  assets  │  audit   │           │
│   │  ~10K    │   ~1K    │  ~100K   │  ~10M    │           │
│   └──────────┴──────────┴──────────┴──────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why PostgreSQL?**

1. **ACID Compliance** - Financial data requires transactions
2. **JSON Support** - Flexible metadata storage
3. **Full-Text Search** - Built-in search capabilities
4. **Mature Ecosystem** - Battle-tested, well-documented

**Why AWS RDS?**

1. **Managed Service** - No DBA required
2. **Multi-AZ** - Automatic failover
3. **Backups** - Point-in-time recovery
4. **Monitoring** - CloudWatch integration

**Trade-off:** Cost vs self-managed.

At current scale, managed is cheaper when you factor in:
- Engineering time for maintenance
- Risk of data loss
- Compliance requirements

---

## 3. COMMUNICATION PATTERNS

### Synchronous Communication

```
Browser → Edge → Next.js → Service → Prisma → PostgreSQL
   │                                              │
   └──────────────── Response ◄──────────────────┘
```

**Used for:**
- User-facing requests
- Data mutations
- Authentication

**Characteristics:**
- Blocking
- Timeout-sensitive
- Must be fast (<500ms P95)

---

### Asynchronous Communication

```
Request → Service → Queue → Worker → External System
   │                                      │
   └──── Immediate Response               │
                                          │
         Webhook ◄────────────────────────┘
```

**Used for:**
- Webhook delivery
- Email sending
- Heavy processing
- External API calls

**Characteristics:**
- Non-blocking
- Retry-capable
- Eventually consistent

---

## 4. FAILURE MODES

### Failure Mode Analysis

| Component | Failure Mode | Impact | Detection | Recovery |
|-----------|--------------|--------|-----------|----------|
| Edge | Total outage | Complete downtime | External monitoring | Provider failover |
| Next.js | Cold start timeout | Slow requests | Latency metrics | Warm-up requests |
| Prisma | Connection exhaustion | 500 errors | Connection pool metrics | Restart pods |
| PostgreSQL | Primary failure | Write unavailable | RDS events | Multi-AZ failover |
| PostgreSQL | Replica lag | Stale reads | Replication lag metric | Promote replica |

### Cascading Failure Prevention

```typescript
const CIRCUIT_BREAKER_CONFIG = {
  // If 50% of requests fail in 10 seconds
  failureThreshold: 0.5,
  windowSize: 10000, // ms
  
  // Open circuit for 30 seconds
  openDuration: 30000,
  
  // Allow 1 request through to test
  halfOpenRequests: 1
} as const;
```

---

## 5. KNOWLEDGE CHECK

Answer these questions without looking at the documentation:

1. What are the five architectural priorities in order?

2. Why is the Prisma client instantiated as a singleton?

3. What happens if PostgreSQL primary fails?

4. Which services are on the critical path?

5. Why doesn't Proveniq Core use microservices?

6. What is the connection pool size and why?

7. How does the middleware chain execute?

8. What is the trade-off of using Vercel Edge?

9. When would you use `$queryRaw` instead of Prisma methods?

10. What is the P95 latency target for synchronous requests?

---

## 6. PRACTICAL EXERCISE

### Exercise 1.1: Draw the Architecture

Without looking at this document:

1. Draw the complete architecture diagram
2. Label each layer
3. Show communication patterns
4. Mark critical path components

**Time limit: 10 minutes**

---

### Exercise 1.2: Failure Scenario

Scenario: The database connection pool is exhausted.

Answer:
1. What symptoms would you see?
2. How would you detect this?
3. What is the immediate mitigation?
4. What is the long-term fix?

**Time limit: 5 minutes**

---

## 📋 LESSON COMPLETE CHECKLIST

Before proceeding to Lesson 02:

- [ ] Can explain all five architectural priorities
- [ ] Can draw the architecture from memory
- [ ] Understand why each technology was chosen
- [ ] Know the failure modes for each layer
- [ ] Completed both practical exercises

---

## ➡️ NEXT LESSON

**[→ 02-request-lifecycle.md](./02-request-lifecycle.md)**

---

*"Architecture is the decisions you wish you could change but can't."*

— Antigravity Academy
