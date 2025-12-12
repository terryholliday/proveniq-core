import { PROVENIQ_DNA } from "./config";

export type ProveniqProduct = (typeof PROVENIQ_DNA.products)[number];
export type ProductId = ProveniqProduct["id"];
export type ProductType = ProveniqProduct["type"];
export type ProductRole = ProveniqProduct["role"];

export type ProveniqTheme = typeof PROVENIQ_DNA.theme;
export type ThemeColor = keyof ProveniqTheme["colors"];
