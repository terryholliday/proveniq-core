/**
 * @file services/registry/paid.ts
 * @description PROVENIQ Asset ID (PAID) Generation & Registry
 * 
 * PAID Format: PAID-{category_code}-{timestamp_base36}-{random_suffix}
 * Example: PAID-EL-1A2B3C4D-X7Y8
 * 
 * Features:
 * - Globally unique asset identification
 * - Category encoding
 * - Collision resistance
 * - Human-readable format
 */

import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';

// ============================================
// TYPES
// ============================================

export const RegisterAssetRequestSchema = z.object({
  // Owner
  ownerId: z.string(),
  ownerType: z.enum(['user', 'organization', 'system']).default('user'),
  
  // Asset details
  name: z.string().min(1).max(255),
  category: z.string(),
  subcategory: z.string().optional(),
  
  // Optional metadata
  sourceApp: z.enum(['home', 'properties', 'ops', 'bids', 'claimsiq', 'service', 'transit', 'protect', 'external']).optional(),
  externalId: z.string().optional(), // ID in source system
  
  // Initial state
  initialValue: z.number().positive().optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).optional(),
});

export type RegisterAssetRequest = z.infer<typeof RegisterAssetRequestSchema>;

export interface PAIDRecord {
  paid: string; // PROVENIQ Asset ID
  
  // Owner
  ownerId: string;
  ownerType: 'user' | 'organization' | 'system';
  
  // Asset
  name: string;
  category: string;
  categoryCode: string;
  subcategory?: string;
  
  // Source
  sourceApp?: string;
  externalId?: string;
  
  // State
  status: 'ACTIVE' | 'TRANSFERRED' | 'ARCHIVED' | 'DISPUTED';
  currentCustodian: string;
  custodyState: 'USER' | 'TRANSIT' | 'LOCKER' | 'ESCROW' | 'SOLD';
  
  // Timestamps
  registeredAt: string;
  updatedAt: string;
  
  // Ledger
  ledgerEventIds: string[];
}

export interface OwnershipTransfer {
  paid: string;
  fromOwnerId: string;
  toOwnerId: string;
  transferType: 'SALE' | 'GIFT' | 'INHERITANCE' | 'CLAIM' | 'CORRECTION';
  transferredAt: string;
  ledgerEventId: string;
}

// ============================================
// CATEGORY CODES
// ============================================

const CATEGORY_CODES: Record<string, string> = {
  electronics: 'EL',
  computers: 'CP',
  smartphones: 'PH',
  furniture: 'FR',
  jewelry: 'JW',
  watches: 'WT',
  art: 'AR',
  collectibles: 'CL',
  vehicles: 'VH',
  musical_instruments: 'MI',
  appliances: 'AP',
  clothing: 'CL',
  sports_outdoor: 'SP',
  tools: 'TL',
  home_decor: 'HD',
  default: 'XX',
};

// ============================================
// REGISTRY
// ============================================

export class PAIDRegistry {
  // In-memory store (production: database)
  private readonly _records: Map<string, PAIDRecord>;
  private readonly _transfers: OwnershipTransfer[];
  private readonly _externalIndex: Map<string, string>; // externalId -> PAID
  
  constructor() {
    this._records = new Map();
    this._transfers = [];
    this._externalIndex = new Map();
  }
  
  /**
   * Generate a new PAID for an asset
   */
  public generatePAID(category: string): string {
    const categoryCode = this.getCategoryCode(category);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(2).toString('hex').toUpperCase();
    
    return `PAID-${categoryCode}-${timestamp}-${random}`;
  }
  
  /**
   * Register a new asset and assign PAID
   */
  public async registerAsset(request: RegisterAssetRequest): Promise<PAIDRecord> {
    const validated = RegisterAssetRequestSchema.parse(request);
    
    // Check for duplicate external ID
    if (validated.externalId && validated.sourceApp) {
      const externalKey = `${validated.sourceApp}:${validated.externalId}`;
      if (this._externalIndex.has(externalKey)) {
        const existingPaid = this._externalIndex.get(externalKey)!;
        const existing = this._records.get(existingPaid);
        if (existing) {
          return existing; // Return existing record
        }
      }
    }
    
    // Generate PAID
    const paid = this.generatePAID(validated.category);
    const now = new Date().toISOString();
    
    const record: PAIDRecord = {
      paid,
      ownerId: validated.ownerId,
      ownerType: validated.ownerType,
      name: validated.name,
      category: validated.category,
      categoryCode: this.getCategoryCode(validated.category),
      subcategory: validated.subcategory,
      sourceApp: validated.sourceApp,
      externalId: validated.externalId,
      status: 'ACTIVE',
      currentCustodian: validated.ownerId,
      custodyState: 'USER',
      registeredAt: now,
      updatedAt: now,
      ledgerEventIds: [],
    };
    
    // Store
    this._records.set(paid, record);
    
    // Index external ID
    if (validated.externalId && validated.sourceApp) {
      const externalKey = `${validated.sourceApp}:${validated.externalId}`;
      this._externalIndex.set(externalKey, paid);
    }
    
    console.log(`[PAID] Registered asset: ${paid} for ${validated.ownerId}`);
    
    return record;
  }
  
  /**
   * Get asset by PAID
   */
  public getAsset(paid: string): PAIDRecord | undefined {
    return this._records.get(paid);
  }
  
  /**
   * Get asset by external ID
   */
  public getAssetByExternalId(sourceApp: string, externalId: string): PAIDRecord | undefined {
    const externalKey = `${sourceApp}:${externalId}`;
    const paid = this._externalIndex.get(externalKey);
    if (paid) {
      return this._records.get(paid);
    }
    return undefined;
  }
  
  /**
   * Get all assets for an owner
   */
  public getAssetsByOwner(ownerId: string): PAIDRecord[] {
    return Array.from(this._records.values()).filter(r => r.ownerId === ownerId);
  }
  
  /**
   * Transfer ownership of an asset
   */
  public async transferOwnership(
    paid: string,
    toOwnerId: string,
    transferType: OwnershipTransfer['transferType'],
    ledgerEventId: string
  ): Promise<{ success: boolean; error?: string }> {
    const record = this._records.get(paid);
    
    if (!record) {
      return { success: false, error: 'Asset not found' };
    }
    
    if (record.status !== 'ACTIVE') {
      return { success: false, error: `Cannot transfer asset in status: ${record.status}` };
    }
    
    const now = new Date().toISOString();
    const fromOwnerId = record.ownerId;
    
    // Create transfer record
    const transfer: OwnershipTransfer = {
      paid,
      fromOwnerId,
      toOwnerId,
      transferType,
      transferredAt: now,
      ledgerEventId,
    };
    this._transfers.push(transfer);
    
    // Update record
    const updatedRecord: PAIDRecord = {
      ...record,
      ownerId: toOwnerId,
      currentCustodian: toOwnerId,
      custodyState: 'USER',
      status: transferType === 'CLAIM' ? 'DISPUTED' : 'ACTIVE',
      updatedAt: now,
      ledgerEventIds: [...record.ledgerEventIds, ledgerEventId],
    };
    this._records.set(paid, updatedRecord);
    
    console.log(`[PAID] Transferred ${paid} from ${fromOwnerId} to ${toOwnerId}`);
    
    return { success: true };
  }
  
  /**
   * Update custody state
   */
  public async updateCustody(
    paid: string,
    custodyState: PAIDRecord['custodyState'],
    custodian: string,
    ledgerEventId: string
  ): Promise<{ success: boolean; error?: string }> {
    const record = this._records.get(paid);
    
    if (!record) {
      return { success: false, error: 'Asset not found' };
    }
    
    const now = new Date().toISOString();
    
    const updatedRecord: PAIDRecord = {
      ...record,
      custodyState,
      currentCustodian: custodian,
      updatedAt: now,
      ledgerEventIds: [...record.ledgerEventIds, ledgerEventId],
    };
    this._records.set(paid, updatedRecord);
    
    console.log(`[PAID] Updated custody for ${paid}: ${custodyState} -> ${custodian}`);
    
    return { success: true };
  }
  
  /**
   * Get ownership history for an asset
   */
  public getOwnershipHistory(paid: string): OwnershipTransfer[] {
    return this._transfers.filter(t => t.paid === paid);
  }
  
  /**
   * Validate PAID format
   */
  public isValidPAID(paid: string): boolean {
    const pattern = /^PAID-[A-Z]{2}-[A-Z0-9]{8,12}-[A-Z0-9]{4}$/;
    return pattern.test(paid);
  }
  
  /**
   * Parse PAID components
   */
  public parsePAID(paid: string): { categoryCode: string; timestamp: string; random: string } | null {
    if (!this.isValidPAID(paid)) return null;
    
    const parts = paid.split('-');
    return {
      categoryCode: parts[1],
      timestamp: parts[2],
      random: parts[3],
    };
  }
  
  /**
   * Get category code for a category
   */
  private getCategoryCode(category: string): string {
    const normalized = category.toLowerCase().replace(/\s+/g, '_');
    return CATEGORY_CODES[normalized] || CATEGORY_CODES['default'];
  }
  
  /**
   * Archive an asset
   */
  public async archiveAsset(paid: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const record = this._records.get(paid);
    
    if (!record) {
      return { success: false, error: 'Asset not found' };
    }
    
    const updatedRecord: PAIDRecord = {
      ...record,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };
    this._records.set(paid, updatedRecord);
    
    console.log(`[PAID] Archived ${paid}: ${reason}`);
    
    return { success: true };
  }
}

// Singleton instance
export const paidRegistry = new PAIDRegistry();
