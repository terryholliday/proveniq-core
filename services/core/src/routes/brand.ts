/**
 * @file routes/brand.ts
 * @description PROVENIQ Core Brand Recognition API Routes (P1)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getBrandRecognizer, BrandRecognitionRequestSchema } from '../services/brand/recognizer';

export async function brandRoutes(fastify: FastifyInstance) {
  const recognizer = getBrandRecognizer();

  /**
   * POST /api/v1/brand/recognize
   * Recognize brand from photos
   */
  fastify.post('/recognize', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      
      const validated = BrandRecognitionRequestSchema.safeParse(body);
      if (!validated.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: validated.error.errors,
        });
      }

      const result = await recognizer.recognize(validated.data);

      console.log(`[Brand] Recognized: ${result.detectedBrand || 'unknown'} (${result.brandConfidence}% confidence)`);

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[Brand] Recognition error:', error);
      return reply.status(500).send({
        error: 'Brand recognition failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/brand/verify
   * Verify if user-claimed brand matches detected brand
   */
  fastify.post('/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { assetId, imageUrls, claimedBrand, category } = request.body as any;
      
      if (!assetId || !imageUrls || !claimedBrand) {
        return reply.status(400).send({
          error: 'assetId, imageUrls, and claimedBrand are required',
        });
      }

      const result = await recognizer.recognize({
        assetId,
        imageUrls,
        category,
        userProvidedBrand: claimedBrand,
      });

      return reply.status(200).send({
        assetId,
        claimedBrand,
        detectedBrand: result.detectedBrand,
        verified: result.verified,
        confidence: result.brandConfidence,
        brandTier: result.brandTier,
        brandPremium: result.brandPremium,
        suggestedCategory: result.suggestedCategory,
      });
    } catch (error) {
      console.error('[Brand] Verification error:', error);
      return reply.status(500).send({
        error: 'Brand verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/brand/lookup/:brand
   * Lookup brand info (premium, tier, category)
   */
  fastify.get('/lookup/:brand', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { brand } = request.params as { brand: string };
      
      // Use recognizer to get brand info
      const result = await recognizer.recognize({
        assetId: 'lookup',
        imageUrls: ['https://placeholder.com/image.jpg'],
        userProvidedBrand: brand,
      });

      if (result.brandTier === 'unknown') {
        return reply.status(404).send({
          error: 'Brand not found',
          brand,
        });
      }

      return reply.status(200).send({
        brand,
        tier: result.brandTier,
        premium: result.brandPremium,
        category: result.suggestedCategory,
        subcategory: result.suggestedSubcategory,
      });
    } catch (error) {
      console.error('[Brand] Lookup error:', error);
      return reply.status(500).send({
        error: 'Brand lookup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export default brandRoutes;
