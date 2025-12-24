"use client";

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import clsx from "clsx";

interface NexusWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title: string;
    isDraggable?: boolean;
    // React-Grid-Layout passes these automatically:
    className?: string;
    style?: React.CSSProperties;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

// Forward Ref is crucial for React-Grid-Layout
export const NexusWrapper = memo(React.forwardRef<HTMLDivElement, NexusWrapperProps>(function NexusWrapper({
    children,
    title,
    className,
    style,
    ...props // Capture grid-layout props like onMouseDown, etc.
}, ref) {

    // React-Grid-Layout adds 'react-grid-placeholder' class when acting as a shadow.
    // It adds 'react-grid-item' to the actual element.
    // When 'resizing' class is present, we are resizing.
    // When 'react-grid-placeholder' is present, it is the shadow.

    // We want to detect interaction to downgrade the chart.
    // Unfortunately RGL doesn't pass a clean "isDragging" prop to the child directly without extra work.
    // However, the 'react-grid-item' usually has 'resizing' class when resizing. 
    // Dragging is harder to detect solely from CSS classes on the item itself sometimes, 
    // but often 'working' allows us to infer.

    // For now, let's trust the "Performance Wrapper" strategy: use the props passed down.
    // Actually, standard RGL doesn't pass 'isDragging' prop. 
    // We can infer interaction if style contains 'z-index' changes or use the className check.

    const isInteracting = className?.includes('resizing') || className?.includes('react-grid-placeholder');

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex flex-col overflow-hidden rounded-md border border-slate-800 bg-slate-950/90 backdrop-blur-md shadow-2xl transition-colors hover:border-slate-700",
                className
            )}
            style={style}
            {...props}
        >
            {/* Widget Header / Drag Handle */}
            {/* RGL uses specific class for drag handle if configured, or the whole item. We'll make header the handle if we configure draggableHandle */}
            <div className="nexus-drag-handle flex h-8 w-full items-center justify-between border-b border-white/5 bg-white/5 px-3 select-none cursor-grab active:cursor-grabbing">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    {title}
                </span>
                <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 p-2 overflow-hidden">
                <AnimatePresence mode='wait'>
                    {isInteracting ? (
                        // LIGHTWEIGHT SKELETON (Shows during Drag/Resize)
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full rounded bg-slate-900/50 flex items-center justify-center border border-dashed border-slate-800"
                        >
                            <span className="font-mono text-xs text-slate-600 animate-pulse">
                                RELOCATING MODULE...
                            </span>
                        </motion.div>
                    ) : (
                        // HEAVY CHART (Shows when static)
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full w-full"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}));
