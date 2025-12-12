'use client';
import { useState } from 'react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
export default function BiometricGate({ onUnlock }: { onUnlock: () => void }) {
    const [status, setStatus] = useState('IDLE');
    const auth = async () => { setStatus('SCANNING'); await new Promise(r => setTimeout(r, 1000)); setStatus('SUCCESS'); setTimeout(onUnlock, 500); };
    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center cursor-pointer" onClick={auth}>
            <div className="h-20 w-20 rounded-full border border-slate-700 flex items-center justify-center">
                {status === 'SUCCESS' ? <ShieldCheck className="text-emerald-500 w-10 h-10" /> : <Fingerprint className="text-slate-500 w-10 h-10 animate-pulse" />}
            </div>
            <div className="mt-4 font-mono text-slate-500 tracking-widest">SECURE ENCLAVE ACCESS</div>
        </div>
    );
}
