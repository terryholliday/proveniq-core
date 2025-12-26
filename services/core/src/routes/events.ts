/**
 * @file routes/events.ts
 * @description PROVENIQ Core Event Bus API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getEventBus, EventSchema, EVENT_TYPES } from '../services/events/bus';

export async function eventRoutes(fastify: FastifyInstance) {
  const bus = getEventBus();

  /**
   * POST /api/v1/events/publish
   * Publish an event to the bus
   */
  fastify.post('/publish', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const validated = EventSchema.safeParse(body);
      if (!validated.success) {
        return reply.status(400).send({
          error: 'Invalid event',
          details: validated.error.errors,
        });
      }

      const event = await bus.publish(validated.data);

      return reply.status(201).send({
        success: true,
        eventId: event.eventId,
        publishedAt: event.publishedAt,
      });
    } catch (error) {
      console.error('[Events] Publish error:', error);
      return reply.status(500).send({
        error: 'Failed to publish event',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/events/subscribe
   * Subscribe to events
   */
  fastify.post('/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { subscriberApp, webhookUrl, eventTypes, entityTypes } = request.body as any;
      
      if (!subscriberApp || !webhookUrl) {
        return reply.status(400).send({
          error: 'subscriberApp and webhookUrl are required',
        });
      }

      const subscription = await bus.subscribe(subscriberApp, webhookUrl, {
        eventTypes,
        entityTypes,
      });

      return reply.status(201).send({
        subscriptionId: subscription.subscriptionId,
        secret: subscription.secret,
        message: 'Store the secret securely - it will not be shown again',
      });
    } catch (error) {
      console.error('[Events] Subscribe error:', error);
      return reply.status(500).send({
        error: 'Failed to create subscription',
      });
    }
  });

  /**
   * DELETE /api/v1/events/subscribe/:id
   * Unsubscribe
   */
  fastify.delete('/subscribe/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const success = await bus.unsubscribe(id);
      
      if (!success) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }

      return reply.status(200).send({ success: true });
    } catch (error) {
      console.error('[Events] Unsubscribe error:', error);
      return reply.status(500).send({ error: 'Failed to unsubscribe' });
    }
  });

  /**
   * GET /api/v1/events/:id
   * Get event by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const event = await bus.getEvent(id);
      
      if (!event) {
        return reply.status(404).send({ error: 'Event not found' });
      }

      return reply.status(200).send(event);
    } catch (error) {
      console.error('[Events] Get error:', error);
      return reply.status(500).send({ error: 'Failed to get event' });
    }
  });

  /**
   * GET /api/v1/events/entity/:type/:id
   * Get events for an entity
   */
  fastify.get('/entity/:type/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type, id } = request.params as { type: string; id: string };
      const { limit, after } = request.query as { limit?: string; after?: string };
      
      const events = await bus.getEntityEvents(type, id, {
        limit: limit ? parseInt(limit) : undefined,
        after,
      });

      return reply.status(200).send({ events, count: events.length });
    } catch (error) {
      console.error('[Events] Entity events error:', error);
      return reply.status(500).send({ error: 'Failed to get entity events' });
    }
  });

  /**
   * GET /api/v1/events/recent
   * Get recent events
   */
  fastify.get('/recent', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit, eventTypes, sourceApp } = request.query as { 
        limit?: string; 
        eventTypes?: string;
        sourceApp?: string;
      };
      
      const events = await bus.getRecentEvents({
        limit: limit ? parseInt(limit) : undefined,
        eventTypes: eventTypes ? eventTypes.split(',') : undefined,
        sourceApp,
      });

      return reply.status(200).send({ events, count: events.length });
    } catch (error) {
      console.error('[Events] Recent events error:', error);
      return reply.status(500).send({ error: 'Failed to get recent events' });
    }
  });

  /**
   * GET /api/v1/events/subscriptions
   * Get all active subscriptions
   */
  fastify.get('/subscriptions', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const subscriptions = await bus.getSubscriptions();

      // Remove secrets from response
      const sanitized = subscriptions.map(s => ({
        ...s,
        secret: '***',
      }));

      return reply.status(200).send({ subscriptions: sanitized });
    } catch (error) {
      console.error('[Events] Subscriptions error:', error);
      return reply.status(500).send({ error: 'Failed to get subscriptions' });
    }
  });

  /**
   * GET /api/v1/events/delivery/:eventId
   * Get delivery status for an event
   */
  fastify.get('/delivery/:eventId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { eventId } = request.params as { eventId: string };
      
      const deliveries = await bus.getDeliveryStatus(eventId);

      return reply.status(200).send({ deliveries });
    } catch (error) {
      console.error('[Events] Delivery status error:', error);
      return reply.status(500).send({ error: 'Failed to get delivery status' });
    }
  });

  /**
   * GET /api/v1/events/stats
   * Get event bus stats
   */
  fastify.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await bus.getStats();

      return reply.status(200).send(stats);
    } catch (error) {
      console.error('[Events] Stats error:', error);
      return reply.status(500).send({ error: 'Failed to get stats' });
    }
  });

  /**
   * GET /api/v1/events/types
   * Get all available event types
   */
  fastify.get('/types', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ eventTypes: EVENT_TYPES });
  });
}

export default eventRoutes;
