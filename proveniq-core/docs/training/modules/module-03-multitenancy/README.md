# Module 3: Multi-Tenancy & Access Control

## 🎯 Learning Objectives

By the end of this module, you will be able to:

1. Design and implement multi-tenant data architectures
2. Configure role-based access control (RBAC) systems
3. Implement organization-level permissions
4. Build data isolation patterns that prevent cross-tenant access
5. Create comprehensive audit logging for compliance
6. Handle complex permission scenarios across organizations

## ⏱️ Duration: 5 hours

---

## Lesson 3.1: Organization Model & Structure

### Multi-Tenancy Architecture

Proveniq Core uses **Organization-based multi-tenancy** where:
- Each organization is a separate tenant
- Users can belong to multiple organizations
- Data is isolated by `organizationId` foreign keys
- Permissions are scoped to organization membership

```
┌─────────────────────────────────────────────────────────────┐
│                 MULTI-TENANCY MODEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                      USER                             │   │
│  │  • Can belong to multiple organizations               │   │
│  │  • Has global role (USER, ADMIN, AUDITOR, INVESTOR)  │   │
│  │  • Has per-organization role (OWNER, ADMIN, etc.)    │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│           ┌─────────────┼─────────────┐                     │
│           │             │             │                      │
│           ▼             ▼             ▼                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │   Org A    │ │   Org B    │ │   Org C    │              │
│  │            │ │            │ │            │              │
│  │ Role:OWNER │ │ Role:MEMBER│ │ Role:VIEWER│              │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │
│        │              │              │                      │
│        ▼              ▼              ▼                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ Assets   │   │ Assets   │   │ Assets   │               │
│  │ Docs     │   │ Docs     │   │ Docs     │               │
│  │ API Keys │   │ API Keys │   │ API Keys │               │
│  │ Webhooks │   │ Webhooks │   │ Webhooks │               │
│  └──────────┘   └──────────┘   └──────────┘               │
│                                                              │
│  DATA IS COMPLETELY ISOLATED BETWEEN ORGANIZATIONS          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Organization Schema

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique  // URL-friendly identifier
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Related data - all scoped to this organization
  members   OrganizationMember[]
  apiKeys   ApiKey[]
  assets    Asset[]
  auditLogs AuditLog[]
  webhooks  Webhook[]
  documents Document[]
  
  @@map("organizations")
}

model OrganizationMember {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           OrgRole      @default(MEMBER)
  
  createdAt      DateTime     @default(now())
  
  user           User         @relation(...)
  organization   Organization @relation(...)
  
  @@unique([userId, organizationId])  // One membership per user per org
  @@map("organization_members")
}

enum OrgRole {
  OWNER   // Full control, can delete organization
  ADMIN   // Manage members, settings, all data
  MEMBER  // Create and manage own data
  VIEWER  // Read-only access
}
```

### Creating Organizations

```typescript
// lib/organizations.ts
export async function createOrganization(
  name: string,
  slug: string,
  ownerId: string
): Promise<Organization> {
  // Validate slug uniqueness
  const existing = await db.organization.findUnique({
    where: { slug },
  });
  
  if (existing) {
    throw new Error("Organization slug already exists");
  }
  
  // Create organization with owner
  const organization = await db.organization.create({
    data: {
      name,
      slug,
      members: {
        create: {
          userId: ownerId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: true,
    },
  });
  
  // Log creation
  await db.auditLog.create({
    data: {
      action: "organization.created",
      entityType: "organization",
      entityId: organization.id,
      userId: ownerId,
      organizationId: organization.id,
    },
  });
  
  return organization;
}
```

### Switching Organizations

```typescript
// Context for current organization
interface OrganizationContext {
  organizationId: string;
  organizationSlug: string;
  userRole: OrgRole;
}

// Get organization from URL or session
export async function getOrganizationContext(
  userId: string,
  slugOrId: string
): Promise<OrganizationContext | null> {
  const membership = await db.organizationMember.findFirst({
    where: {
      userId,
      organization: {
        OR: [
          { id: slugOrId },
          { slug: slugOrId },
        ],
      },
    },
    include: {
      organization: true,
    },
  });
  
  if (!membership) return null;
  
  return {
    organizationId: membership.organizationId,
    organizationSlug: membership.organization.slug,
    userRole: membership.role,
  };
}
```

### Knowledge Check 3.1

1. What is the relationship between User and Organization?
2. Why is the `slug` field unique on Organization?
3. What role is assigned to the user who creates an organization?

---

## Lesson 3.2: Role-Based Access Control (RBAC)

### RBAC Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC HIERARCHY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GLOBAL ROLES (User.role)                                   │
│  ├── ADMIN     → Full platform access                       │
│  ├── AUDITOR   → Read-only audit access                     │
│  ├── INVESTOR  → Limited financial views                    │
│  └── USER      → Standard user (default)                    │
│                                                              │
│  ORGANIZATION ROLES (OrganizationMember.role)               │
│  ├── OWNER     → Full organization control                  │
│  ├── ADMIN     → Manage members and settings                │
│  ├── MEMBER    → Create and manage data                     │
│  └── VIEWER    → Read-only access                           │
│                                                              │
│  PERMISSION CHECK FLOW:                                      │
│  1. Check global role first (ADMIN bypasses all)            │
│  2. Check organization membership                            │
│  3. Check organization role permissions                      │
│  4. Check resource-specific permissions                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Permission Definitions

```typescript
// lib/rbac/roles.ts
export type Role = "USER" | "ADMIN" | "AUDITOR" | "INVESTOR";
export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "organizations:read"
  | "organizations:write"
  | "organizations:delete"
  | "assets:read"
  | "assets:write"
  | "assets:delete"
  | "verifications:read"
  | "verifications:write"
  | "documents:read"
  | "documents:write"
  | "documents:delete"
  | "api-keys:read"
  | "api-keys:write"
  | "webhooks:read"
  | "webhooks:write"
  | "audit:read"
  | "settings:read"
  | "settings:write"
  | "members:read"
  | "members:write"
  | "members:delete";

// Global role permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ["*"], // All permissions
  AUDITOR: [
    "users:read",
    "organizations:read",
    "assets:read",
    "verifications:read",
    "documents:read",
    "audit:read",
  ],
  INVESTOR: [
    "organizations:read",
    "assets:read",
    "verifications:read",
  ],
  USER: [], // Permissions come from org membership
};

// Organization role permissions
export const ORG_ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  OWNER: [
    "organizations:read",
    "organizations:write",
    "organizations:delete",
    "assets:read",
    "assets:write",
    "assets:delete",
    "verifications:read",
    "verifications:write",
    "documents:read",
    "documents:write",
    "documents:delete",
    "api-keys:read",
    "api-keys:write",
    "webhooks:read",
    "webhooks:write",
    "settings:read",
    "settings:write",
    "members:read",
    "members:write",
    "members:delete",
    "audit:read",
  ],
  ADMIN: [
    "organizations:read",
    "organizations:write",
    "assets:read",
    "assets:write",
    "assets:delete",
    "verifications:read",
    "verifications:write",
    "documents:read",
    "documents:write",
    "documents:delete",
    "api-keys:read",
    "api-keys:write",
    "webhooks:read",
    "webhooks:write",
    "settings:read",
    "settings:write",
    "members:read",
    "members:write",
    "audit:read",
  ],
  MEMBER: [
    "organizations:read",
    "assets:read",
    "assets:write",
    "verifications:read",
    "verifications:write",
    "documents:read",
    "documents:write",
    "api-keys:read",
    "webhooks:read",
    "settings:read",
  ],
  VIEWER: [
    "organizations:read",
    "assets:read",
    "verifications:read",
    "documents:read",
    "settings:read",
  ],
};
```

### Permission Checking

```typescript
// lib/rbac/roles.ts
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  
  // Admin has all permissions
  if (permissions.includes("*")) return true;
  
  return permissions.includes(permission);
}

export function hasOrgPermission(
  orgRole: OrgRole,
  permission: Permission
): boolean {
  return ORG_ROLE_PERMISSIONS[orgRole].includes(permission);
}

// Combined check
export async function canPerformAction(
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  // Get user with membership
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      organizations: {
        where: { organizationId },
      },
    },
  });
  
  if (!user) return false;
  
  // Check global role first
  if (hasPermission(user.role, permission)) {
    return true;
  }
  
  // Check organization role
  const membership = user.organizations[0];
  if (!membership) return false;
  
  return hasOrgPermission(membership.role, permission);
}
```

### Using Permission Guards

```typescript
// lib/rbac/guards.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canPerformAction } from "./roles";

export async function requirePermission(
  organizationId: string,
  permission: Permission
): Promise<{ userId: string; organizationId: string }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }
  
  const allowed = await canPerformAction(
    session.user.id,
    organizationId,
    permission
  );
  
  if (!allowed) {
    throw new Error("Permission denied");
  }
  
  return {
    userId: session.user.id,
    organizationId,
  };
}

// Usage in API route
export async function POST(req: NextRequest) {
  const { organizationId, ...data } = await req.json();
  
  // This will throw if not authorized
  const { userId } = await requirePermission(
    organizationId,
    "assets:write"
  );
  
  // Proceed with creating asset
  const asset = await db.asset.create({
    data: {
      ...data,
      organizationId,
    },
  });
  
  return NextResponse.json({ asset });
}
```

### Knowledge Check 3.2

1. What is the difference between global roles and organization roles?
2. Which role has the `*` (all) permission?
3. How do you check if a user can perform an action in an organization?

---

## Lesson 3.3: Permission System Design

### Permission Granularity Levels

```
┌─────────────────────────────────────────────────────────────┐
│              PERMISSION GRANULARITY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: RESOURCE TYPE                                      │
│  └── assets:read, documents:write, etc.                     │
│                                                              │
│  Level 2: RESOURCE INSTANCE                                  │
│  └── Can user access THIS specific asset?                   │
│                                                              │
│  Level 3: FIELD LEVEL                                        │
│  └── Can user see/edit specific fields?                     │
│                                                              │
│  Level 4: ACTION CONTEXT                                     │
│  └── Can user perform action in this context?               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Resource-Level Permissions

```typescript
// Check if user can access specific resource
export async function canAccessAsset(
  userId: string,
  assetId: string
): Promise<boolean> {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { organizationId: true },
  });
  
  if (!asset) return false;
  
  return canPerformAction(userId, asset.organizationId, "assets:read");
}

// Middleware pattern for resource access
export function withResourceAccess<T extends { organizationId: string }>(
  permission: Permission
) {
  return async (
    userId: string,
    resource: T
  ): Promise<boolean> => {
    return canPerformAction(userId, resource.organizationId, permission);
  };
}
```

### Field-Level Permissions

```typescript
// Define sensitive fields per resource
const SENSITIVE_FIELDS = {
  asset: ["value", "internalNotes", "costBasis"],
  user: ["passwordHash", "twoFactorSecret", "backupCodes"],
  organization: ["billingDetails", "apiSecrets"],
};

// Filter response based on permissions
export function filterSensitiveFields<T extends Record<string, any>>(
  data: T,
  resourceType: keyof typeof SENSITIVE_FIELDS,
  canViewSensitive: boolean
): Partial<T> {
  if (canViewSensitive) return data;
  
  const sensitiveFields = SENSITIVE_FIELDS[resourceType];
  const filtered = { ...data };
  
  for (const field of sensitiveFields) {
    delete filtered[field];
  }
  
  return filtered;
}

// Usage
const asset = await db.asset.findUnique({ where: { id } });
const canViewSensitive = await hasOrgPermission(userOrgRole, "assets:sensitive");
const safeAsset = filterSensitiveFields(asset, "asset", canViewSensitive);
```

### Permission Inheritance

```typescript
// Permission hierarchy
const PERMISSION_HIERARCHY: Record<Permission, Permission[]> = {
  "assets:delete": ["assets:write", "assets:read"],
  "assets:write": ["assets:read"],
  "documents:delete": ["documents:write", "documents:read"],
  "documents:write": ["documents:read"],
  "members:delete": ["members:write", "members:read"],
  "members:write": ["members:read"],
};

// Check with inheritance
export function hasPermissionWithInheritance(
  permissions: Permission[],
  required: Permission
): boolean {
  if (permissions.includes(required)) return true;
  
  // Check if any permission implies the required one
  for (const perm of permissions) {
    const implied = PERMISSION_HIERARCHY[perm] || [];
    if (implied.includes(required)) return true;
  }
  
  return false;
}
```

### Knowledge Check 3.3

1. What are the four levels of permission granularity?
2. How do you implement field-level permissions?
3. What is permission inheritance and why is it useful?

---

## Lesson 3.4: Data Isolation Patterns

### Query Scoping

**CRITICAL**: Every database query must be scoped to the organization.

```typescript
// ❌ WRONG - No organization scope
const assets = await db.asset.findMany();

// ✅ CORRECT - Scoped to organization
const assets = await db.asset.findMany({
  where: { organizationId },
});

// ✅ BETTER - Use a scoped query builder
const assets = await scopedQuery(db.asset, organizationId).findMany();
```

### Scoped Query Builder

```typescript
// lib/db/scoped.ts
import { Prisma } from "@prisma/client";

type ModelWithOrgId = {
  organizationId: string;
};

export function scopedQuery<T extends ModelWithOrgId>(
  model: any,
  organizationId: string
) {
  return {
    findMany: (args?: any) =>
      model.findMany({
        ...args,
        where: {
          ...args?.where,
          organizationId,
        },
      }),
    
    findFirst: (args?: any) =>
      model.findFirst({
        ...args,
        where: {
          ...args?.where,
          organizationId,
        },
      }),
    
    findUnique: async (args: any) => {
      const result = await model.findUnique(args);
      if (result && result.organizationId !== organizationId) {
        return null; // Don't return if wrong org
      }
      return result;
    },
    
    create: (args: any) =>
      model.create({
        ...args,
        data: {
          ...args.data,
          organizationId,
        },
      }),
    
    update: async (args: any) => {
      // Verify ownership before update
      const existing = await model.findUnique({
        where: args.where,
        select: { organizationId: true },
      });
      
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error("Resource not found or access denied");
      }
      
      return model.update(args);
    },
    
    delete: async (args: any) => {
      // Verify ownership before delete
      const existing = await model.findUnique({
        where: args.where,
        select: { organizationId: true },
      });
      
      if (!existing || existing.organizationId !== organizationId) {
        throw new Error("Resource not found or access denied");
      }
      
      return model.delete(args);
    },
  };
}
```

### Middleware-Based Isolation

```typescript
// Prisma middleware for automatic scoping
db.$use(async (params, next) => {
  // Get organization context from async local storage
  const orgContext = getOrganizationContext();
  
  if (!orgContext) {
    return next(params);
  }
  
  const modelsWithOrgId = [
    "Asset",
    "Verification",
    "Document",
    "ApiKey",
    "Webhook",
    "AuditLog",
  ];
  
  if (modelsWithOrgId.includes(params.model || "")) {
    // Add organization filter to reads
    if (["findMany", "findFirst", "count"].includes(params.action)) {
      params.args.where = {
        ...params.args.where,
        organizationId: orgContext.organizationId,
      };
    }
    
    // Add organization to creates
    if (params.action === "create") {
      params.args.data.organizationId = orgContext.organizationId;
    }
  }
  
  return next(params);
});
```

### Cross-Organization Access Prevention

```typescript
// Validate all IDs belong to same organization
export async function validateResourceOwnership(
  organizationId: string,
  resources: { model: string; id: string }[]
): Promise<boolean> {
  for (const resource of resources) {
    const model = db[resource.model as keyof typeof db] as any;
    
    const item = await model.findUnique({
      where: { id: resource.id },
      select: { organizationId: true },
    });
    
    if (!item || item.organizationId !== organizationId) {
      return false;
    }
  }
  
  return true;
}

// Usage in API
export async function POST(req: NextRequest) {
  const { organizationId, assetId, documentIds } = await req.json();
  
  // Validate all resources belong to the organization
  const valid = await validateResourceOwnership(organizationId, [
    { model: "asset", id: assetId },
    ...documentIds.map((id: string) => ({ model: "document", id })),
  ]);
  
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid resource references" },
      { status: 400 }
    );
  }
  
  // Proceed with operation
}
```

### Knowledge Check 3.4

1. Why must every query be scoped to an organization?
2. How does the scoped query builder prevent cross-tenant access?
3. What is the purpose of `validateResourceOwnership`?

---

## Lesson 3.5: Audit Logging & Compliance

### Audit Log Schema

```prisma
model AuditLog {
  id             String       @id @default(cuid())
  action         String       // e.g., "asset.created", "user.login"
  entityType     String       // e.g., "asset", "user", "organization"
  entityId       String?      // ID of affected entity
  metadata       Json?        // Additional context
  ipAddress      String?
  userAgent      String?
  
  userId         String?      // Who performed the action
  organizationId String?      // Which organization context
  
  createdAt      DateTime     @default(now())
  
  user           User?        @relation(...)
  organization   Organization? @relation(...)
  
  @@index([entityType, entityId])
  @@index([userId, createdAt])
  @@index([organizationId, createdAt])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

### Audit Logger Implementation

```typescript
// lib/audit.ts
import { db } from "@/lib/db";
import { headers } from "next/headers";

export interface AuditLogInput {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const headersList = headers();
  
  await db.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as any,
      userId: input.userId,
      organizationId: input.organizationId,
      ipAddress: headersList.get("x-forwarded-for") || 
                 headersList.get("x-real-ip"),
      userAgent: headersList.get("user-agent"),
    },
  });
}

// Convenience functions for common actions
export const audit = {
  userLogin: (userId: string, metadata?: Record<string, unknown>) =>
    createAuditLog({
      action: "user.login",
      entityType: "user",
      entityId: userId,
      userId,
      metadata,
    }),
  
  userLogout: (userId: string) =>
    createAuditLog({
      action: "user.logout",
      entityType: "user",
      entityId: userId,
      userId,
    }),
  
  assetCreated: (
    asset: { id: string; organizationId: string },
    userId: string
  ) =>
    createAuditLog({
      action: "asset.created",
      entityType: "asset",
      entityId: asset.id,
      userId,
      organizationId: asset.organizationId,
    }),
  
  assetUpdated: (
    asset: { id: string; organizationId: string },
    userId: string,
    changes: Record<string, unknown>
  ) =>
    createAuditLog({
      action: "asset.updated",
      entityType: "asset",
      entityId: asset.id,
      userId,
      organizationId: asset.organizationId,
      metadata: { changes },
    }),
  
  assetDeleted: (
    assetId: string,
    organizationId: string,
    userId: string
  ) =>
    createAuditLog({
      action: "asset.deleted",
      entityType: "asset",
      entityId: assetId,
      userId,
      organizationId,
    }),
  
  permissionDenied: (
    userId: string,
    resource: string,
    action: string
  ) =>
    createAuditLog({
      action: "permission.denied",
      entityType: "security",
      userId,
      metadata: { resource, attemptedAction: action },
    }),
};
```

### Querying Audit Logs

```typescript
// lib/audit/query.ts
export interface AuditLogQuery {
  organizationId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(query: AuditLogQuery) {
  const where: any = {};
  
  if (query.organizationId) {
    where.organizationId = query.organizationId;
  }
  if (query.userId) {
    where.userId = query.userId;
  }
  if (query.entityType) {
    where.entityType = query.entityType;
  }
  if (query.entityId) {
    where.entityId = query.entityId;
  }
  if (query.action) {
    where.action = { contains: query.action };
  }
  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) where.createdAt.gte = query.startDate;
    if (query.endDate) where.createdAt.lte = query.endDate;
  }
  
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: query.limit || 50,
      skip: query.offset || 0,
    }),
    db.auditLog.count({ where }),
  ]);
  
  return { logs, total };
}
```

### Compliance Reporting

```typescript
// Generate compliance report
export async function generateComplianceReport(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const logs = await db.auditLog.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  
  // Group by action type
  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Identify security events
  const securityEvents = logs.filter(
    (log) =>
      log.action.includes("permission.denied") ||
      log.action.includes("login.failed") ||
      log.action.includes("2fa")
  );
  
  // Data access summary
  const dataAccess = logs.filter(
    (log) =>
      log.action.includes("read") ||
      log.action.includes("export") ||
      log.action.includes("download")
  );
  
  return {
    period: { startDate, endDate },
    totalEvents: logs.length,
    actionCounts,
    securityEvents: securityEvents.length,
    dataAccessEvents: dataAccess.length,
    uniqueUsers: new Set(logs.map((l) => l.userId)).size,
    logs, // Full log for detailed review
  };
}
```

### Knowledge Check 3.5

1. What information should be captured in an audit log?
2. Why are indexes important on the AuditLog table?
3. What types of events should be flagged as security events?

---

## 🔬 Lab 3: Building a Multi-Tenant Feature

### Objective
Build a complete multi-tenant feature with proper isolation and permissions.

### Requirements
1. Create a "Projects" feature scoped to organizations
2. Implement CRUD operations with permission checks
3. Add audit logging for all operations
4. Prevent cross-organization access

### Steps

#### Step 1: Add Project Model
```prisma
model Project {
  id             String       @id @default(cuid())
  name           String
  description    String?
  status         ProjectStatus @default(ACTIVE)
  organizationId String
  createdById    String
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  organization   Organization @relation(...)
  createdBy      User         @relation(...)
  
  @@map("projects")
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}
```

#### Step 2: Create API Routes
```typescript
// app/api/projects/route.ts
// Implement GET (list) and POST (create) with permission checks
```

#### Step 3: Add Audit Logging
```typescript
// Log all project operations
```

#### Step 4: Build UI Components
```typescript
// Create ProjectList and ProjectForm components
```

### Verification Checklist

- [ ] Projects are scoped to organizations
- [ ] Users can only see their organization's projects
- [ ] Permission checks prevent unauthorized access
- [ ] All operations are audit logged
- [ ] Cross-organization access is blocked

---

## 📝 Module 3 Assessment

Complete the following to finish Module 3:

1. **Knowledge Test** (25 questions, 70% to pass)
2. **Lab Completion** (verified by checklist)
3. **Security Review**: Identify potential data isolation issues in sample code

---

**Next Module**: [Module 4: Core Features & Data Models](../module-04-features/README.md)
