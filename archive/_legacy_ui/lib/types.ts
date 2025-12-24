export type ProductType = "Software" | "Infrastructure" | "Hardware";

export interface Product {
  id: string;
  label: string;
  type: ProductType;
  role: string;
  routeSlug: string;
  docSlug: string;
}

export interface ThemeFonts {
  ui: string;
  data: string;
}

export interface ThemeColors {
  bg: string;
  panel: string;
  accent: string;
  success: string;
}

export interface ThemeMotion {
  easeHeavy: readonly [number, number, number, number];
}

export interface Theme {
  fonts: ThemeFonts;
  colors: ThemeColors;
  motion: ThemeMotion;
}

export interface ProveniqDNA {
  products: readonly Product[];
  theme: Theme;
}

export interface Metric {
  id: string;
  label: string;
  value: unknown;
}

export interface Doc {
  id: string;
  title: string;
  content: unknown;
}
