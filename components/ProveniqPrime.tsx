'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Play, SkipForward } from 'lucide-react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type TourStep = 'intro' | 'flywheel' | 'stats' | 'docked';

// 2D SVG Robot Avatar - No Three.js needed
function PrimeRobotSVG({ isThinking, tourStep }: { isThinking: boolean; tourStep: TourStep }) {
  // Calculate rotation based on tour step
  const getRotation = () => {
    switch (tourStep) {
      case 'flywheel': return 15;
      case 'stats': return -15;
      default: return 0;
    }
  };

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      animate={{ rotateY: getRotation() }}
      transition={{ type: "spring", stiffness: 50, damping: 15 }}
    >
      {/* Glow filter for eyes */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e0e0" />
        </linearGradient>
        <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>

      {/* Head */}
      <ellipse cx="50" cy="45" rx="35" ry="32" fill="url(#headGradient)" />
      
      {/* Visor/Faceplate */}
      <rect x="20" y="35" width="60" height="25" rx="5" fill="url(#visorGradient)" />
      
      {/* Left Eye */}
      <motion.circle
        cx="35"
        cy="47"
        r="6"
        fill="#00e5ff"
        filter="url(#glow)"
        animate={{
          opacity: isThinking ? [0.6, 1, 0.6] : 1,
          r: isThinking ? [5, 7, 5] : 6,
        }}
        transition={{
          duration: 0.8,
          repeat: isThinking ? Infinity : 0,
          ease: "easeInOut",
        }}
      />
      
      {/* Right Eye */}
      <motion.circle
        cx="65"
        cy="47"
        r="6"
        fill="#00e5ff"
        filter="url(#glow)"
        animate={{
          opacity: isThinking ? [0.6, 1, 0.6] : 1,
          r: isThinking ? [5, 7, 5] : 6,
        }}
        transition={{
          duration: 0.8,
          repeat: isThinking ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.1,
        }}
      />

      {/* Antenna */}
      <line x1="50" y1="13" x2="50" y2="5" stroke="#666" strokeWidth="2" />
      <motion.circle
        cx="50"
        cy="4"
        r="3"
        fill={isThinking ? "#00ff88" : "#00e5ff"}
        filter="url(#glow)"
        animate={{
          opacity: isThinking ? [0.5, 1, 0.5] : 0.8,
        }}
        transition={{
          duration: 0.5,
          repeat: isThinking ? Infinity : 0,
        }}
      />

      {/* Ear pieces */}
      <rect x="10" y="40" width="6" height="15" rx="2" fill="#333" />
      <rect x="84" y="40" width="6" height="15" rx="2" fill="#333" />

      {/* Neck */}
      <rect x="40" y="75" width="20" height="12" rx="3" fill="#e8e8e8" />
    </motion.svg>
  );
}

// Main Component
export default function ProveniqPrime() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // Tour State
  const [tourStep, setTourStep] = useState<TourStep>('intro');
  const [isTourActive, setIsTourActive] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial Tour Sequence
  useEffect(() => {
    if (!isTourActive) return;

    // Skip auto-tour on smaller screens
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTourStep('docked');
      setIsTourActive(false);
      return;
    }

    const runTour = async () => {
      setTourStep('intro');
      await new Promise(r => setTimeout(r, 1000));
      
      await new Promise(r => setTimeout(r, 4000));
      setTourStep('flywheel');
      
      await new Promise(r => setTimeout(r, 5000));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
      setTourStep('stats');
      
      await new Promise(r => setTimeout(r, 5000));
      setTourStep('docked');
      setIsTourActive(false);
    };

    runTour();
  }, [isTourActive]);

  // Handle position based on tour step
  const getPosition = () => {
    switch (tourStep) {
      case 'intro':
        return { top: '20%', left: '50%', x: '-50%', y: '-50%', scale: 1.5 };
      case 'flywheel':
        return { top: '40%', left: '20%', x: '0%', y: '-50%', scale: 1.2 };
      case 'stats':
        return { top: '30%', right: '20%', left: 'auto', x: '0%', y: '-50%', scale: 1.2 };
      case 'docked':
        return { top: 'auto', bottom: '24px', right: '24px', left: 'auto', x: '0%', y: '0%', scale: 1 };
    }
  };

  const getTourMessage = () => {
    switch (tourStep) {
      case 'intro': return "Welcome to Proveniq. I am Prime, your strategic navigator.";
      case 'flywheel': return "Behold the Flywheel. Our ecosystem creates a self-reinforcing loop of value.";
      case 'stats': return "The market is vast. $20T in dead capital waiting to be unlocked by Truth.";
      case 'docked': return "";
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/prime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessage.id
                        ? { ...m, content: m.content + content }
                        : m
                    )
                  );
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const skipTour = () => {
    setTourStep('docked');
    setIsTourActive(false);
  };

  const pos = getPosition();

  return (
    <>
      {/* Floating Avatar Container */}
      <motion.div
        className="fixed z-[9999] flex flex-col items-center gap-4 pointer-events-none"
        initial={false}
        animate={pos}
        transition={{ type: "spring", stiffness: 40, damping: 15 }}
      >
        {/* Tour Message Bubble */}
        <AnimatePresence>
          {isTourActive && tourStep !== 'docked' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm text-center pointer-events-auto"
            >
              <p className="text-lg font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {getTourMessage()}
              </p>
              <button 
                onClick={skipTour}
                className="mt-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
              >
                <SkipForward className="w-3 h-3" /> Skip Tour
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Avatar Button */}
        <motion.button
          onClick={() => {
            if (isTourActive) skipTour();
            setIsOpen(!isOpen);
          }}
          className={`relative rounded-full overflow-hidden shadow-2xl border-2 border-white/20 flex items-center justify-center group transition-all pointer-events-auto
            ${tourStep === 'docked' ? 'w-20 h-20 hover:scale-110' : 'w-32 h-32 hover:scale-105'}`}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-2 z-0">
            <PrimeRobotSVG isThinking={isThinking} tourStep={tourStep} />
          </div>
          
          {/* Pulse ring when thinking */}
          {isThinking && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400 z-20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-6 z-[9999] w-[90vw] max-w-[400px] h-[500px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'rgba(10, 10, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-b from-slate-900 to-transparent flex items-center justify-center">
              <div className="w-24 h-24">
                <PrimeRobotSVG isThinking={isThinking} tourStep="docked" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Title */}
              <div className="absolute bottom-3 left-4 pointer-events-none">
                <h3 className="text-white font-semibold text-lg tracking-wide">PROVENIQ PRIME</h3>
                <p className="text-cyan-400 text-xs">{isThinking ? 'Processing...' : 'Strategic Navigator'}</p>
              </div>

              {/* Replay Tour Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsTourActive(true);
                }}
                className="absolute bottom-3 right-4 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-white transition-colors bg-black/20 hover:bg-black/40 px-2 py-1 rounded-full border border-cyan-500/30"
              >
                <Play className="w-3 h-3" /> Replay Tour
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-white/50 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    Hello! I&apos;m PROVENIQ PRIME.
                    <br />
                    How can I assist you today?
                  </p>
                </div>
              )}

              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-md'
                        : 'bg-white/10 text-white/90 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isThinking && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-white/70 text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask PRIME anything..."
                  disabled={isThinking}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
