import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring and load balancers.
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'unknown';
    ledger: 'up' | 'down' | 'unknown';
  };
  uptime_seconds: number;
}

const startTime = Date.now();

async function checkDatabase(): Promise<'up' | 'down' | 'unknown'> {
  // TODO: Implement actual database ping
  // For now, return 'up' as we're using mock data
  try {
    // const prisma = new PrismaClient();
    // await prisma.$queryRaw`SELECT 1`;
    return 'up';
  } catch {
    return 'down';
  }
}

async function checkLedger(): Promise<'up' | 'down' | 'unknown'> {
  try {
    const ledgerUrl = process.env.LEDGER_API_URL || 'http://localhost:8006';
    const response = await fetch(`${ledgerUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? 'up' : 'down';
  } catch {
    return 'unknown';
  }
}

export async function GET() {
  const [dbStatus, ledgerStatus] = await Promise.all([
    checkDatabase(),
    checkLedger(),
  ]);

  const isHealthy = dbStatus === 'up';
  const isDegraded = dbStatus === 'up' && ledgerStatus !== 'up';

  const health: HealthStatus = {
    status: isHealthy ? (isDegraded ? 'degraded' : 'healthy') : 'unhealthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      ledger: ledgerStatus,
    },
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  };

  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
