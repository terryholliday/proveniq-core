/**
 * @file services/risk/assessor.ts
 * @description PROVENIQ Core Risk Assessment Engine
 * 
 * Provides risk scoring for:
 * - Insurance claims (claim risk)
 * - Lending decisions (loan risk)
 * - Sales/auctions (transaction risk)
 * - Custody transfers (handoff risk)
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const RiskAssessmentRequestSchema = z.object({
  assetId: z.string(),
  riskType: z.enum(['insurance', 'lending', 'sale', 'custody']),
  
  // Asset context
  category: z.string(),
  currentValue: z.number().positive(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']),
  ageYears: z.number().min(0).optional(),
  
  // Owner/party context
  ownerId: z.string(),
  ownerAccountAgeDays: z.number().min(0).optional(),
  ownerPreviousClaims: z.number().min(0).optional(),
  ownerClaimTotalValue: z.number().min(0).optional(),
  
  // Transaction context (for lending/sale)
  requestedAmount: z.number().positive().optional(),
  loanToValueRatio: z.number().min(0).max(200).optional(),
  
  // Evidence context
  hasReceipt: z.boolean().optional(),
  hasImages: z.boolean().optional(),
  imageCount: z.number().min(0).optional(),
  hasSerialNumber: z.boolean().optional(),
  ledgerEventCount: z.number().min(0).optional(),
  provenanceGrade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  
  // Anchor verification
  hasAnchorVerification: z.boolean().optional(),
  anchorType: z.enum(['tag', 'bag', 'locker']).optional(),
});

export type RiskAssessmentRequest = z.infer<typeof RiskAssessmentRequestSchema>;

export interface RiskFactor {
  factor: string;
  weight: number;
  score: number; // 0-100
  contribution: number; // weighted contribution
  description: string;
}

export interface RiskAssessmentResult {
  assessmentId: string;
  assetId: string;
  riskType: 'insurance' | 'lending' | 'sale' | 'custody';
  
  // Overall risk
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Breakdown
  factors: RiskFactor[];
  mitigatingFactors: string[];
  elevatingFactors: string[];
  
  // Recommendations
  recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REVIEW' | 'DECLINE';
  conditions: string[];
  maxApprovedAmount?: number;
  suggestedLTV?: number;
  
  // Metadata
  assessedAt: string;
  validUntilHours: number;
  modelVersion: string;
}

// ============================================
// RISK WEIGHTS BY TYPE
// ============================================

const INSURANCE_RISK_WEIGHTS = {
  ownerHistory: 0.25,
  assetCondition: 0.15,
  documentation: 0.20,
  provenance: 0.20,
  anchorVerification: 0.10,
  categoryRisk: 0.10,
};

const LENDING_RISK_WEIGHTS = {
  ltvRatio: 0.30,
  assetLiquidity: 0.20,
  ownerHistory: 0.15,
  documentation: 0.15,
  provenance: 0.10,
  anchorVerification: 0.10,
};

const SALE_RISK_WEIGHTS = {
  provenance: 0.30,
  documentation: 0.25,
  anchorVerification: 0.15,
  ownerHistory: 0.15,
  assetCondition: 0.15,
};

const CUSTODY_RISK_WEIGHTS = {
  anchorVerification: 0.35,
  provenance: 0.25,
  assetValue: 0.20,
  partyHistory: 0.20,
};

// ============================================
// CATEGORY RISK PROFILES
// ============================================

const CATEGORY_RISK_PROFILES: Record<string, {
  baseRisk: number;
  liquidityScore: number;
  theftRisk: number;
  depreciationVolatility: number;
}> = {
  electronics: { baseRisk: 40, liquidityScore: 85, theftRisk: 70, depreciationVolatility: 60 },
  jewelry: { baseRisk: 50, liquidityScore: 70, theftRisk: 90, depreciationVolatility: 20 },
  watches: { baseRisk: 45, liquidityScore: 75, theftRisk: 85, depreciationVolatility: 15 },
  furniture: { baseRisk: 25, liquidityScore: 50, theftRisk: 20, depreciationVolatility: 30 },
  appliances: { baseRisk: 30, liquidityScore: 60, theftRisk: 25, depreciationVolatility: 40 },
  vehicles: { baseRisk: 35, liquidityScore: 80, theftRisk: 60, depreciationVolatility: 45 },
  art: { baseRisk: 55, liquidityScore: 40, theftRisk: 75, depreciationVolatility: 70 },
  collectibles: { baseRisk: 50, liquidityScore: 45, theftRisk: 65, depreciationVolatility: 80 },
  clothing: { baseRisk: 35, liquidityScore: 55, theftRisk: 40, depreciationVolatility: 75 },
  musical_instruments: { baseRisk: 35, liquidityScore: 55, theftRisk: 50, depreciationVolatility: 25 },
  default: { baseRisk: 40, liquidityScore: 50, theftRisk: 50, depreciationVolatility: 50 },
};

// ============================================
// RISK ASSESSOR
// ============================================

export class RiskAssessor {
  private modelVersion = '1.0.0';

  /**
   * Assess risk for an asset based on context
   */
  async assess(request: RiskAssessmentRequest): Promise<RiskAssessmentResult> {
    const validated = RiskAssessmentRequestSchema.parse(request);
    const assessmentId = `RISK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Select risk weights based on type
    const weights = this.getWeights(validated.riskType);
    
    // Calculate individual risk factors
    const factors = this.calculateFactors(validated, weights);
    
    // Calculate overall risk score
    const riskScore = Math.round(
      factors.reduce((sum, f) => sum + f.contribution, 0)
    );
    
    // Determine risk level
    const riskLevel = this.getRiskLevel(riskScore);
    
    // Extract mitigating and elevating factors
    const mitigatingFactors = factors
      .filter(f => f.score < 30)
      .map(f => f.description);
    
    const elevatingFactors = factors
      .filter(f => f.score > 60)
      .map(f => f.description);
    
    // Generate recommendations
    const { recommendation, conditions, maxApprovedAmount, suggestedLTV } = 
      this.generateRecommendation(validated, riskScore, riskLevel);

    return {
      assessmentId,
      assetId: validated.assetId,
      riskType: validated.riskType,
      riskScore,
      riskLevel,
      factors,
      mitigatingFactors,
      elevatingFactors,
      recommendation,
      conditions,
      maxApprovedAmount,
      suggestedLTV,
      assessedAt: now,
      validUntilHours: 24,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Get risk weights for assessment type
   */
  private getWeights(riskType: string): Record<string, number> {
    switch (riskType) {
      case 'insurance': return INSURANCE_RISK_WEIGHTS;
      case 'lending': return LENDING_RISK_WEIGHTS;
      case 'sale': return SALE_RISK_WEIGHTS;
      case 'custody': return CUSTODY_RISK_WEIGHTS;
      default: return INSURANCE_RISK_WEIGHTS;
    }
  }

  /**
   * Calculate individual risk factors
   */
  private calculateFactors(
    request: RiskAssessmentRequest, 
    weights: Record<string, number>
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const categoryProfile = CATEGORY_RISK_PROFILES[request.category] || CATEGORY_RISK_PROFILES.default;

    // Owner History Risk
    if (weights.ownerHistory || weights.partyHistory) {
      const weight = weights.ownerHistory || weights.partyHistory;
      let score = 30; // Base score
      
      // Account age factor
      if (request.ownerAccountAgeDays !== undefined) {
        if (request.ownerAccountAgeDays < 30) score += 30;
        else if (request.ownerAccountAgeDays < 90) score += 15;
        else if (request.ownerAccountAgeDays > 365) score -= 10;
      }
      
      // Previous claims factor
      if (request.ownerPreviousClaims !== undefined) {
        if (request.ownerPreviousClaims > 5) score += 25;
        else if (request.ownerPreviousClaims > 2) score += 15;
        else if (request.ownerPreviousClaims === 0) score -= 10;
      }
      
      score = Math.max(0, Math.min(100, score));
      
      factors.push({
        factor: 'ownerHistory',
        weight,
        score,
        contribution: score * weight,
        description: score > 50 ? 'Owner history shows elevated risk' : 'Owner history is acceptable',
      });
    }

    // Asset Condition Risk
    if (weights.assetCondition) {
      const conditionScores: Record<string, number> = {
        new: 10,
        excellent: 20,
        good: 35,
        fair: 55,
        poor: 75,
      };
      const score = conditionScores[request.condition] || 40;
      
      factors.push({
        factor: 'assetCondition',
        weight: weights.assetCondition,
        score,
        contribution: score * weights.assetCondition,
        description: score > 50 ? 'Asset condition increases risk' : 'Asset condition is favorable',
      });
    }

    // Documentation Risk
    if (weights.documentation) {
      let score = 50; // Base score
      
      if (request.hasReceipt) score -= 15;
      if (request.hasImages && (request.imageCount || 0) >= 3) score -= 15;
      if (request.hasSerialNumber) score -= 10;
      if (!request.hasReceipt && !request.hasImages) score += 20;
      
      score = Math.max(0, Math.min(100, score));
      
      factors.push({
        factor: 'documentation',
        weight: weights.documentation,
        score,
        contribution: score * weights.documentation,
        description: score > 50 ? 'Documentation is insufficient' : 'Documentation supports claim',
      });
    }

    // Provenance Risk
    if (weights.provenance) {
      const gradeScores: Record<string, number> = {
        A: 10, B: 25, C: 45, D: 65, F: 85,
      };
      let score = gradeScores[request.provenanceGrade || 'C'] || 50;
      
      if ((request.ledgerEventCount || 0) > 10) score -= 10;
      else if ((request.ledgerEventCount || 0) === 0) score += 15;
      
      score = Math.max(0, Math.min(100, score));
      
      factors.push({
        factor: 'provenance',
        weight: weights.provenance,
        score,
        contribution: score * weights.provenance,
        description: score > 50 ? 'Provenance chain is weak' : 'Strong provenance verified',
      });
    }

    // Anchor Verification Risk
    if (weights.anchorVerification) {
      let score = request.hasAnchorVerification ? 15 : 60;
      
      if (request.anchorType === 'locker') score -= 10; // Most secure
      else if (request.anchorType === 'bag') score -= 5;
      
      score = Math.max(0, Math.min(100, score));
      
      factors.push({
        factor: 'anchorVerification',
        weight: weights.anchorVerification,
        score,
        contribution: score * weights.anchorVerification,
        description: request.hasAnchorVerification ? 'Hardware anchor verified' : 'No hardware verification',
      });
    }

    // Category Risk (for insurance)
    if (weights.categoryRisk) {
      const score = categoryProfile.baseRisk + (categoryProfile.theftRisk * 0.3);
      
      factors.push({
        factor: 'categoryRisk',
        weight: weights.categoryRisk,
        score: Math.min(score, 100),
        contribution: Math.min(score, 100) * weights.categoryRisk,
        description: `${request.category} has ${score > 50 ? 'elevated' : 'standard'} category risk`,
      });
    }

    // LTV Ratio Risk (for lending)
    if (weights.ltvRatio && request.loanToValueRatio !== undefined) {
      let score = 20;
      
      if (request.loanToValueRatio > 80) score = 70;
      else if (request.loanToValueRatio > 60) score = 50;
      else if (request.loanToValueRatio > 40) score = 35;
      
      factors.push({
        factor: 'ltvRatio',
        weight: weights.ltvRatio,
        score,
        contribution: score * weights.ltvRatio,
        description: `LTV of ${request.loanToValueRatio}% is ${score > 50 ? 'high risk' : 'acceptable'}`,
      });
    }

    // Asset Liquidity Risk (for lending)
    if (weights.assetLiquidity) {
      const score = 100 - categoryProfile.liquidityScore;
      
      factors.push({
        factor: 'assetLiquidity',
        weight: weights.assetLiquidity,
        score,
        contribution: score * weights.assetLiquidity,
        description: `${request.category} liquidity is ${score < 40 ? 'high' : score < 60 ? 'moderate' : 'low'}`,
      });
    }

    // Asset Value Risk (for custody)
    if (weights.assetValue) {
      let score = 30;
      if (request.currentValue > 50000) score = 70;
      else if (request.currentValue > 10000) score = 50;
      else if (request.currentValue > 5000) score = 40;
      
      factors.push({
        factor: 'assetValue',
        weight: weights.assetValue,
        score,
        contribution: score * weights.assetValue,
        description: `High-value asset requires ${score > 50 ? 'enhanced' : 'standard'} custody`,
      });
    }

    return factors;
  }

  /**
   * Determine risk level from score
   */
  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 30) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 70) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Generate recommendation based on risk assessment
   */
  private generateRecommendation(
    request: RiskAssessmentRequest,
    riskScore: number,
    riskLevel: string
  ): {
    recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REVIEW' | 'DECLINE';
    conditions: string[];
    maxApprovedAmount?: number;
    suggestedLTV?: number;
  } {
    const conditions: string[] = [];
    let recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REVIEW' | 'DECLINE';
    let maxApprovedAmount: number | undefined;
    let suggestedLTV: number | undefined;

    // Base recommendation on risk level
    if (riskLevel === 'LOW') {
      recommendation = 'APPROVE';
    } else if (riskLevel === 'MEDIUM') {
      recommendation = 'APPROVE_WITH_CONDITIONS';
      
      if (!request.hasReceipt) {
        conditions.push('Require receipt or proof of purchase');
      }
      if ((request.imageCount || 0) < 3) {
        conditions.push('Require minimum 3 photos');
      }
    } else if (riskLevel === 'HIGH') {
      recommendation = 'REVIEW';
      conditions.push('Manual review required');
      conditions.push('Consider anchor verification');
      
      if (request.riskType === 'lending') {
        suggestedLTV = 50; // Cap at 50%
        maxApprovedAmount = request.currentValue * 0.5;
      }
    } else {
      recommendation = 'DECLINE';
      conditions.push('Risk exceeds acceptable threshold');
      
      if (request.ownerPreviousClaims && request.ownerPreviousClaims > 5) {
        conditions.push('Owner claim history flagged');
      }
    }

    // Type-specific adjustments
    if (request.riskType === 'lending' && !suggestedLTV) {
      if (riskScore < 30) suggestedLTV = 70;
      else if (riskScore < 50) suggestedLTV = 60;
      else suggestedLTV = 50;
      
      maxApprovedAmount = request.currentValue * (suggestedLTV / 100);
    }

    if (request.riskType === 'insurance' && request.currentValue > 10000 && !request.hasAnchorVerification) {
      conditions.push('Recommend anchor verification for high-value items');
    }

    return { recommendation, conditions, maxApprovedAmount, suggestedLTV };
  }
}

// Singleton
let assessor: RiskAssessor | null = null;

export function getRiskAssessor(): RiskAssessor {
  if (!assessor) {
    assessor = new RiskAssessor();
  }
  return assessor;
}
