/**
 * @file services/data/taxonomy.ts
 * @description Canonical category taxonomy for PROVENIQ ecosystem
 */

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  defaultDepreciation: number;
  insuranceClass: string;
}

export interface Subcategory {
  id: string;
  name: string;
  depreciation?: number; // Override parent if set
}

export const CATEGORY_TAXONOMY: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    defaultDepreciation: 0.25,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'computers', name: 'Computers & Laptops', depreciation: 0.30 },
      { id: 'smartphones', name: 'Smartphones', depreciation: 0.35 },
      { id: 'tablets', name: 'Tablets', depreciation: 0.30 },
      { id: 'televisions', name: 'Televisions', depreciation: 0.20 },
      { id: 'audio_equipment', name: 'Audio Equipment', depreciation: 0.15 },
      { id: 'cameras', name: 'Cameras & Photography', depreciation: 0.20 },
      { id: 'gaming_consoles', name: 'Gaming Consoles', depreciation: 0.25 },
      { id: 'wearables', name: 'Wearables & Smart Devices', depreciation: 0.30 },
      { id: 'home_automation', name: 'Home Automation', depreciation: 0.25 },
    ],
  },
  {
    id: 'furniture',
    name: 'Furniture',
    defaultDepreciation: 0.10,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'living_room', name: 'Living Room Furniture' },
      { id: 'bedroom', name: 'Bedroom Furniture' },
      { id: 'dining', name: 'Dining Furniture' },
      { id: 'office_furniture', name: 'Office Furniture' },
      { id: 'outdoor_furniture', name: 'Outdoor Furniture', depreciation: 0.12 },
      { id: 'antique_furniture', name: 'Antique Furniture', depreciation: 0.02 },
      { id: 'designer_furniture', name: 'Designer Furniture', depreciation: 0.05 },
    ],
  },
  {
    id: 'jewelry',
    name: 'Jewelry & Watches',
    defaultDepreciation: 0.02,
    insuranceClass: 'VALUABLE_ARTICLES',
    subcategories: [
      { id: 'fine_jewelry', name: 'Fine Jewelry', depreciation: 0.01 },
      { id: 'costume_jewelry', name: 'Costume Jewelry', depreciation: 0.15 },
      { id: 'luxury_watches', name: 'Luxury Watches', depreciation: 0.02 },
      { id: 'fashion_watches', name: 'Fashion Watches', depreciation: 0.20 },
      { id: 'engagement_wedding', name: 'Engagement & Wedding', depreciation: 0.01 },
    ],
  },
  {
    id: 'art',
    name: 'Art & Collectibles',
    defaultDepreciation: 0.00,
    insuranceClass: 'FINE_ART',
    subcategories: [
      { id: 'fine_art', name: 'Fine Art', depreciation: -0.02 },
      { id: 'prints', name: 'Prints & Reproductions', depreciation: 0.05 },
      { id: 'sculptures', name: 'Sculptures', depreciation: 0.00 },
      { id: 'collectibles', name: 'Collectibles', depreciation: 0.05 },
      { id: 'antiques', name: 'Antiques', depreciation: 0.00 },
      { id: 'coins_currency', name: 'Coins & Currency', depreciation: 0.00 },
      { id: 'stamps', name: 'Stamps', depreciation: 0.02 },
      { id: 'sports_memorabilia', name: 'Sports Memorabilia', depreciation: 0.03 },
      { id: 'wine_spirits', name: 'Wine & Spirits', depreciation: -0.05 },
    ],
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    defaultDepreciation: 0.15,
    insuranceClass: 'AUTO',
    subcategories: [
      { id: 'cars', name: 'Cars & SUVs', depreciation: 0.15 },
      { id: 'trucks', name: 'Trucks', depreciation: 0.12 },
      { id: 'motorcycles', name: 'Motorcycles', depreciation: 0.12 },
      { id: 'boats', name: 'Boats & Watercraft', depreciation: 0.10 },
      { id: 'rvs', name: 'RVs & Campers', depreciation: 0.12 },
      { id: 'atvs', name: 'ATVs & Powersports', depreciation: 0.15 },
      { id: 'classic_cars', name: 'Classic & Vintage Cars', depreciation: 0.00 },
      { id: 'evs', name: 'Electric Vehicles', depreciation: 0.20 },
    ],
  },
  {
    id: 'musical_instruments',
    name: 'Musical Instruments',
    defaultDepreciation: 0.08,
    insuranceClass: 'MUSICAL_INSTRUMENTS',
    subcategories: [
      { id: 'guitars', name: 'Guitars', depreciation: 0.06 },
      { id: 'pianos', name: 'Pianos & Keyboards', depreciation: 0.05 },
      { id: 'string_instruments', name: 'String Instruments', depreciation: 0.03 },
      { id: 'wind_instruments', name: 'Wind Instruments', depreciation: 0.08 },
      { id: 'percussion', name: 'Percussion', depreciation: 0.10 },
      { id: 'vintage_instruments', name: 'Vintage Instruments', depreciation: 0.00 },
      { id: 'pro_audio', name: 'Pro Audio Equipment', depreciation: 0.15 },
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    defaultDepreciation: 0.12,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'major_appliances', name: 'Major Appliances', depreciation: 0.10 },
      { id: 'kitchen_appliances', name: 'Kitchen Appliances', depreciation: 0.12 },
      { id: 'laundry', name: 'Laundry Appliances', depreciation: 0.10 },
      { id: 'small_appliances', name: 'Small Appliances', depreciation: 0.20 },
      { id: 'hvac', name: 'HVAC Equipment', depreciation: 0.08 },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing & Accessories',
    defaultDepreciation: 0.40,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'designer_clothing', name: 'Designer Clothing', depreciation: 0.20 },
      { id: 'vintage_clothing', name: 'Vintage Clothing', depreciation: 0.05 },
      { id: 'everyday_clothing', name: 'Everyday Clothing', depreciation: 0.50 },
      { id: 'luxury_handbags', name: 'Luxury Handbags', depreciation: 0.05 },
      { id: 'designer_shoes', name: 'Designer Shoes', depreciation: 0.15 },
      { id: 'accessories', name: 'Fashion Accessories', depreciation: 0.25 },
    ],
  },
  {
    id: 'sports_outdoor',
    name: 'Sports & Outdoor',
    defaultDepreciation: 0.15,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'fitness', name: 'Fitness Equipment', depreciation: 0.12 },
      { id: 'bicycles', name: 'Bicycles', depreciation: 0.10 },
      { id: 'golf', name: 'Golf Equipment', depreciation: 0.12 },
      { id: 'winter_sports', name: 'Winter Sports', depreciation: 0.12 },
      { id: 'water_sports', name: 'Water Sports', depreciation: 0.15 },
      { id: 'camping', name: 'Camping & Hiking', depreciation: 0.15 },
      { id: 'hunting_fishing', name: 'Hunting & Fishing', depreciation: 0.10 },
    ],
  },
  {
    id: 'tools',
    name: 'Tools & Equipment',
    defaultDepreciation: 0.10,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'power_tools', name: 'Power Tools', depreciation: 0.12 },
      { id: 'hand_tools', name: 'Hand Tools', depreciation: 0.08 },
      { id: 'lawn_garden', name: 'Lawn & Garden', depreciation: 0.15 },
      { id: 'workshop', name: 'Workshop Equipment', depreciation: 0.10 },
    ],
  },
  {
    id: 'home_decor',
    name: 'Home & Decor',
    defaultDepreciation: 0.15,
    insuranceClass: 'PERSONAL_PROPERTY',
    subcategories: [
      { id: 'rugs', name: 'Rugs & Carpets', depreciation: 0.08 },
      { id: 'lighting', name: 'Lighting', depreciation: 0.12 },
      { id: 'window_treatments', name: 'Window Treatments', depreciation: 0.15 },
      { id: 'decor', name: 'Decorative Items', depreciation: 0.20 },
      { id: 'bedding', name: 'Bedding & Linens', depreciation: 0.25 },
    ],
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): Category | undefined {
  return CATEGORY_TAXONOMY.find(c => c.id === categoryId);
}

/**
 * Get subcategory by ID
 */
export function getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(s => s.id === subcategoryId);
}

/**
 * Map user category string to canonical category
 */
export function mapToCanonicalCategory(userCategory: string): Category | undefined {
  const normalized = userCategory.toLowerCase().replace(/\s+/g, '_');
  
  // Direct match
  let match = CATEGORY_TAXONOMY.find(c => c.id === normalized || c.name.toLowerCase() === userCategory.toLowerCase());
  if (match) return match;
  
  // Check subcategories
  for (const category of CATEGORY_TAXONOMY) {
    const subMatch = category.subcategories.find(
      s => s.id === normalized || s.name.toLowerCase() === userCategory.toLowerCase()
    );
    if (subMatch) return category;
  }
  
  // Fuzzy match (contains)
  match = CATEGORY_TAXONOMY.find(c => 
    c.name.toLowerCase().includes(userCategory.toLowerCase()) ||
    userCategory.toLowerCase().includes(c.name.toLowerCase())
  );
  
  return match;
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
  return CATEGORY_TAXONOMY.map(c => c.id);
}

/**
 * Validate category exists
 */
export function isValidCategory(categoryId: string): boolean {
  return CATEGORY_TAXONOMY.some(c => c.id === categoryId);
}
