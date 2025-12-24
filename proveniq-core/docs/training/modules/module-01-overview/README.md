# Module 1: Platform Architecture & Overview

## 🎯 Learning Objectives

By the end of this module, you will be able to:

1. Explain the role of Proveniq Core in the application ecosystem
2. Navigate the project structure and understand file conventions
3. Describe the technology stack and justify architectural decisions
4. Set up a local development environment from scratch
5. Understand the database schema and Prisma ORM usage
6. Configure environment variables for different deployment scenarios

## ⏱️ Duration: 4 hours

---

## Lesson 1.1: Introduction to Proveniq Core

### What is Proveniq Core?

Proveniq Core is the **foundational infrastructure platform** that powers every application in the Proveniq ecosystem. It provides:

- **Unified Authentication**: Single sign-on across all applications
- **Multi-Tenancy**: Organization-based data isolation
- **Access Control**: Role-based permissions system
- **Asset Management**: Core data models for tracking assets
- **Verification Engine**: Workflow for asset verification
- **Document Vault**: Secure document storage and management
- **API Gateway**: REST and GraphQL APIs for integrations
- **Analytics**: Event tracking and performance monitoring
- **Compliance**: Audit logging and GDPR compliance tools

### Why a Core Platform?

```
┌─────────────────────────────────────────────────────────────┐
│                    PROVENIQ ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │  App A   │  │  App B   │  │  App C   │  │  App D   │   │
│   │(Consumer)│  │(Business)│  │(Internal)│  │ (Partner)│   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │             │             │             │          │
│        └─────────────┴──────┬──────┴─────────────┘          │
│                             │                                │
│                    ┌────────▼────────┐                      │
│                    │  PROVENIQ CORE  │                      │
│                    │                 │                      │
│                    │ • Authentication│                      │
│                    │ • Multi-Tenancy │                      │
│                    │ • RBAC          │                      │
│                    │ • Assets        │                      │
│                    │ • Verifications │                      │
│                    │ • Documents     │                      │
│                    │ • APIs          │                      │
│                    │ • Analytics     │                      │
│                    └────────┬────────┘                      │
│                             │                                │
│                    ┌────────▼────────┐                      │
│                    │   PostgreSQL    │                      │
│                    │   (AWS RDS)     │                      │
│                    └─────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Benefits of Centralized Core

| Benefit | Description |
|---------|-------------|
| **Consistency** | All apps share the same authentication, permissions, and data models |
| **Efficiency** | Build features once, use everywhere |
| **Security** | Single point for security updates and auditing |
| **Scalability** | Optimize one platform instead of many |
| **Compliance** | Centralized audit logs and data governance |

### Knowledge Check 1.1

1. What is the primary purpose of Proveniq Core?
2. Name three key features provided by the platform.
3. Why is centralized authentication beneficial for a multi-app ecosystem?

---

## Lesson 1.2: Technology Stack Deep Dive

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | React framework with App Router |
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Framer Motion** | 11.x | Animation library |
| **Lucide React** | Latest | Icon library |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.x | Serverless API endpoints |
| **Prisma** | 7.x | Database ORM |
| **NextAuth.js** | 4.x | Authentication |
| **GraphQL Yoga** | Latest | GraphQL server |

### Database & Infrastructure

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database (AWS RDS) |
| **Redis** | Session storage, caching (optional) |
| **AWS S3** | Document storage |
| **Vercel/AWS** | Deployment platform |

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "@prisma/client": "^7.0.0",
    "next-auth": "^4.24.0",
    "graphql-yoga": "^5.0.0",
    "framer-motion": "^11.0.0",
    "sonner": "^1.0.0",
    "web-vitals": "^4.0.0"
  }
}
```

### Why These Choices?

**Next.js 15 with App Router**
- Server Components for better performance
- Built-in API routes eliminate need for separate backend
- Excellent TypeScript support
- Vercel deployment optimization

**Prisma 7**
- Type-safe database queries
- Automatic migrations
- Excellent PostgreSQL support
- Schema-first development

**NextAuth.js**
- Battle-tested authentication
- Multiple provider support
- Session management built-in
- Easy to extend

### Knowledge Check 1.2

1. What is the primary database used by Proveniq Core?
2. Why was Next.js App Router chosen over Pages Router?
3. What role does Prisma play in the architecture?

---

## Lesson 1.3: Project Structure & Conventions

### Directory Structure

```
proveniq-core/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth-related routes (grouped)
│   ├── admin/               # Admin dashboard pages
│   ├── api/                 # API routes
│   │   ├── analytics/       # Analytics endpoints
│   │   ├── api-keys/        # API key management
│   │   ├── audit/           # Audit log endpoints
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── compliance/      # GDPR/compliance endpoints
│   │   ├── dashboard/       # Dashboard data endpoints
│   │   ├── errors/          # Error tracking endpoint
│   │   ├── esign/           # E-signature endpoints
│   │   ├── events/          # SSE real-time endpoint
│   │   ├── graphql/         # GraphQL endpoint
│   │   ├── reports/         # Report generation
│   │   └── webhooks/        # Webhook receivers
│   ├── dashboard/           # Main dashboard
│   ├── reports/             # Report builder UI
│   └── settings/            # User settings pages
│
├── components/              # React components
│   ├── providers/           # Context providers
│   ├── skeletons/           # Loading skeletons
│   └── [Component].tsx      # Individual components
│
├── graphql/                 # GraphQL schema & resolvers
│   ├── schema.graphql       # Type definitions
│   └── resolvers/           # Query/mutation resolvers
│
├── lib/                     # Core business logic
│   ├── analytics/           # Analytics utilities
│   ├── api/                 # API utilities
│   ├── apiKeys/             # API key management
│   ├── compliance/          # GDPR/compliance logic
│   ├── errors/              # Error tracking
│   ├── esign/               # E-signature integration
│   ├── i18n/                # Internationalization
│   ├── rbac/                # Role-based access control
│   ├── realtime/            # WebSocket/SSE utilities
│   ├── reports/             # Report generation
│   ├── search/              # Search functionality
│   ├── security/            # Security utilities
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client
│   └── utils.ts             # General utilities
│
├── messages/                # i18n translation files
│   ├── en.json
│   ├── es.json
│   └── ...
│
├── prisma/                  # Database schema
│   └── schema.prisma        # Prisma schema definition
│
├── docs/                    # Documentation
│   └── training/            # Training materials
│
└── public/                  # Static assets
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `UserProfile.tsx` |
| **Utilities** | camelCase | `formatDate.ts` |
| **API Routes** | kebab-case | `api-keys/route.ts` |
| **Database Models** | PascalCase | `Organization` |
| **Environment Variables** | SCREAMING_SNAKE | `DATABASE_URL` |

### File Organization Rules

1. **Components**: One component per file, named after the component
2. **API Routes**: Use `route.ts` for HTTP handlers
3. **Utilities**: Group related functions in domain folders
4. **Types**: Co-locate with usage or in `types/` folder

### Import Aliases

```typescript
// Use @ alias for absolute imports
import { db } from "@/lib/db";
import { Button } from "@/components/Button";
import { hasPermission } from "@/lib/rbac/roles";
```

### Knowledge Check 1.3

1. Where are API routes located in the project structure?
2. What naming convention is used for React components?
3. How do you import from the lib folder using aliases?

---

## Lesson 1.4: Database Schema & Prisma

### Core Data Models

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐     ┌─────────────────┐     ┌──────────────┐ │
│  │   User   │────▶│ OrganizationMember│◀────│ Organization │ │
│  └────┬─────┘     └─────────────────┘     └──────┬───────┘ │
│       │                                          │          │
│       │           ┌─────────────────┐            │          │
│       ├──────────▶│     ApiKey      │◀───────────┤          │
│       │           └─────────────────┘            │          │
│       │                                          │          │
│       │           ┌─────────────────┐            │          │
│       ├──────────▶│    AuditLog     │◀───────────┤          │
│       │           └─────────────────┘            │          │
│       │                                          │          │
│       │           ┌─────────────────┐            │          │
│       └──────────▶│    Document     │◀───────────┤          │
│                   └─────────────────┘            │          │
│                                                  │          │
│                   ┌─────────────────┐            │          │
│                   │      Asset      │◀───────────┤          │
│                   └────────┬────────┘            │          │
│                            │                     │          │
│                   ┌────────▼────────┐            │          │
│                   │  Verification   │            │          │
│                   └─────────────────┘            │          │
│                                                  │          │
│                   ┌─────────────────┐            │          │
│                   │     Webhook     │◀───────────┘          │
│                   └─────────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Models Explained

**User**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(USER)
  organizations OrganizationMember[]
  apiKeys       ApiKey[]
  auditLogs     AuditLog[]
}

enum Role {
  USER
  ADMIN
  AUDITOR
  INVESTOR
}
```

**Organization (Multi-Tenancy)**
```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  members   OrganizationMember[]
  assets    Asset[]
  apiKeys   ApiKey[]
  auditLogs AuditLog[]
}

model OrganizationMember {
  userId         String
  organizationId String
  role           OrgRole @default(MEMBER)
  
  @@unique([userId, organizationId])
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

**Asset & Verification**
```prisma
model Asset {
  id             String       @id @default(cuid())
  name           String
  category       String
  status         AssetStatus  @default(PENDING)
  organizationId String
  verifications  Verification[]
}

model Verification {
  id          String             @id @default(cuid())
  assetId     String
  type        VerificationType
  status      VerificationStatus @default(PENDING)
  confidence  Float?
}
```

### Prisma Client Usage

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

### Common Queries

```typescript
// Find user with organizations
const user = await db.user.findUnique({
  where: { id: userId },
  include: {
    organizations: {
      include: { organization: true }
    }
  }
});

// Create asset with organization check
const asset = await db.asset.create({
  data: {
    name: "New Asset",
    category: "equipment",
    organizationId: orgId,
  }
});

// Paginated query
const assets = await db.asset.findMany({
  where: { organizationId },
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: "desc" }
});
```

### Knowledge Check 1.4

1. What is the relationship between User and Organization?
2. How does the Asset model relate to Verification?
3. Why is the Prisma client instantiated as a singleton?

---

## Lesson 1.5: Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Analytics (optional)
SEGMENT_WRITE_KEY=""
MIXPANEL_TOKEN=""
SENTRY_DSN=""

# E-Signature (optional)
DOCUSIGN_INTEGRATION_KEY=""
DOCUSIGN_USER_ID=""
DOCUSIGN_ACCOUNT_ID=""

# Compliance
COMPLIANCE_GDPR_ENABLED="true"
COMPLIANCE_SOC2_ENABLED="true"
```

### Environment Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env` | Local development | No |
| `.env.example` | Template for developers | Yes |
| `.env.local` | Local overrides | No |
| `.env.production` | Production values | No |

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets** regularly
4. **Use secret managers** in production (AWS Secrets Manager, Vault)

### Validating Configuration

```typescript
// lib/config.ts
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}
```

### Knowledge Check 1.5

1. Which environment variables are required for the app to run?
2. Why should `.env` files not be committed to Git?
3. How would you add a new OAuth provider?

---

## 🔬 Lab 1: Setting Up a Development Environment

### Objective
Set up a complete local development environment for Proveniq Core.

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running locally or accessible
- Git installed

### Steps

#### Step 1: Clone the Repository
```bash
git clone https://github.com/proveniq/proveniq-core.git
cd proveniq-core
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

#### Step 4: Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data (if available)
npx prisma db seed
```

#### Step 5: Start Development Server
```bash
npm run dev
```

#### Step 6: Verify Installation
- Open http://localhost:3000
- Check that the homepage loads
- Verify database connection in logs

### Verification Checklist

- [ ] All dependencies installed without errors
- [ ] Database connection successful
- [ ] Prisma migrations applied
- [ ] Development server running
- [ ] Homepage accessible in browser
- [ ] No TypeScript errors (`npx tsc --noEmit`)

### Troubleshooting

**Database Connection Failed**
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Ensure database exists

**Prisma Errors**
- Run `npx prisma generate` after schema changes
- Clear `.prisma` folder and regenerate

**Port Already in Use**
- Kill process on port 3000
- Or use `npm run dev -- -p 3001`

---

## 📝 Module 1 Assessment

Complete the following to finish Module 1:

1. **Knowledge Test** (20 questions, 70% to pass)
2. **Lab Completion** (verified by checklist)
3. **Short Answer Questions**:
   - Explain the role of Proveniq Core in the ecosystem
   - Describe the multi-tenancy model
   - List the key technologies and their purposes

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Next Module**: [Module 2: Authentication & Security](../module-02-security/README.md)
