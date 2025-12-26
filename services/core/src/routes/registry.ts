/**
 * @file routes/registry.ts
 * @description PROVENIQ Core Asset Registry (PAID) API Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { paidRegistry, RegisterAssetRequestSchema, ledgerWriteClient } from '../services';
import { AppError, ErrorCode } from '../errors/errors';

export async function registryRoutes(server: FastifyInstance) {
  /**
   * POST /api/v1/assets
   * Register a new asset and get PAID
   */
  server.post('/', async (request, reply) => {
    try {
      const body = RegisterAssetRequestSchema.safeParse(request.body);
      
      if (!body.success) {
        throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid asset registration', body.error);
      }
      
      const record = await paidRegistry.registerAsset(body.data);
      
      // Write to ledger
      await ledgerWriteClient.writeAssetRegistration(
        record.paid,
        record.ownerId,
        { name: record.name, category: record.category }
      );
      
      reply.status(201).send(record);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Asset registration failed', error);
    }
  });
  
  /**
   * GET /api/v1/assets/:paid
   * Get asset by PAID
   */
  server.get('/:paid', async (request, reply) => {
    const params = z.object({ paid: z.string() }).safeParse(request.params);
    
    if (!params.success) {
      throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid PAID format');
    }
    
    const record = paidRegistry.getAsset(params.data.paid);
    
    if (!record) {
      reply.status(404).send({ error: 'Asset not found' });
      return;
    }
    
    reply.status(200).send(record);
  });
  
  /**
   * GET /api/v1/assets/owner/:ownerId
   * Get all assets for an owner
   */
  server.get('/owner/:ownerId', async (request, reply) => {
    const params = z.object({ ownerId: z.string() }).safeParse(request.params);
    
    if (!params.success) {
      throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid owner ID');
    }
    
    const records = paidRegistry.getAssetsByOwner(params.data.ownerId);
    
    reply.status(200).send({ assets: records, count: records.length });
  });
  
  /**
   * POST /api/v1/assets/:paid/transfer
   * Transfer ownership of an asset
   */
  server.post('/:paid/transfer', async (request, reply) => {
    const params = z.object({ paid: z.string() }).safeParse(request.params);
    const body = z.object({
      toOwnerId: z.string(),
      transferType: z.enum(['SALE', 'GIFT', 'INHERITANCE', 'CLAIM', 'CORRECTION']),
    }).safeParse(request.body);
    
    if (!params.success || !body.success) {
      throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid transfer request');
    }
    
    // Write to ledger first
    const record = paidRegistry.getAsset(params.data.paid);
    if (!record) {
      reply.status(404).send({ error: 'Asset not found' });
      return;
    }
    
    const ledgerResult = await ledgerWriteClient.writeOwnershipTransfer(
      params.data.paid,
      record.ownerId,
      body.data.toOwnerId,
      body.data.transferType
    );
    
    if (!ledgerResult.success) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to record transfer in ledger');
    }
    
    // Update registry
    const result = await paidRegistry.transferOwnership(
      params.data.paid,
      body.data.toOwnerId,
      body.data.transferType,
      ledgerResult.eventId || 'unknown'
    );
    
    if (!result.success) {
      reply.status(400).send({ error: result.error });
      return;
    }
    
    reply.status(200).send({ success: true, ledgerEventId: ledgerResult.eventId });
  });
  
  /**
   * GET /api/v1/assets/:paid/history
   * Get ownership history
   */
  server.get('/:paid/history', async (request, reply) => {
    const params = z.object({ paid: z.string() }).safeParse(request.params);
    
    if (!params.success) {
      throw new AppError(ErrorCode.INVALID_REQUEST, 'Invalid PAID');
    }
    
    const history = paidRegistry.getOwnershipHistory(params.data.paid);
    
    reply.status(200).send({ transfers: history, count: history.length });
  });
}
