/**
 * @file services/provenance/scorer.ts
 * @description PROVENIQ Core Provenance Scorer
 * 
 * Evidence quality assessment (0-100):
 * - Chain completeness (ownership history)
 * - Evidence quality (photos, receipts, documents)
 * - Ledger verification
 * - Source credibility
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const ProvenanceRequestSchema = z.object({
  assetId: z.string(),
  
  // Evidence
  hasReceipt: z.boolean().default(false),
  receiptVerified: z.boolean().default(false),
  imageCount: z.number().int().min(0).default(0),
  imagesHashed: z.boolean().default(false),
  hasSerialNumber: z.boolean().default(false),
  serialVerified: z.boolean().default(false),
  hasAppraisal: z.boolean().default(false),
  appraisalAge: z.number().int().optional(), // Days since appraisal
  
  // Ownership chain
  ownershipEvents: z.number().int().min(0).default(0),
  transfersDocumented: z.number().int().min(0).default(0),
  currentOwnershipDays: z.number().int().min(0).default(0),
  
  // Ledger data
  ledgerEventCount: z.number().int().min(0).default(0),
  ledgerChainIntact: z.boolean().default(true),
  lastLedgerEvent: z.string().optional(), // ISO date
  
  // Source credibility
  sourceApp: z.enum(['home', 'properties', 'ops', 'bids', 'claimsiq', 'external']).optional(),
  userVerified: z.boolean().default(false),
  anchorBound: z.boolean().default(false),
});

export type ProvenanceRequest = z.infer<typeof ProvenanceRequestSchema>;

export interface ProvenanceResult {
  assetId: string;
  
  // Score
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Breakdown
  breakdown: {
    evidenceScore: number;      // Quality of documentation
    chainScore: number;         // Ownership chain completeness
    ledgerScore: number;        // Ledger verification
    credibilityScore: number;   // Source credibility
  };
  
  // Details
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // Metadata
  scoredAt: string;
  validUntil: string;
}

// ============================================
// SCORER
// ============================================

export class ProvenanceScorer {
  /**
   * Score provenance for an asset
   */
  public async score(request: ProvenanceRequest): Promise<ProvenanceResult> {
    const validated = ProvenanceRequestSchema.parse(request);
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    
    // 1. Evidence scoring
    const evidenceScore = this.scoreEvidence(validated, strengths, weaknesses, recommendations);
    
    // 2. Chain scoring
    const chainScore = this.scoreChain(validated, strengths, weaknesses, recommendations);
    
    // 3. Ledger scoring
    const ledgerScore = this.scoreLedger(validated, strengths, weaknesses, recommendations);
    
    // 4. Credibility scoring
    const credibilityScore = this.scoreCredibility(validated, strengths, weaknesses, recommendations);
    
    // Calculate weighted total
    const weights = {
      evidence: 0.30,
      chain: 0.25,
      ledger: 0.30,
      credibility: 0.15,
    };
    
    const totalScore = Math.round(
      evidenceScore * weights.evidence +
      chainScore * weights.chain +
      ledgerScore * weights.ledger +
      credibilityScore * weights.credibility
    );
    
    const grade = this.scoreToGrade(totalScore);
    const confidence = this.determineConfidence(totalScore, validated);
    
    const now = new Date();
    
    return {
      assetId: validated.assetId,
      score: totalScore,
      grade,
      confidence,
      breakdown: {
        evidenceScore,
        chainScore,
        ledgerScore,
        credibilityScore,
      },
      strengths,
      weaknesses,
      recommendations,
      scoredAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    };
  }
  
  /**
   * Score evidence quality
   */
  private scoreEvidence(
    request: ProvenanceRequest,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[]
  ): number {
    let score = 0;
    
    // Receipt (30 points max)
    if (request.hasReceipt) {
      score += 20;
      if (request.receiptVerified) {
        score += 10;
        strengths.push('Verified purchase receipt');
      } else {
        score += 5;
        strengths.push('Purchase receipt on file');
        recommendations.push('Verify receipt authenticity for higher score');
      }
    } else {
      weaknesses.push('No purchase receipt');
      recommendations.push('Add purchase receipt to strengthen provenance');
    }
    
    // Images (30 points max)
    if (request.imageCount > 0) {
      const imagePoints = Math.min(request.imageCount * 5, 20);
      score += imagePoints;
      
      if (request.imagesHashed) {
        score += 10;
        strengths.push(`${request.imageCount} hashed photos on file`);
      } else {
        strengths.push(`${request.imageCount} photos on file`);
        recommendations.push('Hash images for tamper-proof evidence');
      }
    } else {
      weaknesses.push('No photos documented');
      recommendations.push('Add at least 3 photos from multiple angles');
    }
    
    // Serial number (20 points max)
    if (request.hasSerialNumber) {
      score += 12;
      if (request.serialVerified) {
        score += 8;
        strengths.push('Verified serial number');
      } else {
        strengths.push('Serial number recorded');
        recommendations.push('Verify serial with manufacturer');
      }
    }
    
    // Appraisal (20 points max)
    if (request.hasAppraisal) {
      const ageMonths = (request.appraisalAge || 0) / 30;
      if (ageMonths < 12) {
        score += 20;
        strengths.push('Recent professional appraisal');
      } else if (ageMonths < 36) {
        score += 12;
        strengths.push('Professional appraisal (aging)');
        recommendations.push('Update appraisal for current market value');
      } else {
        score += 5;
        weaknesses.push('Appraisal is outdated');
        recommendations.push('Get new appraisal - current one is over 3 years old');
      }
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score ownership chain completeness
   */
  private scoreChain(
    request: ProvenanceRequest,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[]
  ): number {
    let score = 0;
    
    // Ownership duration (30 points max)
    const yearOwned = request.currentOwnershipDays / 365;
    if (yearOwned >= 5) {
      score += 30;
      strengths.push(`Long-term ownership (${Math.round(yearOwned)} years)`);
    } else if (yearOwned >= 1) {
      score += 20;
      strengths.push(`Established ownership (${Math.round(yearOwned)} years)`);
    } else if (yearOwned >= 0.25) {
      score += 10;
    } else {
      score += 5;
      weaknesses.push('Recent acquisition');
    }
    
    // Ownership events documented (40 points max)
    if (request.ownershipEvents > 0) {
      const eventPoints = Math.min(request.ownershipEvents * 10, 30);
      score += eventPoints;
      
      // Transfer documentation
      if (request.transfersDocumented > 0) {
        score += Math.min(request.transfersDocumented * 5, 10);
        strengths.push(`${request.transfersDocumented} ownership transfers documented`);
      }
    } else {
      weaknesses.push('No ownership events recorded');
      recommendations.push('Document acquisition and any transfers');
    }
    
    // Anchor binding (30 points)
    if (request.anchorBound) {
      score += 30;
      strengths.push('Physical anchor bound to asset');
    } else {
      recommendations.push('Bind a PROVENIQ Anchor for maximum provenance');
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score ledger verification
   */
  private scoreLedger(
    request: ProvenanceRequest,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[]
  ): number {
    let score = 0;
    
    // Ledger events (50 points max)
    if (request.ledgerEventCount > 0) {
      const eventPoints = Math.min(request.ledgerEventCount * 5, 40);
      score += eventPoints;
      strengths.push(`${request.ledgerEventCount} events in ledger`);
      
      // Recency bonus
      if (request.lastLedgerEvent) {
        const daysSinceEvent = (Date.now() - new Date(request.lastLedgerEvent).getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceEvent < 30) {
          score += 10;
          strengths.push('Recent ledger activity');
        }
      }
    } else {
      weaknesses.push('No ledger history');
      recommendations.push('Register asset in PROVENIQ Ledger');
    }
    
    // Chain integrity (50 points)
    if (request.ledgerChainIntact) {
      score += 50;
      if (request.ledgerEventCount > 0) {
        strengths.push('Ledger chain integrity verified');
      }
    } else {
      weaknesses.push('Ledger chain integrity compromised');
      recommendations.push('Investigate ledger chain integrity issue');
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Score source credibility
   */
  private scoreCredibility(
    request: ProvenanceRequest,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[]
  ): number {
    let score = 50; // Base credibility
    
    // Source app credibility
    const sourceCredibility: Record<string, number> = {
      home: 20,
      properties: 25,
      ops: 25,
      bids: 30,      // Auction verification
      claimsiq: 15,  // Claims context
      external: 0,
    };
    
    if (request.sourceApp) {
      score += sourceCredibility[request.sourceApp] || 0;
      if (request.sourceApp !== 'external') {
        strengths.push(`Documented via PROVENIQ ${request.sourceApp.charAt(0).toUpperCase() + request.sourceApp.slice(1)}`);
      }
    }
    
    // User verification
    if (request.userVerified) {
      score += 20;
      strengths.push('User identity verified');
    } else {
      recommendations.push('Complete identity verification');
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Convert score to letter grade
   */
  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
  
  /**
   * Determine confidence level
   */
  private determineConfidence(score: number, request: ProvenanceRequest): 'HIGH' | 'MEDIUM' | 'LOW' {
    // High confidence requires strong evidence
    if (score >= 80 && request.ledgerEventCount >= 3 && request.hasReceipt) {
      return 'HIGH';
    }
    
    if (score >= 60 && (request.ledgerEventCount > 0 || request.hasReceipt)) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }
}

// Singleton instance
export const provenanceScorer = new ProvenanceScorer();
