export interface EntityNode { id: string; type: 'WALLET' | 'FOUNDER' | 'VC_FIRM'; riskScore: number; connections: string[]; }
export const ENTITY_GRAPH: EntityNode[] = [
    { id: '0x123...abc', type: 'WALLET', riskScore: 10, connections: ['FOUNDER_A'] },
    { id: 'FOUNDER_A', type: 'FOUNDER', riskScore: 85, connections: ['FAILED_PROJECT_X'] }
];
