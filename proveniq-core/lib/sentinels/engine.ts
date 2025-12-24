import { create } from 'zustand';

interface Agent { id: string; name: string; target: number; current: number; status: string; }

export const useSentinelStore = create<{
    agents: Agent[];
    tick: () => void;
}>((set) => ({
    agents: [{ id: '1', name: 'Yield Hunter', target: 5.0, current: 4.2, status: 'WATCHING' }],
    tick: () => set((state: any) => ({
        agents: state.agents.map((a: any) => ({ ...a, current: parseFloat((a.current + (Math.random() - 0.5) * 0.1).toFixed(2)) }))
    }))
}));
