export type AssetClass = 
  | 'REAL_ESTATE'
  | 'VEHICLE'
  | 'WATCH'
  | 'ART'
  | 'JEWELRY_CERTIFIED'
  | 'COLLECTIBLES_GRADED'
  | 'ELECTRONICS_PHONE'
  | 'ELECTRONICS_TABLET'
  | 'ELECTRONICS_LAPTOP'
  | 'OTHER';

export interface AssetIdentifiers {
  serialNumber?: string;
  imei?: string;
  vin?: string;
  modelNumber?: string;
  brand?: string;
  year?: number;
  giaCertNumber?: string; // Jewelry
  psaCertNumber?: string; // Trading Cards
  watchSerial?: string;
  watchBrand?: string;
  gradingCertNumber?: string;
  gradingService?: string;
}

export interface IdentityVerificationResult {
  verified: boolean;
  confidence: number; // 0-1
  source: string; // e.g. 'NMVTIS', 'GSX', 'CHRONO24'
  metadata?: Record<string, any>;
  issues?: string[];
}
