"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACADEMY_ENGINE, PilotProgress, AcademyModule, AcademyLesson } from '@/lib/academy/engine';
import { FLIGHT_SCHOOL_CURRICULUM } from '@/lib/academy/content';
import { PROVENIQ_DNA } from '@/lib/config';
import { Shield, Book, Award, ChevronRight, CheckCircle, Lock, PlayCircle, AlertTriangle, Terminal } from 'lucide-react';
import Link from 'next/link';
import { LatencySim } from '@/components/academy/simulators/LatencySim';

export default function AcademyPage() {
    const [progress, setProgress] = useState<PilotProgress | null>(null);
    const [activeModule, setActiveModule] = useState<AcademyModule | null>(null);
    const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);
    const [boot, setBoot] = useState(true);

    // Boot Sequence Effect
    useEffect(() => {
        setTimeout(() => setBoot(false), 1500);
        const p = ACADEMY_ENGINE.getProgress();
        setProgress(p);

        const handler = () => { setProgress(ACADEMY_ENGINE.getProgress()); };
        window.addEventListener('academy-update', handler);
        return () => window.removeEventListener('academy-update', handler);
    }, []);

    const handleCompleteLesson = (modId: string, lessId: string) => {
        const newProgress = ACADEMY_ENGINE.completeLesson(modId, lessId);
        setProgress(newProgress);

        const mod = FLIGHT_SCHOOL_CURRICULUM.find(m => m.id === modId);
        if (mod) {
            const allComplete = mod.lessons.every(l => newProgress.completedLessonIds.includes(l.id));
            if (allComplete) {
                ACADEMY_ENGINE.completeModule(modId);
            }
        }
    };

    if (boot || !progress) return (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono text-emerald-500">
            <div className="w-64">
                <p className="mb-2">Initializing ACADEMY OS v1.0...</p>
                <div className="h-1 w-full bg-emerald-900 rounded overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.2, ease: "linear" }}
                        className="h-full bg-emerald-500"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-slate-300 flex flex-col md:flex-row font-mono">

            {/* LEFT: Command Deck */}
            <div className={`w-full md:w-1/3 border-r border-slate-800 p-6 flex flex-col bg-slate-950/50 ${activeLesson ? 'hidden md:flex' : ''}`}>
                <header className="mb-8 border-b border-slate-800 pb-4">
                    <h1 className="text-xl font-bold mb-1 flex items-center gap-2 text-white tracking-tight">
                        <Terminal className="text-emerald-500" size={20} />
                        ANTIGRAVITY ACADEMY
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">
                        Mission Critical Certification
                    </p>
                </header>

                {/* Rank Card */}
                <div className="bg-slate-900/30 border border-slate-800 p-4 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50">
                        <Shield className="text-slate-700 w-16 h-16" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest">CURRENT RANK</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-4 tracking-tighter">{progress.rank}</div>

                        <div className="flex gap-1 mb-2">
                            {FLIGHT_SCHOOL_CURRICULUM.map((mod, i) => {
                                const isComplete = progress.completedModuleIds.includes(mod.id);
                                return (
                                    <div key={i} className={`h-1 flex-1 ${isComplete ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                                )
                            })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                            CLEARANCE LEVEL: {progress.completedModuleIds.length} / {FLIGHT_SCHOOL_CURRICULUM.length}
                        </div>
                    </div>
                </div>

                {/* Tracks List */}
                <div className="space-y-3 overflow-y-auto flex-1">
                    {FLIGHT_SCHOOL_CURRICULUM.map((mod, i) => {
                        const isLocked = i > 0 && !progress.completedModuleIds.includes(FLIGHT_SCHOOL_CURRICULUM[i - 1].id);
                        const isComplete = progress.completedModuleIds.includes(mod.id);
                        const isActive = activeModule?.id === mod.id;

                        return (
                            <div
                                key={mod.id}
                                className={`
                                    border p-4 transition-all relative
                                    ${isActive ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-800 bg-black'}
                                    ${isLocked ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}
                                `}
                                onClick={() => !isLocked && setActiveModule(mod)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {mod.title}
                                    </h3>
                                    {isComplete ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : isLocked ? (
                                        <Lock className="w-4 h-4 text-slate-700" />
                                    ) : (
                                        <span className="text-[9px] border border-slate-700 px-1 py-0.5 text-slate-500">
                                            ACTIVE
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight">{mod.description}</p>

                                {isActive && (
                                    <div className="mt-4 space-y-1">
                                        {mod.lessons.map(less => {
                                            const lessComplete = progress.completedLessonIds.includes(less.id);
                                            return (
                                                <button
                                                    key={less.id}
                                                    onClick={(e) => { e.stopPropagation(); setActiveLesson(less); }}
                                                    className={`
                                                        w-full text-left text-[10px] uppercase tracking-wide p-2 flex items-center gap-3 border-l-2
                                                        ${activeLesson?.id === less.id
                                                            ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                                                            : 'border-transparent text-slate-500 hover:text-slate-300'}
                                                    `}
                                                >
                                                    {lessComplete ? "✓" : "•"} {less.title}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                    <Link href="/docs/manual" className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-white transition-colors">
                        :: Operator Manual ::
                    </Link>
                </div>
            </div>

            {/* RIGHT: Mission Interface */}
            <div className={`w-full md:w-2/3 bg-black p-8 md:p-12 overflow-y-auto relative ${!activeLesson ? 'hidden md:flex md:items-center md:justify-center' : ''}`}>
                {/* Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>

                {activeLesson ? (
                    <div className="max-w-3xl mx-auto w-full relative z-10">
                        <div className="mb-6 flex items-center gap-2 text-[10px] text-emerald-900 uppercase font-bold tracking-widest border-b border-emerald-900/30 pb-2">
                            <span>Cmd</span>
                            <ChevronRight size={10} />
                            <span>{activeModule?.id}</span>
                            <ChevronRight size={10} />
                            <span className="text-emerald-500">{activeLesson.id}</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white tracking-tight">{activeLesson.title}</h2>

                        <div className="space-y-6 mb-12">
                            {activeLesson.content.map((para, i) => (
                                <div key={i} className="flex gap-4">
                                    <span className="text-slate-700 font-mono text-xs pt-1">0{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                                            {para.replace(/```.*?```/gs, "")}
                                        </p>

                                        {/* SIMULATOR INJECTION NODE */}
                                        {activeLesson.id === "LAB_301" && i === 1 && (
                                            <div className="my-8">
                                                <LatencySim />
                                            </div>
                                        )}

                                        {/* CODE BLOCK RENDERER */}
                                        {para.includes("```") && (
                                            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-emerald-400 overflow-x-auto">
                                                <pre>{para.match(/```(.*?)```/s)?.[1].replace(/mermaid|json/g, "")}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {activeLesson.quiz && (
                            <HardFailQuiz
                                quiz={activeLesson.quiz}
                                onComplete={() => handleCompleteLesson(activeModule!.id, activeLesson.id)}
                            />
                        )}

                        {!activeLesson.quiz && (
                            <button
                                onClick={() => handleCompleteLesson(activeModule!.id, activeLesson.id)}
                                className="w-full py-4 bg-emerald-900/20 border border-emerald-900/50 hover:bg-emerald-900/40 text-emerald-400 font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={14} /> Mission Debrief Complete
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-slate-700">
                        <Terminal size={48} className="mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-bold mb-2 uppercase tracking-widest text-slate-500">System Idle</h2>
                        <p className="text-xs font-mono">Select a mission vector to initialize.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function HardFailQuiz({ quiz, onComplete }: { quiz: any, onComplete: () => void }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "FAILURE">("IDLE");

    const checkAnswer = (idx: number) => {
        if (status !== "IDLE") return; // Lock input
        setSelected(idx);

        if (idx === quiz.correctIndex) {
            setStatus("SUCCESS");
            setTimeout(onComplete, 1500);
        } else {
            setStatus("FAILURE");
        }
    };

    const reboot = () => {
        setSelected(null);
        setStatus("IDLE");
    };

    if (status === "FAILURE") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-950/20 border border-red-900 p-8 text-center rounded-sm"
            >
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
                <h3 className="text-red-500 font-bold uppercase tracking-widest mb-2">CRITICAL MISSION FAILURE</h3>
                <p className="text-xs text-red-400 mb-6 font-mono">Incorrect vector selected. System integrity compromised.</p>
                <button
                    onClick={reboot}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 px-6 py-2 text-xs uppercase tracking-widest font-bold font-mono"
                >
                    REBOOT SYSTEM
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-slate-900/20 border border-slate-800 p-6 md:p-8">
            <h3 className="font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest text-xs">
                <span className="text-emerald-500 flash">{'>>'}</span> Tactical Assessment
            </h3>
            <p className="text-sm text-slate-300 mb-8 font-mono">{quiz.question}</p>

            <div className="space-y-3">
                {quiz.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => checkAnswer(i)}
                        disabled={status === "SUCCESS"}
                        className={`
                            w-full text-left p-4 text-xs font-mono uppercase tracking-wide transition-all border
                            ${selected === i && status === "SUCCESS"
                                ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
                                : 'bg-black border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white'}
                        `}
                    >
                        <span className="mr-4 text-slate-600">[{String.fromCharCode(65 + i)}]</span>
                        {opt}
                    </button>
                ))}
            </div>
            {status === "SUCCESS" && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-center text-emerald-500 text-xs font-bold uppercase tracking-widest"
                >
                    {'>>'} INTEGRITY VERIFIED. PROCEEDING...
                </motion.div>
            )}
        </div>
    );
}
