# PROVENIQ CORE — TECHNICAL MANUAL

**Version:** 1.0.0  
**Classification:** Internal Engineering Reference  
**Last Updated:** December 2024

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [The 8-Node Ecosystem](#3-the-8-node-ecosystem)
4. [Data Flow & Lifecycle](#4-data-flow--lifecycle)
5. [Security Model](#5-security-model)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Multi-Tenancy](#7-multi-tenancy)
8. [API Reference](#8-api-reference)
9. [Database Schema](#9-database-schema)
10. [Webhooks & Events](#10-webhooks--events)
11. [Deployment & Operations](#11-deployment--operations)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Disaster Recovery](#13-disaster-recovery)
14. [Appendices](#14-appendices)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What is Proveniq Core?

Proveniq Core is the **orchestration layer** for the Proveniq ecosystem—the central nervous system that coordinates data flow between software applications, infrastructure services, and hardware devices.

**Mission:** Establish truth infrastructure for physical assets.

**Core Function:** Transform Dead Capital (unverified, illiquid assets) into Live Capital (verified, tradeable assets with provenance).

### 1.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Single Source of Truth** | All asset state flows through Core |
| **Zero Trust** | Every request authenticated, every action authorized |
| **Audit Everything** | Immutable audit trail for compliance |
| **Fail Loud** | Explicit errors, no silent failures |
| **Tenant Isolation** | Data segregation at every layer |

### 1.3 Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                         │
│  Next.js 14 · React 18 · TailwindCSS · Framer Motion   │
├─────────────────────────────────────────────────────────┤
│                      API LAYER                          │
│  REST · GraphQL (Yoga) · WebSocket · Webhooks          │
├─────────────────────────────────────────────────────────┤
│                   BUSINESS LOGIC                        │
│  TypeScript · Zod Validation · RBAC · Audit Logging    │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                           │
│  Prisma ORM · PostgreSQL · Redis (cache) · S3 (files)  │
├─────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE                        │
│  Vercel/Railway · Neon/Supabase · Cloudflare           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
                              ┌─────────────────┐
                              │   EDGE LAYER    │
                              │   (Cloudflare)  │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  LOAD BALANCER  │
                              └────────┬────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
┌───────▼───────┐            ┌─────────▼─────────┐          ┌─────────▼─────────┐
│   WEB APP     │            │    API SERVER     │          │   WORKER QUEUE    │
│  (Next.js)    │            │   (REST/GraphQL)  │          │   (Background)    │
└───────┬───────┘            └─────────┬─────────┘          └─────────┬─────────┘
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   DATA LAYER    │
                              │  PostgreSQL +   │
                              │  Redis + S3     │
                              └─────────────────┘
```

### 2.2 Request Lifecycle

```
1. REQUEST INGRESS
   Client → Cloudflare (WAF/DDoS) → Load Balancer → App Server

2. AUTHENTICATION
   JWT Validation → Session Lookup → User Context Injection

3. AUTHORIZATION
   RBAC Check → Tenant Isolation → Permission Verification

4. BUSINESS LOGIC
   Input Validation → Domain Logic → Side Effects

5. DATA ACCESS
   Prisma Query → PostgreSQL → Response Mapping

6. AUDIT LOGGING
   Action Recorded → Audit Table → Async Webhook Dispatch

7. RESPONSE EGRESS
   JSON Serialization → Compression → Client
```

### 2.3 Directory Structure

```
proveniq-core/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public pages
│   ├── api/                # API routes
│   ├── dashboard/          # Authenticated app
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── motion/             # Animated components
│   ├── providers/          # Context providers
│   └── ui/                 # Base UI components
├── lib/                    # Core business logic
│   ├── api/                # API utilities
│   ├── auth/               # Authentication
│   ├── rbac/               # Role-based access
│   ├── webhooks/           # Webhook dispatch
│   └── config.ts           # PROVENIQ_DNA
├── prisma/                 # Database schema
│   ├── schema.prisma       # Prisma schema
│   └── migrations/         # Migration history
├── graphql/                # GraphQL schema
│   ├── schema.graphql      # Type definitions
│   └── resolvers/          # Resolver functions
├── docs/                   # Documentation
│   └── academy/            # Training curriculum
└── src/config/             # Type-safe configuration
```

---

## 3. THE 8-NODE ECOSYSTEM

### 3.1 Ecosystem Overview

Proveniq operates as an **8-node directed acyclic graph (DAG)** where each node has a specific role in the asset lifecycle.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SOFTWARE LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   HOME   │  │  LEDGER  │  │ CLAIMSIQ │  │   BIDS   │            │
│  │  Ingest  │→ │  Verify  │→ │Adjudicate│→ │Liquidate │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑
                                    │ Orchestrate
┌─────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                           │
│              ┌──────────┐              ┌──────────┐                 │
│              │   CORE   │              │ CAPITAL  │                 │
│              │Orchestrate│              │ Finance  │                 │
│              └──────────┘              └──────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑
                                    │ Signal
┌─────────────────────────────────────────────────────────────────────┐
│                        HARDWARE LAYER                               │
│              ┌──────────┐              ┌──────────┐                 │
│              │  LOCKER  │              │ SMARTTAG │                 │
│              │  Secure  │              │  Track   │                 │
│              └──────────┘              └──────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Node Definitions

| ID | Label | Type | Role | Function |
|----|-------|------|------|----------|
| `home` | Home | Software | **Ingest** | Entry point for asset registration |
| `ledger` | Ledger | Software | **Verify** | Cryptographic verification of asset claims |
| `claims-iq` | ClaimsIQ | Software | **Adjudicate** | AI-powered claim dispute resolution |
| `bids` | Bids | Software | **Liquidate** | Marketplace for verified asset trading |
| `core` | Core | Infrastructure | **Orchestrate** | Central coordination and routing |
| `capital` | Capital | Infrastructure | **Finance** | Financial operations and treasury |
| `locker` | Locker | Hardware | **Secure** | Physical custody and anti-fraud |
| `smart-tag` | SmartTags | Hardware | **Track** | IoT tracking and chain-of-custody |

### 3.3 PROVENIQ_DNA Configuration

The canonical ecosystem definition lives in `lib/config.ts`:

```typescript
export type ProductRole = 
  | "Ingest" 
  | "Verify" 
  | "Adjudicate" 
  | "Liquidate" 
  | "Orchestrate" 
  | "Finance" 
  | "Secure" 
  | "Track";

export type ProductCategory = "Software" | "Infrastructure" | "Hardware";

export interface ProductModule {
  id: string;
  label: string;
  type: ProductCategory;
  role: ProductRole;
  routeSlug: string;
  docSlug: string;
}

export const PROVENIQ_DNA: ProveniqConfig = {
  products: [
    { id: "home", label: "Home", type: "Software", role: "Ingest", ... },
    { id: "ledger", label: "Ledger", type: "Software", role: "Verify", ... },
    { id: "claims-iq", label: "ClaimsIQ", type: "Software", role: "Adjudicate", ... },
    { id: "bids", label: "Bids", type: "Software", role: "Liquidate", ... },
    { id: "core", label: "Core", type: "Infrastructure", role: "Orchestrate", ... },
    { id: "capital", label: "Capital", type: "Infrastructure", role: "Finance", ... },
    { id: "locker", label: "Locker", type: "Hardware", role: "Secure", ... },
    { id: "smart-tag", label: "SmartTags", type: "Hardware", role: "Track", ... }
  ],
  theme: {
    fonts: { ui: "var(--font-inter)", data: "var(--font-jetbrains)" },
    colors: { bg: "#0f172a", panel: "#1e293b", accent: "#0ea5e9", success: "#10b981" }
  }
};
```

---

## 4. DATA FLOW & LIFECYCLE

### 4.1 Asset Lifecycle States

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ DRAFT   │ →  │ PENDING  │ →  │ VERIFIED │ →  │  LISTED  │ →  │  SOLD   │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └─────────┘
     │              │               │               │               │
     │              │               │               │               │
   Ingest        Verify        Adjudicate      Liquidate        Archive
   (Home)       (Ledger)      (ClaimsIQ)        (Bids)         (Ledger)
```

### 4.2 Happy Path Flow

```
STEP 1: INGEST (Home)
────────────────────
User submits asset registration form
├── Asset metadata captured
├── Supporting documents uploaded to S3
├── Initial hash generated
└── Status: DRAFT → PENDING

STEP 2: VERIFY (Ledger)
───────────────────────
Verification process initiated
├── Document authenticity checked
├── Ownership chain validated
├── Cryptographic proof generated
└── Status: PENDING → VERIFIED

STEP 3: ADJUDICATE (ClaimsIQ) [If Disputed]
───────────────────────────────────────────
Dispute raised against asset
├── AI analysis of claim
├── Evidence evaluation
├── Resolution recommendation
└── Status: DISPUTED → VERIFIED or REJECTED

STEP 4: LIQUIDATE (Bids)
────────────────────────
Asset listed for sale
├── Marketplace listing created
├── Bids collected
├── Winner determined
└── Status: LISTED → SOLD

STEP 5: CUSTODY (Locker + SmartTag)
───────────────────────────────────
Physical asset secured
├── Locker assignment
├── SmartTag attached
├── Chain-of-custody tracked
└── Transfer executed
```

### 4.3 Failure Path Handling

```
FAILURE TYPE          │ DETECTION           │ RESPONSE
──────────────────────┼─────────────────────┼──────────────────────
Validation Error      │ Zod schema          │ 400 + field errors
Auth Failure          │ JWT/Session         │ 401 + redirect
Permission Denied     │ RBAC check          │ 403 + audit log
Not Found             │ Prisma query        │ 404 + suggestion
Rate Limited          │ Redis counter       │ 429 + retry-after
Server Error          │ Try/catch           │ 500 + error tracking
Timeout               │ AbortController     │ 504 + circuit breaker
```

---

## 5. SECURITY MODEL

### 5.1 Security Layers

```
LAYER 1: NETWORK
────────────────
├── Cloudflare WAF (DDoS, bot protection)
├── TLS 1.3 everywhere
├── IP allowlisting for admin routes
└── Rate limiting per IP/user

LAYER 2: APPLICATION
────────────────────
├── Input validation (Zod schemas)
├── Output encoding (XSS prevention)
├── CSRF tokens for mutations
└── Content Security Policy headers

LAYER 3: AUTHENTICATION
───────────────────────
├── NextAuth.js with multiple providers
├── JWT with short expiry (15min)
├── Refresh token rotation
└── Optional 2FA (TOTP)

LAYER 4: AUTHORIZATION
──────────────────────
├── Role-Based Access Control (RBAC)
├── Organization-scoped permissions
├── Resource-level access checks
└── Audit logging for all actions

LAYER 5: DATA
─────────────
├── Encryption at rest (AES-256)
├── Encryption in transit (TLS)
├── Field-level encryption for PII
└── Tenant isolation in queries
```

### 5.2 Threat Model

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | Prisma parameterized queries |
| **XSS** | React auto-escaping + CSP |
| **CSRF** | SameSite cookies + tokens |
| **Broken Auth** | NextAuth + session validation |
| **IDOR** | Tenant ID in all queries |
| **Data Exposure** | Field-level permissions |
| **Rate Abuse** | Redis-based rate limiting |
| **Privilege Escalation** | RBAC enforcement |

### 5.3 Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

---

## 6. AUTHENTICATION & AUTHORIZATION

### 6.1 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │ →   │ NextAuth │ →   │ Provider │ →   │ Callback │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                  │
                      │         ┌──────────┐            │
                      └─────────│  Session │←───────────┘
                                │  Created │
                                └──────────┘
```

### 6.2 Supported Providers

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({ ... }),
    GitHubProvider({ ... }),
    CredentialsProvider({ ... }),  // Email/password
  ],
  callbacks: {
    jwt: async ({ token, user }) => { ... },
    session: async ({ session, token }) => { ... },
  },
};
```

### 6.3 Role Hierarchy

```
GLOBAL ROLES (Platform-wide)
────────────────────────────
ADMIN     │ Full platform access, can manage all orgs
AUDITOR   │ Read-only access to all data for compliance
INVESTOR  │ Limited financial views across portfolio
USER      │ Standard user (default)

ORGANIZATION ROLES (Per-org)
────────────────────────────
OWNER     │ Full control, can delete org
ADMIN     │ Manage members and settings
MEMBER    │ Create and manage own data
VIEWER    │ Read-only access
```

### 6.4 Permission Matrix

```typescript
// lib/rbac/roles.ts
export const PERMISSIONS = {
  // Asset permissions
  "asset:create":    ["OWNER", "ADMIN", "MEMBER"],
  "asset:read":      ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "asset:update":    ["OWNER", "ADMIN", "MEMBER"],
  "asset:delete":    ["OWNER", "ADMIN"],
  
  // Organization permissions
  "org:settings":    ["OWNER", "ADMIN"],
  "org:members":     ["OWNER", "ADMIN"],
  "org:billing":     ["OWNER"],
  "org:delete":      ["OWNER"],
  
  // Admin permissions
  "admin:audit":     ["ADMIN", "AUDITOR"],
  "admin:users":     ["ADMIN"],
  "admin:system":    ["ADMIN"],
} as const;
```

### 6.5 RBAC Guard Usage

```typescript
// In API route
import { withAuth } from "@/lib/withAuth";
import { requirePermission } from "@/lib/rbac/guards";

export const POST = withAuth(async (req, { user, org }) => {
  // Check permission
  requirePermission(user, org, "asset:create");
  
  // Proceed with logic
  const asset = await createAsset({ ... });
  return Response.json(asset);
});
```

---

## 7. MULTI-TENANCY

### 7.1 Tenant Isolation Model

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM LAYER                          │
│  (Shared infrastructure, global admins, system config)      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐
│   ORG: ACME   │     │  ORG: GLOBEX  │     │  ORG: INITECH │
│               │     │               │     │               │
│ ┌───────────┐ │     │ ┌───────────┐ │     │ ┌───────────┐ │
│ │  Assets   │ │     │ │  Assets   │ │     │ │  Assets   │ │
│ │  Members  │ │     │ │  Members  │ │     │ │  Members  │ │
│ │  Settings │ │     │ │  Settings │ │     │ │  Settings │ │
│ └───────────┘ │     │ └───────────┘ │     │ └───────────┘ │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 7.2 Data Isolation

Every database query includes `organizationId`:

```typescript
// lib/tenant.ts
export function getTenantContext(session: Session) {
  if (!session.user.organizationId) {
    throw new TenantError("No organization context");
  }
  return {
    organizationId: session.user.organizationId,
    userId: session.user.id,
  };
}

// Usage in queries
const assets = await prisma.asset.findMany({
  where: {
    organizationId: tenant.organizationId,  // ALWAYS INCLUDED
    status: "VERIFIED",
  },
});
```

### 7.3 Tenant Switching

Users can belong to multiple organizations:

```typescript
// API: Switch organization context
POST /api/org/switch
{
  "organizationId": "org_xyz123"
}

// Response: New session with updated org context
{
  "success": true,
  "organization": {
    "id": "org_xyz123",
    "name": "Acme Corp",
    "role": "ADMIN"
  }
}
```

---

## 8. API REFERENCE

### 8.1 REST API

**Base URL:** `https://api.proveniq.com/v1`

#### Authentication

All requests require Bearer token:

```
Authorization: Bearer <access_token>
```

#### Endpoints

```
ASSETS
──────
GET    /assets              List assets (paginated)
POST   /assets              Create asset
GET    /assets/:id          Get asset by ID
PATCH  /assets/:id          Update asset
DELETE /assets/:id          Delete asset

DOCUMENTS
─────────
GET    /documents           List documents
POST   /documents           Upload document
GET    /documents/:id       Get document
DELETE /documents/:id       Delete document

ORGANIZATIONS
─────────────
GET    /org                 Get current org
PATCH  /org                 Update org settings
GET    /org/members         List members
POST   /org/members/invite  Invite member
DELETE /org/members/:id     Remove member

WEBHOOKS
────────
GET    /webhooks            List webhooks
POST   /webhooks            Create webhook
PATCH  /webhooks/:id        Update webhook
DELETE /webhooks/:id        Delete webhook
```

#### Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### 8.2 GraphQL API

**Endpoint:** `https://api.proveniq.com/graphql`

#### Schema Overview

```graphql
type Query {
  # Assets
  asset(id: ID!): Asset
  assets(filter: AssetFilter, pagination: Pagination): AssetConnection!
  
  # Organizations
  organization: Organization!
  organizationMembers: [Member!]!
  
  # User
  me: User!
}

type Mutation {
  # Assets
  createAsset(input: CreateAssetInput!): Asset!
  updateAsset(id: ID!, input: UpdateAssetInput!): Asset!
  deleteAsset(id: ID!): Boolean!
  
  # Documents
  uploadDocument(input: UploadDocumentInput!): Document!
  
  # Organization
  inviteMember(email: String!, role: OrgRole!): Invitation!
  removeMember(userId: ID!): Boolean!
}

type Subscription {
  assetUpdated(id: ID!): Asset!
  notificationReceived: Notification!
}
```

#### Example Query

```graphql
query GetAssets($filter: AssetFilter) {
  assets(filter: $filter, pagination: { limit: 20 }) {
    edges {
      node {
        id
        title
        status
        verifiedAt
        documents {
          id
          filename
          url
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### 8.3 Rate Limiting

```
TIER        │ REQUESTS/MIN │ BURST
────────────┼──────────────┼───────
Free        │ 60           │ 10
Pro         │ 600          │ 100
Enterprise  │ 6000         │ 1000
```

Rate limit headers:

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1702400000
```

---

## 9. DATABASE SCHEMA

### 9.1 Core Tables

```prisma
// prisma/schema.prisma

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  image           String?
  globalRole      GlobalRole @default(USER)
  
  // Relations
  memberships     Membership[]
  sessions        Session[]
  auditLogs       AuditLog[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Organization {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  
  // Relations
  members         Membership[]
  assets          Asset[]
  documents       Document[]
  webhooks        Webhook[]
  apiKeys         ApiKey[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Asset {
  id              String    @id @default(cuid())
  title           String
  description     String?
  status          AssetStatus @default(DRAFT)
  metadata        Json?
  
  // Verification
  verifiedAt      DateTime?
  verifiedBy      String?
  proofHash       String?
  
  // Relations
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  documents       Document[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([organizationId])
  @@index([status])
}

model Document {
  id              String    @id @default(cuid())
  filename        String
  mimeType        String
  size            Int
  s3Key           String
  hash            String
  
  // Relations
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  assetId         String?
  asset           Asset?    @relation(fields: [assetId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@index([organizationId])
  @@index([assetId])
}

model AuditLog {
  id              String    @id @default(cuid())
  action          String
  entityType      String
  entityId        String
  metadata        Json?
  ipAddress       String?
  userAgent       String?
  
  // Relations
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  organizationId  String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([organizationId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### 9.2 Enums

```prisma
enum GlobalRole {
  ADMIN
  AUDITOR
  INVESTOR
  USER
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum AssetStatus {
  DRAFT
  PENDING
  VERIFIED
  DISPUTED
  REJECTED
  LISTED
  SOLD
  ARCHIVED
}
```

### 9.3 Indexes & Performance

Critical indexes for query performance:

```prisma
// Composite indexes for common queries
@@index([organizationId, status])           // Filter by org + status
@@index([organizationId, createdAt])        // Org timeline
@@index([status, verifiedAt])               // Verification queue
```

---

## 10. WEBHOOKS & EVENTS

### 10.1 Event Types

```typescript
export const WEBHOOK_EVENTS = {
  // Asset events
  "asset.created": "Asset was created",
  "asset.updated": "Asset was updated",
  "asset.verified": "Asset verification completed",
  "asset.disputed": "Dispute raised against asset",
  "asset.sold": "Asset sale completed",
  
  // Document events
  "document.uploaded": "Document was uploaded",
  "document.verified": "Document verification completed",
  
  // Organization events
  "member.invited": "Member invitation sent",
  "member.joined": "Member joined organization",
  "member.removed": "Member removed from organization",
} as const;
```

### 10.2 Webhook Payload

```typescript
interface WebhookPayload {
  id: string;              // Unique event ID
  type: string;            // Event type
  timestamp: string;       // ISO 8601 timestamp
  organizationId: string;  // Source organization
  data: {
    // Event-specific data
  };
}

// Example: asset.verified
{
  "id": "evt_abc123",
  "type": "asset.verified",
  "timestamp": "2024-12-12T18:00:00Z",
  "organizationId": "org_xyz789",
  "data": {
    "assetId": "ast_def456",
    "title": "2019 Toyota Camry",
    "status": "VERIFIED",
    "verifiedAt": "2024-12-12T18:00:00Z",
    "proofHash": "sha256:abc123..."
  }
}
```

### 10.3 Webhook Security

All webhooks are signed with HMAC-SHA256:

```typescript
// Signature header
X-Proveniq-Signature: sha256=<signature>

// Verification
import { verifyWebhookSignature } from "@/lib/webhooks/signature";

const isValid = verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

### 10.4 Retry Policy

```
ATTEMPT │ DELAY
────────┼───────
1       │ Immediate
2       │ 1 minute
3       │ 5 minutes
4       │ 30 minutes
5       │ 2 hours
6       │ 24 hours (final)
```

---

## 11. DEPLOYMENT & OPERATIONS

### 11.1 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/proveniq"

# Authentication
NEXTAUTH_URL="https://app.proveniq.com"
NEXTAUTH_SECRET="<random-32-char-string>"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Storage
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="proveniq-documents"
AWS_REGION="us-east-1"

# Redis (optional, for rate limiting)
REDIS_URL="redis://..."

# Monitoring
SENTRY_DSN="..."

# Feature Flags
ENABLE_2FA="true"
ENABLE_WEBHOOKS="true"
```

### 11.2 Deployment Checklist

```
PRE-DEPLOYMENT
──────────────
[ ] All tests passing
[ ] Environment variables configured
[ ] Database migrations applied
[ ] S3 bucket created with correct permissions
[ ] DNS configured
[ ] SSL certificate provisioned

DEPLOYMENT
──────────
[ ] Build successful
[ ] Health check passing
[ ] Database connection verified
[ ] Auth flow tested
[ ] Webhook endpoints reachable

POST-DEPLOYMENT
───────────────
[ ] Smoke tests passing
[ ] Monitoring alerts configured
[ ] Error tracking active
[ ] Performance baseline captured
```

### 11.3 Scaling Considerations

```
COMPONENT       │ SCALING STRATEGY
────────────────┼──────────────────────────────────
Web/API         │ Horizontal (add instances)
Database        │ Vertical first, then read replicas
File Storage    │ S3 (infinite scale)
Background Jobs │ Queue workers (horizontal)
Cache           │ Redis cluster
Search          │ Dedicated search service
```

---

## 12. MONITORING & OBSERVABILITY

### 12.1 Key Metrics

```
AVAILABILITY
────────────
- Uptime percentage (target: 99.9%)
- Error rate (target: < 0.1%)
- Health check status

PERFORMANCE
───────────
- P50 latency (target: < 100ms)
- P99 latency (target: < 500ms)
- Time to first byte (TTFB)

BUSINESS
────────
- Assets created per day
- Verification completion rate
- Active organizations
- API calls per hour
```

### 12.2 Logging Strategy

```typescript
// Structured logging format
{
  "timestamp": "2024-12-12T18:00:00Z",
  "level": "info",
  "message": "Asset verified",
  "context": {
    "assetId": "ast_123",
    "organizationId": "org_456",
    "userId": "usr_789",
    "duration_ms": 150
  },
  "trace_id": "trace_abc123"
}
```

### 12.3 Alerting Rules

```
CRITICAL (Page immediately)
───────────────────────────
- Error rate > 5% for 5 minutes
- P99 latency > 5s for 5 minutes
- Database connection failures
- Auth service unavailable

WARNING (Notify during business hours)
──────────────────────────────────────
- Error rate > 1% for 15 minutes
- P99 latency > 2s for 15 minutes
- Disk usage > 80%
- Queue depth > 1000
```

---

## 13. DISASTER RECOVERY

### 13.1 Backup Strategy

```
DATABASE
────────
- Continuous WAL archiving
- Daily full backups (retained 30 days)
- Point-in-time recovery capability
- Cross-region replication

FILE STORAGE
────────────
- S3 versioning enabled
- Cross-region replication
- 90-day retention for deleted files

CONFIGURATION
─────────────
- Infrastructure as Code (Terraform)
- Secrets in vault (not in repo)
- Environment configs versioned
```

### 13.2 Recovery Procedures

```
SCENARIO: Database corruption
─────────────────────────────
1. Identify corruption timestamp
2. Provision new database instance
3. Restore from backup to point before corruption
4. Verify data integrity
5. Update connection strings
6. Resume traffic

RTO: 1 hour
RPO: 5 minutes
```

### 13.3 Incident Response

```
SEVERITY 1 (Critical)
─────────────────────
- Complete service outage
- Data breach
- Response: Immediate (< 15 min)
- Escalation: Engineering lead + Security

SEVERITY 2 (High)
─────────────────
- Partial outage
- Significant performance degradation
- Response: < 30 min
- Escalation: On-call engineer

SEVERITY 3 (Medium)
───────────────────
- Minor feature broken
- Non-critical errors
- Response: < 4 hours
- Escalation: Team queue

SEVERITY 4 (Low)
────────────────
- Cosmetic issues
- Documentation errors
- Response: Next sprint
- Escalation: Backlog
```

---

## 14. APPENDICES

### A. Glossary

| Term | Definition |
|------|------------|
| **Dead Capital** | Unverified assets that cannot be traded or used as collateral |
| **Live Capital** | Verified assets with provenance that can be traded |
| **Provenance** | Complete chain of custody and ownership history |
| **PROVENIQ_DNA** | Canonical configuration defining the 8-node ecosystem |
| **Tenant** | An organization using the platform |
| **RBAC** | Role-Based Access Control |

### B. Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid credentials |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### C. API Versioning

```
Current: v1
Deprecation policy: 12 months notice
Breaking changes: Major version bump only
```

### D. Compliance

| Standard | Status |
|----------|--------|
| GDPR | Compliant |
| SOC 2 Type II | In progress |
| ISO 27001 | Planned |

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 2024 | Proveniq Engineering | Initial release |

---

**END OF TECHNICAL MANUAL**
