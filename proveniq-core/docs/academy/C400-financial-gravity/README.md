# C400: FINANCIAL GRAVITY
## Capital Integration Track

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗██╗███╗   ██╗ █████╗ ███╗   ██╗ ██████╗██╗ █████╗ ██╗             ║
║   ██╔════╝██║████╗  ██║██╔══██╗████╗  ██║██╔════╝██║██╔══██╗██║             ║
║   █████╗  ██║██╔██╗ ██║███████║██╔██╗ ██║██║     ██║███████║██║             ║
║   ██╔══╝  ██║██║╚██╗██║██╔══██║██║╚██╗██║██║     ██║██╔══██║██║             ║
║   ██║     ██║██║ ╚████║██║  ██║██║ ╚████║╚██████╗██║██║  ██║███████╗        ║
║   ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝╚═╝  ╚═╝╚══════╝        ║
║                                                                              ║
║                      G R A V I T Y                                           ║
║                                                                              ║
║   "Money doesn't move. It falls. Control the trajectory."                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 TRACK OBJECTIVES

By the end of this track, you will be able to:

1. **Reconcile ledgers** across distributed systems
2. **Model financial waterfalls** for complex capital structures
3. **Trace every cent** through the system
4. **Generate compliance reports** that satisfy auditors
5. **Handle financial edge cases** without losing money

---

## ⏱️ TRACK DURATION: 18 HOURS

| Lesson | Topic | Duration |
|--------|-------|----------|
| 01 | Ledger Fundamentals | 4 hours |
| 02 | Transaction Integrity | 4 hours |
| 03 | Reconciliation Patterns | 4 hours |
| 04 | Compliance Reporting | 3 hours |
| LAB-001 | Loan Default Waterfalls | 1.5 hours |
| LAB-002 | Ledger Reconciliation | 1 hour |
| LAB-003 | Audit Trail Forensics | 0.5 hours |
| EXAM | C400 Assessment | Timed |

---

## ⚠️ THE WEIGHT OF MONEY

Before proceeding, understand this:

```typescript
const FINANCIAL_AXIOMS = {
  // Every cent must be accounted for
  axiom_1: "The ledger must always balance",
  
  // Money has memory
  axiom_2: "Every transaction has a source and destination",
  
  // Precision is not optional
  axiom_3: "Floating point is forbidden for money",
  
  // Time is money (literally)
  axiom_4: "Timestamps determine truth in disputes",
  
  // Auditors will find everything
  axiom_5: "If you can't prove it happened, it didn't happen"
} as const;
```

---

## 💰 THE FINANCIAL DATA MODEL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FINANCIAL DATA ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LEDGER STRUCTURE                                                           │
│  ════════════════                                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         GENERAL LEDGER                               │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   ASSETS     │  │ LIABILITIES  │  │   EQUITY     │              │   │
│  │  │              │  │              │  │              │              │   │
│  │  │ • Cash       │  │ • Payables   │  │ • Capital    │              │   │
│  │  │ • Receivables│  │ • Loans      │  │ • Retained   │              │   │
│  │  │ • Inventory  │  │ • Deposits   │  │   Earnings   │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │  FUNDAMENTAL EQUATION: Assets = Liabilities + Equity                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  TRANSACTION FLOW                                                           │
│  ════════════════                                                           │
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│  │ Request │───►│ Validate│───►│ Execute │───►│ Record  │               │
│  │         │    │         │    │         │    │         │               │
│  │ • Amount│    │ • Funds │    │ • Debit │    │ • Ledger│               │
│  │ • Parties│   │ • Limits│    │ • Credit│    │ • Audit │               │
│  │ • Type  │    │ • Auth  │    │ • Fees  │    │ • Index │               │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘               │
│       │              │              │              │                     │
│       │              │              │              │                     │
│       └──────────────┴──────────────┴──────────────┘                     │
│                           │                                              │
│                    ALL OR NOTHING                                        │
│                   (ACID Transaction)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔢 MONEY REPRESENTATION

### The Cardinal Rule

```typescript
// ❌ NEVER DO THIS
const price = 19.99;
const tax = price * 0.08;
const total = price + tax;
// Result: 21.5892 (floating point error)

// ✅ ALWAYS DO THIS
const priceInCents = 1999;
const taxInCents = Math.round(priceInCents * 0.08);
const totalInCents = priceInCents + taxInCents;
// Result: 2159 cents = $21.59
```

### Money Type Definition

```typescript
// lib/financial/money.ts

export interface Money {
  amount: bigint;        // Amount in smallest unit (cents)
  currency: Currency;    // ISO 4217 currency code
  precision: number;     // Decimal places (2 for USD, 0 for JPY)
}

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CAD";

export const CURRENCY_PRECISION: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CAD: 2,
};

export function createMoney(
  amount: number | string,
  currency: Currency
): Money {
  const precision = CURRENCY_PRECISION[currency];
  const multiplier = 10 ** precision;
  
  // Convert to smallest unit
  const amountInSmallestUnit = BigInt(
    Math.round(Number(amount) * multiplier)
  );
  
  return {
    amount: amountInSmallestUnit,
    currency,
    precision,
  };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error("Cannot add different currencies");
  }
  
  return {
    amount: a.amount + b.amount,
    currency: a.currency,
    precision: a.precision,
  };
}

export function formatMoney(money: Money): string {
  const divisor = BigInt(10 ** money.precision);
  const whole = money.amount / divisor;
  const fraction = money.amount % divisor;
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
  }).format(Number(whole) + Number(fraction) / Number(divisor));
}
```

---

## 📚 LESSON OVERVIEW

### Lesson 01: Ledger Fundamentals
*File: `01-ledger-fundamentals.md`*

You will learn:
- Double-entry bookkeeping
- Chart of accounts design
- Journal entries
- Trial balance
- Account reconciliation

**Key Concept:** Every debit has a credit. Always.

---

### Lesson 02: Transaction Integrity
*File: `02-transaction-integrity.md`*

You will learn:
- ACID properties for financial transactions
- Idempotency keys
- Optimistic locking
- Saga patterns for distributed transactions
- Rollback strategies

**Key Concept:** A partial transaction is worse than no transaction.

---

### Lesson 03: Reconciliation Patterns
*File: `03-reconciliation-patterns.md`*

You will learn:
- Bank reconciliation
- Inter-system reconciliation
- Variance detection
- Exception handling
- Automated vs manual reconciliation

**Key Concept:** Trust, but verify. Then verify again.

---

### Lesson 04: Compliance Reporting
*File: `04-compliance-reporting.md`*

You will learn:
- Regulatory requirements (SOX, GDPR, etc.)
- Audit trail requirements
- Report generation
- Data retention policies
- Evidence preservation

**Key Concept:** The auditor is not your enemy. Incomplete records are.

---

## 🔬 LABS

### LAB-001: Loan Default Waterfalls
*File: `labs/LAB-001-default-waterfalls.md`*

**Scenario:** A borrower defaults on a $1M loan with multiple tranches and investors.

**Your Mission:**
1. Model the capital structure (senior, mezzanine, equity)
2. Calculate loss allocation per tranche
3. Execute the waterfall distribution
4. Generate investor statements
5. Reconcile all accounts to zero

**Success Criteria:**
- All losses allocated correctly
- Waterfall follows priority rules
- Every cent accounted for
- Audit trail complete

---

### LAB-002: Ledger Reconciliation
*File: `labs/LAB-002-ledger-reconciliation.md`*

**Scenario:** Month-end close. The ledger is off by $0.01 across 10 million transactions.

**Your Mission:**
1. Identify the source of the discrepancy
2. Trace the error to specific transactions
3. Determine if it's rounding or data error
4. Propose and implement correction
5. Prevent future occurrences

**Success Criteria:**
- Discrepancy identified
- Root cause documented
- Correction applied
- Prevention measure implemented

---

### LAB-003: Audit Trail Forensics
*File: `labs/LAB-003-audit-forensics.md`*

**Scenario:** An auditor asks: "Show me every change to Account #12345 in Q3."

**Your Mission:**
1. Query the audit log for all relevant events
2. Reconstruct the account state at any point in time
3. Identify who made each change and why
4. Generate a compliance-ready report
5. Answer auditor follow-up questions

**Success Criteria:**
- Complete audit trail retrieved
- Point-in-time reconstruction accurate
- Report meets compliance standards
- All questions answered with evidence

---

## 📊 ASSESSMENT CRITERIA

The C400 exam tests:

| Category | Weight | Topics |
|----------|--------|--------|
| Ledger Knowledge | 25% | Double-entry, accounts, balancing |
| Transaction Integrity | 30% | ACID, idempotency, rollback |
| Reconciliation | 25% | Variance, exceptions, automation |
| Compliance | 20% | Reporting, audit trails, retention |

**Passing Score: 95%**

---

## 🚨 FINANCIAL INCIDENT SIMULATION

At the end of this track, you will face a simulated financial crisis:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🚨 INCIDENT: FIN-2024-001                                 │
│                                                              │
│   Severity: SEV-1 (CRITICAL)                                │
│   Status: ACTIVE                                            │
│   Duration: 00:00:00                                        │
│                                                              │
│   Description:                                              │
│   Month-end close failed. General ledger shows              │
│   $47,832.19 variance between assets and liabilities.       │
│   CFO needs resolution before board meeting in 4 hours.     │
│                                                              │
│   Known Facts:                                               │
│   - 2.3M transactions processed this month                  │
│   - New payment processor integrated on the 15th            │
│   - Three manual journal entries on the 28th                │
│   - Currency conversion batch ran twice on the 30th         │
│                                                              │
│   Your Role: Financial Systems Engineer                     │
│   Your Task: Find and fix the variance                      │
│                                                              │
│   Clock starts now.                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

You will be graded on:
- Time to identify root cause
- Accuracy of correction
- Audit trail preservation
- Communication to stakeholders
- Prevention recommendations

---

## 🔑 KEY FINANCIAL COMPONENTS

### Files You Must Know

```
lib/
├── financial/
│   ├── money.ts              # Money type and operations
│   ├── ledger.ts             # Ledger operations
│   ├── transactions.ts       # Transaction processing
│   ├── reconciliation.ts     # Reconciliation logic
│   └── waterfall.ts          # Distribution waterfalls
├── reports/
│   ├── templates/            # Report templates
│   └── generator.ts          # Report generation
├── compliance/
│   ├── config.ts             # Compliance settings
│   └── gdpr.ts               # GDPR operations
└── audit.ts                  # Audit logging
```

### Critical Financial Functions

```typescript
// You must understand these functions completely

// Money Operations
createMoney(amount, currency)      // Create money object
addMoney(a, b)                     // Add money safely
subtractMoney(a, b)                // Subtract money safely
multiplyMoney(money, factor)       // Multiply (for interest, etc.)
allocateMoney(money, ratios)       // Split without losing cents

// Ledger Operations
createJournalEntry(entries)        // Record transaction
postToLedger(journalEntry)         // Update account balances
getAccountBalance(accountId, date) // Point-in-time balance
getTrialBalance(date)              // All accounts summary

// Reconciliation
reconcileAccounts(internal, external)  // Compare balances
identifyVariances(reconciliation)      // Find differences
resolveVariance(varianceId, resolution) // Fix discrepancy

// Compliance
generateComplianceReport(orgId, period) // Create report
exportAuditTrail(query)                 // Extract audit data
```

---

## 📋 CHECKLIST

Before proceeding to the exam:

- [ ] Completed Lesson 01: Ledger Fundamentals
- [ ] Completed Lesson 02: Transaction Integrity
- [ ] Completed Lesson 03: Reconciliation Patterns
- [ ] Completed Lesson 04: Compliance Reporting
- [ ] Completed LAB-001: Loan Default Waterfalls
- [ ] Completed LAB-002: Ledger Reconciliation
- [ ] Completed LAB-003: Audit Trail Forensics
- [ ] Can explain double-entry bookkeeping
- [ ] Can handle money without floating point
- [ ] Can reconcile a ledger variance

---

## 🎯 BEGIN

Start with Lesson 01:

**[→ 01-ledger-fundamentals.md](./01-ledger-fundamentals.md)**

---

*"In finance, close enough is never close enough."*

— Antigravity Academy
