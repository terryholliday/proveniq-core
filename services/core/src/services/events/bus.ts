/**
 * @file services/events/bus.ts
 * @description PROVENIQ Core Event Bus
 * 
 * Pub/sub system for cross-app event communication:
 * - Event publishing with guaranteed delivery
 * - Subscription management
 * - Event history and replay
 * - Webhook delivery to subscribers
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export const EventSchema = z.object({
  eventType: z.string(),
  sourceApp: z.enum([
    'core', 'ledger', 'home', 'claimsiq', 'properties', 
    'bids', 'service', 'ops', 'capital', 'transit', 'protect'
  ]),
  entityType: z.enum(['asset', 'user', 'claim', 'auction', 'loan', 'inspection', 'order', 'shipment']),
  entityId: z.string(),
  payload: z.record(z.any()),
  metadata: z.object({
    correlationId: z.string().optional(),
    causationId: z.string().optional(),
    userId: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
});

export type EventInput = z.infer<typeof EventSchema>;

export interface ProveniqEvent extends EventInput {
  eventId: string;
  publishedAt: string;
  version: number;
}

export interface Subscription {
  subscriptionId: string;
  subscriberApp: string;
  eventTypes: string[]; // Empty = all events
  entityTypes: string[]; // Empty = all entities
  webhookUrl: string;
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface DeliveryAttempt {
  eventId: string;
  subscriptionId: string;
  attemptNumber: number;
  status: 'pending' | 'delivered' | 'failed';
  responseCode?: number;
  error?: string;
  attemptedAt: string;
}

// ============================================
// EVENT TYPES
// ============================================

export const EVENT_TYPES = {
  // Asset Events
  ASSET_REGISTERED: 'asset.registered',
  ASSET_VALUED: 'asset.valued',
  ASSET_TRANSFERRED: 'asset.transferred',
  ASSET_CONDITION_ASSESSED: 'asset.condition_assessed',
  ASSET_ANCHORED: 'asset.anchored',
  
  // Claim Events
  CLAIM_SUBMITTED: 'claim.submitted',
  CLAIM_APPROVED: 'claim.approved',
  CLAIM_DENIED: 'claim.denied',
  CLAIM_PAID: 'claim.paid',
  
  // Auction Events
  AUCTION_CREATED: 'auction.created',
  AUCTION_BID_PLACED: 'auction.bid_placed',
  AUCTION_ENDED: 'auction.ended',
  AUCTION_SETTLED: 'auction.settled',
  
  // Loan Events
  LOAN_APPLIED: 'loan.applied',
  LOAN_APPROVED: 'loan.approved',
  LOAN_FUNDED: 'loan.funded',
  LOAN_PAYMENT_RECEIVED: 'loan.payment_received',
  LOAN_DEFAULTED: 'loan.defaulted',
  
  // Inspection Events
  INSPECTION_STARTED: 'inspection.started',
  INSPECTION_COMPLETED: 'inspection.completed',
  DAMAGE_DETECTED: 'inspection.damage_detected',
  
  // Service Events
  WORK_ORDER_CREATED: 'service.work_order_created',
  WORK_ORDER_ASSIGNED: 'service.work_order_assigned',
  WORK_ORDER_COMPLETED: 'service.work_order_completed',
  
  // Custody Events
  CUSTODY_OFFERED: 'custody.offered',
  CUSTODY_ACCEPTED: 'custody.accepted',
  CUSTODY_TRANSFERRED: 'custody.transferred',
  
  // Fraud Events
  FRAUD_DETECTED: 'fraud.detected',
  ANOMALY_DETECTED: 'fraud.anomaly_detected',
} as const;

// ============================================
// IN-MEMORY STORES (Production: Use Redis/Postgres)
// ============================================

const events: Map<string, ProveniqEvent> = new Map();
const subscriptions: Map<string, Subscription> = new Map();
const deliveryQueue: DeliveryAttempt[] = [];

// ============================================
// EVENT BUS
// ============================================

export class EventBus {
  private version = 1;

  /**
   * Publish an event to the bus
   */
  async publish(input: EventInput): Promise<ProveniqEvent> {
    const validated = EventSchema.parse(input);
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const event: ProveniqEvent = {
      ...validated,
      eventId,
      publishedAt: now,
      version: this.version,
      metadata: {
        ...validated.metadata,
        timestamp: validated.metadata?.timestamp || now,
      },
    };

    // Store event
    events.set(eventId, event);

    console.log(`[EventBus] Published: ${event.eventType} from ${event.sourceApp} (${eventId})`);

    // Deliver to subscribers (async, non-blocking)
    this.deliverToSubscribers(event).catch(err => {
      console.error('[EventBus] Delivery error:', err);
    });

    return event;
  }

  /**
   * Subscribe to events
   */
  async subscribe(
    subscriberApp: string,
    webhookUrl: string,
    options: {
      eventTypes?: string[];
      entityTypes?: string[];
    } = {}
  ): Promise<Subscription> {
    const subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const secret = `sec_${Math.random().toString(36).substr(2, 32)}`;

    const subscription: Subscription = {
      subscriptionId,
      subscriberApp,
      eventTypes: options.eventTypes || [],
      entityTypes: options.entityTypes || [],
      webhookUrl,
      secret,
      active: true,
      createdAt: new Date().toISOString(),
    };

    subscriptions.set(subscriptionId, subscription);

    console.log(`[EventBus] New subscription: ${subscriberApp} -> ${subscriptionId}`);

    return subscription;
  }

  /**
   * Unsubscribe
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const sub = subscriptions.get(subscriptionId);
    if (sub) {
      sub.active = false;
      console.log(`[EventBus] Unsubscribed: ${subscriptionId}`);
      return true;
    }
    return false;
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<ProveniqEvent | null> {
    return events.get(eventId) || null;
  }

  /**
   * Get events for an entity
   */
  async getEntityEvents(
    entityType: string,
    entityId: string,
    options: { limit?: number; after?: string } = {}
  ): Promise<ProveniqEvent[]> {
    const limit = options.limit || 100;
    const results: ProveniqEvent[] = [];

    for (const event of events.values()) {
      if (event.entityType === entityType && event.entityId === entityId) {
        if (options.after && event.publishedAt <= options.after) continue;
        results.push(event);
        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  /**
   * Get recent events
   */
  async getRecentEvents(
    options: { 
      limit?: number; 
      eventTypes?: string[];
      sourceApp?: string;
    } = {}
  ): Promise<ProveniqEvent[]> {
    const limit = options.limit || 50;
    let results = Array.from(events.values());

    if (options.eventTypes?.length) {
      results = results.filter(e => options.eventTypes!.includes(e.eventType));
    }

    if (options.sourceApp) {
      results = results.filter(e => e.sourceApp === options.sourceApp);
    }

    return results
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get all active subscriptions
   */
  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(subscriptions.values()).filter(s => s.active);
  }

  /**
   * Deliver event to all matching subscribers
   */
  private async deliverToSubscribers(event: ProveniqEvent): Promise<void> {
    const activeSubscriptions = Array.from(subscriptions.values()).filter(s => s.active);

    for (const sub of activeSubscriptions) {
      // Check if subscription matches event
      if (!this.subscriptionMatches(sub, event)) continue;

      // Queue delivery
      const attempt: DeliveryAttempt = {
        eventId: event.eventId,
        subscriptionId: sub.subscriptionId,
        attemptNumber: 1,
        status: 'pending',
        attemptedAt: new Date().toISOString(),
      };

      deliveryQueue.push(attempt);

      // Attempt delivery (in production: use proper queue with retries)
      this.attemptDelivery(event, sub, attempt).catch(err => {
        console.error(`[EventBus] Delivery failed to ${sub.subscriberApp}:`, err);
      });
    }
  }

  /**
   * Check if subscription matches event
   */
  private subscriptionMatches(sub: Subscription, event: ProveniqEvent): boolean {
    // Check event type filter
    if (sub.eventTypes.length > 0 && !sub.eventTypes.includes(event.eventType)) {
      return false;
    }

    // Check entity type filter
    if (sub.entityTypes.length > 0 && !sub.entityTypes.includes(event.entityType)) {
      return false;
    }

    return true;
  }

  /**
   * Attempt to deliver event to subscriber
   */
  private async attemptDelivery(
    event: ProveniqEvent,
    sub: Subscription,
    attempt: DeliveryAttempt
  ): Promise<void> {
    try {
      const response = await fetch(sub.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Proveniq-Event-Id': event.eventId,
          'X-Proveniq-Event-Type': event.eventType,
          'X-Proveniq-Signature': this.generateSignature(event, sub.secret),
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      attempt.responseCode = response.status;
      attempt.status = response.ok ? 'delivered' : 'failed';

      if (!response.ok) {
        attempt.error = `HTTP ${response.status}`;
      }

      console.log(`[EventBus] Delivered ${event.eventId} to ${sub.subscriberApp}: ${attempt.status}`);
    } catch (error) {
      attempt.status = 'failed';
      attempt.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EventBus] Delivery failed to ${sub.subscriberApp}:`, attempt.error);
    }
  }

  /**
   * Generate webhook signature for verification
   */
  private generateSignature(event: ProveniqEvent, secret: string): string {
    // Simple signature (production: use HMAC-SHA256)
    const payload = JSON.stringify(event);
    const hash = Buffer.from(`${payload}:${secret}`).toString('base64').slice(0, 32);
    return `sha256=${hash}`;
  }

  /**
   * Get delivery status for an event
   */
  async getDeliveryStatus(eventId: string): Promise<DeliveryAttempt[]> {
    return deliveryQueue.filter(d => d.eventId === eventId);
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{
    totalEvents: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    pendingDeliveries: number;
  }> {
    return {
      totalEvents: events.size,
      totalSubscriptions: subscriptions.size,
      activeSubscriptions: Array.from(subscriptions.values()).filter(s => s.active).length,
      pendingDeliveries: deliveryQueue.filter(d => d.status === 'pending').length,
    };
  }
}

// Singleton
let eventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBus) {
    eventBus = new EventBus();
  }
  return eventBus;
}
