import Fastify from 'fastify';
import cors from '@fastify/cors';
import { assetRoutes } from './routes/assets';
import { valuationRoutes } from './routes/valuations';
import { fraudRoutes } from './routes/fraud';
import { registryRoutes } from './routes/registry';
import { conditionRoutes } from './routes/condition';
import { marketRoutes } from './routes/market';
import { brandRoutes } from './routes/brand';
import { riskRoutes } from './routes/risk';
import { anomalyRoutes } from './routes/anomaly';
import { eventRoutes } from './routes/events';
import { errorHandler } from './errors/errors';
import { registerGatewayMiddleware, checkServiceHealth } from './services';
import dotenv from 'dotenv';

dotenv.config();

const server = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID()
});

// Middleware
server.register(cors);
server.setErrorHandler(errorHandler);
registerGatewayMiddleware(server);

// Health Check
server.get('/api/health', async () => {
    return { 
        status: 'OK', 
        service: 'proveniq-core',
        version: '0.3.0',
        mode: process.env.CORE_LEDGER_MODE || 'mock',
        timestamp: new Date().toISOString(),
    };
});

// Gateway Health - Check all downstream services
server.get('/api/v1/gateway/health', async () => {
    const services = [
        { name: 'ledger', url: process.env.LEDGER_API_URL || 'http://localhost:8006' },
        { name: 'home', url: process.env.HOME_API_URL || 'http://localhost:9003' },
        { name: 'claimsiq', url: process.env.CLAIMSIQ_API_URL || 'http://localhost:3005' },
    ];
    
    const healthChecks = await Promise.all(
        services.map(s => checkServiceHealth(s.name, s.url))
    );
    
    const allHealthy = healthChecks.every(h => h.status === 'healthy');
    
    return {
        status: allHealthy ? 'healthy' : 'degraded',
        services: healthChecks,
        checkedAt: new Date().toISOString(),
    };
});

// Routes
server.register(assetRoutes, { prefix: '/api/v1/assets' });
server.register(valuationRoutes, { prefix: '/api/v1/valuations' });
server.register(fraudRoutes, { prefix: '/api/v1/fraud' });
server.register(registryRoutes, { prefix: '/api/v1/registry' });
server.register(conditionRoutes, { prefix: '/api/v1/condition' }); // P1
server.register(marketRoutes, { prefix: '/api/v1/market' }); // P1
server.register(brandRoutes, { prefix: '/api/v1/brand' }); // P1
server.register(riskRoutes, { prefix: '/api/v1/risk' }); // Phase 3
server.register(anomalyRoutes, { prefix: '/api/v1/anomaly' }); // Phase 3
server.register(eventRoutes, { prefix: '/api/v1/events' }); // Phase 3 - Event Bus

const PORT = parseInt(process.env.PORT || "8000");

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`[PROVENIQ CORE] Asset Intelligence Engine v0.3.0 listening on ${PORT}`);
        console.log(`[PROVENIQ CORE] Endpoints:`);
        console.log(`  - GET  /api/health`);
        console.log(`  - GET  /api/v1/gateway/health`);
        console.log(`  - POST /api/v1/valuations`);
        console.log(`  - POST /api/v1/fraud/score`);
        console.log(`  - POST /api/v1/registry`);
        console.log(`  - GET  /api/v1/assets/:asset_id`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
