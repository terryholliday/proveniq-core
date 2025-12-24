
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { assetRoutes } from './routes/assets';
import { errorHandler } from './errors/errors';
import dotenv from 'dotenv';

dotenv.config();

const server = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID() // Requires Node 15.6+
});

// Middleware
server.register(cors);
server.setErrorHandler(errorHandler);

// Health Check
server.get('/api/health', async () => {
    return { status: 'OK', service: 'proveniq-core', mode: process.env.CORE_LEDGER_MODE || 'mock' };
});

// Routes
server.register(assetRoutes, { prefix: '/api/v1/assets' });

const PORT = parseInt(process.env.PORT || "3010");

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`[PROVENIQ CORE] Read-Only Engine listening on ${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
