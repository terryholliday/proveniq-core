export const FLYWHEEL_RADIUS = 240 as const;
export const NODE_COUNT = 7 as const;
export const ROTATION_DURATION = 60 as const;
export const PACKET_STAGGER_DELAY = 0.5 as const;
export const EASE_HEAVY: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const LAYOUT = {
  sidebarWidth: 240,
  headerHeight: 64,
  contentPadding: 24,
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  modal: 50,
  overlay: 100,
  hud: 200,
} as const;

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

