# LAB-001: Breach Simulation
## C200: The Iron Gate

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██╗      █████╗ ██████╗        ██████╗  ██████╗  ██╗                       ║
║   ██║     ██╔══██╗██╔══██╗      ██╔═████╗██╔═████╗███║                       ║
║   ██║     ███████║██████╔╝█████╗██║██╔██║██║██╔██║╚██║                       ║
║   ██║     ██╔══██║██╔══██╗╚════╝████╔╝██║████╔╝██║ ██║                       ║
║   ███████╗██║  ██║██████╔╝      ╚██████╔╝╚██████╔╝ ██║                       ║
║   ╚══════╝╚═╝  ╚═╝╚═════╝        ╚═════╝  ╚═════╝  ╚═╝                       ║
║                                                                              ║
║   BREACH SIMULATION                                                          ║
║   "Think like an attacker. Defend like a guardian."                          ║
║                                                                              ║
║   Duration: 90 minutes                                                       ║
║   Difficulty: █████████░ 90%                                                ║
║                                                                              ║
║   ⚠️  WARNING: This lab involves attempting to breach security controls.    ║
║   Only perform these tests in your local development environment.            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 MISSION BRIEFING

**Scenario:** You are a malicious actor who has obtained valid credentials for User A. Your goal is to access data belonging to Organization B, where User A has no membership.

**Your Mission:**
1. Attempt to bypass tenant isolation
2. Try to escalate privileges
3. Attempt to access unauthorized resources
4. Document all attack vectors tested
5. Verify each vector is blocked

**Rules of Engagement:**
- Use only the tools available in the application
- Document every attempt, successful or not
- Do not modify source code during testing
- Report all findings, even partial successes

---

## 📋 PREREQUISITES

Before starting this lab:

- [ ] Two test users created (User A, User B)
- [ ] Two test organizations created (Org A, Org B)
- [ ] User A is member of Org A only
- [ ] User B is member of Org B only
- [ ] Each organization has test assets
- [ ] API testing tool ready (Postman/curl)

### Setup Script

```bash
# Create test data (run in development only)
npm run db:seed:security-lab
```

Or manually create:
- User A: `attacker@test.local` (member of Org A)
- User B: `victim@test.local` (member of Org B)
- Org A: Has 3 assets
- Org B: Has 3 assets (TARGET)

---

## PHASE 1: RECONNAISSANCE (15 minutes)

### Step 1.1: Gather Information

Log in as User A and document:

```
RECONNAISSANCE REPORT
=====================

User A Details:
- User ID: ________________
- Email: ________________
- Global Role: ________________
- Organizations: ________________

Org A Details:
- Organization ID: ________________
- Slug: ________________
- User A's Role: ________________

Target (Org B) Details (from any public source):
- Organization ID: ________________ (if discoverable)
- Slug: ________________ (if discoverable)
```

### Step 1.2: Identify Attack Surface

List all API endpoints you can access:

```
ATTACK SURFACE
==============

Authenticated Endpoints:
[ ] GET  /api/assets
[ ] POST /api/assets
[ ] GET  /api/assets/:id
[ ] PUT  /api/assets/:id
[ ] DELETE /api/assets/:id
[ ] GET  /api/organizations
[ ] GET  /api/organizations/:id
[ ] GET  /api/organizations/:id/members
[ ] POST /api/graphql
[ ] GET  /api/audit

Parameters that accept organization context:
- organizationId (query param)
- organizationId (body param)
- X-Organization-Id (header)
```

---

## PHASE 2: DIRECT ACCESS ATTACKS (20 minutes)

### Attack 2.1: Direct Resource Access

Attempt to access Org B's assets directly.

**Test:**
```bash
# Get Org B's asset ID (assume you discovered it)
ORG_B_ASSET_ID="clx123..."

# Attempt direct access
curl -X GET "http://localhost:3000/api/assets/$ORG_B_ASSET_ID" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

**Document Result:**

```
ATTACK 2.1: Direct Resource Access
==================================

Request: GET /api/assets/{org_b_asset_id}
Expected: 403 Forbidden or 404 Not Found
Actual: ________________

Response Body:
________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL

If not blocked, describe the vulnerability:
________________
```

### Attack 2.2: Organization ID Manipulation

Attempt to query with Org B's ID.

**Test:**
```bash
# Attempt to list Org B's assets
curl -X GET "http://localhost:3000/api/assets?organizationId=ORG_B_ID" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

**Document Result:**

```
ATTACK 2.2: Organization ID Manipulation
========================================

Request: GET /api/assets?organizationId={org_b_id}
Expected: 403 Forbidden
Actual: ________________

Response Body:
________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

### Attack 2.3: Create Resource in Wrong Org

Attempt to create an asset in Org B.

**Test:**
```bash
curl -X POST "http://localhost:3000/api/assets" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "name": "Malicious Asset",
    "category": "equipment",
    "organizationId": "ORG_B_ID"
  }'
```

**Document Result:**

```
ATTACK 2.3: Create in Wrong Organization
========================================

Request: POST /api/assets with org_b_id
Expected: 403 Forbidden
Actual: ________________

Response Body:
________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

---

## PHASE 3: IDOR ATTACKS (20 minutes)

### Attack 3.1: Sequential ID Enumeration

If IDs are sequential, enumerate to find other resources.

**Test:**
```bash
# If asset IDs are sequential
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3000/api/assets/asset_$i" \
    -H "Cookie: next-auth.session-token=YOUR_SESSION"
  echo " - asset_$i"
done
```

**Document Result:**

```
ATTACK 3.1: Sequential ID Enumeration
=====================================

ID Pattern Discovered: [ ] Sequential  [ ] UUID  [ ] CUID

Enumeration Results:
- IDs tested: ________________
- 200 responses: ________________
- 403 responses: ________________
- 404 responses: ________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL

Notes:
________________
```

### Attack 3.2: Parameter Pollution

Attempt to confuse the server with multiple organization IDs.

**Test:**
```bash
# Multiple organizationId parameters
curl -X GET "http://localhost:3000/api/assets?organizationId=ORG_A_ID&organizationId=ORG_B_ID" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# Body vs Query parameter conflict
curl -X POST "http://localhost:3000/api/assets?organizationId=ORG_A_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"name": "Test", "category": "test", "organizationId": "ORG_B_ID"}'
```

**Document Result:**

```
ATTACK 3.2: Parameter Pollution
===============================

Test 1 - Multiple Query Params:
Expected: Use first or reject
Actual: ________________

Test 2 - Query vs Body Conflict:
Expected: Reject or use validated source
Actual: ________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

---

## PHASE 4: GRAPHQL ATTACKS (15 minutes)

### Attack 4.1: GraphQL Introspection

Discover the schema to find attack vectors.

**Test:**
```bash
curl -X POST "http://localhost:3000/api/graphql" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"query": "{ __schema { types { name fields { name } } } }"}'
```

**Document Result:**

```
ATTACK 4.1: GraphQL Introspection
=================================

Introspection Enabled: [ ] Yes  [ ] No

If enabled, sensitive types discovered:
________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

### Attack 4.2: GraphQL Batch Query

Attempt to access multiple organizations in one query.

**Test:**
```bash
curl -X POST "http://localhost:3000/api/graphql" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "query": "query { orgA: assets(organizationId: \"ORG_A_ID\") { edges { node { id name } } } orgB: assets(organizationId: \"ORG_B_ID\") { edges { node { id name } } } }"
  }'
```

**Document Result:**

```
ATTACK 4.2: GraphQL Batch Query
===============================

Request: Batch query for both organizations
Expected: orgB should return error/empty
Actual: ________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

---

## PHASE 5: PRIVILEGE ESCALATION (15 minutes)

### Attack 5.1: Role Manipulation

Attempt to change your own role.

**Test:**
```bash
# Attempt to update own user with elevated role
curl -X PUT "http://localhost:3000/api/users/YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"role": "ADMIN"}'

# Attempt to update org membership role
curl -X PUT "http://localhost:3000/api/organizations/ORG_A_ID/members/YOUR_USER_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"role": "OWNER"}'
```

**Document Result:**

```
ATTACK 5.1: Role Manipulation
=============================

Test 1 - Global Role Change:
Expected: 403 Forbidden
Actual: ________________

Test 2 - Org Role Change:
Expected: 403 Forbidden (unless already OWNER/ADMIN)
Actual: ________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

### Attack 5.2: Add Self to Organization

Attempt to join Org B without invitation.

**Test:**
```bash
curl -X POST "http://localhost:3000/api/organizations/ORG_B_ID/members" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"userId": "YOUR_USER_ID", "role": "MEMBER"}'
```

**Document Result:**

```
ATTACK 5.2: Self-Add to Organization
====================================

Request: POST /api/organizations/{org_b}/members
Expected: 403 Forbidden
Actual: ________________

Status: [ ] BLOCKED  [ ] PARTIAL  [ ] SUCCESSFUL
```

---

## PHASE 6: REPORT COMPILATION (15 minutes)

### Vulnerability Summary

```
═══════════════════════════════════════════════════════════════
                 BREACH SIMULATION REPORT
                 LAB-001: Security Assessment
═══════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────
Assessment Date: ________________
Assessor: ________________
Target: Proveniq Core - Tenant Isolation

ATTACK VECTORS TESTED
─────────────────────
Total Attacks Attempted: ________
Attacks Blocked: ________
Attacks Partially Successful: ________
Attacks Fully Successful: ________

FINDINGS BY SEVERITY
────────────────────

CRITICAL (Immediate action required):
[ ] None found
[ ] Finding: ________________
    Impact: ________________
    Remediation: ________________

HIGH (Action required within 24 hours):
[ ] None found
[ ] Finding: ________________
    Impact: ________________
    Remediation: ________________

MEDIUM (Action required within 7 days):
[ ] None found
[ ] Finding: ________________
    Impact: ________________
    Remediation: ________________

LOW (Action required within 30 days):
[ ] None found
[ ] Finding: ________________
    Impact: ________________
    Remediation: ________________

INFORMATIONAL:
________________
________________

SECURITY CONTROLS VERIFIED
──────────────────────────
[✓/✗] Tenant isolation enforced at API layer
[✓/✗] Tenant isolation enforced at database layer
[✓/✗] IDOR protection in place
[✓/✗] GraphQL authorization working
[✓/✗] Role manipulation blocked
[✓/✗] Self-enrollment blocked

RECOMMENDATIONS
───────────────
1. ________________
2. ________________
3. ________________

CONCLUSION
──────────
[ ] System is secure - all attacks blocked
[ ] Minor issues found - low risk
[ ] Significant issues found - action required
[ ] Critical vulnerabilities - immediate action required

═══════════════════════════════════════════════════════════════
```

---

## ✅ COMPLETION CHECKLIST

Before submitting this lab:

- [ ] All attack vectors tested
- [ ] All results documented with evidence
- [ ] Vulnerability report completed
- [ ] Recommendations provided for any findings
- [ ] No actual damage done to test environment

---

## 📊 GRADING RUBRIC

| Criteria | Points | Your Score |
|----------|--------|------------|
| Reconnaissance completeness | 15 | |
| Attack vector coverage | 25 | |
| Documentation quality | 20 | |
| Finding accuracy | 25 | |
| Remediation recommendations | 15 | |
| **TOTAL** | **100** | |

**Passing Score: 95/100**

---

## 🚨 IF YOU FIND A REAL VULNERABILITY

If any attack succeeds:

1. **STOP** - Do not exploit further
2. **DOCUMENT** - Record exact steps to reproduce
3. **REPORT** - Submit finding immediately
4. **DO NOT** share publicly until fixed

---

*"The best defense is knowing your weaknesses before your enemies do."*

— Antigravity Academy
