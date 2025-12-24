
import { z } from 'zod';

// --- PRIMITIVES ---
export const IntString = z.string().regex(/^-?\d+$/, "Must be an integer string");

// --- WIDGET PROTOCOL ---
export const WidgetBaseSchema = z.object({
    priority_int: z.number().int().min(0).max(100),
    title: z.string(),
    generated_at: z.string().datetime(),
    source_event_refs: z.array(z.string())
});

export const ValuationSummaryWidget = WidgetBaseSchema.extend({
    type: z.literal('VALUATION_SUMMARY'),
    data: z.object({
        amount_micros: IntString,
        currency: z.string(),
        confidence_score: z.number().min(0).max(1),
        valuation_date: z.string().datetime()
    })
});

export const CustodyStatusWidget = WidgetBaseSchema.extend({
    type: z.literal('CUSTODY_STATUS'),
    data: z.object({
        status: z.enum(['CUSTODY', 'TRANSIT', 'DISPUTED', 'LOST']),
        current_custodian: z.string(),
        lat: z.number().optional(),
        lon: z.number().optional(),
        last_update: z.string().datetime().optional()
    })
});

export const ProvenanceTimelineWidget = WidgetBaseSchema.extend({
    type: z.literal('PROVENANCE_TIMELINE'),
    data: z.object({
        events: z.array(z.object({
            occurred_at: z.string().datetime(),
            title: z.string(),
            description: z.string(),
            actor: z.string()
        }))
    })
});

// Fallback/Generic for future expansion (Strictly defined for now)
// Add more widgets here as needed
export const WidgetSchema = z.discriminatedUnion('type', [
    ValuationSummaryWidget,
    CustodyStatusWidget,
    ProvenanceTimelineWidget
]);

// --- UNIVERSAL ASSET ---
export const UniversalAssetSchema = z.object({
    asset_id: z.string().uuid(),
    asset_kind: z.string(), // "Vehicle", "Device", etc. (Not used for UI logic)
    owner_subject: z.string(),
    integrity: z.enum(['INTACT', 'COMPROMISED', 'UNKNOWN']),
    health: z.enum(['NOMINAL', 'DEGRADED', 'CRITICAL', 'UNKNOWN']),
    risk_bps: z.number().int(),
    value_micros: IntString,
    currency: z.string(),
    custody_status: z.enum(['CUSTODY', 'TRANSIT', 'DISPUTED', 'LOST']),
    custody_holder: z.string(),
    capabilities: z.array(z.string())
});

// --- API RESPONSE ENVELOPE ---
export const CoreAssetResponseSchema = z.object({
    schema_version: z.literal("1.0.0"),
    correlation_id: z.string().uuid(),
    generated_at: z.string().datetime(),
    asset_id: z.string().uuid(),
    mode: z.enum(['mock', 'ledger']),
    asset: UniversalAssetSchema,
    widgets: z.array(WidgetSchema),
    debug: z.any().optional()
});

export type CoreAssetResponse = z.infer<typeof CoreAssetResponseSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type UniversalAsset = z.infer<typeof UniversalAssetSchema>;
