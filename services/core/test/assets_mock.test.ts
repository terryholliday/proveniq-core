
import { describe, it, expect } from 'vitest';
import { resolveAsset } from '../src/aggregator/resolver';

describe('Aggregator: Mock Mode', () => {
    // We assume ASSET-MOCK-1 fixture is present
    const ASSET_ID = "ASSET-MOCK-1";

    it('Should resolve mock asset with widgets', async () => {
        process.env.CORE_LEDGER_MODE = 'mock';
        const response = await resolveAsset(ASSET_ID);

        expect(response.asset_id).toBe(ASSET_ID);
        expect(response.widgets.length).toBeGreaterThan(0);

        const valuation = response.widgets.find(w => w.type === 'VALUATION_SUMMARY');
        expect(valuation).toBeDefined();
        if (valuation && valuation.type === 'VALUATION_SUMMARY') {
            // 50000 * 1000000 = 50000000000
            expect(valuation.data.amount_micros).toBe("50000000000");
        }
    });
});
