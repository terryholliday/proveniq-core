'use client';
import { Usb } from 'lucide-react';
import { useState } from 'react';

export const HardwareKeyGate = ({ onVerify }: { onVerify: () => void }) => {
    const [scanning, setScanning] = useState(false);

    const tapKey = async () => {
        setScanning(true);
        // WebAuthn 'cross-platform' attachment enforces external keys (YubiKey)
        try {
            // navigator.credentials.get({ publicKey: { ... attachment: 'cross-platform' } })
            await new Promise(r => setTimeout(r, 2000)); // Simulating physical tap delay
            onVerify();
        } catch (e) {
            alert('HARDWARE KEY NOT DETECTED');
            setScanning(false);
        }
    };

    return (
        <button
            onClick={tapKey}
            disabled={scanning}
            className="flex items-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
            <Usb className={`w-6 h-6 ${scanning ? 'animate-pulse' : ''}`} />
            {scanning ? 'TAP YUBIKEY NOW...' : 'AUTHORIZE DEPLOYMENT'}
        </button>
    );
};
