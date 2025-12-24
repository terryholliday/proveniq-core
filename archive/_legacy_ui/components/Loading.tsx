import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-3",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-cyan-500 border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function Loading({ text, size = "md", fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Spinner size={size} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex gap-1", className)}>
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
    </span>
  );
}

export function LoadingBar({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-1 bg-white/10 rounded-full overflow-hidden", className)}>
      <div className="h-full bg-cyan-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
    </div>
  );
}
