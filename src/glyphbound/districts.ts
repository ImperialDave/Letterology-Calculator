import type { ThemeId } from "./types";

export type Weather =
  | "none"
  | "rain"
  | "ash"
  | "embers"
  | "sparks"
  | "motes"
  | "snow"
  | "inkfall"
  | "petals"
  | "aurora"
  | "static"
  | "eclipse";

export type Mid =
  | "city"
  | "books"
  | "pipes"
  | "spires"
  | "ribs"
  | "ships"
  | "columns"
  | "coils"
  | "vaults"
  | "irises"
  | "machines"
  | "mirrors"
  | "arches"
  | "docks"
  | "foundry"
  | "forest";

export interface DistrictLook {
  theme: ThemeId;
  sky: readonly [string, string, string];
  accent: string;
  weather: Weather;
  mid: Mid;
  fog: string;
  grade: string;
  sun: "day" | "dusk" | "night" | "storm" | "eclipse";
}

export const DISTRICTS: DistrictLook[] = [
  { theme: "hub", sky: ["#1a1424", "#121018", "#07080c"], accent: "#c9b896", weather: "motes", mid: "books", fog: "rgba(18,12,24,0.55)", grade: "rgba(80,50,90,0.12)", sun: "night" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "rain", mid: "city", fog: "rgba(40,50,58,0.4)", grade: "rgba(90,110,120,0.1)", sun: "storm" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "embers", mid: "arches", fog: "rgba(40,22,12,0.5)", grade: "rgba(160,90,40,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "inkfall", mid: "pipes", fog: "rgba(8,24,18,0.5)", grade: "rgba(20,80,60,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "sparks", mid: "coils", fog: "rgba(28,8,32,0.5)", grade: "rgba(140,40,160,0.12)", sun: "night" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "motes", mid: "vaults", fog: "rgba(8,16,22,0.5)", grade: "rgba(40,90,100,0.1)", sun: "night" },
  { theme: "street", sky: ["#f0c888", "#c87848", "#3a2018"], accent: "#f0c888", weather: "none", mid: "city", fog: "rgba(80,40,20,0.25)", grade: "rgba(220,140,60,0.1)", sun: "day" },
  { theme: "canal", sky: ["#1a2830", "#0e1c22", "#081014"], accent: "#7fd0b8", weather: "rain", mid: "docks", fog: "rgba(12,24,28,0.45)", grade: "rgba(40,80,90,0.1)", sun: "storm" },
  { theme: "abyss", sky: ["#2a2218", "#18140e", "#0a0806"], accent: "#c4b08a", weather: "ash", mid: "columns", fog: "rgba(24,18,12,0.5)", grade: "rgba(90,70,40,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#061410", "#0a1c16", "#040c0a"], accent: "#3de8a8", weather: "motes", mid: "irises", fog: "rgba(4,20,16,0.55)", grade: "rgba(20,90,70,0.14)", sun: "night" },
  { theme: "vault", sky: ["#2a2430", "#18141c", "#0c0a10"], accent: "#e8d4c0", weather: "petals", mid: "columns", fog: "rgba(24,18,28,0.4)", grade: "rgba(160,120,140,0.1)", sun: "dusk" },
  { theme: "fort", sky: ["#3a1810", "#22100c", "#100806"], accent: "#e07040", weather: "embers", mid: "foundry", fog: "rgba(40,12,8,0.5)", grade: "rgba(180,60,20,0.14)", sun: "dusk" },
  { theme: "coil", sky: ["#1c0c18", "#140814", "#0a040c"], accent: "#e8a0f0", weather: "sparks", mid: "coils", fog: "rgba(30,8,28,0.5)", grade: "rgba(160,40,180,0.12)", sun: "night" },
  { theme: "street", sky: ["#d8c070", "#6a5840", "#1c1810"], accent: "#e8d48a", weather: "none", mid: "machines", fog: "rgba(40,32,16,0.3)", grade: "rgba(180,150,40,0.1)", sun: "day" },
  { theme: "fort", sky: ["#4a1818", "#280c0c", "#100606"], accent: "#d45a4a", weather: "embers", mid: "arches", fog: "rgba(48,8,8,0.5)", grade: "rgba(180,30,30,0.14)", sun: "dusk" },
  { theme: "vault", sky: ["#141820", "#0c1018", "#06080c"], accent: "#8ec8d4", weather: "motes", mid: "books", fog: "rgba(10,16,22,0.5)", grade: "rgba(50,90,110,0.1)", sun: "night" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#7a8b96", weather: "motes", mid: "ribs", fog: "rgba(4,8,14,0.6)", grade: "rgba(20,40,60,0.16)", sun: "night" },
  { theme: "street", sky: ["#c4a060", "#8a6030", "#2a1c10"], accent: "#e0b060", weather: "ash", mid: "columns", fog: "rgba(60,40,16,0.4)", grade: "rgba(180,120,40,0.12)", sun: "day" },
  { theme: "canal", sky: ["#102028", "#0a161c", "#060c10"], accent: "#7fd0ff", weather: "rain", mid: "ships", fog: "rgba(8,20,28,0.5)", grade: "rgba(30,70,90,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#241c28", "#161018", "#0c0a10"], accent: "#e8d4c8", weather: "petals", mid: "vaults", fog: "rgba(28,16,28,0.4)", grade: "rgba(140,90,120,0.1)", sun: "dusk" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#5ee0c0", weather: "aurora", mid: "spires", fog: "rgba(12,10,20,0.45)", grade: "rgba(40,90,80,0.1)", sun: "night" },
  { theme: "spire", sky: ["#0c1420", "#081018", "#04080e"], accent: "#7fd0ff", weather: "motes", mid: "irises", fog: "rgba(6,14,22,0.5)", grade: "rgba(30,70,110,0.12)", sun: "night" },
  { theme: "spire", sky: ["#101828", "#0c1420", "#060a12"], accent: "#9af8de", weather: "aurora", mid: "spires", fog: "rgba(8,16,28,0.45)", grade: "rgba(40,80,120,0.12)", sun: "night" },
  { theme: "canal", sky: ["#1a1014", "#120c10", "#080608"], accent: "#d45a4a", weather: "rain", mid: "ships", fog: "rgba(24,10,12,0.5)", grade: "rgba(120,30,40,0.12)", sun: "storm" },
  { theme: "fort", sky: ["#2a1810", "#1a100c", "#0c0806"], accent: "#e07040", weather: "embers", mid: "machines", fog: "rgba(32,14,8,0.5)", grade: "rgba(160,70,20,0.12)", sun: "dusk" },
  { theme: "coil", sky: ["#201018", "#140c12", "#0a060a"], accent: "#d45a4a", weather: "sparks", mid: "arches", fog: "rgba(32,8,16,0.5)", grade: "rgba(160,30,50,0.14)", sun: "night" },
  { theme: "vault", sky: ["#101418", "#0c1014", "#06080c"], accent: "#c8d8e0", weather: "static", mid: "mirrors", fog: "rgba(10,14,18,0.5)", grade: "rgba(80,100,120,0.12)", sun: "night" },
  { theme: "abyss", sky: ["#1c1010", "#120808", "#080404"], accent: "#d45a4a", weather: "ash", mid: "arches", fog: "rgba(28,8,8,0.55)", grade: "rgba(140,20,20,0.14)", sun: "dusk" },
  { theme: "abyss", sky: ["#020406", "#04060a", "#000204"], accent: "#7a8b96", weather: "static", mid: "ribs", fog: "rgba(0,4,8,0.65)", grade: "rgba(10,20,40,0.2)", sun: "night" },
  { theme: "spire", sky: ["#121018", "#0c0a12", "#06050a"], accent: "#5ee0c0", weather: "motes", mid: "spires", fog: "rgba(10,8,16,0.55)", grade: "rgba(30,60,70,0.12)", sun: "night" },
  { theme: "abyss", sky: ["#08040a", "#040208", "#020104"], accent: "#e8d48a", weather: "eclipse", mid: "irises", fog: "rgba(8,4,12,0.7)", grade: "rgba(40,10,20,0.18)", sun: "eclipse" },
];

export function districtFor(index: number): DistrictLook {
  if (index <= 0) return DISTRICTS[0];
  return DISTRICTS[Math.min(DISTRICTS.length - 1, index)];
}
