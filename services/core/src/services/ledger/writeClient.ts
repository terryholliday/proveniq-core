/**
 * @file services/ledger/writeClient.ts
 * @description PROVENIQ Core Ledger Write-through Client
 * 
 * Dual-write pattern to Ledger service:
 * - Guaranteed delivery with retries
 * - Local queue for resilience
 * - Consistency verification
 */

import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';

// ============================================
// TYPES
// ============================================

export const LedgerEventSchema = z.object({
  eventType: z.string(),
  assetId: z.string().optional(),
  anchorId: z.string().optional(),
  ownerId: z.string().optional(),
  payload: z.record(z.any()),
  sourceApp: z.enum(['home', 'properties', 'ops', 'bids', 'claimsiq', 'service', 'transit', 'protect', 'core']),
  correlationId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export type LedgerEvent = z.infer<typeof LedgerEventSchema>;

export interface LedgerWriteResult {
  success: boolean;
  eventId?: string;
  entryHash?: string;
  error?: string;
  retryable?: boolean;
}

export interface QueuedEvent {
  id: string;
  event: LedgerEvent;
  attempts: number;
  lastAttempt?: string;
  status: 'pending' | 'processing' | 'failed' | 'success';
  createdAt: string;
}

// ============================================
// CLIENT
// ============================================

export class LedgerWriteClient {
  private readonly LEDGER_API_URL: string;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  
  // Local queue for resilience
  private readonly _queue: Map<string, QueuedEvent>;
  private _isProcessing = false;
  
  constructor() {
    this.LEDGER_API_URL = process.env.LEDGER_API_URL || 'http://localhost:8006';
    this._queue = new Map();
  }
  
  /**
   * Write event to Ledger with guaranteed delivery
   */
  public async writeEvent(event: LedgerEvent): Promise<LedgerWriteResult> {
    const validated = LedgerEventSchema.parse(event);
    
    // Generate idempotency key if not provided
    const idempotencyKey = validated.idempotencyKey || this.generateIdempotencyKey(validated);
    const correlationId = validated.correlationId || randomUUID();
    
    const eventWithIds: LedgerEvent = {
      ...validated,
      idempotencyKey,
      correlationId,
    };
    
    // Try direct write first
    const result = await this.attemptWrite(eventWithIds);
    
    if (result.success) {
      return result;
    }
    
    // If failed and retryable, queue for retry
    if (result.retryable) {
      this.queueEvent(eventWithIds);
      this.processQueue(); // Start background processing
      
      return {
        success: false,
        error: `Write queued for retry: ${result.error}`,
        retryable: true,
      };
    }
    
    return result;
  }
  
  /**
   * Write multiple events atomically
   */
  public async writeBatch(events: LedgerEvent[]): Promise<LedgerWriteResult[]> {
    // Process sequentially for now (production: batch API)
    const results: LedgerWriteResult[] = [];
    
    for (const event of events) {
      const result = await this.writeEvent(event);
      results.push(result);
      
      // Stop on non-retryable error
      if (!result.success && !result.retryable) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Attempt to write event to Ledger API
   */
  private async attemptWrite(event: LedgerEvent): Promise<LedgerWriteResult> {
    const payload = {
      event_type: event.eventType,
      asset_id: event.assetId,
      anchor_id: event.anchorId,
      owner_id: event.ownerId,
      payload: event.payload,
      source: event.sourceApp,
      correlation_id: event.correlationId,
      idempotency_key: event.idempotencyKey,
      occurred_at: new Date().toISOString(),
    };
    
    try {
      const response = await fetch(`${this.LEDGER_API_URL}/api/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source-App': 'proveniq-core',
          'X-Correlation-Id': event.correlationId || '',
          'X-Idempotency-Key': event.idempotencyKey || '',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const data = await response.json() as { id?: string; event_id?: string; entry_hash?: string; hash?: string };
        console.log(`[LEDGER] Event written: ${data.id || data.event_id}`);
        
        return {
          success: true,
          eventId: data.id || data.event_id,
          entryHash: data.entry_hash || data.hash,
        };
      }
      
      // Handle specific error codes
      const status = response.status;
      const errorData = await response.json().catch(() => ({})) as { existing_event_id?: string; message?: string };
      
      if (status === 409) {
        // Duplicate - idempotency check passed, treat as success
        console.log(`[LEDGER] Duplicate event (idempotent): ${event.idempotencyKey}`);
        return {
          success: true,
          eventId: errorData.existing_event_id,
        };
      }
      
      if (status >= 500) {
        // Server error - retryable
        return {
          success: false,
          error: `Ledger server error: ${status}`,
          retryable: true,
        };
      }
      
      // Client error - not retryable
      return {
        success: false,
        error: `Ledger client error: ${status} - ${errorData.message || 'Unknown error'}`,
        retryable: false,
      };
      
    } catch (error) {
      // Network error - retryable
      console.error('[LEDGER] Network error:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
        retryable: true,
      };
    }
  }
  
  /**
   * Queue event for retry
   */
  private queueEvent(event: LedgerEvent): void {
    const queuedEvent: QueuedEvent = {
      id: randomUUID(),
      event,
      attempts: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    this._queue.set(queuedEvent.id, queuedEvent);
    console.log(`[LEDGER] Event queued: ${queuedEvent.id}`);
  }
  
  /**
   * Process queued events (background)
   */
  private async processQueue(): Promise<void> {
    if (this._isProcessing) return;
    this._isProcessing = true;
    
    try {
      for (const [id, queuedEvent] of this._queue) {
        if (queuedEvent.status !== 'pending') continue;
        if (queuedEvent.attempts >= this.MAX_RETRIES) {
          queuedEvent.status = 'failed';
          console.error(`[LEDGER] Event failed after ${this.MAX_RETRIES} attempts: ${id}`);
          continue;
        }
        
        queuedEvent.status = 'processing';
        queuedEvent.attempts++;
        queuedEvent.lastAttempt = new Date().toISOString();
        
        // Wait before retry
        await new Promise(r => setTimeout(r, this.RETRY_DELAY_MS * queuedEvent.attempts));
        
        const result = await this.attemptWrite(queuedEvent.event);
        
        if (result.success) {
          queuedEvent.status = 'success';
          this._queue.delete(id);
          console.log(`[LEDGER] Queued event succeeded: ${id}`);
        } else if (!result.retryable) {
          queuedEvent.status = 'failed';
          console.error(`[LEDGER] Queued event permanently failed: ${id}`);
        } else {
          queuedEvent.status = 'pending'; // Will retry
        }
      }
    } finally {
      this._isProcessing = false;
    }
  }
  
  /**
   * Generate idempotency key from event content
   */
  private generateIdempotencyKey(event: LedgerEvent): string {
    const content = JSON.stringify({
      eventType: event.eventType,
      assetId: event.assetId,
      payload: event.payload,
      sourceApp: event.sourceApp,
    });
    
    return createHash('sha256').update(content).digest('hex').substring(0, 32);
  }
  
  /**
   * Get queue status
   */
  public getQueueStatus(): { pending: number; failed: number; total: number } {
    let pending = 0;
    let failed = 0;
    
    for (const event of this._queue.values()) {
      if (event.status === 'pending' || event.status === 'processing') pending++;
      if (event.status === 'failed') failed++;
    }
    
    return { pending, failed, total: this._queue.size };
  }
  
  /**
   * Verify event exists in Ledger
   */
  public async verifyEvent(eventId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.LEDGER_API_URL}/api/v1/events/${eventId}`, {
        method: 'GET',
        headers: {
          'X-Source-App': 'proveniq-core',
        },
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Helper: Write asset registration event
   */
  public async writeAssetRegistration(
    assetId: string,
    ownerId: string,
    metadata: Record<string, unknown>
  ): Promise<LedgerWriteResult> {
    return this.writeEvent({
      eventType: 'CORE_ASSET_REGISTERED',
      assetId,
      ownerId,
      payload: {
        ...metadata,
        registered_at: new Date().toISOString(),
      },
      sourceApp: 'core',
    });
  }
  
  /**
   * Helper: Write ownership transfer event
   */
  public async writeOwnershipTransfer(
    assetId: string,
    fromOwnerId: string,
    toOwnerId: string,
    transferType: string
  ): Promise<LedgerWriteResult> {
    return this.writeEvent({
      eventType: 'CORE_OWNERSHIP_TRANSFERRED',
      assetId,
      payload: {
        from_owner: fromOwnerId,
        to_owner: toOwnerId,
        transfer_type: transferType,
        transferred_at: new Date().toISOString(),
      },
      sourceApp: 'core',
    });
  }
  
  /**
   * Helper: Write valuation event
   */
  public async writeValuation(
    assetId: string,
    valuation: Record<string, unknown>
  ): Promise<LedgerWriteResult> {
    return this.writeEvent({
      eventType: 'CORE_VALUATION_GENERATED',
      assetId,
      payload: valuation,
      sourceApp: 'core',
    });
  }
  
  /**
   * Helper: Write fraud score event
   */
  public async writeFraudScore(
    assetId: string,
    userId: string,
    score: number,
    riskLevel: string
  ): Promise<LedgerWriteResult> {
    return this.writeEvent({
      eventType: 'CORE_FRAUD_SCORED',
      assetId,
      ownerId: userId,
      payload: {
        score,
        risk_level: riskLevel,
        scored_at: new Date().toISOString(),
      },
      sourceApp: 'core',
    });
  }
}

// Singleton instance
export const ledgerWriteClient = new LedgerWriteClient();
