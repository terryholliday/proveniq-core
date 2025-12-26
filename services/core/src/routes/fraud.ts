/**
 * @file routes/fraud.ts
 * @description PROVENIQ Core Fraud Scoring API Routes
 */

import { FastifyInstance } from 'fastify';
import { fraudScorer, FraudScoringRequestSchema } from '../services';
import { AppError, ErrorCode } from '../errors/errors';

export async function fraudRoutes(server: FastifyInstance) {
  /**
   * POST /api/v1/fraud/score
   * Generate fraud risk score for an asset/claim
   */
  server.post('/score', async (request, reply) => {
    try {
      const body = FraudScoringRequestSchema.safeParse(request.body);
      
      if (!body.success) {
        throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid fraud scoring request', body.error);
      }
      
      const result = await fraudScorer.score(body.data);
      
      reply.status(200).send(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Fraud scoring failed', error);
    }
  });
}
