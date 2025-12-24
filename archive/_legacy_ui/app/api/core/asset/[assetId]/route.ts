import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/core/asset/[assetId]
 * 
 * Returns a UniversalAssetProfile for the requested asset.
 * This is the primary endpoint consumed by all frontend apps via the Core SDK.
 * 
 * Query Params:
 *   - view: OPS | PROPERTIES | HOME | BIDS (affects which widgets are returned)
 */

type AssetView = 'OPS' | 'PROPERTIES' | 'HOME' | 'BIDS';

interface Widget {
  widget_type: string;
  priority: number;
  data: Record<string, unknown>;
}

interface UniversalAssetProfile {
  schema_version: '1.0.0';
  requested_view: AssetView;
  identity: {
    paid: string;
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    anchor_id?: string;
  };
  ownership: {
    current_owner_id: string;
    ownership_type: 'personal' | 'business' | 'rental_unit_fixture' | 'inventory';
    acquired_at?: string;
    acquisition_method?: string;
  };
  integrity: {
    provenance_score: number;
    integrity_verified: boolean;
    last_verified_at: string | null;
    event_count: number;
    anchor_sealed?: boolean;
  };
  widgets: Widget[];
  profile_generated_at: string;
  cache_ttl_seconds?: number;
}

// =============================================================================
// MOCK DATA LAYER (Replace with Prisma/DB calls in production)
// =============================================================================

async function fetchAssetFromDB(assetId: string): Promise<{
  paid: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  anchor_id?: string;
  owner_id: string;
  ownership_type: 'personal' | 'business' | 'rental_unit_fixture' | 'inventory';
  acquired_at?: string;
  acquisition_method?: string;
} | null> {
  // TODO: Replace with actual database lookup
  // For now, return mock data for demo purposes
  
  // Simulate not found for certain IDs
  if (assetId.startsWith('NOT_FOUND')) {
    return null;
  }

  return {
    paid: assetId,
    name: 'MacBook Pro 16"',
    description: 'Apple MacBook Pro with M3 Max chip',
    category: 'Electronics',
    subcategory: 'Computers',
    brand: 'Apple',
    model: 'MacBook Pro 16-inch (2024)',
    serial_number: 'C02X1234ABCD',
    anchor_id: assetId.startsWith('ANCHORED') ? `anchor_${assetId}` : undefined,
    owner_id: 'user_demo123',
    ownership_type: 'personal',
    acquired_at: '2024-01-15T00:00:00Z',
    acquisition_method: 'purchase',
  };
}

async function fetchProvenanceData(assetId: string): Promise<{
  score: number;
  verified: boolean;
  last_verified_at: string | null;
  event_count: number;
  anchor_sealed: boolean;
  events: Array<{
    event_id: string;
    event_type: string;
    occurred_at: string;
    producer: string;
    summary: string;
    payload_hash?: string;
  }>;
}> {
  // TODO: Fetch from Ledger service
  return {
    score: 78,
    verified: true,
    last_verified_at: '2024-12-20T15:30:00Z',
    event_count: 12,
    anchor_sealed: false,
    events: [
      {
        event_id: 'evt_001',
        event_type: 'HOME_ASSET_REGISTERED',
        occurred_at: '2024-01-15T10:00:00Z',
        producer: 'home',
        summary: 'Asset registered by owner',
      },
      {
        event_id: 'evt_002',
        event_type: 'HOME_PHOTO_ADDED',
        occurred_at: '2024-01-15T10:05:00Z',
        producer: 'home',
        summary: '4 photos uploaded',
      },
      {
        event_id: 'evt_003',
        event_type: 'HOME_VALUATION_UPDATED',
        occurred_at: '2024-01-16T09:00:00Z',
        producer: 'home',
        summary: 'AI valuation completed: $2,499',
      },
    ],
  };
}

async function fetchValuationData(assetId: string): Promise<{
  current_value_cents: number;
  original_value_cents: number | null;
  depreciation_rate_bps: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  valuation_source: string;
  last_valued_at: string;
  bias_flags: string[];
}> {
  // TODO: Fetch from Core valuation engine
  return {
    current_value_cents: 249900,
    original_value_cents: 299900,
    depreciation_rate_bps: 2500, // 25%
    confidence_level: 'HIGH',
    valuation_source: 'AI_VALUATION',
    last_valued_at: '2024-12-20T15:30:00Z',
    bias_flags: [],
  };
}

async function fetchRiskData(assetId: string): Promise<{
  fraud_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: Array<{ signal_type: string; description: string; weight: number }>;
  last_scored_at: string;
}> {
  // TODO: Fetch from Core fraud scorer
  return {
    fraud_score: 15,
    risk_level: 'LOW',
    signals: [],
    last_scored_at: '2024-12-20T15:30:00Z',
  };
}

async function fetchCustodyData(assetId: string): Promise<{
  current_state: 'HOME' | 'IN_TRANSIT' | 'VAULT' | 'AUCTION' | 'SOLD' | 'CLAIMED';
  current_holder_id: string | null;
  last_transition_at: string | null;
  chain_of_custody: Array<{
    from_state: string;
    to_state: string;
    transitioned_at: string;
    actor_id?: string;
  }>;
}> {
  // TODO: Fetch from Ledger custody state
  return {
    current_state: 'HOME',
    current_holder_id: 'user_demo123',
    last_transition_at: '2024-01-15T10:00:00Z',
    chain_of_custody: [],
  };
}

async function fetchServiceHistory(assetId: string): Promise<{
  records: Array<{
    work_order_id: string;
    service_type: string;
    provider_name: string;
    completed_at: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    cost_cents?: number;
  }>;
  total_service_cost_cents: number;
}> {
  // TODO: Fetch from Service app
  return {
    records: [],
    total_service_cost_cents: 0,
  };
}

// =============================================================================
// WIDGET BUILDERS
// =============================================================================

function buildWidgetsForView(
  view: AssetView,
  provenance: Awaited<ReturnType<typeof fetchProvenanceData>>,
  valuation: Awaited<ReturnType<typeof fetchValuationData>>,
  risk: Awaited<ReturnType<typeof fetchRiskData>>,
  custody: Awaited<ReturnType<typeof fetchCustodyData>>,
  service: Awaited<ReturnType<typeof fetchServiceHistory>>
): Widget[] {
  const widgets: Widget[] = [];

  // Common widgets for all views
  widgets.push({
    widget_type: 'CUSTODY_STATUS',
    priority: 10,
    data: custody,
  });

  widgets.push({
    widget_type: 'PROVENANCE_TIMELINE',
    priority: 20,
    data: {
      events: provenance.events,
      total_events: provenance.event_count,
    },
  });

  // View-specific widgets
  switch (view) {
    case 'HOME':
      widgets.push({
        widget_type: 'VALUATION_SUMMARY',
        priority: 5,
        data: valuation,
      });
      if (service.records.length > 0) {
        widgets.push({
          widget_type: 'SERVICE_TIMELINE',
          priority: 30,
          data: service,
        });
      }
      break;

    case 'PROPERTIES':
      widgets.push({
        widget_type: 'VALUATION_SUMMARY',
        priority: 5,
        data: valuation,
      });
      widgets.push({
        widget_type: 'SERVICE_TIMELINE',
        priority: 25,
        data: service,
      });
      break;

    case 'OPS':
      widgets.push({
        widget_type: 'RISK_BADGE',
        priority: 5,
        data: risk,
      });
      widgets.push({
        widget_type: 'SERVICE_TIMELINE',
        priority: 25,
        data: service,
      });
      break;

    case 'BIDS':
      widgets.push({
        widget_type: 'VALUATION_SUMMARY',
        priority: 5,
        data: valuation,
      });
      widgets.push({
        widget_type: 'RISK_BADGE',
        priority: 15,
        data: risk,
      });
      break;
  }

  return widgets.sort((a, b) => a.priority - b.priority);
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const view = (searchParams.get('view') || 'HOME').toUpperCase() as AssetView;

    // Validate view parameter
    if (!['OPS', 'PROPERTIES', 'HOME', 'BIDS'].includes(view)) {
      return NextResponse.json(
        {
          error: 'INVALID_VIEW',
          code: 'INVALID_VIEW',
          message: `Invalid view: ${view}. Must be one of: OPS, PROPERTIES, HOME, BIDS`,
        },
        { status: 400 }
      );
    }

    // Fetch asset from database
    const asset = await fetchAssetFromDB(assetId);

    if (!asset) {
      return NextResponse.json(
        {
          error: 'ASSET_NOT_FOUND',
          code: 'ASSET_NOT_FOUND',
          message: `Asset not found: ${assetId}`,
        },
        { status: 404 }
      );
    }

    // Fetch all related data in parallel
    const [provenance, valuation, risk, custody, service] = await Promise.all([
      fetchProvenanceData(assetId),
      fetchValuationData(assetId),
      fetchRiskData(assetId),
      fetchCustodyData(assetId),
      fetchServiceHistory(assetId),
    ]);

    // Build widgets based on view
    const widgets = buildWidgetsForView(view, provenance, valuation, risk, custody, service);

    // Construct UniversalAssetProfile
    const profile: UniversalAssetProfile = {
      schema_version: '1.0.0',
      requested_view: view,
      identity: {
        paid: asset.paid,
        name: asset.name,
        description: asset.description,
        category: asset.category,
        subcategory: asset.subcategory,
        brand: asset.brand,
        model: asset.model,
        serial_number: asset.serial_number,
        anchor_id: asset.anchor_id,
      },
      ownership: {
        current_owner_id: asset.owner_id,
        ownership_type: asset.ownership_type,
        acquired_at: asset.acquired_at,
        acquisition_method: asset.acquisition_method,
      },
      integrity: {
        provenance_score: provenance.score,
        integrity_verified: provenance.verified,
        last_verified_at: provenance.last_verified_at,
        event_count: provenance.event_count,
        anchor_sealed: provenance.anchor_sealed,
      },
      widgets,
      profile_generated_at: new Date().toISOString(),
      cache_ttl_seconds: 60,
    };

    return NextResponse.json(profile, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('[CORE] Error fetching asset profile:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      },
      { status: 500 }
    );
  }
}
