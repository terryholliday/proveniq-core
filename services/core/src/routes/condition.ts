/**
 * @file routes/condition.ts
 * @description PROVENIQ Core Condition Assessment API Routes (P1)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConditionAssessor, ConditionAssessmentRequestSchema } from '../services/condition/assessor';

export async function conditionRoutes(fastify: FastifyInstance) {
  const assessor = getConditionAssessor();

  /**
   * POST /api/v1/condition/assess
   * Assess asset condition from photos
   */
  fastify.post('/assess', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      // Validate request
      const validated = ConditionAssessmentRequestSchema.safeParse(body);
      if (!validated.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: validated.error.errors,
        });
      }

      const result = await assessor.assess(validated.data);

      // Log to console for debugging
      console.log(`[Condition] Assessed ${result.assetId}: ${result.condition} (${result.conditionScore}/100)`);

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Condition] Assessment error:', error);
      return reply.status(500).send({
        error: 'Assessment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/condition/compare
   * Compare before/after condition (for claims, inspections)
   */
  fastify.post('/compare', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      if (!body.beforeImageUrls || !body.afterImageUrls) {
        return reply.status(400).send({
          error: 'Both beforeImageUrls and afterImageUrls required',
        });
      }

      // Assess "before" state
      const beforeResult = await assessor.assess({
        assetId: body.assetId,
        imageUrls: body.beforeImageUrls,
        category: body.category,
        context: 'inspection',
      });

      // Assess "after" state with comparison
      const afterResult = await assessor.assess({
        assetId: body.assetId,
        imageUrls: body.afterImageUrls,
        category: body.category,
        context: body.context || 'claim',
        previousCondition: beforeResult.condition,
        compareToImageUrls: body.beforeImageUrls,
      });

      console.log(`[Condition] Comparison: ${beforeResult.condition} → ${afterResult.condition}`);

      return reply.status(200).send({
        assetId: body.assetId,
        before: {
          condition: beforeResult.condition,
          conditionScore: beforeResult.conditionScore,
          damages: beforeResult.damages,
        },
        after: {
          condition: afterResult.condition,
          conditionScore: afterResult.conditionScore,
          damages: afterResult.damages,
        },
        comparison: afterResult.comparison,
        valueImpact: {
          beforeMultiplier: afterResult.comparison ? 
            getConditionMultiplier(beforeResult.condition) : 1,
          afterMultiplier: getConditionMultiplier(afterResult.condition),
          deteriorationPercent: afterResult.comparison?.deteriorationScore || 0,
        },
        recommendation: afterResult.comparison?.recommendation || 'no_action',
        assessedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Condition] Comparison error:', error);
      return reply.status(500).send({
        error: 'Comparison failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/condition/multipliers
   * Get condition multipliers for valuation
   */
  fastify.get('/multipliers', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      multipliers: {
        new: 1.0,
        excellent: 0.95,
        good: 0.85,
        fair: 0.70,
        poor: 0.50,
      },
      description: 'Condition multipliers applied to base valuation',
    });
  });
}

function getConditionMultiplier(condition: string): number {
  const multipliers: Record<string, number> = {
    new: 1.0,
    excellent: 0.95,
    good: 0.85,
    fair: 0.70,
    poor: 0.50,
  };
  return multipliers[condition] || 0.85;
}

export default conditionRoutes;
