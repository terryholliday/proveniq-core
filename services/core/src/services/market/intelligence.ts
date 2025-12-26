/**
 * @file services/market/intelligence.ts
 * @description PROVENIQ Core Market Intelligence Engine (P1)
 * 
 * Market data and comparable analysis:
 * - Similar items sold prices
 * - Price trends over time
 * - Brand premium analysis
 * - Market demand indicators
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const MarketQuerySchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  location: z.string().optional(), // For regional pricing
  timeframeDays: z.number().int().min(7).max(365).default(90),
});

export type MarketQuery = z.infer<typeof MarketQuerySchema>;

export interface ComparableSale {
  id: string;
  title: string;
  category: string;
  brand?: string;
  condition: string;
  soldPrice: number;
  soldDate: string;
  source: string; // eBay, auction house, etc.
  similarity: number; // 0-100 match score
}

export interface PriceTrend {
  period: string; // "2024-Q4", "2024-12", etc.
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  saleCount: number;
  trend: 'rising' | 'stable' | 'falling';
  changePercent: number;
}

export interface MarketIntelligenceResult {
  query: MarketQuery;
  
  // Comparable sales
  comparables: ComparableSale[];
  comparableCount: number;
  
  // Market pricing
  marketPrice: {
    low: number;
    median: number;
    high: number;
    average: number;
  };
  
  // Trends
  trends: PriceTrend[];
  overallTrend: 'rising' | 'stable' | 'falling';
  trendConfidence: number;
  
  // Brand analysis
  brandPremium?: {
    brand: string;
    premiumPercent: number;
    marketPosition: 'premium' | 'mid-tier' | 'budget';
  };
  
  // Demand indicators
  demand: {
    level: 'high' | 'medium' | 'low';
    daysOnMarket: number; // Average
    liquidityScore: number; // 0-100
  };
  
  // Recommendations
  recommendations: {
    suggestedListPrice: number;
    quickSalePrice: number;
    premiumPrice: number;
    bestTimeToSell?: string;
  };
  
  // Metadata
  dataSourceCount: number;
  queriedAt: string;
  dataFreshness: string; // "last 24h", "last 7d", etc.
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_BRANDS: Record<string, { premium: number; position: 'premium' | 'mid-tier' | 'budget' }> = {
  // Electronics
  'apple': { premium: 25, position: 'premium' },
  'samsung': { premium: 10, position: 'premium' },
  'sony': { premium: 15, position: 'premium' },
  'lg': { premium: 5, position: 'mid-tier' },
  'dell': { premium: 0, position: 'mid-tier' },
  'hp': { premium: -5, position: 'mid-tier' },
  'acer': { premium: -10, position: 'budget' },
  
  // Jewelry
  'tiffany': { premium: 40, position: 'premium' },
  'cartier': { premium: 50, position: 'premium' },
  'pandora': { premium: 5, position: 'mid-tier' },
  
  // Furniture
  'restoration hardware': { premium: 30, position: 'premium' },
  'west elm': { premium: 15, position: 'premium' },
  'ikea': { premium: -15, position: 'budget' },
  'wayfair': { premium: -10, position: 'budget' },
  
  // Vehicles
  'toyota': { premium: 15, position: 'premium' },
  'honda': { premium: 10, position: 'premium' },
  'ford': { premium: 0, position: 'mid-tier' },
  'chevrolet': { premium: -5, position: 'mid-tier' },
  
  // Art
  'original': { premium: 100, position: 'premium' },
  'limited edition': { premium: 40, position: 'premium' },
  'reproduction': { premium: -30, position: 'budget' },
};

const CATEGORY_BASE_PRICES: Record<string, { min: number; max: number }> = {
  electronics: { min: 50, max: 2000 },
  furniture: { min: 100, max: 5000 },
  jewelry: { min: 100, max: 10000 },
  clothing: { min: 20, max: 500 },
  appliances: { min: 100, max: 3000 },
  vehicles: { min: 5000, max: 50000 },
  art: { min: 50, max: 20000 },
  collectibles: { min: 25, max: 5000 },
  tools: { min: 20, max: 1000 },
  sports: { min: 30, max: 2000 },
  musical: { min: 100, max: 10000 },
};

// ============================================
// MARKET INTELLIGENCE ENGINE
// ============================================

export class MarketIntelligence {
  /**
   * Get market intelligence for an asset category
   */
  public async query(request: MarketQuery): Promise<MarketIntelligenceResult> {
    const validated = MarketQuerySchema.parse(request);
    const now = new Date();
    
    // Generate comparable sales
    const comparables = this.generateComparables(validated);
    
    // Calculate market pricing
    const marketPrice = this.calculateMarketPrice(comparables);
    
    // Generate trends
    const trends = this.generateTrends(validated, marketPrice.median);
    const overallTrend = this.determineOverallTrend(trends);
    
    // Brand analysis
    const brandPremium = validated.brand 
      ? this.analyzeBrand(validated.brand) 
      : undefined;
    
    // Demand analysis
    const demand = this.analyzeDemand(validated.category);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      marketPrice, 
      overallTrend, 
      demand, 
      brandPremium
    );

    return {
      query: validated,
      comparables,
      comparableCount: comparables.length,
      marketPrice,
      trends,
      overallTrend,
      trendConfidence: 70 + Math.floor(Math.random() * 20),
      brandPremium,
      demand,
      recommendations,
      dataSourceCount: 3,
      queriedAt: now.toISOString(),
      dataFreshness: 'last 7 days',
    };
  }

  /**
   * Get price suggestion for a specific asset
   */
  public async suggestPrice(
    category: string,
    condition: string,
    brand?: string,
    purchasePrice?: number
  ): Promise<{
    suggestedPrice: number;
    priceRange: { low: number; high: number };
    confidence: number;
    factors: string[];
  }> {
    const marketData = await this.query({ category, brand, condition: condition as any, timeframeDays: 90 });
    
    let suggestedPrice = marketData.marketPrice.median;
    const factors: string[] = [];
    
    // Apply condition adjustment
    const conditionMultipliers: Record<string, number> = {
      new: 1.0,
      excellent: 0.95,
      good: 0.85,
      fair: 0.70,
      poor: 0.50,
    };
    suggestedPrice *= conditionMultipliers[condition] || 0.85;
    factors.push(`Condition: ${condition} (${Math.round(conditionMultipliers[condition] * 100)}%)`);
    
    // Apply brand premium
    if (marketData.brandPremium) {
      suggestedPrice *= (1 + marketData.brandPremium.premiumPercent / 100);
      factors.push(`Brand premium: +${marketData.brandPremium.premiumPercent}%`);
    }
    
    // Consider purchase price if provided
    if (purchasePrice && purchasePrice > suggestedPrice * 1.5) {
      factors.push('Warning: Purchase price significantly above market');
    }

    return {
      suggestedPrice: Math.round(suggestedPrice),
      priceRange: {
        low: Math.round(suggestedPrice * 0.85),
        high: Math.round(suggestedPrice * 1.15),
      },
      confidence: marketData.trendConfidence,
      factors,
    };
  }

  /**
   * Generate mock comparable sales
   */
  private generateComparables(query: MarketQuery): ComparableSale[] {
    const comparables: ComparableSale[] = [];
    const baseRange = CATEGORY_BASE_PRICES[query.category.toLowerCase()] || { min: 100, max: 1000 };
    const count = 5 + Math.floor(Math.random() * 10);
    
    const sources = ['eBay', 'Amazon', 'Auction House', 'Marketplace', 'Dealer'];
    const conditions = ['new', 'excellent', 'good', 'fair', 'poor'];
    
    for (let i = 0; i < count; i++) {
      const basePrice = baseRange.min + Math.random() * (baseRange.max - baseRange.min);
      const condition = query.condition || conditions[Math.floor(Math.random() * conditions.length)];
      
      // Apply condition multiplier
      const conditionMult = { new: 1, excellent: 0.9, good: 0.8, fair: 0.65, poor: 0.45 };
      const soldPrice = Math.round(basePrice * (conditionMult[condition as keyof typeof conditionMult] || 0.8));
      
      // Generate sold date within timeframe
      const daysAgo = Math.floor(Math.random() * query.timeframeDays);
      const soldDate = new Date();
      soldDate.setDate(soldDate.getDate() - daysAgo);
      
      comparables.push({
        id: `COMP-${Date.now()}-${i}`,
        title: `${query.brand || ''} ${query.category} Item`.trim(),
        category: query.category,
        brand: query.brand,
        condition,
        soldPrice,
        soldDate: soldDate.toISOString().split('T')[0],
        source: sources[Math.floor(Math.random() * sources.length)],
        similarity: 70 + Math.floor(Math.random() * 25),
      });
    }
    
    // Sort by similarity
    return comparables.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate market pricing from comparables
   */
  private calculateMarketPrice(comparables: ComparableSale[]): MarketIntelligenceResult['marketPrice'] {
    if (comparables.length === 0) {
      return { low: 0, median: 0, high: 0, average: 0 };
    }
    
    const prices = comparables.map(c => c.soldPrice).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    
    return {
      low: prices[0],
      median: prices[Math.floor(prices.length / 2)],
      high: prices[prices.length - 1],
      average: Math.round(sum / prices.length),
    };
  }

  /**
   * Generate price trends
   */
  private generateTrends(query: MarketQuery, medianPrice: number): PriceTrend[] {
    const trends: PriceTrend[] = [];
    const periods = Math.min(Math.ceil(query.timeframeDays / 30), 6);
    
    let currentPrice = medianPrice;
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const volatility = 0.05 + Math.random() * 0.1;
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const change = (Math.random() - 0.5) * volatility * trendDirection;
      currentPrice *= (1 + change);
      
      trends.push({
        period,
        avgPrice: Math.round(currentPrice),
        minPrice: Math.round(currentPrice * 0.8),
        maxPrice: Math.round(currentPrice * 1.2),
        saleCount: 10 + Math.floor(Math.random() * 50),
        trend: change > 0.02 ? 'rising' : change < -0.02 ? 'falling' : 'stable',
        changePercent: Math.round(change * 100),
      });
    }
    
    return trends;
  }

  /**
   * Determine overall trend
   */
  private determineOverallTrend(trends: PriceTrend[]): 'rising' | 'stable' | 'falling' {
    if (trends.length < 2) return 'stable';
    
    const first = trends[0].avgPrice;
    const last = trends[trends.length - 1].avgPrice;
    const change = (last - first) / first;
    
    if (change > 0.05) return 'rising';
    if (change < -0.05) return 'falling';
    return 'stable';
  }

  /**
   * Analyze brand premium
   */
  private analyzeBrand(brand: string): MarketIntelligenceResult['brandPremium'] | undefined {
    const brandData = MOCK_BRANDS[brand.toLowerCase()];
    if (!brandData) return undefined;
    
    return {
      brand,
      premiumPercent: brandData.premium,
      marketPosition: brandData.position,
    };
  }

  /**
   * Analyze demand
   */
  private analyzeDemand(category: string): MarketIntelligenceResult['demand'] {
    // Mock demand levels by category
    const demandLevels: Record<string, 'high' | 'medium' | 'low'> = {
      electronics: 'high',
      vehicles: 'high',
      jewelry: 'medium',
      furniture: 'medium',
      clothing: 'low',
      art: 'low',
    };
    
    const level = demandLevels[category.toLowerCase()] || 'medium';
    const daysOnMarket = level === 'high' ? 7 : level === 'medium' ? 21 : 45;
    const liquidityScore = level === 'high' ? 85 : level === 'medium' ? 60 : 35;
    
    return { level, daysOnMarket, liquidityScore };
  }

  /**
   * Generate pricing recommendations
   */
  private generateRecommendations(
    marketPrice: MarketIntelligenceResult['marketPrice'],
    trend: 'rising' | 'stable' | 'falling',
    demand: MarketIntelligenceResult['demand'],
    brandPremium?: MarketIntelligenceResult['brandPremium']
  ): MarketIntelligenceResult['recommendations'] {
    let basePrice = marketPrice.median;
    
    // Apply brand premium
    if (brandPremium) {
      basePrice *= (1 + brandPremium.premiumPercent / 100);
    }
    
    // Adjust for trend
    const trendAdjust = trend === 'rising' ? 1.05 : trend === 'falling' ? 0.95 : 1;
    basePrice *= trendAdjust;
    
    return {
      suggestedListPrice: Math.round(basePrice),
      quickSalePrice: Math.round(basePrice * 0.85),
      premiumPrice: Math.round(basePrice * 1.15),
      bestTimeToSell: trend === 'rising' ? 'Wait 30 days' : 'Sell now',
    };
  }
}

// Singleton
let intelligence: MarketIntelligence | null = null;

export function getMarketIntelligence(): MarketIntelligence {
  if (!intelligence) {
    intelligence = new MarketIntelligence();
  }
  return intelligence;
}
