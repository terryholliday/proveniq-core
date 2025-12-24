
# PROVENIQ CORE RESTRUCTURE REPORT

## 1. Architecture Update
- **Root:** Flattened. `proveniq-core` package is now the root workspace.
- **Service:** `services/core` contains the TypeScript backend.
- **Legacy:** moved to `archive/_legacy_ui` and `archive/_legacy_python_backend`.

## 2. Widget Protocol (v1.0)
Defined in `services/core/src/domain/schemas.ts`.
- **Enforced via Zod:** No `any`. Strict `IntString` for currency.
- **Widgets:**
  - `VALUATION_SUMMARY`
  - `CUSTODY_STATUS`
  - `PROVENANCE_TIMELINE`

## 3. Read-Only Enforcement
- **Ledger Client:** `readClient.ts` only exports `getEventStreamByAssetId`.
- **Modes:** `CORE_LEDGER_MODE=mock` (active) / `ledger` (stubbed).
- **Fixtures:** `ASSET-MOCK-1.json` active for verification.

## 4. Verification
- **Build:** `npm run build` PASSED.
- **Runtime:** Server listens on 3010.
- **Endpoint:** `GET /api/v1/assets/ASSET-MOCK-1` returns standard envelope.

## 5. Next Steps
- Implement `CORE_LEDGER_MODE=ledger` when a real Ledger Read API is available.
- Connect Frontend (Ops) to `http://localhost:3010`.
