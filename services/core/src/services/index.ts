/**
 * @file services/index.ts
 * @description PROVENIQ Core Services - Central Export
 */

// Valuation
export { valuationEngine, ValuationEngine, ValuationRequestSchema } from './valuation/engine';
export type { ValuationRequest, ValuationResult } from './valuation/engine';

// Fraud
export { fraudScorer, FraudScorer, FraudScoringRequestSchema } from './fraud/scorer';
export type { FraudScoringRequest, FraudScoringResult, FraudSignal } from './fraud/scorer';

// Provenance
export { provenanceScorer, ProvenanceScorer } from './provenance/scorer';
export type { ProvenanceRequest, ProvenanceResult } from './provenance/scorer';

// Registry (PAID)
export { paidRegistry, PAIDRegistry, RegisterAssetRequestSchema } from './registry/paid';
export type { RegisterAssetRequest, PAIDRecord, OwnershipTransfer } from './registry/paid';

// Ledger
export { ledgerWriteClient, LedgerWriteClient } from './ledger/writeClient';
export type { LedgerEvent, LedgerWriteResult } from './ledger/writeClient';

// Gateway
export { 
  RateLimiter, 
  CircuitBreaker, 
  requireAuth, 
  requireRole,
  requestLogger,
  checkServiceHealth,
  registerGatewayMiddleware,
  defaultRateLimiter,
  defaultCircuitBreaker,
} from './gateway/middleware';
export type { AuthContext, ServiceHealth, RateLimitConfig, CircuitBreakerConfig } from './gateway/middleware';

// Data
export { DEPRECIATION_RATES, CONDITION_MULTIPLIERS, BRAND_PREMIUMS, getDepreciationRate, getBrandPremium } from './data/depreciation';
export { CATEGORY_TAXONOMY, getCategoryById, getSubcategoryById, mapToCanonicalCategory, getAllCategoryIds, isValidCategory } from './data/taxonomy';
export type { Category, Subcategory } from './data/taxonomy';
