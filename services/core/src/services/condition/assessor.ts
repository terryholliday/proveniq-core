/**
 * @file services/condition/assessor.ts
 * @description PROVENIQ Core Condition Assessment Engine (P1)
 * 
 * AI-powered condition analysis from photos:
 * - Damage detection (scratches, dents, wear)
 * - Condition grading (new → poor)
 * - Confidence scoring
 * - Before/after comparison
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const ConditionAssessmentRequestSchema = z.object({
  assetId: z.string(),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  category: z.string(),
  subcategory: z.string().optional(),
  context: z.enum(['initial', 'claim', 'inspection', 'sale', 'service']).default('initial'),
  previousCondition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).optional(),
  compareToImageUrls: z.array(z.string().url()).optional(), // For before/after
});

export type ConditionAssessmentRequest = z.infer<typeof ConditionAssessmentRequestSchema>;

export interface DamageDetection {
  type: string; // scratch, dent, crack, stain, tear, rust, wear, missing_part
  severity: 'minor' | 'moderate' | 'severe';
  location: string; // top, bottom, left, right, front, back, corner
  confidence: number; // 0-100
  affectsValue: boolean;
  valueImpactPercent: number; // negative = reduces value
}

export interface ConditionAssessmentResult {
  assetId: string;
  assessmentId: string;
  
  // Overall condition
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  conditionScore: number; // 0-100 (100 = pristine)
  confidenceScore: number; // 0-100
  
  // Damage analysis
  damageDetected: boolean;
  damages: DamageDetection[];
  totalDamageCount: number;
  
  // Value impact
  estimatedValueImpact: number; // Percentage change from baseline
  conditionMultiplier: number; // 0.1 - 1.2
  
  // Comparison (if before/after provided)
  comparison?: {
    previousCondition: string;
    currentCondition: string;
    deteriorationScore: number; // 0-100 (higher = more damage)
    newDamages: DamageDetection[];
    recommendation: 'no_action' | 'minor_repair' | 'major_repair' | 'claim_recommended';
  };
  
  // AI reasoning
  analysisNotes: string[];
  
  // Metadata
  imagesAnalyzed: number;
  assessedAt: string;
  modelVersion: string;
}

// ============================================
// CONDITION GRADING
// ============================================

const CONDITION_THRESHOLDS = {
  new: { min: 95, multiplier: 1.0 },
  excellent: { min: 85, multiplier: 0.95 },
  good: { min: 70, multiplier: 0.85 },
  fair: { min: 50, multiplier: 0.70 },
  poor: { min: 0, multiplier: 0.50 },
};

const DAMAGE_SEVERITY_IMPACT = {
  minor: -2,
  moderate: -8,
  severe: -20,
};

// Category-specific damage patterns
const CATEGORY_DAMAGE_PATTERNS: Record<string, string[]> = {
  electronics: ['scratch', 'crack', 'dent', 'screen_damage', 'port_damage', 'battery_swell'],
  furniture: ['scratch', 'stain', 'tear', 'crack', 'wobble', 'missing_part', 'water_damage'],
  jewelry: ['scratch', 'tarnish', 'missing_stone', 'bent', 'broken_clasp'],
  clothing: ['tear', 'stain', 'fade', 'pilling', 'hole', 'zipper_damage'],
  appliances: ['dent', 'rust', 'crack', 'missing_part', 'discoloration', 'corrosion'],
  vehicles: ['dent', 'scratch', 'rust', 'crack', 'paint_chip', 'glass_damage', 'tire_wear'],
  art: ['tear', 'fade', 'water_damage', 'frame_damage', 'foxing', 'crack'],
  collectibles: ['scratch', 'chip', 'fade', 'crack', 'missing_part', 'discoloration'],
  tools: ['rust', 'crack', 'dull', 'missing_part', 'wear', 'handle_damage'],
  sports: ['tear', 'crack', 'dent', 'string_damage', 'grip_wear', 'frame_damage'],
  musical: ['crack', 'dent', 'scratch', 'string_damage', 'key_damage', 'finish_damage'],
};

// ============================================
// CONDITION ASSESSOR
// ============================================

export class ConditionAssessor {
  private modelVersion = '1.0.0';

  /**
   * Assess condition from photos
   */
  public async assess(request: ConditionAssessmentRequest): Promise<ConditionAssessmentResult> {
    const validated = ConditionAssessmentRequestSchema.parse(request);
    const assessmentId = `CA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Analyze images for damage
    const damages = await this.analyzeImages(validated.imageUrls, validated.category);
    
    // Calculate condition score
    const conditionScore = this.calculateConditionScore(damages);
    const condition = this.scoreToCondition(conditionScore);
    const conditionMultiplier = CONDITION_THRESHOLDS[condition].multiplier;

    // Calculate confidence based on image count and clarity
    const confidenceScore = this.calculateConfidence(validated.imageUrls.length, damages);

    // Calculate value impact
    const estimatedValueImpact = this.calculateValueImpact(damages, condition);

    // Generate comparison if before/after images provided
    let comparison: ConditionAssessmentResult['comparison'] | undefined;
    if (validated.compareToImageUrls && validated.previousCondition) {
      comparison = await this.compareConditions(
        validated.previousCondition,
        condition,
        damages,
        validated.compareToImageUrls
      );
    }

    // Generate analysis notes
    const analysisNotes = this.generateNotes(damages, condition, validated.category);

    return {
      assetId: validated.assetId,
      assessmentId,
      condition,
      conditionScore,
      confidenceScore,
      damageDetected: damages.length > 0,
      damages,
      totalDamageCount: damages.length,
      estimatedValueImpact,
      conditionMultiplier,
      comparison,
      analysisNotes,
      imagesAnalyzed: validated.imageUrls.length,
      assessedAt: now,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Analyze images for damage (mock AI vision)
   * In production, this would call Gemini/GPT-4V
   */
  private async analyzeImages(imageUrls: string[], category: string): Promise<DamageDetection[]> {
    const damages: DamageDetection[] = [];
    const patterns = CATEGORY_DAMAGE_PATTERNS[category.toLowerCase()] || 
                     CATEGORY_DAMAGE_PATTERNS['electronics'];

    // Mock: Simulate AI detection based on image count
    // More images = more thorough analysis = more potential finds
    const detectionProbability = Math.min(0.3 + (imageUrls.length * 0.1), 0.8);
    
    // Simulate finding 0-3 issues
    const issueCount = Math.random() < detectionProbability 
      ? Math.floor(Math.random() * 3) 
      : 0;

    for (let i = 0; i < issueCount; i++) {
      const damageType = patterns[Math.floor(Math.random() * patterns.length)];
      const severity = this.randomSeverity();
      const location = this.randomLocation();
      
      damages.push({
        type: damageType,
        severity,
        location,
        confidence: 70 + Math.floor(Math.random() * 25),
        affectsValue: severity !== 'minor',
        valueImpactPercent: DAMAGE_SEVERITY_IMPACT[severity],
      });
    }

    return damages;
  }

  /**
   * Calculate overall condition score
   */
  private calculateConditionScore(damages: DamageDetection[]): number {
    let score = 100;
    
    for (const damage of damages) {
      score += DAMAGE_SEVERITY_IMPACT[damage.severity];
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Convert score to condition grade
   */
  private scoreToCondition(score: number): 'new' | 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= CONDITION_THRESHOLDS.new.min) return 'new';
    if (score >= CONDITION_THRESHOLDS.excellent.min) return 'excellent';
    if (score >= CONDITION_THRESHOLDS.good.min) return 'good';
    if (score >= CONDITION_THRESHOLDS.fair.min) return 'fair';
    return 'poor';
  }

  /**
   * Calculate confidence in assessment
   */
  private calculateConfidence(imageCount: number, damages: DamageDetection[]): number {
    // Base confidence from image count
    let confidence = Math.min(50 + (imageCount * 10), 80);
    
    // Boost from consistent damage detections
    if (damages.length > 0) {
      const avgDamageConfidence = damages.reduce((sum, d) => sum + d.confidence, 0) / damages.length;
      confidence = Math.min(confidence + (avgDamageConfidence * 0.2), 95);
    }
    
    return Math.round(confidence);
  }

  /**
   * Calculate total value impact
   */
  private calculateValueImpact(damages: DamageDetection[], condition: string): number {
    if (damages.length === 0) return 0;
    
    const damageImpact = damages
      .filter(d => d.affectsValue)
      .reduce((sum, d) => sum + d.valueImpactPercent, 0);
    
    return Math.max(-50, damageImpact); // Cap at 50% reduction
  }

  /**
   * Compare before/after conditions
   */
  private async compareConditions(
    previousCondition: string,
    currentCondition: string,
    currentDamages: DamageDetection[],
    _beforeImageUrls: string[]
  ): Promise<ConditionAssessmentResult['comparison']> {
    const previousScore = CONDITION_THRESHOLDS[previousCondition as keyof typeof CONDITION_THRESHOLDS]?.min || 70;
    const currentScore = CONDITION_THRESHOLDS[currentCondition as keyof typeof CONDITION_THRESHOLDS]?.min || 70;
    
    const deteriorationScore = Math.max(0, previousScore - currentScore);
    
    // Determine recommendation
    let recommendation: 'no_action' | 'minor_repair' | 'major_repair' | 'claim_recommended' = 'no_action';
    if (deteriorationScore > 30) {
      recommendation = 'claim_recommended';
    } else if (deteriorationScore > 15) {
      recommendation = 'major_repair';
    } else if (deteriorationScore > 5) {
      recommendation = 'minor_repair';
    }

    return {
      previousCondition,
      currentCondition,
      deteriorationScore,
      newDamages: currentDamages, // In production, would diff against before
      recommendation,
    };
  }

  /**
   * Generate human-readable analysis notes
   */
  private generateNotes(damages: DamageDetection[], condition: string, category: string): string[] {
    const notes: string[] = [];
    
    if (damages.length === 0) {
      notes.push(`No visible damage detected. Asset appears to be in ${condition} condition.`);
    } else {
      notes.push(`Detected ${damages.length} area(s) of concern.`);
      
      const severeCounts = {
        minor: damages.filter(d => d.severity === 'minor').length,
        moderate: damages.filter(d => d.severity === 'moderate').length,
        severe: damages.filter(d => d.severity === 'severe').length,
      };
      
      if (severeCounts.severe > 0) {
        notes.push(`${severeCounts.severe} severe issue(s) detected - significant value impact.`);
      }
      if (severeCounts.moderate > 0) {
        notes.push(`${severeCounts.moderate} moderate issue(s) - may affect resale value.`);
      }
    }
    
    notes.push(`Assessment based on ${category} category standards.`);
    
    return notes;
  }

  // Helpers
  private randomSeverity(): 'minor' | 'moderate' | 'severe' {
    const r = Math.random();
    if (r < 0.6) return 'minor';
    if (r < 0.9) return 'moderate';
    return 'severe';
  }

  private randomLocation(): string {
    const locations = ['top', 'bottom', 'left', 'right', 'front', 'back', 'corner', 'edge', 'center'];
    return locations[Math.floor(Math.random() * locations.length)];
  }
}

// Singleton
let assessor: ConditionAssessor | null = null;

export function getConditionAssessor(): ConditionAssessor {
  if (!assessor) {
    assessor = new ConditionAssessor();
  }
  return assessor;
}
