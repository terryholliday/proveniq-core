# C200: THE IRON GATE
## Security & IAM Track

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ████████╗██╗  ██╗███████╗    ██╗██████╗  ██████╗ ███╗   ██╗                ║
║   ╚══██╔══╝██║  ██║██╔════╝    ██║██╔══██╗██╔═══██╗████╗  ██║                ║
║      ██║   ███████║█████╗      ██║██████╔╝██║   ██║██╔██╗ ██║                ║
║      ██║   ██╔══██║██╔══╝      ██║██╔══██╗██║   ██║██║╚██╗██║                ║
║      ██║   ██║  ██║███████╗    ██║██║  ██║╚██████╔╝██║ ╚████║                ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝                ║
║                                                                              ║
║                            G A T E                                           ║
║                                                                              ║
║   "Security is not a feature. It's the foundation."                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 TRACK OBJECTIVES

By the end of this track, you will be able to:

1. **Breach your own systems** and understand why they failed
2. **Rotate all secrets** with zero downtime
3. **Audit permission escalation** paths and close them
4. **Respond to security incidents** with clinical precision
5. **Explain every security decision** in the codebase

---

## ⏱️ TRACK DURATION: 16 HOURS

| Lesson | Topic | Duration |
|--------|-------|----------|
| 01 | Authentication Internals | 3 hours |
| 02 | Authorization Matrix | 3 hours |
| 03 | Cryptographic Operations | 3 hours |
| 04 | Incident Response | 3 hours |
| LAB-001 | Breach Simulation | 1.5 hours |
| LAB-002 | Key Rotation Drills | 1.5 hours |
| LAB-003 | Permission Escalation | 1 hour |
| EXAM | C200 Assessment | Timed |

---

## ⚠️ SECURITY MINDSET

Before proceeding, internalize this:

```typescript
const SECURITY_AXIOMS = {
  // Trust nothing. Verify everything.
  axiom_1: "All input is hostile until proven otherwise",
  
  // Defense in depth. One layer will fail.
  axiom_2: "Security is layers, not walls",
  
  // Complexity is the enemy of security.
  axiom_3: "Simple systems are secure systems",
  
  // Assume breach. Plan for containment.
  axiom_4: "It's not if, it's when",
  
  // Audit everything. Memory fades, logs don't.
  axiom_5: "If it's not logged, it didn't happen"
} as const;
```

---

## 🔐 THE SECURITY PERIMETER

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY PERIMETER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: EDGE SECURITY                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • DDoS Protection (Vercel/CloudFlare)                               │   │
│  │  • TLS 1.3 Termination                                               │   │
│  │  • Geographic Blocking (if configured)                               │   │
│  │  • Bot Detection                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  LAYER 2: APPLICATION SECURITY      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Rate Limiting (per IP, per user)                                  │   │
│  │  • CORS Policy                                                       │   │
│  │  • CSP Headers                                                       │   │
│  │  • Input Validation (Zod schemas)                                    │   │
│  │  • CSRF Protection (NextAuth)                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  LAYER 3: AUTHENTICATION            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Session Management (JWT/Database)                                 │   │
│  │  • OAuth 2.0 Providers                                               │   │
│  │  • Two-Factor Authentication                                         │   │
│  │  • Password Hashing (bcrypt)                                         │   │
│  │  • Session Expiration                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  LAYER 4: AUTHORIZATION             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Global Role Check (ADMIN, AUDITOR, etc.)                          │   │
│  │  • Organization Membership                                           │   │
│  │  • Organization Role (OWNER, ADMIN, MEMBER, VIEWER)                  │   │
│  │  • Resource-Level Permissions                                        │   │
│  │  • Field-Level Access Control                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  LAYER 5: DATA SECURITY             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Tenant Isolation (organizationId scoping)                         │   │
│  │  • Encryption at Rest (RDS)                                          │   │
│  │  • Encryption in Transit (TLS)                                       │   │
│  │  • Sensitive Field Masking                                           │   │
│  │  • Audit Logging                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 LESSON OVERVIEW

### Lesson 01: Authentication Internals
*File: `01-authentication-internals.md`*

You will learn:
- How NextAuth.js manages sessions
- JWT structure and validation
- OAuth flow security considerations
- Password hashing and verification
- 2FA implementation details

**Key Concept:** Authentication answers "Who are you?"

---

### Lesson 02: Authorization Matrix
*File: `02-authorization-matrix.md`*

You will learn:
- RBAC implementation patterns
- Permission inheritance
- Organization-scoped access
- Resource-level authorization
- The complete permission matrix

**Key Concept:** Authorization answers "What can you do?"

---

### Lesson 03: Cryptographic Operations
*File: `03-cryptographic-operations.md`*

You will learn:
- Secret management
- API key generation and hashing
- Webhook signature verification
- Token generation patterns
- Key rotation procedures

**Key Concept:** Cryptography is easy to use wrong.

---

### Lesson 04: Incident Response
*File: `04-incident-response.md`*

You will learn:
- Security incident classification
- Response procedures
- Evidence preservation
- Communication protocols
- Post-incident analysis

**Key Concept:** Speed and accuracy under pressure.

---

## 🔬 LABS

### LAB-001: Breach Simulation
*File: `labs/LAB-001-breach-simulation.md`*

**Scenario:** You are a malicious actor attempting to access another tenant's data.

**Your Mission:**
1. Attempt to bypass tenant isolation
2. Try to escalate privileges
3. Attempt to access unauthorized resources
4. Document all attack vectors tested
5. Verify each vector is blocked

**Success Criteria:**
- All attack vectors documented
- All attacks blocked by existing controls
- Report on any vulnerabilities found

---

### LAB-002: Key Rotation Drills
*File: `labs/LAB-002-key-rotation.md`*

**Scenario:** A secret has been compromised. Rotate everything.

**Your Mission:**
1. Rotate NEXTAUTH_SECRET with zero downtime
2. Rotate database credentials
3. Invalidate all API keys for an organization
4. Rotate webhook signing secrets
5. Verify no service disruption

**Success Criteria:**
- All secrets rotated
- No user sessions invalidated unexpectedly
- No webhook deliveries failed
- Complete audit trail of rotation

---

### LAB-003: Permission Escalation
*File: `labs/LAB-003-permission-escalation.md`*

**Scenario:** Audit the permission system for escalation paths.

**Your Mission:**
1. Map all permission inheritance paths
2. Identify any circular dependencies
3. Test boundary conditions
4. Verify VIEWER cannot become ADMIN
5. Document the complete authorization flow

**Success Criteria:**
- Complete permission map
- No escalation paths found
- All edge cases tested
- Remediation for any issues found

---

## 📊 ASSESSMENT CRITERIA

The C200 exam tests:

| Category | Weight | Topics |
|----------|--------|--------|
| Authentication Knowledge | 25% | Sessions, tokens, 2FA |
| Authorization Implementation | 30% | RBAC, permissions, isolation |
| Cryptographic Understanding | 20% | Hashing, signing, secrets |
| Incident Response | 25% | Procedures, communication, forensics |

**Passing Score: 95%**

---

## 🚨 SECURITY INCIDENT SIMULATION

At the end of this track, you will face a simulated security incident:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🚨 SECURITY INCIDENT: SEC-2024-001                        │
│                                                              │
│   Severity: SEV-1 (CRITICAL)                                │
│   Status: ACTIVE                                            │
│   Duration: 00:00:00                                        │
│                                                              │
│   Description:                                              │
│   Suspicious API activity detected. Multiple failed         │
│   authentication attempts followed by successful access     │
│   to resources outside normal user patterns.                │
│                                                              │
│   Indicators:                                               │
│   - 500+ failed login attempts from single IP               │
│   - Successful login after attempts                         │
│   - Access to 3 different organizations                     │
│   - Bulk data export initiated                              │
│                                                              │
│   Your Role: Security On-Call                               │
│   Your Task: Contain, investigate, remediate                │
│                                                              │
│   Clock starts now.                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

You will be graded on:
- Time to containment
- Evidence preservation
- Root cause identification
- Communication quality
- Remediation effectiveness

---

## 🔑 KEY SECURITY COMPONENTS

### Files You Must Know

```
lib/
├── auth.ts                    # NextAuth configuration
├── rbac/
│   ├── roles.ts              # Role and permission definitions
│   └── guards.ts             # Authorization guards
├── security/
│   ├── rateLimit.ts          # Rate limiting implementation
│   ├── ipAllowlist.ts        # IP allowlist management
│   └── twoFactor.ts          # 2FA implementation
├── apiKeys.ts                 # API key management
└── audit.ts                   # Audit logging

middleware.ts                  # Request interception
```

### Critical Security Functions

```typescript
// You must understand these functions completely

// Authentication
getServerSession(authOptions)  // Get current user session
verifyTwoFactorToken()         // Validate TOTP code
hashPassword() / verifyPassword() // Password operations

// Authorization
hasPermission(role, permission)     // Global role check
hasOrgPermission(orgRole, permission) // Org role check
requirePermission(orgId, permission)  // Combined guard

// Cryptography
generateApiKey()               // Create new API key
validateApiKey()               // Verify API key
signWebhookPayload()           // Create HMAC signature
verifyWebhookSignature()       // Validate HMAC signature

// Audit
createAuditLog()               // Record security event
```

---

## 📋 CHECKLIST

Before proceeding to the exam:

- [ ] Completed Lesson 01: Authentication Internals
- [ ] Completed Lesson 02: Authorization Matrix
- [ ] Completed Lesson 03: Cryptographic Operations
- [ ] Completed Lesson 04: Incident Response
- [ ] Completed LAB-001: Breach Simulation
- [ ] Completed LAB-002: Key Rotation Drills
- [ ] Completed LAB-003: Permission Escalation
- [ ] Can explain the complete auth flow
- [ ] Can rotate secrets without downtime
- [ ] Can respond to a security incident

---

## 🎯 BEGIN

Start with Lesson 01:

**[→ 01-authentication-internals.md](./01-authentication-internals.md)**

---

*"The gate holds not because it is strong, but because those who guard it never sleep."*

— Antigravity Academy
