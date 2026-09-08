import { formatWalk, walkOf } from "./count";

export const BRAIN_ITEM_COUNT = 25;
export const BRAIN_SCALE = 4;

export type BrainDomainId = "sight" | "keeping" | "entrance" | "court" | "weather";
export type BrainAspectId =
  | "wonder"
  | "inquiry"
  | "crossing"
  | "file"
  | "warmth"
  | "role"
  | "neighbor"
  | "rule"
  | "contrary"
  | "storm";
export type BrainVerdict = "letter" | "circuit" | "number";
export type BrainChoice = 0 | 1 | 2 | 3 | 4;

export type BrainItem = {
  id: string;
  domain: BrainDomainId;
  aspect: BrainAspectId;
  prompt: string;
  letter: string;
  number: string;
  reverse: boolean;
};

export type BrainDomainScore = {
  id: BrainDomainId;
  name: string;
  job: string;
  lean: number;
  louder: BrainAspectId;
  louderName: string;
  gold: string;
  shadow: string;
};

export type BrainReading = {
  answers: BrainChoice[];
  name: string;
  guest: boolean;
  lean: number;
  walk: string;
  verdict: BrainVerdict;
  verdictName: string;
  title: string;
  headline: string;
  invitation: string;
  domains: BrainDomainScore[];
  token: string;
};

export const DOMAIN_META: Record<
  BrainDomainId,
  { name: string; job: string; aspects: [BrainAspectId, BrainAspectId]; aspectNames: [string, string] }
> = {
  sight: {
    name: "Sight",
    job: "How you take a life in.",
    aspects: ["wonder", "inquiry"],
    aspectNames: ["Wonder", "Inquiry"],
  },
  keeping: {
    name: "Keeping",
    job: "How you handle work and promises.",
    aspects: ["crossing", "file"],
    aspectNames: ["Crossing", "The File"],
  },
  entrance: {
    name: "Entrance",
    job: "How you show up in a room.",
    aspects: ["warmth", "role"],
    aspectNames: ["Warmth", "The Role"],
  },
  court: {
    name: "Court",
    job: "How you meet other people.",
    aspects: ["neighbor", "rule"],
    aspectNames: ["Neighbor", "The Rule"],
  },
  weather: {
    name: "Weather",
    job: "How you treat a hard day.",
    aspects: ["contrary", "storm"],
    aspectNames: ["The Contrary", "The Storm"],
  },
};

export const ASPECT_NAME: Record<BrainAspectId, string> = {
  wonder: "Wonder",
  inquiry: "Inquiry",
  crossing: "Crossing",
  file: "The File",
  warmth: "Warmth",
  role: "The Role",
  neighbor: "Neighbor",
  rule: "The Rule",
  contrary: "The Contrary",
  storm: "The Storm",
};

export const ITEMS: BrainItem[] = [
  {
    id: "s1",
    domain: "sight",
    aspect: "wonder",
    prompt:
      "You meet someone new at a table. Before you know their job or their age, what do you actually pay attention to?",
    letter: "The way they enter, the name they give you, and whatever is strange or alive in their face.",
    number: "The facts you can file: age, title, where they sit in a ranking you already understand.",
    reverse: false,
  },
  {
    id: "s2",
    domain: "sight",
    aspect: "wonder",
    prompt: "A painting, a street, or a person stops you. What do you do first?",
    letter: "I stay with it long enough to see what it is, even if I cannot name it yet.",
    number: "I look for the type, the period, the score, or the comparison that would let me put it away.",
    reverse: false,
  },
  {
    id: "s3",
    domain: "sight",
    aspect: "wonder",
    prompt: "Someone you love asks you to describe them to a stranger. You start with:",
    letter: "The name they actually use, and how they come into a room.",
    number: "A handful of facts that would help a clerk find them in a list.",
    reverse: true,
  },
  {
    id: "s4",
    domain: "sight",
    aspect: "inquiry",
    prompt: "You are trying to understand a problem that still has a person in it. Your first move is:",
    letter: "I keep the person in view while I take the problem apart, and I put the pieces back when I am done.",
    number: "I reduce it to variables I can add, rank, or optimize, and I treat that total as the answer.",
    reverse: false,
  },
  {
    id: "s5",
    domain: "sight",
    aspect: "inquiry",
    prompt: "You finish a sharp analysis of someone’s life. What do you do with it?",
    letter: "I look back at the actual person and ask whether the analysis still fits the face.",
    number: "I keep the model. If the person disagrees with it, the person is probably wrong.",
    reverse: false,
  },
  {
    id: "k1",
    domain: "keeping",
    aspect: "crossing",
    prompt: "You have started something that would change your life if you finished it. What usually happens?",
    letter: "I keep the promise I made to the path, even when the first excitement is gone.",
    number: "I restart, re-rank, or fold the work into a neater plan that never has to leave the page.",
    reverse: false,
  },
  {
    id: "k2",
    domain: "keeping",
    aspect: "crossing",
    prompt: "A project is almost done, but it is messy. You:",
    letter: "Finish the crossing that is actually in front of me, mess and all.",
    number: "Stop to reorganize, relabel, and get the system perfect before I will call it done.",
    reverse: true,
  },
  {
    id: "k3",
    domain: "keeping",
    aspect: "crossing",
    prompt: "You tell a friend you are leaving a life that is too small. A month later:",
    letter: "I have taken at least one irreversible step that matches what I said.",
    number: "I have a better spreadsheet of options, and I am still in the same room.",
    reverse: false,
  },
  {
    id: "k4",
    domain: "keeping",
    aspect: "file",
    prompt: "Your desk, your calendar, or your notes are a mess. What bothers you more?",
    letter: "That I have not done the one living piece of work that actually needed me.",
    number: "That nothing is in its right folder, labeled, and easy to add up.",
    reverse: false,
  },
  {
    id: "k5",
    domain: "keeping",
    aspect: "file",
    prompt: "You are asked to explain a year of your work in one minute. You reach for:",
    letter: "The story of what you kept, what you finished, and what you refused to abandon.",
    number: "A total, a rank, a metric, or a tidy list that could sit in someone else’s file.",
    reverse: false,
  },
  {
    id: "e1",
    domain: "entrance",
    aspect: "warmth",
    prompt: "You walk into a room of people you only half know. What do you bring in with you?",
    letter: "The name I actually use, and enough warmth that someone could meet me as a person.",
    number: "A title, a credential, or a performance of being impressive before anyone has met me.",
    reverse: false,
  },
  {
    id: "e2",
    domain: "entrance",
    aspect: "warmth",
    prompt: "After an evening with new people, what do you hope they remember?",
    letter: "How it felt to be in the room with me.",
    number: "Where I stood in the ranking of the night: funniest, smartest, most successful.",
    reverse: true,
  },
  {
    id: "e3",
    domain: "entrance",
    aspect: "warmth",
    prompt: "You introduce yourself. The sentence you trust is:",
    letter: "The username or nickname I actually live in, said plainly.",
    number: "The version of my name that looks best on a form, followed by what I am worth on paper.",
    reverse: false,
  },
  {
    id: "e4",
    domain: "entrance",
    aspect: "role",
    prompt: "A group needs someone to go first. You:",
    letter: "Step in as a person who can start the work, without needing the room to crown me.",
    number: "Take the seat that proves I am first, highest, or in charge, and treat that rank as the point.",
    reverse: false,
  },
  {
    id: "e5",
    domain: "entrance",
    aspect: "role",
    prompt: "You have to put a public face on your work. What matters more?",
    letter: "That the face matches the work I will actually stand behind.",
    number: "That the face wins: the title, the follower count, the number that makes me look ahead.",
    reverse: false,
  },
  {
    id: "c1",
    domain: "court",
    aspect: "neighbor",
    prompt: "Someone you care about is in trouble. You first see:",
    letter: "A whole life that needs company, help, and time.",
    number: "A case: what category they fall into, what they score, what the efficient move is.",
    reverse: false,
  },
  {
    id: "c2",
    domain: "court",
    aspect: "neighbor",
    prompt: "A friend is good at something you are not. You treat that as:",
    letter: "Help already in the room, which I can ask for without becoming smaller.",
    number: "A ranking. One of us is ahead, and that fact sits between us.",
    reverse: false,
  },
  {
    id: "c3",
    domain: "court",
    aspect: "neighbor",
    prompt: "You disagree with someone you love. The useful move is:",
    letter: "Stay with them long enough to see the blind spot, including mine.",
    number: "Win the argument, assign the fault, and put them in the right bin.",
    reverse: true,
  },
  {
    id: "c4",
    domain: "court",
    aspect: "rule",
    prompt: "A room has an unspoken ranking. You:",
    letter: "Notice it, then keep treating people as people anyway.",
    number: "Use it. Knowing who is above whom is how you stay safe and polite.",
    reverse: false,
  },
  {
    id: "c5",
    domain: "court",
    aspect: "rule",
    prompt: "You are asked to keep the peace at a table. You keep it by:",
    letter: "Making sure no one is reduced to a type while we talk.",
    number: "Enforcing the categories, the manners, and the order that make the table easy to run.",
    reverse: false,
  },
  {
    id: "w1",
    domain: "weather",
    aspect: "contrary",
    prompt: "The day is against you. Work that usually works will not move. You:",
    letter: "Treat it as weather. I do the small necessary thing and wait for a better current.",
    number: "Treat it as a score. A low day means I am losing, unlucky, or finished.",
    reverse: false,
  },
  {
    id: "w2",
    domain: "weather",
    aspect: "contrary",
    prompt: "You have to postpone something you wanted. The story you tell yourself is:",
    letter: "The house is withdrawn today. I can keep the act written and try it when the day will have it.",
    number: "I missed my number. If I were the kind of person who wins, this would not have happened.",
    reverse: false,
  },
  {
    id: "w3",
    domain: "weather",
    aspect: "storm",
    prompt: "A plan collapses in public. What happens in you first?",
    letter: "I feel the weather, then I look for one honest next step that is still mine.",
    number: "I spike. The collapse becomes a verdict on my worth, and I either crown myself with a new total or excuse myself with a low one.",
    reverse: false,
  },
  {
    id: "w4",
    domain: "weather",
    aspect: "storm",
    prompt: "Someone gives you a ranking of your day, your work, or your luck. You:",
    letter: "Take it as a weather report I can use or ignore. I still walk out the door.",
    number: "Swallow it as fate. If the number is high I am safe; if it is low I am condemned.",
    reverse: true,
  },
  {
    id: "w5",
    domain: "weather",
    aspect: "storm",
    prompt: "You share a result about yourself online. You hope people see:",
    letter: "A portrait they can meet, with a number sitting quietly beside it.",
    number: "The score. If the score is not the point, there is no point in posting.",
    reverse: false,
  },
];

const ORDER_SEED = 33;

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function orderedItems(): BrainItem[] {
  const items = [...ITEMS];
  const rand = lcg(ORDER_SEED);
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = items[i];
    items[i] = items[j]!;
    items[j] = swap!;
  }
  return items;
}

export function polesOf(item: BrainItem): { left: string; right: string; leftIsLetter: boolean } {
  if (item.reverse) {
    return { left: item.number, right: item.letter, leftIsLetter: false };
  }
  return { left: item.letter, right: item.number, leftIsLetter: true };
}

export function itemLean(item: BrainItem, choice: BrainChoice): number {
  const fromLeft = (choice / BRAIN_SCALE) * 100;
  return item.reverse ? fromLeft : 100 - fromLeft;
}

function mean(values: number[]): number {
  if (values.length === 0) return 50;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function verdictOf(lean: number): BrainVerdict {
  if (lean >= 62) return "letter";
  if (lean <= 38) return "number";
  return "circuit";
}

export const VERDICT_NAME: Record<BrainVerdict, string> = {
  letter: "Letter-brained",
  circuit: "Circuit-kept",
  number: "Number-brained",
};

function roundLean(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function spellLean(lean: number): string {
  if (lean <= 0) return "the Fool";
  return formatWalk(walkOf(BigInt(lean))) || "the Fool";
}

function louderAspect(domain: BrainDomainId, byAspect: Partial<Record<BrainAspectId, number[]>>): BrainAspectId {
  const [first, second] = DOMAIN_META[domain].aspects;
  const a = mean(byAspect[first] ?? [50]);
  const b = mean(byAspect[second] ?? [50]);
  return a >= b ? first : second;
}

const GOLD: Record<BrainDomainId, Record<"letter" | "circuit" | "number", string>> = {
  sight: {
    letter:
      "You tend to stay with a person, a street, or a problem until you have actually seen it. Inquiry is welcome here as long as it reports back to the face in front of you.",
    circuit:
      "You can take a life apart to understand it, and you still remember to look back at the person when the analysis is done. Wonder and inquiry are both on duty.",
    number:
      "You reach for a type, a score, or a map quickly, which makes you fast. The cost is that a living face can get filed before it has finished arriving.",
  },
  keeping: {
    letter:
      "You finish crossings. A messy promise that actually leaves the room matters more to you than a perfect plan that never does.",
    circuit:
      "You can tidy a file and still keep a path. Order helps you; it does not get to replace the work of finishing.",
    number:
      "You are gifted at making things neat, ranked, and easy to hold in one hand. Watch the moment when the file becomes a reason not to cross.",
  },
  entrance: {
    letter:
      "You arrive as a person. The name you walk around in, and the warmth you bring, are how you enter, not a costume you put on after the ranking is done.",
    circuit:
      "You can take a public role without disappearing into it. Warmth and a clear seat can live in the same entrance.",
    number:
      "You know how to take a seat and look like first. The work now is to let the room meet you, not only the rank you arrived with.",
  },
  court: {
    letter:
      "You meet people as neighbors, including the ones who keep you honest. Help already in the room is something you can ask for.",
    circuit:
      "You can keep the peace without turning anyone into a bin. Manners serve the table; they do not own the people at it.",
    number:
      "You read a room’s ranking quickly, which can be kind in a pinch. The risk is that a type, a score, or a rule starts standing in for the person.",
  },
  weather: {
    letter:
      "A low day is weather. You do the small necessary thing, keep the act written, and do not let a number tell you who you are.",
    circuit:
      "You feel a storm without appointing it as fate. The day can be against you and still not get the last word.",
    number:
      "You take scores to heart, including the unofficial ones. A high day crowns you and a low day condemns you, which is a heavy way to live.",
  },
};

const SHADOW: Record<BrainDomainId, Record<"letter" | "circuit" | "number", string>> = {
  sight: {
    letter: "If you never count, you can stay enchanted and never understand the work. Let inquiry help, then come back.",
    circuit: "The only failure here is forgetting the last step. See, count, and look back.",
    number: "A sharp map that never returns to the face is how a person gets replaced by a total.",
  },
  keeping: {
    letter: "Finishing is not the same as refusing to plan. A path still needs a next step you can name.",
    circuit: "Keep the file in service of the crossing, not the other way around.",
    number: "A life can be perfectly labeled and still unlived. Complete one crossing.",
  },
  entrance: {
    letter: "Warmth without a seat can vanish. Say what you are here to do.",
    circuit: "Do not let the role eat the person who walked in wearing it.",
    number: "A first-place entrance that nobody could actually meet is a performance, not a greeting.",
  },
  court: {
    letter: "Compassion that never names a boundary becomes fusion. Neighbors still get to have their own breath.",
    circuit: "Use the rule to protect the table, not to file the guests.",
    number: "If everyone is a category, there is no one left to ask.",
  },
  weather: {
    letter: "Waiting can become hiding. Do the day’s small work even when the house is withdrawn.",
    circuit: "Feel the weather. Do not build a religion out of it.",
    number: "A score is a weather report. It cannot tell you whether you are allowed to walk out the door.",
  },
};

const INVITE: Record<BrainDomainId, string> = {
  sight: "Before noon, look at one person or one problem without ranking it. When you have seen it, you may count, and then you have to look back.",
  keeping: "Finish one small crossing you already started. Do not start a neater version of it instead.",
  entrance: "Walk into one room as the name you actually use, and let that be enough for the first minute.",
  court: "Ask one person for help they already have, without turning it into a ranking of who is ahead.",
  weather: "If today is against you, do one small necessary thing and do not let a number tell you what that means about your life.",
};

export function domainBand(lean: number): "letter" | "circuit" | "number" {
  return verdictOf(lean);
}

function typeTitle(verdict: BrainVerdict, domains: BrainDomainScore[]): string {
  const ranked = [...domains].sort((a, b) => b.lean - a.lean);
  const first = ranked[0];
  const second = ranked[1];
  if (!first || !second) return VERDICT_NAME[verdict];
  if (verdict === "number") {
    return `${VERDICT_NAME[verdict]} · ${ASPECT_NAME[first.louder]} and ${ASPECT_NAME[second.louder]}`;
  }
  if (verdict === "letter") {
    return `${VERDICT_NAME[verdict]} · ${first.name} and ${second.name}`;
  }
  return `${VERDICT_NAME[verdict]} · ${first.name} and ${second.name}`;
}

function headlineOf(verdict: BrainVerdict, name: string): string {
  const who = name;
  if (verdict === "letter") {
    return `${who} looks first at the whole living thing in front of them, and only then at the pieces. That is Letter-brained looking.`;
  }
  if (verdict === "number") {
    return `${who} is skilled with pieces, files, and totals. Number-brained looking is useful until it forgets to come back to the person.`;
  }
  return `${who} already goes out into the count and comes home to the person. That is the circuit kept, which is the practice, not a tie.`;
}

const CHOICE_MARK = "abcde";

export function encodeAnswers(answers: BrainChoice[]): string {
  return answers.map((value) => CHOICE_MARK[value] ?? "c").join("");
}

export function decodeAnswers(raw: string | undefined): BrainChoice[] | null {
  if (!raw || raw.length !== BRAIN_ITEM_COUNT) return null;
  const answers: BrainChoice[] = [];
  for (const ch of raw.toLowerCase()) {
    const n = CHOICE_MARK.indexOf(ch);
    if (n < 0) return null;
    answers.push(n as BrainChoice);
  }
  return answers;
}

export const GUEST_NAME = "A guest of CC33";

export function readBrain(answers: BrainChoice[], nameRaw?: string): BrainReading | null {
  if (answers.length !== BRAIN_ITEM_COUNT) return null;
  const items = orderedItems();
  if (items.length !== BRAIN_ITEM_COUNT) return null;
  const byDomain: Record<BrainDomainId, number[]> = {
    sight: [],
    keeping: [],
    entrance: [],
    court: [],
    weather: [],
  };
  const byAspect: Partial<Record<BrainAspectId, number[]>> = {};
  items.forEach((item, index) => {
    const lean = itemLean(item, answers[index] ?? 2);
    byDomain[item.domain].push(lean);
    const bucket = byAspect[item.aspect] ?? [];
    bucket.push(lean);
    byAspect[item.aspect] = bucket;
  });
  const domains: BrainDomainScore[] = (Object.keys(DOMAIN_META) as BrainDomainId[]).map((id) => {
    const lean = roundLean(mean(byDomain[id]));
    const band = domainBand(lean);
    const louder = louderAspect(id, byAspect);
    return {
      id,
      name: DOMAIN_META[id].name,
      job: DOMAIN_META[id].job,
      lean,
      louder,
      louderName: ASPECT_NAME[louder],
      gold: GOLD[id][band],
      shadow: SHADOW[id][band],
    };
  });
  const lean = roundLean(mean(domains.map((row) => row.lean)));
  const verdict = verdictOf(lean);
  const trimmed = nameRaw?.trim() ?? "";
  const guest = trimmed.length === 0;
  const name = guest ? GUEST_NAME : trimmed.replace(/^@+/, "");
  const weakest = [...domains].sort((a, b) => a.lean - b.lean)[0] ?? domains[0]!;
  return {
    answers,
    name,
    guest,
    lean,
    walk: spellLean(lean),
    verdict,
    verdictName: VERDICT_NAME[verdict],
    title: typeTitle(verdict, domains),
    headline: headlineOf(verdict, name),
    invitation: INVITE[weakest.id],
    domains,
    token: encodeAnswers(answers),
  };
}

export function brainPath(token: string, name?: string): string {
  const query = new URLSearchParams();
  query.set("a", token);
  if (name?.trim()) query.set("n", name.trim());
  return `/brain?${query.toString()}`;
}

export function brainCardFile(token: string): string {
  return `brain-${token}.jpg`;
}

export function tweetBrain(reading: BrainReading): string {
  return `${reading.name} is ${reading.title}\nLetter-lean ${reading.walk} · ${reading.verdictName}`;
}

export const SCALE_LABELS = [
  "Much more this",
  "Closer to this",
  "Both",
  "Closer to that",
  "Much more that",
] as const;
