# CHEATSHEETS
## Quick Reference for Proveniq Core

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██████╗██╗  ██╗███████╗ █████╗ ████████╗███████╗██╗  ██╗███████╗███████╗  ║
║  ██╔════╝██║  ██║██╔════╝██╔══██╗╚══██╔══╝██╔════╝██║  ██║██╔════╝██╔════╝  ║
║  ██║     ███████║█████╗  ███████║   ██║   ███████╗███████║█████╗  █████╗    ║
║  ██║     ██╔══██║██╔══╝  ██╔══██║   ██║   ╚════██║██╔══██║██╔══╝  ██╔══╝    ║
║  ╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████║██║  ██║███████╗███████╗  ║
║   ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🏗️ ARCHITECTURE

### Layer Stack
```
Edge → Middleware → API Route → Service → Prisma → PostgreSQL
```

### Latency Budget (200ms total)
| Stage | Target |
|-------|--------|
| Network | 40ms |
| Middleware | 20ms |
| Auth | 20ms |
| AuthZ | 30ms |
| Business Logic | 20ms |
| Database | 50ms |
| Response | 20ms |

### Key Files
```
middleware.ts           # Request interception
lib/auth.ts            # NextAuth config
lib/db.ts              # Prisma singleton
lib/rbac/roles.ts      # Permission definitions
lib/rbac/guards.ts     # Authorization guards
```

---

## 🔐 AUTHENTICATION

### Session Check
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### JWT Structure
```
Header.Payload.Signature

Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "user_id", "iat": timestamp, "exp": timestamp }
```

### Password Operations
```typescript
import bcrypt from "bcrypt";

// Hash
const hash = await bcrypt.hash(password, 12);

// Verify
const valid = await bcrypt.compare(password, hash);
```

---

## 🛡️ AUTHORIZATION

### Global Roles
| Role | Description |
|------|-------------|
| ADMIN | Full platform access |
| AUDITOR | Read-only audit access |
| INVESTOR | Limited financial views |
| USER | Standard (check org role) |

### Organization Roles
| Role | Permissions |
|------|-------------|
| OWNER | Full control, can delete org |
| ADMIN | Manage members, settings, data |
| MEMBER | Create and manage own data |
| VIEWER | Read-only access |

### Permission Check
```typescript
import { requirePermission } from "@/lib/rbac/guards";

// Throws if not authorized
const { userId } = await requirePermission(organizationId, "assets:write");
```

### Permission Matrix Quick Reference
```
assets:read    → VIEWER, MEMBER, ADMIN, OWNER
assets:write   → MEMBER, ADMIN, OWNER
assets:delete  → ADMIN, OWNER
members:write  → ADMIN, OWNER
members:delete → OWNER only
```

---

## 🗄️ DATABASE

### Prisma Singleton
```typescript
// lib/db.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### Common Queries
```typescript
// Find with relations
const asset = await db.asset.findUnique({
  where: { id },
  include: { verifications: true },
});

// Scoped list
const assets = await db.asset.findMany({
  where: { organizationId },
  orderBy: { createdAt: "desc" },
  take: 20,
});

// Transaction
await db.$transaction([
  db.asset.update({ where: { id }, data }),
  db.auditLog.create({ data: auditData }),
]);
```

### Index Hints
```sql
-- Check if index is used
EXPLAIN ANALYZE SELECT * FROM assets WHERE organization_id = 'xxx';
```

---

## 📡 API PATTERNS

### Standard Response Format
```typescript
// Success
{ "data": {...}, "meta": { "total": 100, "page": 1 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (DELETE) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |

### API Route Template
```typescript
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: result.error } }, { status: 400 });
    }

    await requirePermission(result.data.organizationId, "resource:write");

    const resource = await db.resource.create({ data: result.data });
    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
```

---

## 🔔 WEBHOOKS

### Trigger Webhook
```typescript
import { triggerWebhook } from "@/lib/webhooks/service";

await triggerWebhook(organizationId, "asset.created", {
  assetId: asset.id,
  name: asset.name,
});
```

### Signature Verification
```typescript
import crypto from "crypto";

const signature = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

const valid = crypto.timingSafeEqual(
  Buffer.from(receivedSignature),
  Buffer.from(signature)
);
```

### Retry Schedule
| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

---

## 💰 FINANCIAL

### Money Handling
```typescript
// NEVER use floating point
const priceInCents = 1999;  // $19.99

// Safe operations
const total = priceInCents + taxInCents;

// Formatting
new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(total / 100);
```

### Ledger Entry
```typescript
// Every transaction has two sides
const journalEntry = {
  debit: { accountId: "cash", amount: 10000 },
  credit: { accountId: "revenue", amount: 10000 },
};
// Debits MUST equal Credits
```

---

## 📊 AUDIT LOGGING

### Create Audit Log
```typescript
import { createAuditLog } from "@/lib/audit";

await createAuditLog({
  action: "asset.created",
  entityType: "asset",
  entityId: asset.id,
  userId: session.user.id,
  organizationId,
  metadata: { name: asset.name },
});
```

### Query Audit Logs
```typescript
const logs = await db.auditLog.findMany({
  where: {
    organizationId,
    createdAt: { gte: startDate, lte: endDate },
  },
  orderBy: { createdAt: "desc" },
});
```

---

## 🔍 DEBUGGING

### Enable Prisma Logging
```env
DEBUG="prisma:query"
```

### Request Tracing
```typescript
const requestId = crypto.randomUUID();
console.log(JSON.stringify({
  requestId,
  stage: "handler",
  action: "asset.create",
  duration: Date.now() - startTime,
}));
```

### Common Issues
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 500 on first request | Cold start | Warm-up function |
| Connection timeout | Pool exhausted | Increase pool size |
| 403 on valid user | Wrong org context | Check organizationId |
| Slow queries | Missing index | Add database index |

---

## 🚨 INCIDENT RESPONSE

### Severity Levels
| Level | Description | Response Time |
|-------|-------------|---------------|
| SEV-1 | Complete outage | 15 minutes |
| SEV-2 | Major degradation | 30 minutes |
| SEV-3 | Minor impact | 4 hours |
| SEV-4 | No user impact | Next business day |

### First Response Checklist
1. [ ] Acknowledge incident
2. [ ] Check recent deployments
3. [ ] Check external dependencies
4. [ ] Check database metrics
5. [ ] Check error logs
6. [ ] Communicate status

### Rollback Command
```bash
# Vercel
vercel rollback

# Database
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## 📋 ENVIRONMENT VARIABLES

### Required
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Optional
```env
# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=

# External Services
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

# Monitoring
SENTRY_DSN=
```

---

## 🧪 TESTING

### Run Tests
```bash
npm test                 # All tests
npm test -- --watch      # Watch mode
npm test -- path/to/file # Single file
```

### Test Database
```bash
# Reset test database
DATABASE_URL=postgresql://test... npx prisma migrate reset --force
```

---

*Keep this cheatsheet handy. You'll need it.*

— Antigravity Academy
