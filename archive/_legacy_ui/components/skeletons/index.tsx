import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/10",
        className
      )}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} />;
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-9 w-24 rounded-md", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-white/10 p-6", className)}>
      <div className="flex items-center gap-4 mb-4">
        <SkeletonAvatar />
        <div className="space-y-2 flex-1">
          <SkeletonText className="w-1/3" />
          <SkeletonText className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText />
        <SkeletonText className="w-4/5" />
        <SkeletonText className="w-3/5" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="bg-white/5 p-4 flex gap-4">
        <SkeletonText className="w-1/4" />
        <SkeletonText className="w-1/4" />
        <SkeletonText className="w-1/4" />
        <SkeletonText className="w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-t border-white/5 flex gap-4">
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/10">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-2">
            <SkeletonText className="w-1/3" />
            <SkeletonText className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
