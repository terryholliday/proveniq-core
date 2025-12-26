/**
 * @file services/brand/recognizer.ts
 * @description PROVENIQ Core Brand Recognition Engine (P1)
 * 
 * AI-powered brand detection from photos:
 * - Logo detection
 * - Brand classification
 * - Category auto-assignment
 * - Premium multiplier lookup
 */

import { z } from 'zod';
import { BRAND_PREMIUMS } from '../data/depreciation';

// ============================================
// TYPES
// ============================================

export const BrandRecognitionRequestSchema = z.object({
  assetId: z.string(),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  category: z.string().optional(), // If known
  userProvidedBrand: z.string().optional(), // User's claim
});

export type BrandRecognitionRequest = z.infer<typeof BrandRecognitionRequestSchema>;

export interface BrandDetection {
  brand: string;
  confidence: number; // 0-100
  logoDetected: boolean;
  textDetected: boolean;
  location: string; // Where on the item
}

export interface BrandRecognitionResult {
  assetId: string;
  recognitionId: string;
  
  // Primary detection
  detectedBrand: string | null;
  brandConfidence: number;
  verified: boolean; // Matches user claim if provided
  
  // All detections
  detections: BrandDetection[];
  
  // Category inference
  suggestedCategory: string | null;
  suggestedSubcategory: string | null;
  
  // Value impact
  brandPremium: number; // Percentage premium/discount
  brandTier: 'luxury' | 'premium' | 'mid-tier' | 'budget' | 'unknown';
  
  // Metadata
  imagesAnalyzed: number;
  recognizedAt: string;
  modelVersion: string;
}

// ============================================
// BRAND DATABASE
// ============================================

const KNOWN_BRANDS: Record<string, {
  category: string;
  subcategory?: string;
  tier: 'luxury' | 'premium' | 'mid-tier' | 'budget';
  premium: number;
  aliases: string[];
}> = {
  // Electronics - Premium
  'apple': { category: 'electronics', subcategory: 'smartphones', tier: 'premium', premium: 25, aliases: ['iphone', 'ipad', 'macbook', 'airpods'] },
  'samsung': { category: 'electronics', subcategory: 'smartphones', tier: 'premium', premium: 10, aliases: ['galaxy'] },
  'sony': { category: 'electronics', subcategory: 'audio_equipment', tier: 'premium', premium: 15, aliases: ['playstation', 'ps5'] },
  'bose': { category: 'electronics', subcategory: 'audio_equipment', tier: 'premium', premium: 20, aliases: [] },
  'bang_olufsen': { category: 'electronics', subcategory: 'audio_equipment', tier: 'luxury', premium: 40, aliases: ['b&o'] },
  
  // Electronics - Mid-tier
  'lg': { category: 'electronics', subcategory: 'televisions', tier: 'mid-tier', premium: 5, aliases: [] },
  'dell': { category: 'electronics', subcategory: 'computers', tier: 'mid-tier', premium: 0, aliases: [] },
  'hp': { category: 'electronics', subcategory: 'computers', tier: 'mid-tier', premium: -5, aliases: ['hewlett-packard'] },
  'lenovo': { category: 'electronics', subcategory: 'computers', tier: 'mid-tier', premium: 0, aliases: ['thinkpad'] },
  
  // Jewelry - Luxury
  'tiffany': { category: 'jewelry', subcategory: 'fine_jewelry', tier: 'luxury', premium: 50, aliases: ['tiffany & co', 'tiffany and co'] },
  'cartier': { category: 'jewelry', subcategory: 'fine_jewelry', tier: 'luxury', premium: 60, aliases: [] },
  'van_cleef': { category: 'jewelry', subcategory: 'fine_jewelry', tier: 'luxury', premium: 70, aliases: ['van cleef & arpels', 'vca'] },
  'bulgari': { category: 'jewelry', subcategory: 'fine_jewelry', tier: 'luxury', premium: 55, aliases: ['bvlgari'] },
  
  // Watches - Luxury
  'rolex': { category: 'jewelry', subcategory: 'luxury_watches', tier: 'luxury', premium: 80, aliases: [] },
  'patek_philippe': { category: 'jewelry', subcategory: 'luxury_watches', tier: 'luxury', premium: 100, aliases: ['patek'] },
  'omega': { category: 'jewelry', subcategory: 'luxury_watches', tier: 'luxury', premium: 40, aliases: [] },
  'tag_heuer': { category: 'jewelry', subcategory: 'watches', tier: 'premium', premium: 25, aliases: ['tag'] },
  
  // Furniture - Premium
  'restoration_hardware': { category: 'furniture', subcategory: 'sofas', tier: 'premium', premium: 30, aliases: ['rh'] },
  'pottery_barn': { category: 'furniture', tier: 'premium', premium: 15, aliases: [] },
  'west_elm': { category: 'furniture', tier: 'premium', premium: 15, aliases: [] },
  'herman_miller': { category: 'furniture', subcategory: 'chairs', tier: 'luxury', premium: 50, aliases: ['aeron'] },
  
  // Furniture - Budget
  'ikea': { category: 'furniture', tier: 'budget', premium: -15, aliases: [] },
  'wayfair': { category: 'furniture', tier: 'budget', premium: -10, aliases: [] },
  
  // Handbags - Luxury
  'louis_vuitton': { category: 'clothing', subcategory: 'luxury_handbags', tier: 'luxury', premium: 70, aliases: ['lv'] },
  'hermes': { category: 'clothing', subcategory: 'luxury_handbags', tier: 'luxury', premium: 100, aliases: ['birkin', 'kelly'] },
  'chanel': { category: 'clothing', subcategory: 'luxury_handbags', tier: 'luxury', premium: 80, aliases: [] },
  'gucci': { category: 'clothing', subcategory: 'luxury_handbags', tier: 'luxury', premium: 50, aliases: [] },
  'prada': { category: 'clothing', subcategory: 'luxury_handbags', tier: 'luxury', premium: 45, aliases: [] },
  
  // Vehicles
  'toyota': { category: 'vehicles', subcategory: 'cars', tier: 'premium', premium: 15, aliases: ['lexus'] },
  'honda': { category: 'vehicles', subcategory: 'cars', tier: 'premium', premium: 10, aliases: ['acura'] },
  'bmw': { category: 'vehicles', subcategory: 'cars', tier: 'luxury', premium: 25, aliases: [] },
  'mercedes': { category: 'vehicles', subcategory: 'cars', tier: 'luxury', premium: 30, aliases: ['mercedes-benz', 'benz'] },
  'tesla': { category: 'vehicles', subcategory: 'cars', tier: 'premium', premium: 20, aliases: [] },
  
  // Appliances
  'sub_zero': { category: 'appliances', subcategory: 'kitchen_appliances', tier: 'luxury', premium: 50, aliases: ['sub-zero'] },
  'wolf': { category: 'appliances', subcategory: 'kitchen_appliances', tier: 'luxury', premium: 45, aliases: [] },
  'viking': { category: 'appliances', subcategory: 'kitchen_appliances', tier: 'premium', premium: 30, aliases: [] },
  'kitchenaid': { category: 'appliances', subcategory: 'kitchen_appliances', tier: 'premium', premium: 15, aliases: [] },
  'whirlpool': { category: 'appliances', tier: 'mid-tier', premium: 0, aliases: [] },
  
  // Musical Instruments
  'steinway': { category: 'musical_instruments', subcategory: 'pianos', tier: 'luxury', premium: 100, aliases: ['steinway & sons'] },
  'gibson': { category: 'musical_instruments', subcategory: 'guitars', tier: 'premium', premium: 30, aliases: [] },
  'fender': { category: 'musical_instruments', subcategory: 'guitars', tier: 'premium', premium: 25, aliases: ['stratocaster', 'telecaster'] },
  'yamaha': { category: 'musical_instruments', tier: 'mid-tier', premium: 10, aliases: [] },
};

// ============================================
// BRAND RECOGNIZER
// ============================================

export class BrandRecognizer {
  private modelVersion = '1.0.0';

  /**
   * Recognize brand from photos
   */
  async recognize(request: BrandRecognitionRequest): Promise<BrandRecognitionResult> {
    const validated = BrandRecognitionRequestSchema.parse(request);
    const recognitionId = `BR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Analyze images for brand indicators
    const detections = await this.analyzeImages(validated.imageUrls, validated.userProvidedBrand);
    
    // Get primary detection
    const primaryDetection = detections.length > 0 
      ? detections.reduce((best, curr) => curr.confidence > best.confidence ? curr : best)
      : null;

    // Lookup brand info
    const brandInfo = primaryDetection 
      ? this.lookupBrand(primaryDetection.brand) 
      : null;

    // Verify against user claim
    const verified = validated.userProvidedBrand && primaryDetection
      ? this.brandsMatch(validated.userProvidedBrand, primaryDetection.brand)
      : false;

    return {
      assetId: validated.assetId,
      recognitionId,
      detectedBrand: primaryDetection?.brand || null,
      brandConfidence: primaryDetection?.confidence || 0,
      verified,
      detections,
      suggestedCategory: brandInfo?.category || validated.category || null,
      suggestedSubcategory: brandInfo?.subcategory || null,
      brandPremium: brandInfo?.premium || 0,
      brandTier: brandInfo?.tier || 'unknown',
      imagesAnalyzed: validated.imageUrls.length,
      recognizedAt: now,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Analyze images for brand detection (mock AI vision)
   * In production, this would call Gemini/GPT-4V
   */
  private async analyzeImages(
    imageUrls: string[], 
    userHint?: string
  ): Promise<BrandDetection[]> {
    const detections: BrandDetection[] = [];

    // If user provided a hint, try to verify it
    if (userHint) {
      const normalizedHint = this.normalizeBrand(userHint);
      const brandInfo = this.lookupBrand(normalizedHint);
      
      if (brandInfo) {
        // Simulate finding the brand with moderate confidence
        detections.push({
          brand: normalizedHint,
          confidence: 70 + Math.floor(Math.random() * 20),
          logoDetected: Math.random() > 0.3,
          textDetected: Math.random() > 0.5,
          location: 'front',
        });
      }
    }

    // Simulate detecting additional brands from images
    const brandKeys = Object.keys(KNOWN_BRANDS);
    const detectCount = Math.floor(Math.random() * 2); // 0-1 additional detections
    
    for (let i = 0; i < detectCount; i++) {
      const randomBrand = brandKeys[Math.floor(Math.random() * brandKeys.length)];
      if (!detections.some(d => d.brand === randomBrand)) {
        detections.push({
          brand: randomBrand,
          confidence: 30 + Math.floor(Math.random() * 40),
          logoDetected: Math.random() > 0.5,
          textDetected: Math.random() > 0.7,
          location: ['front', 'back', 'label', 'tag'][Math.floor(Math.random() * 4)],
        });
      }
    }

    return detections.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Lookup brand in database
   */
  private lookupBrand(brand: string): typeof KNOWN_BRANDS[string] | null {
    const normalized = this.normalizeBrand(brand);
    
    // Direct match
    if (KNOWN_BRANDS[normalized]) {
      return KNOWN_BRANDS[normalized];
    }

    // Check aliases
    for (const [key, info] of Object.entries(KNOWN_BRANDS)) {
      if (info.aliases.some(alias => this.normalizeBrand(alias) === normalized)) {
        return info;
      }
    }

    return null;
  }

  /**
   * Normalize brand name for comparison
   */
  private normalizeBrand(brand: string): string {
    return brand
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Check if two brand names match
   */
  private brandsMatch(brand1: string, brand2: string): boolean {
    const n1 = this.normalizeBrand(brand1);
    const n2 = this.normalizeBrand(brand2);
    
    if (n1 === n2) return true;

    // Check if either is an alias of the other
    const info1 = KNOWN_BRANDS[n1];
    const info2 = KNOWN_BRANDS[n2];

    if (info1?.aliases.some(a => this.normalizeBrand(a) === n2)) return true;
    if (info2?.aliases.some(a => this.normalizeBrand(a) === n1)) return true;

    return false;
  }
}

// Singleton
let recognizer: BrandRecognizer | null = null;

export function getBrandRecognizer(): BrandRecognizer {
  if (!recognizer) {
    recognizer = new BrandRecognizer();
  }
  return recognizer;
}
