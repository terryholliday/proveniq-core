export interface EvidencePackage {
  photos: number;
  receipts: number;
  genomeVerified: boolean;
  lastConditionScore: number;
  warranties: number;
}

export interface ProvenanceScoreInput {
  photoCount: number;
  receiptCount: number;
  warrantyCount: number;
  genomeVerified: boolean;
  ownershipTransfers: number;
  lastVerifiedAt: string | Date;
  documentedValue: number;
}

export interface ProvenanceScoreOutput {
  score: number; // 0-100
  rating: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'UNRATED';
  claimReadiness: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: {
    documentation: number;
    verification: number;
    history: number;
  };
  fraudFlags: string[];
}
