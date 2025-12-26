/**
 * @file routes/valuations.ts
 * @description PROVENIQ Core Valuation API Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { valuationEngine, ValuationRequestSchema } from '../services';
import { AppError, ErrorCode } from '../errors/errors';

export async function valuationRoutes(server: FastifyInstance) {
  /**
   * POST /api/v1/valuations
   * Generate a valuation for an asset
   */
  server.post('/', async (request, reply) => {
    try {
      const body = ValuationRequestSchema.safeParse(request.body);
      
      if (!body.success) {
        throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid valuation request', body.error);
      }
      
      const result = await valuationEngine.valuate(body.data);
      
      reply.status(200).send(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Valuation failed', error);
    }
  });
  
  /**
   * POST /api/v1/valuations/batch
   * Generate valuations for multiple assets
   */
  server.post('/batch', async (request, reply) => {
    try {
      const body = z.array(ValuationRequestSchema).safeParse(request.body);
      
      if (!body.success) {
        throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid batch request', body.error);
      }
      
      const results = await Promise.all(
        body.data.map(req => valuationEngine.valuate(req))
      );
      
      reply.status(200).send({ valuations: results, count: results.length });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Batch valuation failed', error);
    }
  });
}
