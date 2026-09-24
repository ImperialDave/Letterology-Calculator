/** Placed CC0 props. A radius stops Sable. A line is what E says when she is close. */

export type PropMode = "height" | "longest" | "stand";

export type Prop = {
  id: string;
  file: string;
  x: number;
  z: number;
  meters: number;
  mode: PropMode;
  palette: string;
  yaw?: number;
  r?: number;
  wind?: boolean;
  say?: string;
  reach?: number;
  /** Word on the action button. Defaults to Read, or Open for a gate. */
  verb?: string;
};

export const PROPS: Prop[] = [
  { id: "fountain", file: "fountain", x: 6.5, z: 14, meters: 3.2, mode: "longest", palette: "stone", r: 1.55, say: "The basin is dry. Someone chalked a letter in the rim.", reach: 2.3 },
  { id: "cart", file: "cart", x: 18, z: 11, meters: 1.35, mode: "height", palette: "roof", yaw: 0.6, r: 1.7, say: "The cart is empty. The axle is carved, not counted.", reach: 2.4 },
  { id: "stall", file: "stall", x: 22, z: 14.5, meters: 2.6, mode: "longest", palette: "wall", yaw: 0.5, r: 1.25, say: "The stall's cloth is indigo. Nothing is for sale.", reach: 2.2 },
  { id: "bench", file: "bench", x: 20.2, z: 12.4, meters: 0.48, mode: "height", palette: "roof", yaw: 0.5, say: "A bench worn smooth by waiting.", reach: 1.5 },
  { id: "tent", file: "tent", x: 7, z: 1.2, meters: 1.55, mode: "height", palette: "vellum", yaw: 1.1, r: 0.85, say: "A small tent, open. The bedroll is still warm.", reach: 1.8, verb: "Listen" },
  { id: "fire", file: "pit", x: 4.4, z: 10.6, meters: 1.15, mode: "longest", palette: "stone", r: 0.5, say: "The stones are warm. The fire is out.", reach: 1.5 },
  { id: "fence-a", file: "fence", x: 14.6, z: 20.4, meters: 1.15, mode: "height", palette: "wall", yaw: 0.15, r: 0.42 },
  { id: "fence-b", file: "fence", x: 16.0, z: 19.6, meters: 1.15, mode: "height", palette: "wall", yaw: 0.15, r: 0.42 },
  { id: "gate", file: "gate", x: 15.4, z: 17.6, meters: 1.05, mode: "height", palette: "wall", yaw: 1.2, say: "The gate swings. The yard is not locked.", reach: 1.6 },
  { id: "hedge", file: "hedge", x: -12.4, z: 18.6, meters: 1.15, mode: "height", palette: "leaf", yaw: 0.7, r: 0.4 },
  { id: "hedge-b", file: "hedge", x: -13.4, z: 17.5, meters: 1.15, mode: "height", palette: "leaf", yaw: 0.7, r: 0.4 },
  { id: "barrel", file: "barrel", x: 16.4, z: 13.1, meters: 0.95, mode: "height", palette: "roof", r: 0.32, say: "The barrel smells of pitch and rain.", reach: 1.4 },
  { id: "barrel-b", file: "barrel", x: 17.1, z: 13.7, meters: 0.82, mode: "height", palette: "roof", r: 0.28 },
  { id: "box", file: "box", x: 15.7, z: 12.5, meters: 0.48, mode: "height", palette: "roof", r: 0.26 },
  { id: "chest", file: "chest", x: 99.2, z: 13.6, meters: 0.62, mode: "height", palette: "roof", yaw: 0.4, r: 0.42, say: "The chest is shut. The clasp is a letter, not a numeral.", reach: 1.5 },
  { id: "sign", file: "signpost", x: 9.6, z: 7.4, meters: 1.7, mode: "height", palette: "wall", r: 0.22, say: "East to the spire. South to the mesa. The fen is not on this sheet.", reach: 1.6 },
  { id: "work", file: "workbench", x: 28, z: 9.8, meters: 0.95, mode: "height", palette: "roof", yaw: -0.3, r: 0.55, say: "A workbench. The tools are gone. Only ink stains remain.", reach: 1.6 },
  { id: "column", file: "column", x: 97.4, z: 5.8, meters: 3.1, mode: "height", palette: "stone", r: 0.4, say: "A stone column. The capital is a blank serif.", reach: 1.6 },
  { id: "log", file: "log", x: 33, z: -2.2, meters: 1.6, mode: "longest", palette: "roof", yaw: 0.8, r: 0.55, say: "A felled trunk. The rings almost spell.", reach: 1.5 },
  { id: "stump", file: "stump", x: 31.2, z: -0.6, meters: 0.5, mode: "height", palette: "roof", r: 0.28 },
  { id: "mushroom", file: "mushroom", x: 19.5, z: -6.2, meters: 0.35, mode: "height", palette: "leaf" },
  { id: "flower-red", file: "flowerRed", x: 5.2, z: 8.6, meters: 0.4, mode: "height", palette: "bronze", wind: true },
  { id: "flower-purple", file: "flowerPurple", x: -2.4, z: 11.2, meters: 0.38, mode: "height", palette: "indigo", wind: true },
  { id: "door", file: "", x: -5.4, z: 11.7, meters: 0, mode: "height", palette: "wall", say: "The shutter is indigo. The hearth inside is cold.", reach: 1.7, verb: "Open" },
  { id: "candle", file: "candle", x: 102.2, z: 14.8, meters: 0.7, mode: "height", palette: "gold", say: "The candle is burning. The wax has no number in it.", reach: 1.3 },
  { id: "torch", file: "torch", x: 46, z: 9.2, meters: 1.55, mode: "height", palette: "bronze", r: 0.22, say: "A torch along the road. The flame is a letter's height.", reach: 1.5 },
  { id: "banner-blue", file: "bannerBlue", x: 64, z: 11.4, meters: 2.8, mode: "height", palette: "indigo", yaw: 0.4, r: 0.35, say: "An indigo banner. The device is a blank page.", reach: 1.6 },
  { id: "table", file: "table", x: 101.2, z: 14.2, meters: 1.05, mode: "height", palette: "wall", yaw: 0.2, r: 0.7, say: "A small table. Someone left a bottle and did not come back.", reach: 1.6 },
  { id: "chair", file: "chair", x: 103.4, z: 13.4, meters: 1.05, mode: "height", palette: "roof", yaw: 2.4, r: 0.35, say: "A chair pulled out, as if the reader stood up mid-line.", reach: 1.4 },
  { id: "shelf", file: "shelf", x: 99.4, z: 15.2, meters: 1.05, mode: "height", palette: "wall", yaw: 1.4, r: 0.4, say: "Candles on a shelf. The scriptorium keeps its own light.", reach: 1.4, verb: "Read" },
  { id: "cloth", file: "tableCloth", x: 26.5, z: 16.4, meters: 1.0, mode: "height", palette: "vellum", yaw: 0.6, r: 0.85, say: "A cloth on a table. The fold is careful.", reach: 1.6 },
  { id: "bottle", file: "bottle", x: 23.6, z: 13.4, meters: 0.42, mode: "height", palette: "leaf", say: "Green glass. Empty. It smells like wet vellum.", reach: 1.2 },
  { id: "jug", file: "jug", x: 19.4, z: 12.6, meters: 0.48, mode: "height", palette: "roof", say: "A brown jug. The stopper is wax.", reach: 1.2 },
  { id: "coins", file: "coins", x: 22.8, z: 15.6, meters: 0.28, mode: "height", palette: "gold", say: "A stack of coins. None of them are counters.", reach: 1.2 },
  { id: "crates", file: "crates", x: 84, z: -1.5, meters: 1.45, mode: "height", palette: "roof", yaw: 0.5, r: 0.7, say: "Crates lashed for the road. The brand on the wood is a letter.", reach: 1.6 },
  { id: "barrels", file: "barrelStack", x: 56, z: 12.2, meters: 1.35, mode: "height", palette: "roof", r: 0.55, say: "A stack of small barrels. Pitch, not ink.", reach: 1.5 },
  { id: "pillar", file: "pillarDecor", x: 94.2, z: 7.6, meters: 3.4, mode: "height", palette: "stone", r: 0.55, say: "A dressed pillar. The carving stops where a word would start.", reach: 1.6, verb: "Read" },
  { id: "chest-gold", file: "chestGold", x: 106.8, z: 11.2, meters: 1.05, mode: "height", palette: "gold", yaw: -0.6, r: 0.7, say: "A gilt chest. The lock is a letter clasp, and it is shut.", reach: 1.6, verb: "Read" },
];

export function propSolids() {
  return PROPS.filter((prop) => prop.r && prop.r > 0).map((prop) => ({ x: prop.x, z: prop.z, r: prop.r as number }));
}

export function nearestExamine(x: number, z: number, yaw?: number) {
  const fx = yaw === undefined ? 0 : -Math.sin(yaw);
  const fz = yaw === undefined ? 0 : -Math.cos(yaw);
  let best: { say: string; d: number; verb: string } | null = null;
  for (const prop of PROPS) {
    if (!prop.say || !prop.reach) continue;
    const dx = prop.x - x;
    const dz = prop.z - z;
    const d = Math.hypot(dx, dz);
    if (d > prop.reach) continue;
    if (yaw !== undefined && d > 0.25 && (fx * dx + fz * dz) / d < 0.35) continue;
    const verb = prop.verb ?? (prop.id === "gate" || prop.id === "door" ? "Open" : "Read");
    if (!best || d < best.d) best = { say: prop.say, d, verb };
  }
  return best;
}
