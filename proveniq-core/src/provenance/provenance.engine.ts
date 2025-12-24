import { ProvenanceScoreInput, ProvenanceScoreOutput } from './types';

/**
 * PROVENIQ CORE - PROVENANCE ENGINE
 * 
 * The authoritative engine for calculating trust scores for physical assets.
 * Logic extracted from ClaimsIQ to ensure consistent scoring across the ecosystem.
 */
export class ProvenanceEngine {
  
  /**
   * Calculate the official Proveniq Provenance Score
   */
  public calculateScore(input: ProvenanceScoreInput): ProvenanceScoreOutput {
    let rawScore = 0;
    const factors = {
      documentation: 0,
      verification: 0,
      history: 0
    };
    const fraudFlags: string[] = [];

    // 1. Documentation Factor (Max 40)
    if (input.photoCount >= 4) factors.documentation += 20;
    else if (input.photoCount >= 1) factors.documentation += 10;

    if (input.receiptCount >= 1) factors.documentation += 20;
    
    // 2. Verification Factor (Max 40)
    if (input.genomeVerified) factors.verification += 25;
    if (input.warrantyCount >= 1) factors.verification += 15;

    // 3. History Factor (Max 20)
    // Penalize excessive transfers
    if (input.ownershipTransfers === 0) factors.history += 20; // Original owner
    else if (input.ownershipTransfers <= 2) factors.history += 15;
    else if (input.ownershipTransfers <= 5) factors.history += 10;
    else factors.history += 5;

    // Recency penalty
    const lastVerified = new Date(input.lastVerifiedAt);
    const daysSinceVerification = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVerification > 365) {
      fraudFlags.push('STALE_VERIFICATION');
      factors.history = Math.max(0, factors.history - 10);
    }

    // Total Score
    rawScore = factors.documentation + factors.verification + factors.history;
    const score = Math.min(100, Math.max(0, rawScore));

    // Fraud Flags
    if (input.ownershipTransfers > 3 && daysSinceVerification < 30) {
      fraudFlags.push('HIGH_VELOCITY_TRANSFER');
    }
    if (!input.genomeVerified && input.documentedValue > 5000) {
      fraudFlags.push('HIGH_VALUE_UNVERIFIED');
    }

    return {
      score,
      rating: this.getRating(score),
      claimReadiness: this.getClaimReadiness(score, input),
      factors,
      fraudFlags
    };
  }

  private getRating(score: number): ProvenanceScoreOutput['rating'] {
    if (score >= 90) return 'PLATINUM';
    if (score >= 75) return 'GOLD';
    if (score >= 50) return 'SILVER';
    if (score >= 25) return 'BRONZE';
    return 'UNRATED';
  }

  private getClaimReadiness(score: number, input: ProvenanceScoreInput): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Claim readiness is stricter than just the raw score
    // Requires specific evidence types
    if (input.photoCount >= 4 && input.receiptCount >= 1 && score >= 70) return 'HIGH';
    if (input.photoCount >= 2 && score >= 50) return 'MEDIUM';
    return 'LOW';
  }
}

export const provenanceEngine = new ProvenanceEngine();
