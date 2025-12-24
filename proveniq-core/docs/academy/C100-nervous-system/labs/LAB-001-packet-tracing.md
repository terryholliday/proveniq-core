# LAB-001: Packet Tracing
## C100: The Nervous System

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
║   PACKET TRACING                                                             ║
║   "Follow the signal. Find the noise."                                       ║
║                                                                              ║
║   Duration: 90 minutes                                                       ║
║   Difficulty: ████████░░ 80%                                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 MISSION BRIEFING

**Scenario:** A user reports that asset creation is "slow." No other details provided.

**Your Mission:**
1. Trace a complete request from browser to database
2. Document every network hop with timing
3. Identify the slowest component
4. Produce a complete request flow diagram

**Success Criteria:**
- [ ] Complete timing breakdown for all stages
- [ ] Accurate request/response documentation
- [ ] Root cause identification (if slowness exists)
- [ ] Professional incident report

---

## 📋 PREREQUISITES

Before starting this lab:

- [ ] Development environment running (`npm run dev`)
- [ ] Browser with DevTools (Chrome recommended)
- [ ] Access to application logs
- [ ] Authenticated session in the application

---

## PHASE 1: ENVIRONMENT SETUP (15 minutes)

### Step 1.1: Enable Verbose Logging

Add to your `.env.local`:

```env
# Enable Prisma query logging
DEBUG="prisma:query"

# Enable verbose API logging
LOG_LEVEL="debug"
```

Restart the dev server.

### Step 1.2: Prepare Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Enable "Preserve log"
4. Enable "Disable cache"
5. Set throttling to "No throttling"

### Step 1.3: Prepare Terminal Logging

Open a terminal window positioned to see server logs:

```bash
# Watch the dev server output
npm run dev
```

### Step 1.4: Create Test Data

Ensure you have:
- An authenticated user session
- At least one organization
- Permission to create assets

---

## PHASE 2: CAPTURE THE REQUEST (20 minutes)

### Step 2.1: Perform the Action

1. Navigate to the asset creation page
2. Clear the Network tab
3. Fill in asset details:
   - Name: "LAB-001 Test Asset"
   - Category: "equipment"
4. Click "Create"
5. **DO NOT** navigate away

### Step 2.2: Document the Request

In the Network tab, find the POST request to `/api/assets`.

**Record the following:**

```
REQUEST CAPTURE FORM
====================

Timestamp: ________________
URL: ________________
Method: ________________
Status: ________________

REQUEST HEADERS:
- Content-Type: ________________
- Cookie: ________________ (first 20 chars)
- User-Agent: ________________

REQUEST BODY:
________________
________________
________________

RESPONSE HEADERS:
- Content-Type: ________________
- X-Request-Id: ________________
- X-Response-Time: ________________

RESPONSE BODY:
________________
________________
________________
```

### Step 2.3: Capture Timing

In the Network tab, click on the request and go to "Timing" tab.

**Record the following:**

```
TIMING BREAKDOWN
================

Queueing:        _______ ms
Stalled:         _______ ms
DNS Lookup:      _______ ms
Initial Connection: _______ ms
SSL:             _______ ms
Request Sent:    _______ ms
Waiting (TTFB):  _______ ms
Content Download: _______ ms
─────────────────────────
TOTAL:           _______ ms
```

---

## PHASE 3: TRACE THE SERVER PATH (25 minutes)

### Step 3.1: Middleware Trace

Check your server logs for middleware execution.

**Expected log pattern:**

```
[middleware] Request received
  path: /api/assets
  method: POST
  requestId: abc-123-def
  timestamp: 2024-01-15T10:30:00.000Z

[middleware] Rate limit check
  ip: 127.0.0.1
  remaining: 99
  duration: 2ms

[middleware] Session validated
  userId: user_xyz
  duration: 5ms
```

**Record:**

```
MIDDLEWARE TRACE
================

Rate Limit Check:    _______ ms
Session Validation:  _______ ms
Request Enrichment:  _______ ms
─────────────────────────────
TOTAL MIDDLEWARE:    _______ ms
```

### Step 3.2: Handler Trace

Check logs for API route handler execution.

**Expected log pattern:**

```
[api/assets] Handler started
  requestId: abc-123-def
  
[api/assets] Body parsed
  duration: 2ms
  
[api/assets] Validation passed
  duration: 3ms
  
[api/assets] Permission check
  userId: user_xyz
  organizationId: org_abc
  permission: assets:write
  result: allowed
  duration: 15ms
```

**Record:**

```
HANDLER TRACE
=============

Body Parsing:        _______ ms
Validation:          _______ ms
Permission Check:    _______ ms
Business Logic:      _______ ms
─────────────────────────────
TOTAL HANDLER:       _______ ms
```

### Step 3.3: Database Trace

Check Prisma query logs.

**Expected log pattern:**

```
prisma:query SELECT "organization_members"."id", ...
  duration: 12ms
  
prisma:query INSERT INTO "assets" ...
  duration: 25ms
  
prisma:query INSERT INTO "audit_logs" ...
  duration: 8ms
```

**Record:**

```
DATABASE TRACE
==============

Membership Query:    _______ ms
Asset Insert:        _______ ms
Audit Log Insert:    _______ ms
─────────────────────────────
TOTAL DATABASE:      _______ ms
```

---

## PHASE 4: BUILD THE FLOW DIAGRAM (20 minutes)

### Step 4.1: Create Timeline

Using your captured data, create a timeline:

```
TIME (ms)  COMPONENT           ACTION
─────────────────────────────────────────────────────────
0          Browser             Request initiated
5          DNS                 Resolution complete
15         TLS                 Handshake complete
25         Edge                Request received
30         Middleware          Rate limit check
35         Middleware          Session validation
40         Handler             Body parsing
43         Handler             Validation
58         Handler             Permission check (DB query)
63         Handler             Business logic
88         Database            Asset insert
96         Database            Audit log insert
100        Handler             Response construction
105        Edge                Response sent
200        Browser             Response received
─────────────────────────────────────────────────────────
```

### Step 4.2: Create Visual Diagram

Draw the complete flow:

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR REQUEST FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Draw your diagram here based on captured data]            │
│                                                             │
│  Include:                                                   │
│  • All components touched                                   │
│  • Timing for each hop                                      │
│  • Data transformed at each stage                          │
│  • Any async operations                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4.3: Identify Bottlenecks

Analyze your timing data:

```
BOTTLENECK ANALYSIS
===================

Slowest Component: ________________
Time Consumed:     ________________ ms
Percentage of Total: ________________%

Is this expected? [ ] Yes  [ ] No

If unexpected, potential causes:
1. ________________
2. ________________
3. ________________

Recommended optimization:
________________
________________
```

---

## PHASE 5: INCIDENT REPORT (10 minutes)

### Step 5.1: Write the Report

Complete this incident report template:

```
═══════════════════════════════════════════════════════════════
                    INCIDENT REPORT
                    LAB-001: Packet Tracing
═══════════════════════════════════════════════════════════════

SUMMARY
───────
User Report: "Asset creation is slow"

Investigation Date: ________________
Investigator: ________________
Request ID: ________________

FINDINGS
────────
Total Request Duration: _______ ms
Expected Duration:      200 ms
Status:                 [ ] Within SLA  [ ] Exceeds SLA

TIMING BREAKDOWN
────────────────
Network (Client → Server):  _______ ms (______%)
Middleware:                 _______ ms (______%)
Authentication:             _______ ms (______%)
Authorization:              _______ ms (______%)
Business Logic:             _______ ms (______%)
Database:                   _______ ms (______%)
Network (Server → Client):  _______ ms (______%)

BOTTLENECK IDENTIFICATION
─────────────────────────
Primary Bottleneck: ________________
Secondary Bottleneck: ________________

ROOT CAUSE ANALYSIS
───────────────────
[ ] Network latency
[ ] Database query performance
[ ] Missing index
[ ] N+1 query problem
[ ] Connection pool exhaustion
[ ] Cold start
[ ] External service latency
[ ] Other: ________________

EVIDENCE
────────
[Attach relevant log snippets]

RECOMMENDATIONS
───────────────
Immediate Actions:
1. ________________
2. ________________

Long-term Improvements:
1. ________________
2. ________________

CONCLUSION
──────────
[ ] Issue confirmed - action required
[ ] Issue not confirmed - within normal parameters
[ ] Needs further investigation

═══════════════════════════════════════════════════════════════
```

---

## ✅ COMPLETION CHECKLIST

Before submitting this lab:

- [ ] All timing data captured accurately
- [ ] Request/response headers documented
- [ ] Server-side traces collected
- [ ] Flow diagram created
- [ ] Bottleneck analysis completed
- [ ] Incident report filled out completely
- [ ] All findings supported by evidence

---

## 📊 GRADING RUBRIC

| Criteria | Points | Your Score |
|----------|--------|------------|
| Timing accuracy (±10ms) | 25 | |
| Complete header documentation | 15 | |
| Server trace completeness | 20 | |
| Flow diagram accuracy | 20 | |
| Incident report quality | 20 | |
| **TOTAL** | **100** | |

**Passing Score: 95/100**

---

## 🚨 COMMON MISTAKES

1. **Missing the audit log query** - It's async but still happens
2. **Ignoring DNS/TLS time** - First request is always slower
3. **Not accounting for cold starts** - Run the request twice
4. **Confusing TTFB with total time** - They're different metrics
5. **Missing middleware timing** - Check server logs, not just network

---

## 💡 HINTS

If you're stuck:

1. **Can't see Prisma logs?** Check that `DEBUG="prisma:query"` is set
2. **Timing doesn't add up?** Some operations are parallel
3. **Missing request ID?** Check if middleware is adding it
4. **Response time seems wrong?** Account for JSON serialization

---

## ➡️ NEXT LAB

After completing this lab:

**[→ LAB-002-latency-hunting.md](./LAB-002-latency-hunting.md)**

---

*"The packet doesn't lie. The logs don't lie. Only your assumptions lie."*

— Antigravity Academy
