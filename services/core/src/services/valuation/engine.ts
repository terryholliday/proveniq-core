/**
 * @file services/valuation/engine.ts
 * @description PROVENIQ Core Valuation Engine
 * 
 * Central valuation service with:
 * - Category-specific depreciation
 * - Condition multipliers
 * - Brand premium adjustments
 * - Confidence scoring
 * - Bias detection
 */

import { z } from 'zod';
import { DEPRECIATION_RATES, CONDITION_MULTIPLIERS, BRAND_PREMIUMS } from '../data/depreciation';
import { CATEGORY_TAXONOMY } from '../data/taxonomy';

// ============================================
// TYPES
// ============================================

export const ValuationRequestSchema = z.object({
  assetId: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.string().optional(), // ISO date
  estimatedValue: z.number().positive().optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).default('good'),
  hasReceipt: z.boolean().default(false),
  hasImages: z.boolean().default(false),
  imageCount: z.number().int().min(0).default(0),
  provenanceScore: z.number().min(0).max(100).optional(),
});

export type ValuationRequest = z.infer<typeof ValuationRequestSchema>;

export interface ValuationResult {
  assetId: string;
  valuationId: string;
  
  // Core valuation
  estimatedValue: number;
  currency: string;
  confidenceScore: number; // 0-100
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Breakdown
  breakdown: {
    baseValue: number;
    depreciationRate: number;
    depreciationAmount: number;
    conditionMultiplier: number;
    brandPremium: number;
    adjustedValue: number;
  };
  
  // Metadata
  methodology: string;
  factors: string[];
  biasFlags: string[];
  
  // Timestamps
  valuedAt: string;
  validUntil: string; // Valuations expire
}

// ============================================
// ENGINE
// ============================================

export class ValuationEngine {
  /**
   * Generate a valuation for an asset
   */
  public async valuate(request: ValuationRequest): Promise<ValuationResult> {
    const validated = ValuationRequestSchema.parse(request);
    const now = new Date();
    
    // 1. Determine base value
    const baseValue = this.determineBaseValue(validated);
    
    // 2. Calculate depreciation
    const { depreciationRate, depreciationAmount, yearsOwned } = this.calculateDepreciation(
      validated.category,
      validated.subcategory,
      baseValue,
      validated.purchaseDate
    );
    
    // 3. Apply condition multiplier
    const conditionMultiplier = CONDITION_MULTIPLIERS[validated.condition] || 0.7;
    
    // 4. Apply brand premium
    const brandPremium = this.getBrandPremium(validated.brand, validated.category);
    
    // 5. Calculate final value
    const afterDepreciation = baseValue - depreciationAmount;
    const afterCondition = afterDepreciation * conditionMultiplier;
    const adjustedValue = Math.round(afterCondition * (1 + brandPremium));
    
    // 6. Calculate confidence
    const { confidenceScore, confidenceLevel, factors } = this.calculateConfidence(validated);
    
    // 7. Detect bias
    const biasFlags = this.detectBias(validated, adjustedValue);
    
    // 8. Build result
    const result: ValuationResult = {
      assetId: validated.assetId,
      valuationId: `val_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      
      estimatedValue: Math.max(adjustedValue, 0),
      currency: 'USD',
      confidenceScore,
      confidenceLevel,
      
      breakdown: {
        baseValue,
        depreciationRate,
        depreciationAmount,
        conditionMultiplier,
        brandPremium,
        adjustedValue: Math.max(adjustedValue, 0),
      },
      
      methodology: this.getMethodology(validated),
      factors,
      biasFlags,
      
      valuedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    
    return result;
  }
  
  /**
   * Determine base value from purchase price or estimate
   */
  private determineBaseValue(request: ValuationRequest): number {
    if (request.purchasePrice && request.purchasePrice > 0) {
      return request.purchasePrice;
    }
    
    if (request.estimatedValue && request.estimatedValue > 0) {
      return request.estimatedValue;
    }
    
    // Fallback to category average (would be from database in production)
    return this.getCategoryAverageValue(request.category, request.subcategory);
  }
  
  /**
   * Calculate depreciation based on category and age
   */
  private calculateDepreciation(
    category: string,
    subcategory: string | undefined,
    baseValue: number,
    purchaseDate: string | undefined
  ): { depreciationRate: number; depreciationAmount: number; yearsOwned: number } {
    // Get depreciation rate for category
    const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
    const rate = DEPRECIATION_RATES[categoryKey] ?? DEPRECIATION_RATES['default'];
    
    // Calculate years owned
    let yearsOwned = 0;
    if (purchaseDate) {
      const purchase = new Date(purchaseDate);
      const now = new Date();
      yearsOwned = (now.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    }
    
    // Straight-line depreciation with floor
    const totalDepreciation = Math.min(rate * yearsOwned, 0.9); // Max 90% depreciation
    const depreciationAmount = Math.round(baseValue * totalDepreciation);
    
    return {
      depreciationRate: rate,
      depreciationAmount,
      yearsOwned: Math.round(yearsOwned * 10) / 10,
    };
  }
  
  /**
   * Get brand premium multiplier
   */
  private getBrandPremium(brand: string | undefined, category: string): number {
    if (!brand) return 0;
    
    const normalizedBrand = brand.toLowerCase().trim();
    const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
    
    // Check category-specific premiums first
    const categoryPremiums = BRAND_PREMIUMS[categoryKey];
    if (categoryPremiums && categoryPremiums[normalizedBrand]) {
      return categoryPremiums[normalizedBrand];
    }
    
    // Check global premium brands
    const globalPremiums = BRAND_PREMIUMS['global'];
    if (globalPremiums && globalPremiums[normalizedBrand]) {
      return globalPremiums[normalizedBrand];
    }
    
    return 0;
  }
  
  /**
   * Calculate confidence score based on available data
   */
  private calculateConfidence(request: ValuationRequest): {
    confidenceScore: number;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    factors: string[];
  } {
    let score = 50; // Base score
    const factors: string[] = [];
    
    // Purchase price adds confidence
    if (request.purchasePrice) {
      score += 20;
      factors.push('Purchase price available');
    }
    
    // Purchase date adds confidence
    if (request.purchaseDate) {
      score += 10;
      factors.push('Purchase date available');
    }
    
    // Receipt adds confidence
    if (request.hasReceipt) {
      score += 10;
      factors.push('Receipt documented');
    }
    
    // Images add confidence
    if (request.hasImages) {
      score += 5;
      factors.push('Photos available');
      if (request.imageCount >= 3) {
        score += 5;
        factors.push('Multiple photos (3+)');
      }
    }
    
    // Brand recognition
    if (request.brand) {
      score += 5;
      factors.push('Brand identified');
    }
    
    // Provenance score
    if (request.provenanceScore && request.provenanceScore >= 70) {
      score += 10;
      factors.push('Strong provenance');
    }
    
    // Cap at 100
    score = Math.min(score, 100);
    
    // Determine level
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    if (score >= 85) {
      confidenceLevel = 'HIGH';
    } else if (score >= 60) {
      confidenceLevel = 'MEDIUM';
    } else {
      confidenceLevel = 'LOW';
    }
    
    return { confidenceScore: score, confidenceLevel, factors };
  }
  
  /**
   * Detect potential valuation bias
   */
  private detectBias(request: ValuationRequest, calculatedValue: number): string[] {
    const flags: string[] = [];
    
    // Check if estimated exceeds purchase price significantly
    if (request.estimatedValue && request.purchasePrice) {
      const ratio = request.estimatedValue / request.purchasePrice;
      if (ratio > 1.5) {
        flags.push('ESTIMATED_EXCEEDS_PURCHASE');
      }
    }
    
    // Check for missing brand on high-value items
    if (!request.brand && calculatedValue > 1000) {
      flags.push('MISSING_BRAND_HIGH_VALUE');
    }
    
    // Check for age-condition mismatch
    if (request.purchaseDate && request.condition) {
      const yearsOld = (Date.now() - new Date(request.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (yearsOld > 5 && request.condition === 'new') {
        flags.push('AGE_CONDITION_MISMATCH');
      }
    }
    
    // Check for no documentation on high-value items
    if (calculatedValue > 5000 && !request.hasReceipt && !request.hasImages) {
      flags.push('NO_DOCUMENTATION_HIGH_VALUE');
    }
    
    return flags;
  }
  
  /**
   * Get category average value (fallback)
   */
  private getCategoryAverageValue(category: string, subcategory?: string): number {
    // In production, this would query a database
    const categoryAverages: Record<string, number> = {
      'electronics': 500,
      'furniture': 800,
      'jewelry': 2000,
      'watches': 3000,
      'art': 1500,
      'collectibles': 500,
      'vehicles': 15000,
      'musical_instruments': 1000,
      'appliances': 600,
      'clothing': 100,
      'default': 300,
    };
    
    const key = category.toLowerCase().replace(/\s+/g, '_');
    return categoryAverages[key] ?? categoryAverages['default'];
  }
  
  /**
   * Get methodology description
   */
  private getMethodology(request: ValuationRequest): string {
    if (request.purchasePrice && request.purchaseDate) {
      return 'DEPRECIATED_COST';
    }
    if (request.purchasePrice) {
      return 'COST_BASED';
    }
    if (request.estimatedValue) {
      return 'USER_ESTIMATE';
    }
    return 'CATEGORY_AVERAGE';
  }
}

// Singleton instance
export const valuationEngine = new ValuationEngine();
