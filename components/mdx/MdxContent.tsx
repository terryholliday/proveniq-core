"use client";

import { ReactNode } from "react";

interface MdxContentProps {
  children: ReactNode;
}

export function MdxContent({ children }: MdxContentProps) {
  return (
    <article className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-200 prose-a:text-proveniq-accent prose-code:text-proveniq-accent prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
      {children}
    </article>
  );
}
