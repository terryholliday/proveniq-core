"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SHORTCUTS, ShortcutAction } from "@/lib/shortcuts";

interface ShortcutsProviderProps {
  children: ReactNode;
  onAction?: (action: ShortcutAction) => void;
}

export function ShortcutsProvider({ children, onAction }: ShortcutsProviderProps) {
  const router = useRouter();

  useEffect(() => {
    let buffer: string[] = [];
    let bufferTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const modifiers = [];
      if (e.metaKey) modifiers.push("meta");
      if (e.ctrlKey) modifiers.push("control");
      if (e.altKey) modifiers.push("alt");
      if (e.shiftKey) modifiers.push("shift");

      const combo = [...modifiers, key].join("+");

      // Check for modifier combos first
      for (const shortcut of SHORTCUTS) {
        if (shortcut.keys.includes(combo)) {
          e.preventDefault();
          executeAction(shortcut.action);
          return;
        }
      }

      // Handle sequences (vim-like g then h)
      // Only process single chars for sequences
      if (modifiers.length === 0 && key.length === 1) {
        buffer.push(key);
        clearTimeout(bufferTimeout);

        // Check buffer match
        const sequence = buffer.join(" ");
        const match = SHORTCUTS.find((s) => s.keys.includes(sequence));

        if (match) {
          executeAction(match.action);
          buffer = [];
        } else {
          // Keep buffer alive for a short time
          bufferTimeout = setTimeout(() => {
            buffer = [];
          }, 1000);
        }
      }
    };

    function executeAction(action: ShortcutAction) {
      if (onAction) {
        onAction(action);
      }

      switch (action) {
        case "GO_HOME":
          router.push("/");
          break;
        case "GO_VAULT":
          router.push("/vault");
          break;
        case "GO_AUDIT":
          router.push("/admin/audit");
          break;
        case "GO_SETTINGS":
          router.push("/settings");
          break;
        case "OPEN_COMMAND_PALETTE":
          // This usually requires communicating with the CommandPalette component.
          // We can dispatch a custom event or use a context.
          // For simplicity, we'll dispatch a custom event that CommandPalette listens to.
          window.dispatchEvent(new CustomEvent("open-command-palette"));
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(bufferTimeout);
    };
  }, [router, onAction]);

  return <>{children}</>;
}
