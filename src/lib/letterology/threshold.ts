export const THRESHOLD_INVENTORY = "threshold-v1";
export const THRESHOLD_SCALE_MIN = 1;
export const THRESHOLD_SCALE_MAX = 5;

export type ThresholdSectionId = "handle" | "stay" | "hand" | "houses" | "scale" | "scenes";
export type ThresholdKind = "written" | "scale" | "choice" | "scene";
export type ThresholdAxisId = "stay" | "hand" | "room" | "method";

export type ThresholdItem = {
  id: string;
  n: number;
  section: ThresholdSectionId;
  kind: ThresholdKind;
  prompt: string;
  options?: readonly string[];
};

export type ThresholdAxes = {
  stay: number;
  hand: number;
  room: number;
  method: number;
  poorDiscretion: boolean;
  ornamental: boolean;
};

export type ThresholdPayload = {
  id: string;
  handle: string;
  house: string;
  hours: string;
  written: Record<string, string>;
  scales: Record<string, number>;
  scenes: Record<string, string>;
};

export type ThresholdRecord = ThresholdPayload & {
  createdAt: string;
  userId: string | null;
  axes: ThresholdAxes;
  inventory: string;
};

export const THRESHOLD_SECTIONS: { id: ThresholdSectionId; title: string; lede: string }[] = [
  {
    id: "handle",
    title: "The handle, not the birth name",
    lede: "Whether you actually live inside the practice, or only want the costume.",
  },
  {
    id: "stay",
    title: "Staying power",
    lede: "How you leave, how you keep a dull season, and how you disagree without splitting the room.",
  },
  {
    id: "hand",
    title: "Usefulness",
    lede: "Craft, not enthusiasm. Follow-through, teaching without annexation, refusal to fake a reading.",
  },
  {
    id: "houses",
    title: "The houses in motion",
    lede: "A few sentences. Do not name a house unless it is already how you think.",
  },
  {
    id: "scale",
    title: "How often",
    lede: "One is almost never. Five is almost always. The sides are not a test of piety.",
  },
  {
    id: "scenes",
    title: "Two short scenes",
    lede: "Harder to fake. Precision, restraint, and ownership of the decision.",
  },
];

export const THRESHOLD_OFFICES = ["keep a ledger", "open a chapter", "teach the Brief", "pilot a game"] as const;

export const THRESHOLD_ITEMS: ThresholdItem[] = [
  { id: "q1", n: 1, section: "handle", kind: "written", prompt: "Why this handle, and not another? What would change if you had to retire it?" },
  { id: "q2", n: 2, section: "handle", kind: "written", prompt: "When a reading of your letters disagrees with how you feel that day, what do you do with the disagreement?" },
  { id: "q3", n: 3, section: "handle", kind: "written", prompt: "“Luck is willingness, not fate.” In your last month, name one thing you treated as fate that was actually willingness — or the reverse." },
  { id: "q4", n: 4, section: "handle", kind: "written", prompt: "Would you rather be read by your legal name or by the handle you work under? Why?" },
  { id: "q5", n: 5, section: "handle", kind: "written", prompt: "If today’s current is contrary to your house, do you wait, force the act, or letterize a smaller act? Give a real example." },
  { id: "q6", n: 6, section: "stay", kind: "written", prompt: "Describe the last group, game, or practice you left. What was the last honest sentence you said before you went?" },
  { id: "q7", n: 7, section: "stay", kind: "written", prompt: "A chapter closes and the next one is dull. Do you keep the ledger, start a side project, or go quiet? Walk through the last time that happened." },
  { id: "q8", n: 8, section: "stay", kind: "written", prompt: "Someone in the club is wrong in public, and you are right. What do you do in the first hour, and what do you do after a week?" },
  { id: "q9", n: 9, section: "stay", kind: "written", prompt: "The club asks you to keep a working detail inside the room until it is ready. How do you decide what stays in and what you may say outside?" },
  { id: "q10", n: 10, section: "stay", kind: "written", prompt: "If the reading of the day told you to wait, and a friend outside told you to ship, whose voice do you give weight — and how do you explain that without making either of them an enemy?" },
  { id: "q11", n: 11, section: "stay", kind: "written", prompt: "What would make you leave Letterology.club in under a month? What would make you stay through a boring season?" },
  {
    id: "q12",
    n: 12,
    section: "hand",
    kind: "choice",
    prompt: "Pick one: you would rather keep a ledger, open a chapter, teach the Brief, or pilot a game. Why that office, and what are you mediocre at?",
    options: THRESHOLD_OFFICES,
  },
  { id: "q13", n: 13, section: "hand", kind: "written", prompt: "Glyphbound and StarWords keep progress in the browser. How do you feel about work that does not follow you to a new machine?" },
  { id: "q14", n: 14, section: "hand", kind: "written", prompt: "Give an example of a small system you maintained when nobody was watching. How long did it last?" },
  { id: "q15", n: 15, section: "hand", kind: "written", prompt: "A newcomer letterizes badly and posts it as doctrine. How do you correct them without making the club smaller?" },
  { id: "q16", n: 16, section: "hand", kind: "written", prompt: "You are asked to compare two handles and time an act. What information do you refuse to invent?" },
  { id: "q17", n: 17, section: "hand", kind: "written", prompt: "When a task has no audience, what is your usual half-life before you drop it?" },
  { id: "q18", n: 18, section: "hand", kind: "written", prompt: "Teach the club one thing you already know that is not letters. How would you make it fit the room without taking the room over?" },
  { id: "q19", n: 19, section: "houses", kind: "written", prompt: "A thing you started is alive, but unfinished. What do you protect, and what do you release?" },
  { id: "q20", n: 20, section: "houses", kind: "written", prompt: "A rule in the club has gone dead. How do you say no without becoming the next dead rule?" },
  { id: "q21", n: 21, section: "houses", kind: "written", prompt: "Two people you like want opposite things from the same reading. How do you hold the room?" },
  { id: "q22", n: 22, section: "houses", kind: "written", prompt: "You notice a current before anyone else does. Who do you tell first, and what do you not tell yet?" },
  { id: "q23", n: 23, section: "houses", kind: "written", prompt: "What do you do with a member who is loyal and also slowing the work?" },
  { id: "q24", n: 24, section: "scale", kind: "scale", prompt: "I finish the unglamorous third of a project." },
  { id: "q25", n: 25, section: "scale", kind: "scale", prompt: "I can wait a day before answering a slight." },
  { id: "q26", n: 26, section: "scale", kind: "scale", prompt: "I change my mind in public when the letters (or the facts) move." },
  { id: "q27", n: 27, section: "scale", kind: "scale", prompt: "I keep other people’s handles and private readings out of my outside talk." },
  { id: "q28", n: 28, section: "scale", kind: "scale", prompt: "I would rather be correct than first." },
  { id: "q29", n: 29, section: "scale", kind: "scale", prompt: "I show up on a contrary day." },
  { id: "q30", n: 30, section: "scale", kind: "scale", prompt: "I can take a small office and not audition for a larger one." },
  { id: "q31", n: 31, section: "scale", kind: "scale", prompt: "I ask before I turn someone’s name into a reading they did not request." },
  { id: "q32", n: 32, section: "scale", kind: "scale", prompt: "I can be bored and still keep the ledger." },
  { id: "q33", n: 33, section: "scale", kind: "scale", prompt: "I tell the room when I cannot keep a promise, early." },
  { id: "q34", n: 34, section: "scale", kind: "scale", prompt: "I enjoy the practice more than the identity of being “in.”" },
  { id: "q35", n: 35, section: "scale", kind: "scale", prompt: "If the club is wrong, I can say so without needing an audience for the saying." },
  { id: "q36", n: 36, section: "scenes", kind: "scene", prompt: "The contrary day. A member wants to letterize “quit my job” on a day the club’s method says the act will not travel. They want your blessing. Write the message you send." },
  { id: "q37", n: 37, section: "scenes", kind: "scene", prompt: "The borrowed face. Someone outside asks you to explain Letterology so they can mock it well. Write the two-sentence version you would actually give." },
];

export const AXIS_NAME: Record<ThresholdAxisId, string> = {
  stay: "Stay",
  hand: "Hand",
  room: "Room",
  method: "Method",
};

export const AXIS_LISTEN: Record<ThresholdAxisId, { good: string; poor: string }> = {
  stay: { good: "Names exits; keeps dull seasons.", poor: "Disappears, or clings as identity." },
  hand: { good: "Maintains small systems; teaches cleanly.", poor: "Only wants the reading, not the ledger." },
  room: { good: "Corrects without shrinking people.", poor: "Needs an audience for every disagreement." },
  method: { good: "Uses letters as willingness.", poor: "Treats letters as fate, or as a bit." },
};

/** Admin-only. Never show these to the person taking the screen. */
export const SECTION_LISTEN: Record<ThresholdSectionId, string> = {
  handle:
    "They can hold the doctrine as a tool, not as a personality replacement. Usefulness rises when they can revise an act. Fit drops when they treat the club as destiny or as a joke they will discard.",
  stay:
    "Clean exits and named reasons are good. “I never leave / I vanish without a word / I stay to punish” is a poor fit. Discretion is timing, not a vow of silence. They can disagree without splitting the room.",
  hand:
    "Follow-through, teaching without annexation, refusal to fake a reading, preference for a real office over main character.",
  houses:
    "People who lecture the house names are usually less useful than people who describe a concrete move.",
  scale:
    "High 24, 29, 32, 33: useful. High 25, 27, 31, 35: safe in a shared practice. High 26, 28, 34: will not turn doctrine into a cage. Low 27 and 31: poor fit even if devoted. Low 24, 32, 33: ornamental member.",
  scenes:
    "Not piety. Precision, restraint, and ownership of the decision — which is already the site’s doctrine.",
};

const STAY_IDS = ["q24", "q29", "q32", "q33"] as const;
const HAND_IDS = ["q24", "q29", "q32", "q33", "q30"] as const;
const ROOM_IDS = ["q25", "q27", "q31", "q35"] as const;
const METHOD_IDS = ["q26", "q28", "q34"] as const;

export const WRITTEN_ITEMS = THRESHOLD_ITEMS.filter((item) => item.kind === "written" || item.kind === "choice");
export const SCALE_ITEMS = THRESHOLD_ITEMS.filter((item) => item.kind === "scale");
export const SCENE_ITEMS = THRESHOLD_ITEMS.filter((item) => item.kind === "scene");

function meanOf(scales: Record<string, number>, ids: readonly string[]): number {
  const values = ids.map((id) => scales[id]).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export type MembershipMark = "keep" | "hold" | "costume" | "unseat" | "thin";

export const MEMBERSHIP_MARK_NAME: Record<MembershipMark, string> = {
  keep: "Keep",
  hold: "Hold",
  costume: "Costume",
  unseat: "Do not seat",
  thin: "Too little to read",
};

export const MEMBERSHIP_MARK_CAPTION: Record<MembershipMark, string> = {
  keep: "Craft, discretion, and a method that is willingness. Seat them.",
  hold: "Mixed. Read the highlighted answers before you offer an office.",
  costume: "Intensity without the unglamorous third. They want the identity more than the ledger.",
  unseat: "Poor discretion. Handles and unasked readings leak. Do not seat them in the room.",
  thin: "Not enough of the scale to grade. Read the written answers yourself.",
};

export type ConsequentialPull = "good" | "poor" | "watch";

export type ConsequentialHit = {
  id: string;
  n: number;
  prompt: string;
  answer: string;
  pull: ConsequentialPull;
  why: string;
};

export type MembershipGrade = {
  mark: MembershipMark;
  markName: string;
  caption: string;
  hits: ConsequentialHit[];
};

/** Answers the court should read first. Never shown to the person who sat. */
export const CONSEQUENTIAL_ITEMS: { id: string; why: string }[] = [
  { id: "q5", why: "Whether they can revise an act when the current is contrary." },
  { id: "q6", why: "How they leave. Vanish, punish, or name the reason." },
  { id: "q9", why: "Discretion as timing, not a vow of silence." },
  { id: "q11", why: "What would make them leave in a month, and stay through a dull season." },
  { id: "q15", why: "Correct without shrinking the club." },
  { id: "q16", why: "What they refuse to invent in a reading." },
  { id: "q24", why: "The unglamorous third. Low here is ornamental." },
  { id: "q27", why: "Handles and private readings stay in the room." },
  { id: "q31", why: "Ask before turning a name into a reading." },
  { id: "q32", why: "Bored and still keep the ledger." },
  { id: "q33", why: "Name a broken promise early." },
  { id: "q36", why: "The contrary-day blessing. Precision, not piety." },
  { id: "q37", why: "The borrowed face. Two sentences they would actually give." },
];

function answerOf(record: Pick<ThresholdRecord, "written" | "scales" | "scenes">, id: string): string {
  const item = THRESHOLD_ITEMS.find((row) => row.id === id);
  if (!item) return "";
  if (item.kind === "scale") return record.scales[id] == null ? "" : String(record.scales[id]);
  if (item.kind === "scene") return record.scenes[id] ?? "";
  return record.written[id] ?? "";
}

function pullOf(item: ThresholdItem, answer: string): ConsequentialPull {
  if (!answer.trim()) return "watch";
  if (item.kind !== "scale") return "watch";
  const value = Number(answer);
  if (value <= 2) return "poor";
  if (value >= 4) return "good";
  return "watch";
}

export function gradeMembership(
  record: Pick<ThresholdRecord, "written" | "scales" | "scenes" | "axes">,
): MembershipGrade {
  const axes = record.axes;
  const scaleCount = Object.keys(record.scales).length;
  let mark: MembershipMark = "hold";
  if (scaleCount < 6) mark = "thin";
  else if (axes.poorDiscretion) mark = "unseat";
  else if (axes.ornamental) mark = "costume";
  else if (axes.stay >= 4 && axes.hand >= 4 && axes.room >= 4 && axes.method >= 4) mark = "keep";

  const hits: ConsequentialHit[] = CONSEQUENTIAL_ITEMS.map((row) => {
    const item = THRESHOLD_ITEMS.find((entry) => entry.id === row.id);
    const answer = answerOf(record, row.id);
    return {
      id: row.id,
      n: item?.n ?? 0,
      prompt: item?.prompt ?? row.id,
      answer,
      pull: item ? pullOf(item, answer) : "watch",
      why: row.why,
    };
  });

  return {
    mark,
    markName: MEMBERSHIP_MARK_NAME[mark],
    caption: MEMBERSHIP_MARK_CAPTION[mark],
    hits,
  };
}

export function isConsequential(id: string): boolean {
  return CONSEQUENTIAL_ITEMS.some((row) => row.id === id);
}

export function scoreThresholdAxes(scales: Record<string, number>): ThresholdAxes {
  const stay = meanOf(scales, STAY_IDS);
  const hand = meanOf(scales, HAND_IDS);
  const room = meanOf(scales, ROOM_IDS);
  const method = meanOf(scales, METHOD_IDS);
  const discretion = meanOf(scales, ["q27", "q31"]);
  const craft = meanOf(scales, ["q24", "q32", "q33"]);
  return {
    stay,
    hand,
    room,
    method,
    poorDiscretion: discretion > 0 && discretion <= 2,
    ornamental: craft > 0 && craft <= 2,
  };
}

export function sittingIdOk(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function clip(value: unknown, max = 4000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function validateThresholdPayload(input: unknown): ThresholdPayload | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.id !== "string" || !sittingIdOk(raw.id)) return null;
  const handle = clip(raw.handle, 80);
  if (!handle) return null;
  const house = clip(raw.house, 80);
  const hours = clip(raw.hours, 80);
  const writtenRaw = raw.written;
  const scalesRaw = raw.scales;
  const scenesRaw = raw.scenes;
  if (!writtenRaw || typeof writtenRaw !== "object" || !scalesRaw || typeof scalesRaw !== "object" || !scenesRaw || typeof scenesRaw !== "object") {
    return null;
  }
  const written: Record<string, string> = {};
  for (const item of WRITTEN_ITEMS) {
    written[item.id] = clip((writtenRaw as Record<string, unknown>)[item.id]);
  }
  const scales: Record<string, number> = {};
  for (const item of SCALE_ITEMS) {
    const value = (scalesRaw as Record<string, unknown>)[item.id];
    if (value == null || value === "") continue;
    if (typeof value !== "number" || !Number.isInteger(value) || value < THRESHOLD_SCALE_MIN || value > THRESHOLD_SCALE_MAX) {
      return null;
    }
    scales[item.id] = value;
  }
  const scenes: Record<string, string> = {};
  for (const item of SCENE_ITEMS) {
    scenes[item.id] = clip((scenesRaw as Record<string, unknown>)[item.id]);
  }
  return { id: raw.id, handle, house, hours, written, scales, scenes };
}

export function presentScaleDeck(seed: number): ThresholdItem[] {
  const items = [...SCALE_ITEMS];
  let state = seed >>> 0 || 1;
  const rand = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const a = items[i]!;
    items[i] = items[j]!;
    items[j] = a;
  }
  return items;
}

function csvField(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function thresholdCsv(rows: ThresholdRecord[]): string {
  const header = ["id", "created", "handle", "house", "hours", "mark", "stay", "hand", "room", "method", "poorDiscretion", "ornamental"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvField(row.id),
        csvField(row.createdAt),
        csvField(row.handle),
        csvField(row.house),
        csvField(row.hours),
        csvField(gradeMembership(row).mark),
        csvField(row.axes.stay),
        csvField(row.axes.hand),
        csvField(row.axes.room),
        csvField(row.axes.method),
        csvField(row.axes.poorDiscretion),
        csvField(row.axes.ornamental),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function thresholdAnswersCsv(rows: ThresholdRecord[]): string {
  const header = ["sitting", "handle", "item", "kind", "prompt", "answer"];
  const lines = [header.join(",")];
  for (const row of rows) {
    for (const item of THRESHOLD_ITEMS) {
      let answer = "";
      if (item.kind === "scale") answer = row.scales[item.id] == null ? "" : String(row.scales[item.id]);
      else if (item.kind === "scene") answer = row.scenes[item.id] ?? "";
      else answer = row.written[item.id] ?? "";
      lines.push(
        [
          csvField(row.id),
          csvField(row.handle),
          csvField(item.id),
          csvField(item.kind),
          csvField(item.prompt),
          csvField(answer),
        ].join(","),
      );
    }
  }
  return `${lines.join("\n")}\n`;
}
