'use client';
import { Command } from 'cmdk';
import { useState } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
export const NeuralConsole = () => {
    const [input, setInput] = useState('');
    return (
        <Command.Dialog open={true} className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl z-50">
            <div className="flex items-center p-4 border-b border-slate-800">
                <div className="w-2 h-2 rounded-full mr-4 bg-emerald-500 shadow-emerald-500/50 shadow-lg" />
                <Command.Input value={input} onValueChange={setInput} className="bg-transparent w-full outline-none font-mono text-lg" placeholder="Enter Command..." />
            </div>
        </Command.Dialog>
    );
}
