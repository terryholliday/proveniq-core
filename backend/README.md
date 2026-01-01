# PROVENIQ Core Backend

**The Trust Kernel — Asset Intelligence & API Gateway**

Central intelligence hub for the PROVENIQ ecosystem. Provides valuation, fraud scoring, asset registry, and inter-app orchestration.

## Architecture

```
All Apps → CORE → Ledger
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
Valuation  Fraud    Asset
 Engine   Scoring  Registry
```

## Tech Stack

- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL + SQLAlchemy async
- **Auth:** Firebase Admin SDK
- **Port:** 8000

## Quick Start

```bash
cd proveniq-core/backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with DATABASE_URL, FIREBASE_PROJECT_ID
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Valuation Engine
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/valuations` | Generate asset valuation |
| `GET` | `/v1/valuations/{id}` | Get valuation by ID |

### Fraud Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/fraud/score` | Score entity for fraud risk |
| `GET` | `/v1/fraud/score/{id}` | Get score by ID |

### Asset Registry
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/assets` | Register asset, get PAID |
| `GET` | `/v1/assets/{paid}` | Get asset by PAID |
| `GET` | `/v1/assets` | List assets (filter by owner, source) |
| `POST` | `/v1/assets/{paid}/anchor` | Bind anchor to asset |
| `POST` | `/v1/assets/{paid}/transfer` | Transfer ownership |
| `PATCH` | `/v1/assets/{paid}/valuation` | Update valuation |

### API Gateway
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/gateway/health` | Check all services |
| `GET` | `/v1/gateway/health/{service}` | Check specific service |
| `POST` | `/v1/gateway/protect/quote` | Get insurance quote |
| `POST` | `/v1/gateway/transit/shipment` | Create shipment |
| `POST` | `/v1/gateway/protect/claim` | Submit claim |
| `GET` | `/v1/gateway/ledger/asset/{id}/events` | Get asset events |

### Legacy (Inspection)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/magic-link/request` | Request tenant invite |
| `POST` | `/inspections/{id}/evidence/presign` | Get upload URL |
| `POST` | `/inspections/{id}/evidence/confirm` | Confirm upload |
| `POST` | `/inspections/{id}/submit` | Submit inspection |
| `GET` | `/inspections/{id}/certificate.pdf` | Get certificate |

## Valuation Engine

```
Inputs: asset_type, brand, model, condition, age, purchase_price, images
    ↓
Base Value (purchase price or category estimate)
    ↓
Depreciation (category-specific rates)
    ↓
Condition Adjustment (new=1.0, poor=0.25)
    ↓
Confidence Scoring (input quality)
    ↓
Bias Detection (flags for review)
    ↓
Output: estimated_value, range, confidence, bias_flags
```

### Depreciation Rates
| Category | Annual Rate |
|----------|-------------|
| Electronics | 25% |
| Clothing | 30% |
| Tools | 15% |
| Furniture | 10% |
| Appliances | 12% |
| Jewelry | 2% |
| Collectibles | -5% (appreciates) |

## Fraud Scoring

```
Score: 0-100 (higher = more risky)

Risk Levels:
- LOW (0-30): Auto-approve allowed
- MEDIUM (31-60): Manual review required
- HIGH (61-80): Escalate to senior
- CRITICAL (81-100): Auto-deny recommended
```

### Signal Types
- **VELOCITY:** Too many claims/transactions
- **AMOUNT:** Unusual amounts
- **TIMING:** Suspicious timing
- **DOCUMENTATION:** Missing/inconsistent evidence
- **HISTORY:** Past fraud indicators

## Asset Registry (PAID)

Every asset in PROVENIQ gets a **PROVENIQ Asset ID (PAID)**:
- UUID format
- Canonical identifier across all apps
- Links to Ledger event history
- Binds to Anchors
- Tracks ownership transfers

## Service URLs

| Service | URL |
|---------|-----|
| Ledger | http://localhost:8006/api/v1 |
| Anchors | http://localhost:8005/api/v1 |
| Protect | http://localhost:3003/api |
| Transit | http://localhost:3004/api |
| Home | http://localhost:9003/api |
| Properties | http://localhost:8001/api/v1 |
| Ops | http://localhost:8002/api/v1 |

## Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://...
FIREBASE_PROJECT_ID=proveniq-core
GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
LEDGER_API_URL=http://localhost:8006/api/v1
ALLOWED_ORIGINS=http://localhost:3000
```

## License

Proprietary — PROVENIQ Inc.
