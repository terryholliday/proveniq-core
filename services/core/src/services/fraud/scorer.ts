/**
 * @file services/fraud/scorer.ts
 * @description PROVENIQ Core Fraud Scorer
 * 
 * Risk scoring (0-100) with signals:
 * - Velocity (how fast claims/valuations are happening)
 * - Amount anomalies (unusual values)
 * - Documentation gaps
 * - Pattern detection
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const FraudScoringRequestSchema = z.object({
  assetId: z.string(),
  userId: z.string(),
  claimType: z.enum(['insurance', 'valuation', 'sale', 'loan', 'transfer']).optional(),
  
  // Asset data
  claimedValue: z.number().positive(),
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  category: z.string(),
  
  // Documentation
  hasReceipt: z.boolean().default(false),
  hasImages: z.boolean().default(false),
  imageCount: z.number().int().min(0).default(0),
  hasSerialNumber: z.boolean().default(false),
  
  // Provenance
  provenanceScore: z.number().min(0).max(100).optional(),
  ledgerEventCount: z.number().int().min(0).default(0),
  
  // Historical context
  previousClaims: z.number().int().min(0).default(0),
  previousClaimsTotal: z.number().min(0).default(0),
  daysSinceLastClaim: z.number().int().min(0).optional(),
  accountAgeDays: z.number().int().min(0).default(0),
  
  // Location/timing
  ipAddress: z.string().optional(),
  deviceFingerprint: z.string().optional(),
  submissionTime: z.string().optional(),
});

export type FraudScoringRequest = z.infer<typeof FraudScoringRequestSchema>;

export interface FraudSignal {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weight: number;
  description: string;
}

export interface FraudScoringResult {
  assetId: string;
  userId: string;
  
  // Score
  score: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Recommendation
  recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'ESCALATE' | 'AUTO_DENY';
  
  // Signals
  signals: FraudSignal[];
  signalCount: number;
  
  // Breakdown
  breakdown: {
    velocityScore: number;
    amountScore: number;
    documentationScore: number;
    provenanceScore: number;
    patternScore: number;
  };
  
  // Metadata
  scoredAt: string;
  modelVersion: string;
}

// ============================================
// SCORER
// ============================================

export class FraudScorer {
  private readonly MODEL_VERSION = '1.0.0';
  
  /**
   * Generate fraud risk score for an asset/claim
   */
  public async score(request: FraudScoringRequest): Promise<FraudScoringResult> {
    const validated = FraudScoringRequestSchema.parse(request);
    const signals: FraudSignal[] = [];
    
    // 1. Velocity scoring
    const velocityScore = this.scoreVelocity(validated, signals);
    
    // 2. Amount scoring
    const amountScore = this.scoreAmount(validated, signals);
    
    // 3. Documentation scoring
    const documentationScore = this.scoreDocumentation(validated, signals);
    
    // 4. Provenance scoring
    const provenanceScore = this.scoreProvenance(validated, signals);
    
    // 5. Pattern scoring
    const patternScore = this.scorePatterns(validated, signals);
    
    // Calculate weighted total
    const weights = {
      velocity: 0.25,
      amount: 0.25,
      documentation: 0.20,
      provenance: 0.20,
      pattern: 0.10,
    };
    
    const totalScore = Math.round(
      velocityScore * weights.velocity +
      amountScore * weights.amount +
      documentationScore * weights.documentation +
      provenanceScore * weights.provenance +
      patternScore * weights.pattern
    );
    
    // Determine risk level and recommendation
    const { riskLevel, recommendation } = this.determineRiskLevel(totalScore, signals);
    
    return {
      assetId: validated.assetId,
      userId: validated.userId,
      score: totalScore,
      riskLevel,
      recommendation,
      signals,
      signalCount: signals.length,
      breakdown: {
        velocityScore,
        amountScore,
        documentationScore,
        provenanceScore,
        patternScore,
      },
      scoredAt: new Date().toISOString(),
      modelVersion: this.MODEL_VERSION,
    };
  }
  
  /**
   * Score velocity-related risk factors
   */
  private scoreVelocity(request: FraudScoringRequest, signals: FraudSignal[]): number {
    let score = 0;
    
    // New account with claims
    if (request.accountAgeDays < 30 && request.previousClaims > 0) {
      score += 30;
      signals.push({
        code: 'NEW_ACCOUNT_CLAIMS',
        severity: 'HIGH',
        weight: 30,
        description: 'Claims submitted from account less than 30 days old',
      });
    }
    
    // High claim frequency
    if (request.previousClaims >= 3 && request.accountAgeDays < 365) {
      score += 25;
      signals.push({
        code: 'HIGH_CLAIM_FREQUENCY',
        severity: 'MEDIUM',
        weight: 25,
        description: 'Multiple claims in short time period',
      });
    }
    
    // Very recent previous claim
    if (request.daysSinceLastClaim !== undefined && request.daysSinceLastClaim < 7) {
      score += 20;
      signals.push({
        code: 'RECENT_CLAIM',
        severity: 'MEDIUM',
        weight: 20,
        description: 'Previous claim within last 7 days',
      });
    }
    
    // New account, high value
    if (request.accountAgeDays < 7 && request.claimedValue > 5000) {
      score += 35;
      signals.push({
        code: 'NEW_ACCOUNT_HIGH_VALUE',
        severity: 'CRITICAL',
        weight: 35,
        description: 'High-value claim from brand new account',
      });
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score amount-related risk factors
   */
  private scoreAmount(request: FraudScoringRequest, signals: FraudSignal[]): number {
    let score = 0;
    
    // Claimed value far exceeds purchase price
    if (request.purchasePrice && request.claimedValue > request.purchasePrice * 1.5) {
      const ratio = request.claimedValue / request.purchasePrice;
      score += Math.min(ratio * 15, 40);
      signals.push({
        code: 'CLAIMED_EXCEEDS_PURCHASE',
        severity: ratio > 2 ? 'HIGH' : 'MEDIUM',
        weight: Math.min(ratio * 15, 40),
        description: `Claimed value is ${ratio.toFixed(1)}x purchase price`,
      });
    }
    
    // Very high value claim
    if (request.claimedValue > 50000) {
      score += 15;
      signals.push({
        code: 'HIGH_VALUE_CLAIM',
        severity: 'MEDIUM',
        weight: 15,
        description: 'Claim value exceeds $50,000 threshold',
      });
    }
    
    // Suspiciously round number
    if (request.claimedValue % 1000 === 0 && request.claimedValue >= 5000) {
      score += 10;
      signals.push({
        code: 'ROUND_NUMBER',
        severity: 'LOW',
        weight: 10,
        description: 'Claimed value is suspiciously round number',
      });
    }
    
    // Historical claim total very high
    if (request.previousClaimsTotal > 100000) {
      score += 20;
      signals.push({
        code: 'HIGH_HISTORICAL_CLAIMS',
        severity: 'HIGH',
        weight: 20,
        description: 'User has high total historical claim value',
      });
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score documentation gaps
   */
  private scoreDocumentation(request: FraudScoringRequest, signals: FraudSignal[]): number {
    let score = 0;
    
    // No receipt for high value
    if (!request.hasReceipt && request.claimedValue > 1000) {
      score += 25;
      signals.push({
        code: 'NO_RECEIPT_HIGH_VALUE',
        severity: 'MEDIUM',
        weight: 25,
        description: 'No receipt for item valued over $1,000',
      });
    }
    
    // No images
    if (!request.hasImages) {
      score += 20;
      signals.push({
        code: 'NO_IMAGES',
        severity: 'MEDIUM',
        weight: 20,
        description: 'No photos of item provided',
      });
    } else if (request.imageCount < 2) {
      score += 10;
      signals.push({
        code: 'INSUFFICIENT_IMAGES',
        severity: 'LOW',
        weight: 10,
        description: 'Only single image provided',
      });
    }
    
    // No serial number for electronics
    const electronicCategories = ['electronics', 'computers', 'smartphones', 'tablets', 'cameras'];
    if (electronicCategories.includes(request.category.toLowerCase()) && !request.hasSerialNumber) {
      score += 15;
      signals.push({
        code: 'NO_SERIAL_NUMBER',
        severity: 'MEDIUM',
        weight: 15,
        description: 'No serial number for electronic device',
      });
    }
    
    // No purchase date for old claim
    if (!request.purchaseDate && request.claimedValue > 500) {
      score += 10;
      signals.push({
        code: 'NO_PURCHASE_DATE',
        severity: 'LOW',
        weight: 10,
        description: 'Purchase date not provided',
      });
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score provenance-related factors
   */
  private scoreProvenance(request: FraudScoringRequest, signals: FraudSignal[]): number {
    let score = 0;
    
    // Low provenance score
    if (request.provenanceScore !== undefined) {
      if (request.provenanceScore < 30) {
        score += 30;
        signals.push({
          code: 'WEAK_PROVENANCE',
          severity: 'HIGH',
          weight: 30,
          description: 'Very weak provenance score (<30)',
        });
      } else if (request.provenanceScore < 50) {
        score += 15;
        signals.push({
          code: 'LOW_PROVENANCE',
          severity: 'MEDIUM',
          weight: 15,
          description: 'Low provenance score (<50)',
        });
      }
    } else {
      // No provenance data at all
      score += 20;
      signals.push({
        code: 'NO_PROVENANCE',
        severity: 'MEDIUM',
        weight: 20,
        description: 'No provenance data available',
      });
    }
    
    // No ledger events for high value
    if (request.ledgerEventCount === 0 && request.claimedValue > 5000) {
      score += 25;
      signals.push({
        code: 'NO_LEDGER_HISTORY',
        severity: 'HIGH',
        weight: 25,
        description: 'No ledger history for high-value item',
      });
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score pattern-based risk factors
   */
  private scorePatterns(request: FraudScoringRequest, signals: FraudSignal[]): number {
    let score = 0;
    
    // Submission at unusual hour (2am-5am local would need timezone)
    if (request.submissionTime) {
      const hour = new Date(request.submissionTime).getUTCHours();
      if (hour >= 2 && hour <= 5) {
        score += 10;
        signals.push({
          code: 'UNUSUAL_HOUR',
          severity: 'LOW',
          weight: 10,
          description: 'Claim submitted during unusual hours',
        });
      }
    }
    
    // Very high value category mismatch
    const lowValueCategories = ['clothing', 'small_appliances', 'home_decor', 'tools'];
    if (lowValueCategories.includes(request.category.toLowerCase()) && request.claimedValue > 10000) {
      score += 25;
      signals.push({
        code: 'CATEGORY_VALUE_MISMATCH',
        severity: 'HIGH',
        weight: 25,
        description: 'Unusually high value for category',
      });
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Determine risk level and recommendation from score
   */
  private determineRiskLevel(score: number, signals: FraudSignal[]): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'ESCALATE' | 'AUTO_DENY';
  } {
    // Check for critical signals regardless of score
    const hasCritical = signals.some(s => s.severity === 'CRITICAL');
    if (hasCritical) {
      return { riskLevel: 'CRITICAL', recommendation: 'AUTO_DENY' };
    }
    
    if (score <= 30) {
      return { riskLevel: 'LOW', recommendation: 'AUTO_APPROVE' };
    } else if (score <= 60) {
      return { riskLevel: 'MEDIUM', recommendation: 'MANUAL_REVIEW' };
    } else if (score <= 80) {
      return { riskLevel: 'HIGH', recommendation: 'ESCALATE' };
    } else {
      return { riskLevel: 'CRITICAL', recommendation: 'AUTO_DENY' };
    }
  }
}

// Singleton instance
export const fraudScorer = new FraudScorer();
