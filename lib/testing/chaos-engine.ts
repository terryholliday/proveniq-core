import { create } from 'zustand';

interface ChaosState {
    active: boolean;
    scenarios: {
        usdcDepeg: boolean;
        oracleFailure: boolean;
        latencySpike: boolean;
    };
    toggleScenario: (key: string) => void;
}

export const useChaosEngine = create<ChaosState>((set) => ({
    active: false,
    scenarios: { usdcDepeg: false, oracleFailure: false, latencySpike: false },
    toggleScenario: (key) => set((state: any) => {
        const newState = { ...state.scenarios, [key]: !state.scenarios[key] };
        console.warn(`[CHAOS ENGINE] SIMULATION CHANGED: ${key} -> ${newState[key]}`);
        return { scenarios: newState, active: true };
    })
}));

// Utility to wrap API calls with Chaos
export const chaosFetch = async (url: string) => {
    const { scenarios } = useChaosEngine.getState();
    if (scenarios.latencySpike) await new Promise(r => setTimeout(r, 3000));
    if (scenarios.oracleFailure) throw new Error('CHAOS_SIMULATION: ORACLE_TIMEOUT_504');
    return fetch(url);
};
