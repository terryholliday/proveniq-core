# C100: THE NERVOUS SYSTEM
## Complete Syllabus | Architecture Track

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  [DEAN] CURRICULUM ARTIFACT                                                  ║
║  ═══════════════════════════════════════════════════════════════════════════ ║
║                                                                              ║
║  Track:        C100 - The Nervous System                                     ║
║  Focus:        Platform Architecture                                         ║
║  Duration:     12 hours                                                      ║
║  Pass Rate:    95%                                                           ║
║  Certification: Proveniq Core Operator (Level 1)                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 LEARNING OUTCOMES

Upon completion of C100, the candidate will demonstrate mastery of:

| ID | Outcome | Verification Method |
|----|---------|---------------------|
| LO-1 | Map the 8-node Proveniq ecosystem | Diagram from memory |
| LO-2 | Trace request lifecycle with timing | Live packet capture |
| LO-3 | Explain Ingest vs Verify loops | Whiteboard session |
| LO-4 | Identify single points of failure | Architecture review |
| LO-5 | Calculate latency budgets | Performance analysis |
| LO-6 | Debug production issues | Incident simulation |

---

## 🏗️ THE 8-NODE ECOSYSTEM

### Node Definitions

```typescript
export const PROVENIQ_ECOSYSTEM = {
  nodes: [
    {
      id: "CORE",
      name: "Proveniq Core",
      type: "platform",
      role: "Central nervous system - auth, RBAC, audit, data models",
      dependencies: ["RDS"],
      dependents: ["VERIFY", "INGEST", "PORTAL", "MOBILE", "ANALYTICS", "INTEGRATIONS"],
    },
    {
      id: "VERIFY",
      name: "Proveniq Verify",
      type: "application",
      role: "Asset verification workflows and evidence collection",
      dependencies: ["CORE"],
      dependents: [],
    },
    {
      id: "INGEST",
      name: "Proveniq Ingest",
      type: "application",
      role: "Data ingestion pipelines and ETL processing",
      dependencies: ["CORE"],
      dependents: ["VERIFY"],
    },
    {
      id: "PORTAL",
      name: "Proveniq Portal",
      type: "application",
      role: "Customer-facing dashboard and reporting",
      dependencies: ["CORE", "ANALYTICS"],
      dependents: [],
    },
    {
      id: "MOBILE",
      name: "Proveniq Mobile",
      type: "application",
      role: "Field verification and evidence capture",
      dependencies: ["CORE", "VERIFY"],
      dependents: [],
    },
    {
      id: "ANALYTICS",
      name: "Proveniq Analytics",
      type: "service",
      role: "Business intelligence and reporting engine",
      dependencies: ["CORE", "RDS"],
      dependents: ["PORTAL"],
    },
    {
      id: "INTEGRATIONS",
      name: "Proveniq Integrations",
      type: "service",
      role: "Third-party connectors (DocuSign, Plaid, etc.)",
      dependencies: ["CORE"],
      dependents: ["VERIFY", "INGEST"],
    },
    {
      id: "RDS",
      name: "PostgreSQL (AWS RDS)",
      type: "infrastructure",
      role: "Primary data store - source of truth",
      dependencies: [],
      dependents: ["CORE", "ANALYTICS"],
    },
  ],
} as const;
```

### Ecosystem Topology

See: `diagrams/core-topology.mermaid`

---

## 🔄 INGEST VS VERIFY LOOPS

### The Ingest Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INGEST LOOP                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   EXTERNAL DATA                                                             │
│        │                                                                    │
│        ▼                                                                    │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│   │ RECEIVE │───►│ VALIDATE│───►│TRANSFORM│───►│  STORE  │               │
│   │         │    │         │    │         │    │         │               │
│   │ • API   │    │ • Schema│    │ • Map   │    │ • Asset │               │
│   │ • File  │    │ • Types │    │ • Enrich│    │ • Index │               │
│   │ • Stream│    │ • Rules │    │ • Link  │    │ • Audit │               │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘               │
│        │              │              │              │                     │
│        │              │              │              │                     │
│        └──────────────┴──────────────┴──────────────┘                     │
│                              │                                             │
│                         AUDIT LOG                                          │
│                    (Every step recorded)                                   │
│                                                                             │
│   CHARACTERISTICS:                                                          │
│   • High throughput (1000+ records/sec)                                    │
│   • Batch-optimized                                                        │
│   • Idempotent (re-run safe)                                              │
│   • Eventually consistent                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Verify Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERIFY LOOP                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   VERIFICATION REQUEST                                                      │
│        │                                                                    │
│        ▼                                                                    │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│   │ REQUEST │───►│ COLLECT │───►│ ANALYZE │───►│ CERTIFY │               │
│   │         │    │         │    │         │    │         │               │
│   │ • Asset │    │ • Photos│    │ • Rules │    │ • Sign  │               │
│   │ • Type  │    │ • Docs  │    │ • ML    │    │ • Hash  │               │
│   │ • SLA   │    │ • GPS   │    │ • Human │    │ • Notify│               │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘               │
│        │              │              │              │                     │
│        │              │              │              │                     │
│        └──────────────┴──────────────┴──────────────┘                     │
│                              │                                             │
│                      EVIDENCE CHAIN                                        │
│                   (Immutable, timestamped)                                 │
│                                                                             │
│   CHARACTERISTICS:                                                          │
│   • Lower throughput (100s/hour)                                           │
│   • Human-in-the-loop possible                                             │
│   • Strong consistency required                                            │
│   • Legally binding output                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loop Interaction

```typescript
// The loops interact at the Asset boundary
interface LoopInteraction {
  // Ingest creates assets
  ingest: {
    input: "External data source",
    output: "Asset record in database",
    triggers: "Verification eligibility check",
  };
  
  // Verify consumes assets
  verify: {
    input: "Asset requiring verification",
    output: "Verification certificate",
    triggers: "Asset status update, webhook, notification",
  };
  
  // Feedback loop
  feedback: {
    verificationResult: "Updates asset status",
    assetUpdate: "May trigger re-verification",
    auditTrail: "Links both loops",
  };
}
```

---

## 📐 UNIT BREAKDOWN

### Unit 1: Ecosystem Mapping (2 hours)

| Topic | Duration | Deliverable |
|-------|----------|-------------|
| 8-Node Overview | 30 min | Node identification quiz |
| Dependency Analysis | 30 min | Dependency matrix |
| Communication Patterns | 30 min | Sequence diagram |
| Failure Domains | 30 min | SPOF analysis |

**API Call Exercise:**
```bash
# Verify ecosystem health
curl -X GET "https://api.proveniq.com/health" \
  -H "Authorization: Bearer $API_KEY"

# Expected response
{
  "status": "healthy",
  "nodes": {
    "core": { "status": "up", "latency": 12 },
    "rds": { "status": "up", "latency": 3 },
    "verify": { "status": "up", "latency": 45 },
    "ingest": { "status": "up", "latency": 23 }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Unit 2: Request Lifecycle (2 hours)

| Topic | Duration | Deliverable |
|-------|----------|-------------|
| Edge to Origin | 30 min | Timing diagram |
| Middleware Chain | 30 min | Execution trace |
| Database Round-trip | 30 min | Query analysis |
| Response Construction | 30 min | Payload inspection |

**API Call Exercise:**
```bash
# Create asset with timing headers
curl -X POST "https://api.proveniq.com/api/assets" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: $(uuidgen)" \
  -d '{
    "name": "Test Asset",
    "category": "equipment",
    "organizationId": "org_xxx"
  }' \
  -w "\n\nTiming:\n  DNS: %{time_namelookup}s\n  Connect: %{time_connect}s\n  TLS: %{time_appconnect}s\n  TTFB: %{time_starttransfer}s\n  Total: %{time_total}s\n"
```

---

### Unit 3: Ingest Pipeline (2 hours)

| Topic | Duration | Deliverable |
|-------|----------|-------------|
| Data Sources | 30 min | Source catalog |
| Validation Rules | 30 min | Schema definition |
| Transformation Logic | 30 min | Mapping spec |
| Batch Processing | 30 min | Throughput analysis |

**API Call Exercise:**
```bash
# Batch ingest assets
curl -X POST "https://api.proveniq.com/api/ingest/batch" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "external_system",
    "records": [
      { "externalId": "EXT-001", "name": "Asset 1", "category": "equipment" },
      { "externalId": "EXT-002", "name": "Asset 2", "category": "vehicle" }
    ],
    "options": {
      "upsert": true,
      "validateOnly": false
    }
  }'

# Expected response
{
  "batchId": "batch_abc123",
  "status": "processing",
  "total": 2,
  "processed": 0,
  "failed": 0,
  "estimatedCompletion": "2024-01-15T10:31:00Z"
}
```

---

### Unit 4: Verify Pipeline (2 hours)

| Topic | Duration | Deliverable |
|-------|----------|-------------|
| Verification Types | 30 min | Type matrix |
| Evidence Collection | 30 min | Evidence schema |
| Analysis Engine | 30 min | Rule configuration |
| Certification Output | 30 min | Certificate format |

**API Call Exercise:**
```bash
# Request verification
curl -X POST "https://api.proveniq.com/api/verifications" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset_xxx",
    "type": "OWNERSHIP",
    "priority": "normal",
    "metadata": {
      "requestedBy": "user_xxx",
      "dueDate": "2024-01-20"
    }
  }'

# Expected response
{
  "id": "ver_abc123",
  "assetId": "asset_xxx",
  "type": "OWNERSHIP",
  "status": "PENDING",
  "requestedAt": "2024-01-15T10:30:00Z",
  "estimatedCompletion": "2024-01-17T10:30:00Z"
}
```

---

### Unit 5: Database Topology (2 hours)

| Topic | Duration | Deliverable |
|-------|----------|-------------|
| Schema Design | 30 min | ERD diagram |
| Index Strategy | 30 min | Index audit |
| Query Optimization | 30 min | EXPLAIN analysis |
| Connection Pooling | 30 min | Pool configuration |

**API Call Exercise:**
```bash
# Query with performance metrics
curl -X GET "https://api.proveniq.com/api/assets?organizationId=org_xxx&limit=100" \
  -H "Authorization: Bearer $API_KEY" \
  -H "X-Include-Metrics: true"

# Expected response includes
{
  "data": [...],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 100
  },
  "_metrics": {
    "queryTime": 23,
    "connectionAcquire": 2,
    "serialization": 5,
    "totalServer": 30
  }
}
```

---

### Unit 6: Labs & Assessment (2 hours)

| Activity | Duration | Weight |
|----------|----------|--------|
| LAB-001: Packet Tracing | 45 min | 30% |
| LAB-002: Latency Hunting | 45 min | 30% |
| Incident Simulation | 30 min | 40% |

---

## 📊 GRADING CRITERIA

### Knowledge Assessment (40%)

| Category | Questions | Points |
|----------|-----------|--------|
| Ecosystem Mapping | 10 | 20 |
| Request Lifecycle | 10 | 20 |
| Ingest Pipeline | 10 | 20 |
| Verify Pipeline | 10 | 20 |
| Database Topology | 10 | 20 |

### Lab Performance (40%)

| Lab | Criteria | Points |
|-----|----------|--------|
| Packet Tracing | Timing accuracy ±10ms | 50 |
| Latency Hunting | Root cause identification | 50 |

### Incident Simulation (20%)

| Metric | Target | Points |
|--------|--------|--------|
| Time to Identify | < 10 min | 40 |
| Accuracy | 100% | 40 |
| Communication | Professional | 20 |

---

## 📋 PREREQUISITES

Before starting C100:

```json
{
  "required": {
    "typescript": "Advanced",
    "sql": "Intermediate",
    "http": "Deep understanding",
    "git": "Daily driver"
  },
  "environment": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0",
    "postgresql": ">=14.0",
    "devTools": "Chrome/Firefox"
  },
  "access": {
    "repository": "proveniq-core",
    "database": "Development instance",
    "apiKey": "Training tier"
  }
}
```

---

## 🎓 CERTIFICATION

Upon passing C100 with 95%+:

- **Title:** Proveniq Core Operator (Level 1)
- **Privileges:** Production read access, on-call eligibility
- **Validity:** 2 years
- **Renewal:** Re-certification exam or C200 completion

---

*[DEAN] Syllabus artifact complete. Proceeding to topology diagram.*
