"use client";

/**
 * PROVENIQ Audio Engine
 * Web Audio API wrapper for procedural UI soundscapes.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;

const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.1; // Keep it subtle
        masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
};

export const AUDIO = {
    // Initialize interaction-based context
    init: () => {
        const ctx = getCtx();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    },

    playClick: () => {
        const ctx = getCtx();
        if (!ctx || !masterGain) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(masterGain);

        // High-tech click
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        osc.start();
        osc.stop(ctx.currentTime + 0.06);
    },

    playHover: () => {
        const ctx = getCtx();
        if (!ctx || !masterGain) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.03);

        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    },

    playSuccess: () => {
        const ctx = getCtx();
        if (!ctx || !masterGain) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    },

    setDrone: (active: boolean, intensity: number = 0) => {
        const ctx = getCtx();
        if (!ctx || !masterGain) return;

        if (active) {
            if (!droneOsc) {
                droneOsc = ctx.createOscillator();
                droneGain = ctx.createGain();
                droneOsc.connect(droneGain);
                droneGain.connect(masterGain);

                droneOsc.type = "sawtooth";
                droneOsc.frequency.value = 55; // Low A
                droneGain.gain.value = 0;
                droneOsc.start();
            }
            // Modulate functionality
            if (droneGain) {
                droneGain.gain.setTargetAtTime(intensity * 0.05, ctx.currentTime, 0.5);
            }
        } else {
            if (droneGain) {
                droneGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
            }
        }
    }
};
