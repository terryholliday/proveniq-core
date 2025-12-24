// The Structured "Thought" of the Agent
export type IntentType = 'SWAP' | 'BRIDGE' | 'DEPOSIT' | 'ANALYZE';

export interface IntentObject {
    type: IntentType;
    amount?: number;
    asset?: string;
    targetChain?: string;
    confidence: number; // 0-1
}

const ASSET_MAP: Record<string, string> = {
    'tbill': 'IB01',
    'usdc': 'USDC',
    'eth': 'WETH',
    'bitcoin': 'WBTC',
    'wbtc': 'WBTC',
    'sol': 'SOL',
    'euro': 'EURC'
};

export function parseIntent(input: string): IntentObject | null {
    const lower = input.toLowerCase();

    // 1. Detect Action
    let type: IntentType = 'ANALYZE';
    if (lower.includes('buy') || lower.includes('swap') || lower.includes('trade')) type = 'SWAP';
    if (lower.includes('bridge') || lower.includes('move') || lower.includes('transfer')) type = 'BRIDGE';
    if (lower.includes('deposit') || lower.includes('invest')) type = 'DEPOSIT';

    // 2. Detect Amount (e.g., "100k", "5m")
    const numberMatch = lower.match(/(\d+(?:\.\d+)?)\s*[k|m]?/);
    let amount = 0;
    if (numberMatch) {
        let raw = parseFloat(numberMatch[1]);
        if (lower.includes('k')) raw *= 1000;
        if (lower.includes('m')) raw *= 1000000;
        amount = raw;
    }

    // 3. Detect Asset
    const assetKey = Object.keys(ASSET_MAP).find(k => lower.includes(k));
    const asset = assetKey ? ASSET_MAP[assetKey] : undefined;

    // 4. Return Structured Intent
    // If it's just an analysis request or incomplete, return null or handle as ANALYZE
    // For this spec, we want "Actionable" intents.
    if (type === 'ANALYZE' && !asset) return null;
    if (type !== 'ANALYZE' && !asset) return null; // Need asset for action

    return {
        type,
        amount: amount > 0 ? amount : undefined,
        asset,
        targetChain: lower.includes('base') ? 'BASE' : lower.includes('arbitrum') ? 'ARBITRUM' : 'ETH_MAINNET',
        confidence: type === 'ANALYZE' ? 0.5 : 0.95
    };
}
