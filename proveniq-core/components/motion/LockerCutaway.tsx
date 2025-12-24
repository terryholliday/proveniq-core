"use client";

import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import { SafeAsset } from "./SafeAsset";

interface LockerCutawayProps {
  className?: string;
}

export function LockerCutaway({ className = "" }: LockerCutawayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const doorOpacity = useTransform(scrollYProgress, [0.2, 0.6], [1, 0]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <SafeAsset doorOpacity={doorOpacity} width={400} height={500} />
    </div>
  );
}
