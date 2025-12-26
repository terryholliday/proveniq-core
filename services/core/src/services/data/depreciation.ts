/**
 * @file services/data/depreciation.ts
 * @description Depreciation rates, condition multipliers, and brand premiums
 */

/**
 * Annual depreciation rates by category
 * Values represent percentage of value lost per year
 */
export const DEPRECIATION_RATES: Record<string, number> = {
  // Electronics - High depreciation
  electronics: 0.25,
  computers: 0.30,
  smartphones: 0.35,
  tablets: 0.30,
  televisions: 0.20,
  audio_equipment: 0.15,
  cameras: 0.20,
  gaming_consoles: 0.25,
  
  // Furniture - Low depreciation
  furniture: 0.10,
  sofas: 0.10,
  tables: 0.08,
  chairs: 0.10,
  beds: 0.10,
  outdoor_furniture: 0.12,
  antique_furniture: 0.02,
  
  // Jewelry & Watches - Very low depreciation
  jewelry: 0.02,
  fine_jewelry: 0.01,
  costume_jewelry: 0.15,
  watches: 0.05,
  luxury_watches: 0.02,
  
  // Art & Collectibles
  art: 0.00, // Art can appreciate
  fine_art: -0.02, // Can appreciate
  collectibles: 0.05,
  antiques: 0.00,
  coins: 0.00,
  stamps: 0.02,
  sports_memorabilia: 0.03,
  
  // Vehicles
  vehicles: 0.15,
  cars: 0.15,
  motorcycles: 0.12,
  boats: 0.10,
  rvs: 0.12,
  classic_cars: 0.00,
  
  // Musical Instruments
  musical_instruments: 0.08,
  guitars: 0.06,
  pianos: 0.05,
  violins: 0.02,
  vintage_instruments: 0.00,
  
  // Appliances
  appliances: 0.12,
  kitchen_appliances: 0.12,
  laundry_appliances: 0.10,
  small_appliances: 0.20,
  
  // Clothing & Accessories
  clothing: 0.40,
  designer_clothing: 0.20,
  vintage_clothing: 0.05,
  handbags: 0.15,
  luxury_handbags: 0.05,
  shoes: 0.30,
  designer_shoes: 0.15,
  
  // Sports & Outdoor
  sports_equipment: 0.15,
  fitness_equipment: 0.12,
  bicycles: 0.10,
  golf_equipment: 0.12,
  
  // Tools & Equipment
  tools: 0.10,
  power_tools: 0.12,
  hand_tools: 0.08,
  
  // Home & Garden
  home_decor: 0.15,
  rugs: 0.08,
  lighting: 0.12,
  
  // Office
  office_equipment: 0.20,
  office_furniture: 0.10,
  
  // Default
  default: 0.15,
};

/**
 * Condition multipliers
 * Applied to depreciated value
 */
export const CONDITION_MULTIPLIERS: Record<string, number> = {
  new: 1.00,        // Unused, in original packaging
  excellent: 0.90,  // Like new, minimal signs of use
  good: 0.75,       // Normal wear, fully functional
  fair: 0.50,       // Visible wear, functional with issues
  poor: 0.25,       // Heavy wear, may need repair
};

/**
 * Brand premium multipliers by category
 * Values represent percentage premium over base value
 */
export const BRAND_PREMIUMS: Record<string, Record<string, number>> = {
  // Electronics
  electronics: {
    apple: 0.20,
    samsung: 0.10,
    sony: 0.10,
    bose: 0.15,
    bang_olufsen: 0.25,
    dyson: 0.15,
  },
  
  // Watches
  watches: {
    rolex: 0.50,
    patek_philippe: 0.80,
    audemars_piguet: 0.60,
    omega: 0.30,
    cartier: 0.35,
    tag_heuer: 0.15,
    breitling: 0.20,
    iwc: 0.25,
  },
  
  // Jewelry
  jewelry: {
    tiffany: 0.30,
    cartier: 0.40,
    van_cleef: 0.45,
    bulgari: 0.35,
    harry_winston: 0.50,
  },
  
  // Handbags
  handbags: {
    hermes: 0.80,
    chanel: 0.50,
    louis_vuitton: 0.35,
    gucci: 0.25,
    prada: 0.20,
    dior: 0.25,
    bottega_veneta: 0.20,
  },
  
  // Furniture
  furniture: {
    herman_miller: 0.30,
    knoll: 0.25,
    eames: 0.40,
    restoration_hardware: 0.15,
    pottery_barn: 0.10,
  },
  
  // Musical Instruments
  musical_instruments: {
    steinway: 0.50,
    gibson: 0.25,
    fender: 0.20,
    martin: 0.25,
    yamaha: 0.10,
    stradivarius: 1.00, // Double value
  },
  
  // Vehicles
  vehicles: {
    porsche: 0.25,
    ferrari: 0.40,
    lamborghini: 0.35,
    mercedes: 0.15,
    bmw: 0.15,
    audi: 0.12,
    tesla: 0.20,
    lexus: 0.12,
  },
  
  // Art
  art: {
    // Named artists would be here
    // In production, this would be a database lookup
  },
  
  // Global premium brands (applies to any category)
  global: {
    apple: 0.15,
    rolex: 0.40,
    hermes: 0.60,
    chanel: 0.35,
    louis_vuitton: 0.25,
    cartier: 0.30,
    tiffany: 0.20,
  },
};

/**
 * Get depreciation rate for a category
 */
export function getDepreciationRate(category: string, subcategory?: string): number {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  const normalizedSubcategory = subcategory?.toLowerCase().replace(/\s+/g, '_');
  
  // Try subcategory first
  if (normalizedSubcategory && DEPRECIATION_RATES[normalizedSubcategory]) {
    return DEPRECIATION_RATES[normalizedSubcategory];
  }
  
  // Fall back to category
  if (DEPRECIATION_RATES[normalizedCategory]) {
    return DEPRECIATION_RATES[normalizedCategory];
  }
  
  return DEPRECIATION_RATES['default'];
}

/**
 * Get brand premium for a brand in a category
 */
export function getBrandPremium(brand: string, category: string): number {
  const normalizedBrand = brand.toLowerCase().replace(/\s+/g, '_');
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  
  // Check category-specific premiums
  const categoryPremiums = BRAND_PREMIUMS[normalizedCategory];
  if (categoryPremiums && categoryPremiums[normalizedBrand] !== undefined) {
    return categoryPremiums[normalizedBrand];
  }
  
  // Check global premiums
  const globalPremiums = BRAND_PREMIUMS['global'];
  if (globalPremiums && globalPremiums[normalizedBrand] !== undefined) {
    return globalPremiums[normalizedBrand];
  }
  
  return 0;
}
