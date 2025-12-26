/**
 * @file routes/risk.ts
 * @description PROVENIQ Core Risk Assessment API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRiskAssessor, RiskAssessmentRequestSchema } from '../services/risk/assessor';

export async function riskRoutes(fastify: FastifyInstance) {
  const assessor = getRiskAssessor();

  /**
   * POST /api/v1/risk/assess
   * Assess risk for insurance, lending, sale, or custody
   */
  fastify.post('/assess', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const validated = RiskAssessmentRequestSchema.safeParse(body);
      if (!validated.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: validated.error.errors,
        });
      }

      const result = await assessor.assess(validated.data);

      console.log(`[Risk] Assessment: ${result.riskType} for ${result.assetId} = ${result.riskScore} (${result.riskLevel})`);

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Risk] Assessment error:', error);
      return reply.status(500).send({
        error: 'Risk assessment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/risk/insurance
   * Shortcut for insurance risk assessment
   */
  fastify.post('/insurance', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const result = await assessor.assess({
        ...body,
        riskType: 'insurance',
      });

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Risk] Insurance assessment error:', error);
      return reply.status(500).send({
        error: 'Insurance risk assessment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/risk/lending
   * Shortcut for lending risk assessment
   */
  fastify.post('/lending', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const result = await assessor.assess({
        ...body,
        riskType: 'lending',
      });

      return reply.status(200).send({
        ...result,
        // Add lending-specific fields
        lendingDecision: {
          approved: result.recommendation !== 'DECLINE',
          maxLoanAmount: result.maxApprovedAmount,
          suggestedLTV: result.suggestedLTV,
          interestTier: result.riskLevel === 'LOW' ? 'prime' : 
                        result.riskLevel === 'MEDIUM' ? 'standard' : 'subprime',
        },
      });
    } catch (error) {
      console.error('[Risk] Lending assessment error:', error);
      return reply.status(500).send({
        error: 'Lending risk assessment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/risk/sale
   * Shortcut for sale/auction risk assessment
   */
  fastify.post('/sale', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const result = await assessor.assess({
        ...body,
        riskType: 'sale',
      });

      return reply.status(200).send({
        ...result,
        // Add sale-specific fields
        saleDecision: {
          canList: result.recommendation !== 'DECLINE',
          requiresVerification: result.riskLevel !== 'LOW',
          suggestedReserve: result.riskLevel === 'HIGH' ? 
            Math.round(body.currentValue * 0.8) : undefined,
        },
      });
    } catch (error) {
      console.error('[Risk] Sale assessment error:', error);
      return reply.status(500).send({
        error: 'Sale risk assessment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/risk/custody
   * Shortcut for custody transfer risk assessment
   */
  fastify.post('/custody', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const result = await assessor.assess({
        ...body,
        riskType: 'custody',
      });

      return reply.status(200).send({
        ...result,
        // Add custody-specific fields
        custodyDecision: {
          transferApproved: result.recommendation !== 'DECLINE',
          requiresAnchor: !body.hasAnchorVerification && result.riskLevel !== 'LOW',
          suggestedInsurance: result.riskLevel !== 'LOW',
          handoffProtocol: result.riskLevel === 'HIGH' ? 'witnessed' : 'standard',
        },
      });
    } catch (error) {
      console.error('[Risk] Custody assessment error:', error);
      return reply.status(500).send({
        error: 'Custody risk assessment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/risk/categories
   * Get risk profiles for all categories
   */
  fastify.get('/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = [
      { category: 'electronics', baseRisk: 40, liquidity: 85, theftRisk: 70 },
      { category: 'jewelry', baseRisk: 50, liquidity: 70, theftRisk: 90 },
      { category: 'watches', baseRisk: 45, liquidity: 75, theftRisk: 85 },
      { category: 'furniture', baseRisk: 25, liquidity: 50, theftRisk: 20 },
      { category: 'appliances', baseRisk: 30, liquidity: 60, theftRisk: 25 },
      { category: 'vehicles', baseRisk: 35, liquidity: 80, theftRisk: 60 },
      { category: 'art', baseRisk: 55, liquidity: 40, theftRisk: 75 },
      { category: 'collectibles', baseRisk: 50, liquidity: 45, theftRisk: 65 },
      { category: 'clothing', baseRisk: 35, liquidity: 55, theftRisk: 40 },
      { category: 'musical_instruments', baseRisk: 35, liquidity: 55, theftRisk: 50 },
    ];

    return reply.status(200).send({ categories });
  });
}

export default riskRoutes;
