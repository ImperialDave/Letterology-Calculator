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
  | "eclipse"
  | "hail"
  | "gold"
  | "lightning"
  | "void";

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
  | "forest"
  | "lattice"
  | "orrery"
  | "glacier"
  | "glass"
  | "garden"
  | "script";

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
  // 31–60 The Remainder
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "gold", mid: "orrery", fog: "rgba(20,12,32,0.5)", grade: "rgba(160,120,40,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#0c1828", "#081420", "#040c14"], accent: "#7fd0ff", weather: "motes", mid: "lattice", fog: "rgba(6,16,28,0.5)", grade: "rgba(40,90,140,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "snow", mid: "glacier", fog: "rgba(180,210,220,0.25)", grade: "rgba(80,140,170,0.1)", sun: "day" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "embers", mid: "script", fog: "rgba(36,16,8,0.5)", grade: "rgba(180,80,20,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#101428", "#0c1020", "#060814"], accent: "#c46ad4", weather: "aurora", mid: "orrery", fog: "rgba(10,10,28,0.5)", grade: "rgba(100,40,160,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#0a1820", "#061218", "#040c10"], accent: "#8ec8d4", weather: "hail", mid: "glass", fog: "rgba(8,20,28,0.5)", grade: "rgba(40,100,120,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#1c1018", "#140c12", "#0a060a"], accent: "#d45a4a", weather: "lightning", mid: "lattice", fog: "rgba(28,8,16,0.5)", grade: "rgba(160,30,50,0.14)", sun: "night" },
  { theme: "orbit", sky: ["#f0e0b0", "#c8a060", "#2a2010"], accent: "#e8d48a", weather: "gold", mid: "garden", fog: "rgba(80,60,20,0.25)", grade: "rgba(200,160,40,0.1)", sun: "day" },
  { theme: "glacier", sky: ["#e8f0f4", "#b0c8d4", "#243848"], accent: "#d8eef4", weather: "snow", mid: "glacier", fog: "rgba(200,220,230,0.22)", grade: "rgba(90,140,170,0.1)", sun: "day" },
  { theme: "remainder", sky: ["#12080c", "#0c0408", "#060204"], accent: "#e8d48a", weather: "void", mid: "script", fog: "rgba(16,4,8,0.65)", grade: "rgba(80,20,30,0.16)", sun: "eclipse" },
  { theme: "orbit", sky: ["#081420", "#061018", "#040a12"], accent: "#5ee0c0", weather: "motes", mid: "lattice", fog: "rgba(6,16,24,0.5)", grade: "rgba(20,90,80,0.12)", sun: "night" },
  { theme: "canal", sky: ["#0c241c", "#081810", "#04100c"], accent: "#3de8a8", weather: "inkfall", mid: "garden", fog: "rgba(6,28,20,0.5)", grade: "rgba(20,100,70,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#142028", "#0c181e", "#081014"], accent: "#7fd0ff", weather: "hail", mid: "glass", fog: "rgba(10,20,28,0.5)", grade: "rgba(40,90,130,0.12)", sun: "storm" },
  { theme: "spire", sky: ["#181028", "#120c1c", "#0a0812"], accent: "#c46ad4", weather: "aurora", mid: "orrery", fog: "rgba(16,10,28,0.5)", grade: "rgba(120,40,160,0.12)", sun: "night" },
  { theme: "remainder", sky: ["#2a1810", "#1c100c", "#100806"], accent: "#e07040", weather: "embers", mid: "foundry", fog: "rgba(40,14,8,0.5)", grade: "rgba(180,70,20,0.14)", sun: "dusk" },
  { theme: "orbit", sky: ["#0c0c18", "#080814", "#04040c"], accent: "#9af8de", weather: "void", mid: "mirrors", fog: "rgba(8,8,20,0.6)", grade: "rgba(30,80,90,0.14)", sun: "night" },
  { theme: "glacier", sky: ["#c8dce8", "#6a8aa0", "#182838"], accent: "#c8e4f0", weather: "snow", mid: "glacier", fog: "rgba(160,190,210,0.28)", grade: "rgba(70,120,150,0.1)", sun: "day" },
  { theme: "remainder", sky: ["#201014", "#14080c", "#0a0406"], accent: "#d45a4a", weather: "lightning", mid: "lattice", fog: "rgba(32,8,12,0.55)", grade: "rgba(160,20,40,0.14)", sun: "night" },
  { theme: "orbit", sky: ["#e8d8a0", "#a08040", "#241c10"], accent: "#e8d48a", weather: "gold", mid: "script", fog: "rgba(70,50,16,0.3)", grade: "rgba(200,150,40,0.1)", sun: "day" },
  { theme: "vault", sky: ["#101820", "#0c141c", "#080c12"], accent: "#8ec8d4", weather: "motes", mid: "glass", fog: "rgba(8,16,22,0.5)", grade: "rgba(40,90,110,0.12)", sun: "night" },
  { theme: "remainder", sky: ["#140c10", "#0e080c", "#080406"], accent: "#c46ad4", weather: "static", mid: "orrery", fog: "rgba(20,8,16,0.55)", grade: "rgba(120,30,100,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#08141c", "#061018", "#040c12"], accent: "#7fd0ff", weather: "hail", mid: "lattice", fog: "rgba(6,16,24,0.55)", grade: "rgba(30,80,120,0.14)", sun: "storm" },
  { theme: "orbit", sky: ["#1c1024", "#140c1a", "#0c0812"], accent: "#e8a0f0", weather: "aurora", mid: "garden", fog: "rgba(24,12,32,0.5)", grade: "rgba(140,40,160,0.12)", sun: "night" },
  { theme: "abyss", sky: ["#08060c", "#06040a", "#020208"], accent: "#7a8b96", weather: "void", mid: "ribs", fog: "rgba(4,4,12,0.7)", grade: "rgba(20,20,50,0.18)", sun: "eclipse" },
  { theme: "remainder", sky: ["#2a1c10", "#1a120c", "#0e0a06"], accent: "#e8d48a", weather: "gold", mid: "script", fog: "rgba(40,24,8,0.5)", grade: "rgba(180,120,30,0.12)", sun: "dusk" },
  { theme: "glacier", sky: ["#e4eef4", "#90a8b8", "#1c2c38"], accent: "#d0e8f0", weather: "snow", mid: "glass", fog: "rgba(190,210,220,0.24)", grade: "rgba(80,130,160,0.1)", sun: "day" },
  { theme: "orbit", sky: ["#0c1020", "#080c18", "#040810"], accent: "#5ee0c0", weather: "lightning", mid: "orrery", fog: "rgba(8,12,24,0.55)", grade: "rgba(30,90,80,0.14)", sun: "night" },
  { theme: "remainder", sky: ["#1a0c10", "#12080c", "#0a0406"], accent: "#d45a4a", weather: "embers", mid: "lattice", fog: "rgba(28,8,12,0.6)", grade: "rgba(160,20,30,0.16)", sun: "dusk" },
  { theme: "orbit", sky: ["#080c18", "#060814", "#040610"], accent: "#9af8de", weather: "void", mid: "mirrors", fog: "rgba(6,10,20,0.65)", grade: "rgba(20,60,80,0.16)", sun: "night" },
  { theme: "remainder", sky: ["#040208", "#06040c", "#020104"], accent: "#e8d48a", weather: "eclipse", mid: "script", fog: "rgba(6,2,10,0.75)", grade: "rgba(80,30,20,0.2)", sun: "eclipse" },
  // 61–160 Second Century
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "embers", mid: "foundry", fog: "rgba(8,6,10,0.45)", grade: "rgba(20,30,20,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "inkfall", mid: "vaults", fog: "rgba(9,7,11,0.46)", grade: "rgba(21,31,21,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "sparks", mid: "orrery", fog: "rgba(10,8,12,0.47)", grade: "rgba(22,32,22,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "motes", mid: "city", fog: "rgba(11,9,13,0.48)", grade: "rgba(23,33,23,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "ash", mid: "garden", fog: "rgba(12,10,14,0.49)", grade: "rgba(24,34,24,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "aurora", mid: "mirrors", fog: "rgba(13,11,15,0.50)", grade: "rgba(25,35,25,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "gold", mid: "foundry", fog: "rgba(14,12,16,0.51)", grade: "rgba(26,36,26,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "snow", mid: "vaults", fog: "rgba(15,13,17,0.52)", grade: "rgba(27,37,27,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "lightning", mid: "orrery", fog: "rgba(16,14,18,0.53)", grade: "rgba(28,38,28,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "rain", mid: "city", fog: "rgba(17,15,19,0.54)", grade: "rgba(29,39,29,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "void", mid: "garden", fog: "rgba(18,16,20,0.55)", grade: "rgba(30,40,30,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "hail", mid: "mirrors", fog: "rgba(19,17,21,0.56)", grade: "rgba(31,41,31,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "static", mid: "foundry", fog: "rgba(20,6,22,0.57)", grade: "rgba(32,42,32,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "eclipse", mid: "vaults", fog: "rgba(21,7,23,0.58)", grade: "rgba(33,43,33,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "petals", mid: "orrery", fog: "rgba(22,8,24,0.59)", grade: "rgba(34,44,34,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "embers", mid: "city", fog: "rgba(23,9,25,0.60)", grade: "rgba(35,45,35,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "inkfall", mid: "garden", fog: "rgba(24,10,10,0.61)", grade: "rgba(36,46,36,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "sparks", mid: "mirrors", fog: "rgba(25,11,11,0.62)", grade: "rgba(37,47,37,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "motes", mid: "foundry", fog: "rgba(26,12,12,0.63)", grade: "rgba(38,48,38,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "ash", mid: "vaults", fog: "rgba(27,13,13,0.64)", grade: "rgba(39,49,39,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "aurora", mid: "orrery", fog: "rgba(8,14,14,0.45)", grade: "rgba(40,50,40,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "gold", mid: "city", fog: "rgba(9,15,15,0.46)", grade: "rgba(41,51,41,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "snow", mid: "garden", fog: "rgba(10,16,16,0.47)", grade: "rgba(42,52,42,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "lightning", mid: "mirrors", fog: "rgba(11,17,17,0.48)", grade: "rgba(43,53,43,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "rain", mid: "foundry", fog: "rgba(12,6,18,0.49)", grade: "rgba(44,54,44,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "void", mid: "vaults", fog: "rgba(13,7,19,0.50)", grade: "rgba(45,55,45,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "hail", mid: "orrery", fog: "rgba(14,8,20,0.51)", grade: "rgba(46,56,46,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "static", mid: "city", fog: "rgba(15,9,21,0.52)", grade: "rgba(47,57,47,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "eclipse", mid: "garden", fog: "rgba(16,10,22,0.53)", grade: "rgba(48,58,48,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "petals", mid: "mirrors", fog: "rgba(17,11,23,0.54)", grade: "rgba(49,59,49,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "embers", mid: "foundry", fog: "rgba(18,12,24,0.55)", grade: "rgba(50,60,50,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "inkfall", mid: "vaults", fog: "rgba(19,13,25,0.56)", grade: "rgba(51,61,51,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "sparks", mid: "orrery", fog: "rgba(20,14,10,0.57)", grade: "rgba(52,62,52,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "motes", mid: "city", fog: "rgba(21,15,11,0.58)", grade: "rgba(53,63,53,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "ash", mid: "garden", fog: "rgba(22,16,12,0.59)", grade: "rgba(54,64,54,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "aurora", mid: "mirrors", fog: "rgba(23,17,13,0.60)", grade: "rgba(55,65,55,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "gold", mid: "foundry", fog: "rgba(24,6,14,0.61)", grade: "rgba(56,66,56,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "snow", mid: "vaults", fog: "rgba(25,7,15,0.62)", grade: "rgba(57,67,57,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "lightning", mid: "orrery", fog: "rgba(26,8,16,0.63)", grade: "rgba(58,68,58,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "rain", mid: "city", fog: "rgba(27,9,17,0.64)", grade: "rgba(59,69,59,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "void", mid: "garden", fog: "rgba(8,10,18,0.45)", grade: "rgba(20,70,20,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "hail", mid: "mirrors", fog: "rgba(9,11,19,0.46)", grade: "rgba(21,71,21,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "static", mid: "foundry", fog: "rgba(10,12,20,0.47)", grade: "rgba(22,72,22,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "eclipse", mid: "vaults", fog: "rgba(11,13,21,0.48)", grade: "rgba(23,73,23,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "petals", mid: "orrery", fog: "rgba(12,14,22,0.49)", grade: "rgba(24,74,24,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "embers", mid: "city", fog: "rgba(13,15,23,0.50)", grade: "rgba(25,75,25,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "inkfall", mid: "garden", fog: "rgba(14,16,24,0.51)", grade: "rgba(26,76,26,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "sparks", mid: "mirrors", fog: "rgba(15,17,25,0.52)", grade: "rgba(27,77,27,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "motes", mid: "foundry", fog: "rgba(16,6,10,0.53)", grade: "rgba(28,78,28,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "ash", mid: "vaults", fog: "rgba(17,7,11,0.54)", grade: "rgba(29,79,29,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "aurora", mid: "orrery", fog: "rgba(18,8,12,0.55)", grade: "rgba(30,30,30,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "gold", mid: "city", fog: "rgba(19,9,13,0.56)", grade: "rgba(31,31,31,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "snow", mid: "garden", fog: "rgba(20,10,14,0.57)", grade: "rgba(32,32,32,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "lightning", mid: "mirrors", fog: "rgba(21,11,15,0.58)", grade: "rgba(33,33,33,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "rain", mid: "foundry", fog: "rgba(22,12,16,0.59)", grade: "rgba(34,34,34,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "void", mid: "vaults", fog: "rgba(23,13,17,0.60)", grade: "rgba(35,35,35,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "hail", mid: "orrery", fog: "rgba(24,14,18,0.61)", grade: "rgba(36,36,36,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "static", mid: "city", fog: "rgba(25,15,19,0.62)", grade: "rgba(37,37,37,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "eclipse", mid: "garden", fog: "rgba(26,16,20,0.63)", grade: "rgba(38,38,38,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "petals", mid: "mirrors", fog: "rgba(27,17,21,0.64)", grade: "rgba(39,39,39,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "embers", mid: "foundry", fog: "rgba(8,6,22,0.45)", grade: "rgba(40,40,40,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "inkfall", mid: "vaults", fog: "rgba(9,7,23,0.46)", grade: "rgba(41,41,41,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "sparks", mid: "orrery", fog: "rgba(10,8,24,0.47)", grade: "rgba(42,42,42,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "motes", mid: "city", fog: "rgba(11,9,25,0.48)", grade: "rgba(43,43,43,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "ash", mid: "garden", fog: "rgba(12,10,10,0.49)", grade: "rgba(44,44,44,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "aurora", mid: "mirrors", fog: "rgba(13,11,11,0.50)", grade: "rgba(45,45,45,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "gold", mid: "foundry", fog: "rgba(14,12,12,0.51)", grade: "rgba(46,46,46,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "snow", mid: "vaults", fog: "rgba(15,13,13,0.52)", grade: "rgba(47,47,47,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "lightning", mid: "orrery", fog: "rgba(16,14,14,0.53)", grade: "rgba(48,48,48,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "rain", mid: "city", fog: "rgba(17,15,15,0.54)", grade: "rgba(49,49,49,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "void", mid: "garden", fog: "rgba(18,16,16,0.55)", grade: "rgba(50,50,50,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "hail", mid: "mirrors", fog: "rgba(19,17,17,0.56)", grade: "rgba(51,51,51,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "static", mid: "foundry", fog: "rgba(20,6,18,0.57)", grade: "rgba(52,52,52,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "eclipse", mid: "vaults", fog: "rgba(21,7,19,0.58)", grade: "rgba(53,53,53,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "petals", mid: "orrery", fog: "rgba(22,8,20,0.59)", grade: "rgba(54,54,54,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "embers", mid: "city", fog: "rgba(23,9,21,0.60)", grade: "rgba(55,55,55,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "inkfall", mid: "garden", fog: "rgba(24,10,22,0.61)", grade: "rgba(56,56,56,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "sparks", mid: "mirrors", fog: "rgba(25,11,23,0.62)", grade: "rgba(57,57,57,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "motes", mid: "foundry", fog: "rgba(26,12,24,0.63)", grade: "rgba(58,58,58,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "ash", mid: "vaults", fog: "rgba(27,13,25,0.64)", grade: "rgba(59,59,59,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "aurora", mid: "orrery", fog: "rgba(8,14,10,0.45)", grade: "rgba(20,60,20,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "gold", mid: "city", fog: "rgba(9,15,11,0.46)", grade: "rgba(21,61,21,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "snow", mid: "garden", fog: "rgba(10,16,12,0.47)", grade: "rgba(22,62,22,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "lightning", mid: "mirrors", fog: "rgba(11,17,13,0.48)", grade: "rgba(23,63,23,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "rain", mid: "foundry", fog: "rgba(12,6,14,0.49)", grade: "rgba(24,64,24,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "void", mid: "vaults", fog: "rgba(13,7,15,0.50)", grade: "rgba(25,65,25,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "hail", mid: "orrery", fog: "rgba(14,8,16,0.51)", grade: "rgba(26,66,26,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "static", mid: "city", fog: "rgba(15,9,17,0.52)", grade: "rgba(27,67,27,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "eclipse", mid: "garden", fog: "rgba(16,10,18,0.53)", grade: "rgba(28,68,28,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "petals", mid: "mirrors", fog: "rgba(17,11,19,0.54)", grade: "rgba(29,69,29,0.12)", sun: "eclipse" },
  { theme: "fort", sky: ["#3a2a22", "#241810", "#120c0a"], accent: "#b08a4a", weather: "embers", mid: "foundry", fog: "rgba(18,12,20,0.55)", grade: "rgba(30,70,30,0.12)", sun: "dusk" },
  { theme: "canal", sky: ["#0c1814", "#10241c", "#08140f"], accent: "#5ee0c0", weather: "inkfall", mid: "vaults", fog: "rgba(19,13,21,0.56)", grade: "rgba(31,71,31,0.12)", sun: "night" },
  { theme: "coil", sky: ["#160814", "#1c0e22", "#0c0612"], accent: "#c46ad4", weather: "sparks", mid: "orrery", fog: "rgba(20,14,22,0.57)", grade: "rgba(32,72,32,0.12)", sun: "storm" },
  { theme: "vault", sky: ["#0c1018", "#121820", "#080c12"], accent: "#8ec8d4", weather: "motes", mid: "city", fog: "rgba(21,15,23,0.58)", grade: "rgba(33,73,33,0.12)", sun: "day" },
  { theme: "abyss", sky: ["#04060c", "#060a12", "#020406"], accent: "#c4b08a", weather: "ash", mid: "garden", fog: "rgba(22,16,24,0.59)", grade: "rgba(34,74,34,0.12)", sun: "eclipse" },
  { theme: "spire", sky: ["#141018", "#1c1824", "#0c0a10"], accent: "#7fd0ff", weather: "aurora", mid: "mirrors", fog: "rgba(23,17,25,0.60)", grade: "rgba(35,75,35,0.12)", sun: "dusk" },
  { theme: "orbit", sky: ["#1a1028", "#120c1c", "#080610"], accent: "#e8d48a", weather: "gold", mid: "foundry", fog: "rgba(24,6,10,0.61)", grade: "rgba(36,76,36,0.12)", sun: "night" },
  { theme: "glacier", sky: ["#d8e8f0", "#8aa8bc", "#1c3040"], accent: "#c8e8f4", weather: "snow", mid: "vaults", fog: "rgba(25,7,11,0.62)", grade: "rgba(37,77,37,0.12)", sun: "storm" },
  { theme: "remainder", sky: ["#241810", "#18100c", "#0c0806"], accent: "#e07040", weather: "lightning", mid: "orrery", fog: "rgba(26,8,12,0.63)", grade: "rgba(38,78,38,0.12)", sun: "day" },
  { theme: "street", sky: ["#6d7c8c", "#8a97a4", "#1c242c"], accent: "#e8d296", weather: "rain", mid: "city", fog: "rgba(27,9,13,0.64)", grade: "rgba(39,79,39,0.12)", sun: "eclipse" },
];

export function districtFor(index: number): DistrictLook {
  if (index <= 0) return DISTRICTS[0];
  return DISTRICTS[Math.min(DISTRICTS.length - 1, index)];
}
