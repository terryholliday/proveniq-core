export interface Asset {
    id: string;
    ticker: string;
    sector: 'TREASURY' | 'REAL_ESTATE' | 'CRYPTO';
    tvl: number;
    riskRating: number; // 0-100
}

/**
 * Transforms flat asset list into a Topology Graph.
 * Calculates simple correlation based on 'Sector' and 'Risk' proximity.
 * SAFETY PROTOCOL: Hard cap at 500 nodes.
 */
export function generateTopology(assets: Asset[]) {
    const MAX_NODES = 500;

    // Sort by TVL (Value) descending - Keep the biggest assets
    const sortedAssets = [...assets].sort((a, b) => b.tvl - a.tvl);

    let primaryAssets = sortedAssets;
    let aggregatedNodes: any[] = [];

    // Aggregation Logic
    if (sortedAssets.length > MAX_NODES) {
        primaryAssets = sortedAssets.slice(0, MAX_NODES);
        const remainder = sortedAssets.slice(MAX_NODES);

        // Create Sector Aggregates
        const sectors: Record<string, { count: number; tvl: number; riskSum: number }> = {};

        remainder.forEach(a => {
            if (!sectors[a.sector]) sectors[a.sector] = { count: 0, tvl: 0, riskSum: 0 };
            sectors[a.sector].count++;
            sectors[a.sector].tvl += a.tvl;
            sectors[a.sector].riskSum += a.riskRating;
        });

        aggregatedNodes = Object.entries(sectors).map(([sector, data]) => ({
            id: `AGGREGATE_${sector}`,
            name: `${sector} BASKET (${data.count})`,
            group: sector,
            val: data.tvl,
            riskScore: data.riskSum / data.count,
            isAggregate: true
        }));
    }

    const nodes = [
        ...primaryAssets.map(a => ({
            id: a.id,
            name: a.ticker,
            group: a.sector,
            val: a.tvl,
            riskScore: a.riskRating,
            isAggregate: false
        })),
        ...aggregatedNodes
    ];

    const links: any[] = [];

    // O(n^2) Simple Clustering Algorithm
    // Performance Note: 500 nodes = ~250,000 checks. Done efficiently in JS.
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];

            let strength = 0;
            if (a.group === b.group) strength += 0.5; // Same sector
            if (Math.abs(a.riskScore - b.riskScore) < 10) strength += 0.3; // Similar risk

            // Aggregates always connect strongly to their sector peers
            if ((a.isAggregate || b.isAggregate) && a.group === b.group) strength += 0.4;

            if (strength > 0.3) {
                links.push({ source: a.id, target: b.id, strength });
            }
        }
    }

    return { nodes, links };
}
