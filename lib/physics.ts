export const BUDGET = {
  flywheel: {
    maxParticles: 12,
  },
  particles: {
    max: 50,
  }
} as const;

export const FLYWHEEL = {
  radius: 240,
  duration: 60,
  rotation: 360,
} as const;

export const NODE_COUNT = 7 as const;
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

export const TIMING = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  stagger: 0.05,
} as const;

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

