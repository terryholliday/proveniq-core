import { create } from 'zustand';
export const useCircuitBreaker = create<{
    status: string;
    trip: (reason: string) => void;
    reset: () => void;
}>((set) => ({
    status: 'NOMINAL',
    trip: (reason: string) => { console.error(`[CRITICAL] ${reason}`); set({ status: 'TRIPPED' }); },
    reset: () => set({ status: 'NOMINAL' })
}));
