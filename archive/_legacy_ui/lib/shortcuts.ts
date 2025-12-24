export type ShortcutAction = 
  | "OPEN_COMMAND_PALETTE"
  | "GO_HOME"
  | "GO_VAULT"
  | "GO_AUDIT"
  | "GO_SETTINGS";

export interface Shortcut {
  id: string;
  keys: string[]; // e.g. ["Meta+k", "Ctrl+k"]
  action: ShortcutAction;
  description: string;
}

export const SHORTCUTS: Shortcut[] = [
  {
    id: "open-command-palette",
    keys: ["Meta+k", "Control+k"],
    action: "OPEN_COMMAND_PALETTE",
    description: "Open command palette",
  },
  {
    id: "go-home",
    keys: ["g h"], // sequence 'g' then 'h' - might need advanced handling, let's stick to simple modifiers for now
    action: "GO_HOME",
    description: "Go to Dashboard",
  },
  {
    id: "go-vault",
    keys: ["g v"],
    action: "GO_VAULT",
    description: "Go to Vault",
  },
  {
    id: "go-audit",
    keys: ["g a"],
    action: "GO_AUDIT",
    description: "Go to Audit Logs",
  },
  {
    id: "go-settings",
    keys: ["g s", "Meta+,"],
    action: "GO_SETTINGS",
    description: "Go to Settings",
  },
];
