"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { OnboardingStep, calculateProgress } from "@/lib/onboarding";

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onDismiss?: () => void;
}

export function OnboardingChecklist({ steps, onDismiss }: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const progress = calculateProgress(steps);
  const isComplete = progress === 100;

  if (isComplete && onDismiss) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-xl overflow-hidden"
    >
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Getting Started</h3>
            <p className="text-sm text-gray-400">
              {progress}% complete • {steps.filter((s) => s.completed).length} of {steps.length} tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 text-gray-500 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {step.href ? (
                    <Link
                      href={step.href}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        step.completed
                          ? "bg-white/5 opacity-60"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.completed
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/10 text-gray-500"
                        }`}
                      >
                        {step.completed ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            step.completed ? "text-gray-400 line-through" : "text-white"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {step.description}
                        </p>
                      </div>
                      {!step.completed && (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </Link>
                  ) : (
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        step.completed ? "bg-white/5 opacity-60" : "bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.completed
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/10 text-gray-500"
                        }`}
                      >
                        {step.completed ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            step.completed ? "text-gray-400 line-through" : "text-white"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
