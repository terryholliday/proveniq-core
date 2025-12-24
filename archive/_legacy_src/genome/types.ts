export interface GenomeVector {
  hash: string;
  vector: number[]; // 512-dim feature vector
  modelVersion: string;
  generatedAt: string | Date;
}

export interface GenomeMatchResult {
  matchId: string;
  score: number; // 0-1 similarity
  metadata: Record<string, any>;
}

export interface GenomeInput {
  photos: string[]; // Base64 or URLs
  assetClass?: string;
}
