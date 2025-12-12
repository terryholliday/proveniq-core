# PREREQUISITES
## Antigravity Academy Entry Requirements

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ⚠️  STOP. READ THIS ENTIRE DOCUMENT.                      │
│                                                              │
│   If you cannot pass the self-assessment at the end,        │
│   you are not ready for this program.                       │
│                                                              │
│   There is no shame in preparation.                         │
│   There is only shame in wasted time.                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 REQUIRED KNOWLEDGE DOMAINS

### Domain 1: TypeScript Mastery

You must be able to read and write:

```typescript
// Generic constraints
type ExtractKeys<T, K extends keyof T> = Pick<T, K>;

// Conditional types
type IsArray<T> = T extends Array<infer U> ? U : never;

// Mapped types
type Readonly<T> = { readonly [P in keyof T]: T[P] };

// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;

// Discriminated unions
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };
```

**Self-Check:** Can you explain what each of these does without looking it up?

---

### Domain 2: SQL Proficiency

You must be able to write:

```sql
-- Complex joins with aggregation
SELECT 
  o.id,
  o.name,
  COUNT(DISTINCT a.id) as asset_count,
  AVG(v.confidence) as avg_confidence
FROM organizations o
LEFT JOIN assets a ON a.organization_id = o.id
LEFT JOIN verifications v ON v.asset_id = a.id
WHERE o.created_at > NOW() - INTERVAL '30 days'
GROUP BY o.id, o.name
HAVING COUNT(DISTINCT a.id) > 10
ORDER BY avg_confidence DESC NULLS LAST
LIMIT 20;

-- Window functions
SELECT 
  id,
  amount,
  SUM(amount) OVER (
    PARTITION BY organization_id 
    ORDER BY created_at 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as running_total
FROM transactions;

-- CTEs for complex queries
WITH ranked_assets AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at DESC) as rn
  FROM assets
  WHERE status = 'VERIFIED'
)
SELECT * FROM ranked_assets WHERE rn = 1;
```

**Self-Check:** Can you write these queries from memory?

---

### Domain 3: HTTP Protocol

You must know:

| Status Code | Meaning | When to Use |
|-------------|---------|-------------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | No/invalid auth |
| 403 | Forbidden | Valid auth, no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate/conflict |
| 422 | Unprocessable | Valid syntax, invalid semantics |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Error | Server fault |
| 502 | Bad Gateway | Upstream failure |
| 503 | Service Unavailable | Overloaded/maintenance |

**Self-Check:** What's the difference between 401 and 403? Between 400 and 422?

---

### Domain 4: Authentication Concepts

You must understand:

```
┌─────────────────────────────────────────────────────────────┐
│                    OAUTH 2.0 FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User ──────► App ──────► Auth Server                      │
│    │                           │                            │
│    │    ◄── Redirect ──────────┤                            │
│    │                           │                            │
│    ├──────► Login ─────────────►                            │
│    │                           │                            │
│    │    ◄── Auth Code ─────────┤                            │
│    │                           │                            │
│  App ──────► Exchange Code ────►                            │
│    │                           │                            │
│    │    ◄── Access Token ──────┤                            │
│    │                           │                            │
│  App ──────► API Request ──────► Resource Server            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**JWT Structure:**
```
Header.Payload.Signature

Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "user_id", "iat": 1234567890, "exp": 1234567890 }
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

**Self-Check:** Why can't you store sensitive data in a JWT payload?

---

### Domain 5: Database Concepts

You must understand:

**ACID Properties:**
- **Atomicity**: All or nothing
- **Consistency**: Valid state to valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed = permanent

**Isolation Levels:**
| Level | Dirty Read | Non-Repeatable | Phantom |
|-------|------------|----------------|---------|
| Read Uncommitted | ✓ | ✓ | ✓ |
| Read Committed | ✗ | ✓ | ✓ |
| Repeatable Read | ✗ | ✗ | ✓ |
| Serializable | ✗ | ✗ | ✗ |

**Index Types:**
- B-Tree: Default, range queries
- Hash: Equality only, faster
- GIN: Full-text, arrays, JSONB
- GiST: Geometric, full-text

**Self-Check:** When would you use Serializable isolation? What's the cost?

---

### Domain 6: Security Fundamentals

You must know the **OWASP Top 10**:

1. **Broken Access Control** - Users accessing unauthorized resources
2. **Cryptographic Failures** - Weak encryption, exposed secrets
3. **Injection** - SQL, NoSQL, OS command injection
4. **Insecure Design** - Flawed architecture decisions
5. **Security Misconfiguration** - Default credentials, verbose errors
6. **Vulnerable Components** - Outdated dependencies
7. **Authentication Failures** - Weak passwords, session issues
8. **Data Integrity Failures** - Unsigned updates, CI/CD compromise
9. **Logging Failures** - Missing audit trails
10. **SSRF** - Server-side request forgery

**Self-Check:** Can you give an example of each vulnerability?

---

## 🛠️ REQUIRED TOOLS

### Must Have Installed

```bash
# Verify each command works

node --version        # >= 18.0.0
npm --version         # >= 9.0.0
git --version         # >= 2.30.0
psql --version        # >= 14.0 (or access to PostgreSQL)
```

### Must Be Configured

- [ ] VS Code with TypeScript extension
- [ ] Postman or Insomnia for API testing
- [ ] Browser with DevTools (Chrome/Firefox)
- [ ] Terminal with bash/zsh/PowerShell

### Must Have Access To

- [ ] GitHub account
- [ ] PostgreSQL database (local or remote)
- [ ] AWS account (for S3 labs) OR LocalStack

---

## 🧪 ENVIRONMENT VERIFICATION

Run this script to verify your environment:

```bash
# From the proveniq-core directory
npm run academy:verify
```

If that script doesn't exist, run these manually:

```bash
# 1. Dependencies installed
npm install

# 2. TypeScript compiles
npx tsc --noEmit

# 3. Prisma client generated
npx prisma generate

# 4. Database connection works
npx prisma db push --accept-data-loss

# 5. Dev server starts
npm run dev
# Visit http://localhost:3000 - should load without errors
```

**All five steps must succeed.**

---

## 📝 SELF-ASSESSMENT EXAM

Complete this assessment honestly. No looking up answers.
Score yourself: 1 point per correct answer.

### Section A: TypeScript (10 questions)

**A1.** What is the output type of this function?
```typescript
function identity<T>(arg: T): T { return arg; }
const result = identity("hello");
```

**A2.** What does `keyof` return for this type?
```typescript
type User = { id: string; name: string; age: number };
type Keys = keyof User;
```

**A3.** What is a discriminated union and when would you use one?

**A4.** Explain the difference between `interface` and `type` in TypeScript.

**A5.** What does `infer` do in conditional types?

**A6.** What is the `never` type and when is it used?

**A7.** How do you make all properties of a type optional?

**A8.** What is type narrowing and how does TypeScript achieve it?

**A9.** What is the difference between `unknown` and `any`?

**A10.** What does `as const` do to an object literal?

---

### Section B: SQL (10 questions)

**B1.** What is the difference between `INNER JOIN` and `LEFT JOIN`?

**B2.** When would you use `HAVING` instead of `WHERE`?

**B3.** What is a database index and how does it improve performance?

**B4.** Explain the difference between `UNION` and `UNION ALL`.

**B5.** What is a foreign key constraint and why is it important?

**B6.** What is database normalization? Name the first three normal forms.

**B7.** What is a deadlock and how can you prevent it?

**B8.** What is the difference between `DELETE` and `TRUNCATE`?

**B9.** How do you handle NULL values in comparisons?

**B10.** What is an execution plan and how do you read one?

---

### Section C: HTTP & APIs (10 questions)

**C1.** What is the difference between PUT and PATCH?

**C2.** What headers are required for a JSON API request?

**C3.** What is CORS and why does it exist?

**C4.** Explain the difference between cookies and localStorage.

**C5.** What is a preflight request and when does it occur?

**C6.** What is idempotency and which HTTP methods are idempotent?

**C7.** What is the purpose of the `ETag` header?

**C8.** How does HTTP caching work with `Cache-Control`?

**C9.** What is the difference between 301 and 302 redirects?

**C10.** What is content negotiation in HTTP?

---

### Section D: Security (10 questions)

**D1.** What is SQL injection and how do you prevent it?

**D2.** What is XSS and what are the three types?

**D3.** What is CSRF and how do tokens prevent it?

**D4.** Why should passwords be hashed, not encrypted?

**D5.** What is the principle of least privilege?

**D6.** What is a timing attack and how do you prevent it?

**D7.** What is certificate pinning?

**D8.** What is the difference between authentication and authorization?

**D9.** What is a salt and why is it used in password hashing?

**D10.** What is Content Security Policy (CSP)?

---

### Section E: Architecture (10 questions)

**E1.** What is the difference between monolith and microservices?

**E2.** What is eventual consistency?

**E3.** What is a message queue and when would you use one?

**E4.** What is the CAP theorem?

**E5.** What is horizontal vs vertical scaling?

**E6.** What is a circuit breaker pattern?

**E7.** What is database sharding?

**E8.** What is the difference between sync and async communication?

**E9.** What is a reverse proxy?

**E10.** What is blue-green deployment?

---

## 📊 SCORING

| Score | Result | Action |
|-------|--------|--------|
| 45-50 | **READY** | Proceed to C100 |
| 40-44 | **ALMOST** | Review weak areas, retake in 1 week |
| 30-39 | **NOT READY** | Complete remediation track |
| < 30 | **FOUNDATIONAL GAPS** | Start with fundamentals course |

---

## 📚 REMEDIATION RESOURCES

If you scored below 45, use these resources:

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Total TypeScript](https://www.totaltypescript.com/)

### SQL
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Use The Index, Luke](https://use-the-index-luke.com/)

### HTTP & APIs
- [MDN HTTP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [REST API Tutorial](https://restfulapi.net/)

### Security
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

### Architecture
- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Martin Fowler's Blog](https://martinfowler.com/)

---

## ✅ READY TO PROCEED?

If you scored 45 or above:

1. Verify your environment passes all checks
2. Review the Academy README one more time
3. Begin with [C100: The Nervous System](./C100-nervous-system/README.md)

If you scored below 45:

1. Identify your weakest sections
2. Spend 1-2 weeks on remediation
3. Retake the self-assessment
4. Do not proceed until you score 45+

---

*"The foundation determines the height of the building."*

— Antigravity Academy
