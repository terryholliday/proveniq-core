import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SecurityLevel = 'L1_OBSERVER' | 'L2_OPERATOR' | 'L3_ARCHITECT';

export interface AuditRecord {
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    hash: string; // Simulated cryptographic hash
}

interface SystemState {
    isAuthenticated: boolean;
    securityLevel: SecurityLevel;
    userParams: {
        name: string;
        biometricHash: string | null;
    };
    auditLog: AuditRecord[];

    // Actions
    login: (name: string, level: SecurityLevel) => void;
    logout: () => void;
    logAction: (action: string) => void;
}

export const useSystemStore = create<SystemState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            securityLevel: 'L1_OBSERVER',
            userParams: {
                name: 'GUEST',
                biometricHash: null,
            },
            auditLog: [],

            login: (name, level) => {
                const record = createAuditRecord(name, `SESSION_INIT::${level}`);
                set((state) => ({
                    isAuthenticated: true,
                    securityLevel: level,
                    userParams: { name, biometricHash: 'auth-xc3-99' },
                    auditLog: [record, ...state.auditLog],
                }));
            },

            logout: () => {
                const { userParams } = get();
                const record = createAuditRecord(userParams.name, 'SESSION_TERMINATE');
                set((state) => ({
                    isAuthenticated: false,
                    securityLevel: 'L1_OBSERVER',
                    userParams: { name: 'GUEST', biometricHash: null },
                    auditLog: [record, ...state.auditLog],
                }));
            },

            logAction: (action) => {
                const { userParams } = get();
                const record = createAuditRecord(userParams.name, action);
                set((state) => ({
                    auditLog: [record, ...state.auditLog],
                }));
            },
        }),
        {
            name: 'proveniq-sentinel-storage',
        }
    )
);

// Helper to simulate immutable ledger entry
function createAuditRecord(actor: string, action: string): AuditRecord {
    const timestamp = new Date().toISOString();
    const raw = `${timestamp}|${actor}|${action}`;
    // Simulated hash (in real app, this would be SHA-256)
    const hash = raw.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0).toString(16);

    return {
        id: crypto.randomUUID(),
        timestamp,
        action,
        actor,
        hash: `0x${Math.abs(parseInt(hash)).toString(16).padEnd(64, '0')}`,
    };
}
