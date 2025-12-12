'use client';
import { NeuralConsole } from '@/components/ui/NeuralConsole';
import BiometricGate from '@/components/auth/BiometricGate';
import { useState } from 'react';

export default function SystemShell({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) return <BiometricGate onUnlock={() => setIsAuthenticated(true)} />;

  return (
    <main className="h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      {children}
      <NeuralConsole />
    </main>
  );
}
