/**
 * @file routes/anomaly.ts
 * @description PROVENIQ Core Anomaly Detection API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAnomalyDetector, AnomalyDetectionRequestSchema } from '../services/anomaly/detector';

export async function anomalyRoutes(fastify: FastifyInstance) {
  const detector = getAnomalyDetector();

  /**
   * POST /api/v1/anomaly/detect
   * Detect anomalies in activity patterns
   */
  fastify.post('/detect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const validated = AnomalyDetectionRequestSchema.safeParse(body);
      if (!validated.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: validated.error.errors,
        });
      }

      const result = await detector.detect(validated.data);

      if (result.anomalyDetected) {
        console.log(`[Anomaly] Detected: ${result.anomalies.length} anomalies for ${result.entityType}:${result.entityId} (score=${result.anomalyScore})`);
      }

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Anomaly] Detection error:', error);
      return reply.status(500).send({
        error: 'Anomaly detection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/anomaly/velocity
   * Check for velocity spikes only
   */
  fastify.post('/velocity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { entityId, entityType, recentEventCount, baselineFrequency } = request.body as any;
      
      if (!entityId || !entityType) {
        return reply.status(400).send({ error: 'entityId and entityType required' });
      }

      // Create synthetic events for velocity check
      const recentEvents = Array(recentEventCount || 0).fill(null).map((_, i) => ({
        eventType: 'activity',
        timestamp: new Date(Date.now() - i * 60000).toISOString(), // Events in last hour
      }));

      const result = await detector.detect({
        entityType,
        entityId,
        eventType: 'activity',
        recentEvents,
        baselineAvgFrequency: baselineFrequency || 10,
      });

      const velocityAnomaly = result.anomalies.find(a => a.type === 'VELOCITY_SPIKE');

      return reply.status(200).send({
        entityId,
        velocitySpike: !!velocityAnomaly,
        severity: velocityAnomaly?.severity || null,
        multiplier: velocityAnomaly?.details?.multiplier || 1,
        recommendation: result.recommendedAction,
      });
    } catch (error) {
      console.error('[Anomaly] Velocity check error:', error);
      return reply.status(500).send({ error: 'Velocity check failed' });
    }
  });

  /**
   * POST /api/v1/anomaly/geo
   * Check for geographic anomalies (impossible travel)
   */
  fastify.post('/geo', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { entityId, currentLat, currentLng, lastLat, lastLng, lastTimestamp } = request.body as any;
      
      if (!entityId || currentLat === undefined || currentLng === undefined) {
        return reply.status(400).send({ error: 'entityId, currentLat, currentLng required' });
      }

      const result = await detector.detect({
        entityType: 'user',
        entityId,
        eventType: 'location_check',
        currentLocation: { lat: currentLat, lng: currentLng },
        lastKnownLocation: lastLat !== undefined ? {
          lat: lastLat,
          lng: lastLng,
          timestamp: lastTimestamp || new Date(Date.now() - 3600000).toISOString(),
        } : undefined,
      });

      const geoAnomaly = result.anomalies.find(a => a.type === 'GEO_ANOMALY');

      return reply.status(200).send({
        entityId,
        impossibleTravel: geoAnomaly?.severity === 'critical',
        suspiciousTravel: !!geoAnomaly,
        details: geoAnomaly?.details || null,
        recommendation: result.recommendedAction,
      });
    } catch (error) {
      console.error('[Anomaly] Geo check error:', error);
      return reply.status(500).send({ error: 'Geo check failed' });
    }
  });

  /**
   * POST /api/v1/anomaly/amount
   * Check for amount anomalies
   */
  fastify.post('/amount', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { entityId, entityType, currentAmount, historicalAmounts } = request.body as any;
      
      if (!entityId || currentAmount === undefined) {
        return reply.status(400).send({ error: 'entityId and currentAmount required' });
      }

      const recentEvents = (historicalAmounts || []).map((amount: number, i: number) => ({
        eventType: 'transaction',
        eventValue: amount,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      const result = await detector.detect({
        entityType: entityType || 'user',
        entityId,
        eventType: 'transaction',
        eventValue: currentAmount,
        recentEvents,
        baselineAvgValue: historicalAmounts?.length > 0 
          ? historicalAmounts.reduce((a: number, b: number) => a + b, 0) / historicalAmounts.length 
          : currentAmount,
      });

      const amountAnomaly = result.anomalies.find(a => a.type === 'AMOUNT_ANOMALY');

      return reply.status(200).send({
        entityId,
        amountAnomaly: !!amountAnomaly,
        severity: amountAnomaly?.severity || null,
        deviation: amountAnomaly?.details?.deviation || 0,
        recommendation: result.recommendedAction,
      });
    } catch (error) {
      console.error('[Anomaly] Amount check error:', error);
      return reply.status(500).send({ error: 'Amount check failed' });
    }
  });
}

export default anomalyRoutes;
