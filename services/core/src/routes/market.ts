/**
 * @file routes/market.ts
 * @description PROVENIQ Core Market Intelligence API Routes (P1)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getMarketIntelligence, MarketQuerySchema } from '../services/market/intelligence';

export async function marketRoutes(fastify: FastifyInstance) {
  const market = getMarketIntelligence();

  /**
   * POST /api/v1/market/query
   * Query market intelligence for a category
   */
  fastify.post('/query', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const validated = MarketQuerySchema.safeParse(body);
      if (!validated.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: validated.error.errors,
        });
      }

      const result = await market.query(validated.data);

      console.log(`[Market] Query: ${result.query.category} - ${result.comparableCount} comparables found`);

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Market] Query error:', error);
      return reply.status(500).send({
        error: 'Market query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/market/suggest-price
   * Get price suggestion for an asset
   */
  fastify.post('/suggest-price', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { category, condition, brand, purchasePrice } = request.body as any;
      
      if (!category || !condition) {
        return reply.status(400).send({
          error: 'category and condition are required',
        });
      }

      const result = await market.suggestPrice(category, condition, brand, purchasePrice);

      console.log(`[Market] Price suggestion: ${category} ${condition} → $${result.suggestedPrice}`);

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Market] Price suggestion error:', error);
      return reply.status(500).send({
        error: 'Price suggestion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/market/comparables/:category
   * Get comparable sales for a category
   */
  fastify.get('/comparables/:category', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { category } = request.params as { category: string };
      const { brand, condition, limit } = request.query as any;
      
      const result = await market.query({
        category,
        brand,
        condition,
        timeframeDays: 90,
      });

      const comparables = result.comparables.slice(0, parseInt(limit) || 10);

      return reply.status(200).send({
        category,
        comparables,
        count: comparables.length,
        marketPrice: result.marketPrice,
      });
    } catch (error) {
      console.error('[Market] Comparables error:', error);
      return reply.status(500).send({
        error: 'Comparables query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/market/trends/:category
   * Get price trends for a category
   */
  fastify.get('/trends/:category', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { category } = request.params as { category: string };
      const { timeframeDays } = request.query as any;
      
      const result = await market.query({
        category,
        timeframeDays: parseInt(timeframeDays) || 90,
      });

      return reply.status(200).send({
        category,
        trends: result.trends,
        overallTrend: result.overallTrend,
        trendConfidence: result.trendConfidence,
        demand: result.demand,
      });
    } catch (error) {
      console.error('[Market] Trends error:', error);
      return reply.status(500).send({
        error: 'Trends query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export default marketRoutes;
