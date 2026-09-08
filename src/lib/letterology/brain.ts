export const BRAIN_ITEM_COUNT = 50;
export const BRAIN_SCALE = 4;
export const TRAIT_PER_ASPECT = 4;
export const LOOKING_PER_DOMAIN = 2;

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
export type BrainItemKind = "trait" | "looking";
export type BrainMark = "strong" | "clear" | "mixed" | "light" | "quiet";
export type BrainCombo = "HH" | "HL" | "LH" | "LL";

export const BRAIN_GRADES = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
] as const;
export type BrainGrade = (typeof BRAIN_GRADES)[number];

export type BrainItem = {
  id: string;
  domain: BrainDomainId;
  aspect: BrainAspectId;
  kind: BrainItemKind;
  prompt: string;
  plus: string;
  minus: string;
};

export type PresentedItem = {
  item: BrainItem;
  flip: boolean;
};

export type BrainAspectScore = {
  id: BrainAspectId;
  name: string;
  job: string;
  lean: number;
  mark: BrainMark;
  markName: string;
};

export type BrainDomainScore = {
  id: BrainDomainId;
  name: string;
  job: string;
  lean: number;
  mark: BrainMark;
  markName: string;
  louder: BrainAspectId;
  louderName: string;
  combo: BrainCombo;
  aspects: [BrainAspectScore, BrainAspectScore];
  gold: string;
  shadow: string;
};

export type BrainReading = {
  answers: BrainChoice[];
  name: string;
  guest: boolean;
  lean: number;
  grade: BrainGrade;
  gradeCaption: string;
  verdict: BrainVerdict;
  verdictName: string;
  title: string;
  headline: string;
  pattern: string;
  invitation: string;
  domains: BrainDomainScore[];
  aspects: BrainAspectScore[];
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

export const ASPECT_JOB: Record<BrainAspectId, string> = {
  wonder: "How long you stay with what is particular.",
  inquiry: "How much you want the joints of a thing.",
  crossing: "Whether you finish after the shine is gone.",
  file: "How much order you need in order to work.",
  warmth: "How much heat you bring into a room.",
  role: "Whether you take the floor when a group stalls.",
  neighbor: "How much other people's weather arrives in you.",
  rule: "How carefully you keep a table easy to run.",
  contrary: "Whether a hard day makes you go small.",
  storm: "How loudly a setback runs through you.",
};

export const MARK_NAME: Record<BrainMark, string> = {
  strong: "Strong",
  clear: "Clear",
  mixed: "Mixed",
  light: "Light",
  quiet: "Quiet",
};

function I(
  id: string,
  domain: BrainDomainId,
  aspect: BrainAspectId,
  kind: BrainItemKind,
  prompt: string,
  plus: string,
  minus: string,
): BrainItem {
  return { id, domain, aspect, kind, prompt, plus, minus };
}

export const ITEMS: BrainItem[] = [
  I(
    "w1",
    "sight",
    "wonder",
    "trait",
    "A weekend opens with no plan.",
    "I follow whatever looks alive: a street, a shop, a face I have not seen.",
    "I pick a useful aim first. Loose hours feel wasted if they do not add up to something.",
  ),
  I(
    "w2",
    "sight",
    "wonder",
    "trait",
    "You walk into a room you have never been in.",
    "I take in the light, the objects, and the mood before I decide what the room is for.",
    "I look for the function: where to sit, who is in charge, what we are here to do.",
  ),
  I(
    "w3",
    "sight",
    "wonder",
    "trait",
    "A song, a painting, or a landscape catches you.",
    "I stay with it and let it work on me, even if I cannot say why yet.",
    "I place it: the style, the kind, the comparison that tells me what I am looking at.",
  ),
  I(
    "w4",
    "sight",
    "wonder",
    "trait",
    "Someone tells a story with odd details that do not seem to matter.",
    "I want the odd details. They are often the true part.",
    "I want the point. Details help when they support the summary.",
  ),
  I(
    "q1",
    "sight",
    "inquiry",
    "trait",
    "A problem is sitting in front of you.",
    "I take it apart. I want to see how the pieces depend on each other.",
    "I look for a working answer I can use now, and I leave the inner wiring alone unless I have to.",
  ),
  I(
    "q2",
    "sight",
    "inquiry",
    "trait",
    "You have an afternoon with a new idea.",
    "I enjoy taking it apart until I understand the joints.",
    "I would rather see the idea used than spend the afternoon on its joints.",
  ),
  I(
    "q3",
    "sight",
    "inquiry",
    "trait",
    "Friends disagree about why something happened.",
    "I test the stories. I want the one that survives a hard question.",
    "I am satisfied once I have a version I can live with, even if it is not fully tested.",
  ),
  I(
    "q4",
    "sight",
    "inquiry",
    "trait",
    "You have to learn a new tool or subject.",
    "I want the structure: the rules, the map, how it hangs together.",
    "I want a single path through it that lets me do the next job.",
  ),
  I(
    "x1",
    "keeping",
    "crossing",
    "trait",
    "You have started something that will only matter if you finish it.",
    "I keep going after the first excitement is gone.",
    "I often pause, switch, or wait for a fresher start.",
  ),
  I(
    "x2",
    "keeping",
    "crossing",
    "trait",
    "The middle of a project is dull.",
    "I treat the dull stretch as part of the work and I cross it.",
    "I look for a more interesting angle, even if that means opening a new version.",
  ),
  I(
    "x3",
    "keeping",
    "crossing",
    "trait",
    "A promise you made to yourself is now inconvenient.",
    "I still do the next piece of it.",
    "I renegotiate with myself and put it back on the list for a better week.",
  ),
  I(
    "x4",
    "keeping",
    "crossing",
    "trait",
    "You are close to done and tired.",
    "I finish, then I rest.",
    "I rest, then I see whether I still want the last stretch.",
  ),
  I(
    "f1",
    "keeping",
    "file",
    "trait",
    "Your desk, bag, or notes.",
    "I like them sorted so I can find a thing without hunting.",
    "I can work in a pile. Sorting can wait until the living work is done.",
  ),
  I(
    "f2",
    "keeping",
    "file",
    "trait",
    "You look at the week ahead.",
    "I want a clear sequence, so nothing important falls through.",
    "I keep a rough direction and decide in the day what comes next.",
  ),
  I(
    "f3",
    "keeping",
    "file",
    "trait",
    "You hand work to someone else.",
    "I want it labeled, complete, and easy to follow.",
    "I would rather they have the living sense of the job than a perfect packet.",
  ),
  I(
    "f4",
    "keeping",
    "file",
    "trait",
    "Clutter gathers at home or on a screen.",
    "Untidiness pulls at me until I put things back in place.",
    "Untidiness is background. I notice it when it blocks a task.",
  ),
  I(
    "h1",
    "entrance",
    "warmth",
    "trait",
    "You walk into a gathering of people you only half know.",
    "I light up. I make contact easily, and the room feels warmer for it.",
    "I come in quietly and let the temperature of the room find me first.",
  ),
  I(
    "h2",
    "entrance",
    "warmth",
    "trait",
    "Good news arrives.",
    "I want to share it out loud, with people, while it is still hot.",
    "I turn it over privately before I tell anyone.",
  ),
  I(
    "h3",
    "entrance",
    "warmth",
    "trait",
    "A conversation is underway at a table.",
    "I laugh, lean in, and keep the thread alive.",
    "I listen more than I spark. I speak when I have something I actually want to say.",
  ),
  I(
    "h4",
    "entrance",
    "warmth",
    "trait",
    "The room is flat and nobody is taking it up.",
    "I try to raise the energy. A flat room feels like a job I can do.",
    "I am fine if the room stays low. I do not feel responsible for the weather of it.",
  ),
  I(
    "r1",
    "entrance",
    "role",
    "trait",
    "A group is stalling.",
    "I step in and give us a next move.",
    "I wait. Someone else can take the seat unless I am clearly needed.",
  ),
  I(
    "r2",
    "entrance",
    "role",
    "trait",
    "You disagree in a meeting.",
    "I say so, in the room, before the decision hardens.",
    "I take it up later, or I let it pass if it is not mine to fight.",
  ),
  I(
    "r3",
    "entrance",
    "role",
    "trait",
    "A piece of work needs a public face.",
    "I am comfortable being the person people look at.",
    "I would rather the work speak. Being the face of it is a cost I do not seek.",
  ),
  I(
    "r4",
    "entrance",
    "role",
    "trait",
    "Someone talks over a plan you care about.",
    "I take the thread back.",
    "I wait for an opening. Pushing for the floor feels worse than waiting.",
  ),
  I(
    "n1",
    "court",
    "neighbor",
    "trait",
    "Someone you care about is having a hard week.",
    "I feel it with them. I want to sit near it, not only solve it.",
    "I look for a useful move: what would actually help, then I do that.",
  ),
  I(
    "n2",
    "court",
    "neighbor",
    "trait",
    "A stranger is upset in public.",
    "I am pulled toward them. Their feeling arrives in my body.",
    "I keep a respectful distance unless I can see a concrete way to help.",
  ),
  I(
    "n3",
    "court",
    "neighbor",
    "trait",
    "You are working with a friend.",
    "I want to know how they are, not only what they can do.",
    "I stay on the task we share. Inner weather is theirs unless they bring it.",
  ),
  I(
    "n4",
    "court",
    "neighbor",
    "trait",
    "You hear that someone was treated badly.",
    "It stays with me. I want them okay.",
    "I am sorry, and I move on unless there is a part that is mine to repair.",
  ),
  I(
    "u1",
    "court",
    "rule",
    "trait",
    "A table has unspoken manners.",
    "I keep them. Smooth turns matter more than saying the raw thing in the moment.",
    "I would rather name the real thing, even if the table gets a little rough.",
  ),
  I(
    "u2",
    "court",
    "rule",
    "trait",
    "Someone is late, messy, or out of line in a small way.",
    "I still treat them carefully. Correcting them in front of people feels worse than the fault.",
    "I would rather the standard be clear. A small correction now saves a larger one later.",
  ),
  I(
    "u3",
    "court",
    "rule",
    "trait",
    "You need something from a person with more rank.",
    "I go the long way: courtesy, timing, the proper door.",
    "I ask directly. Rank should not make a simple ask theatrical.",
  ),
  I(
    "u4",
    "court",
    "rule",
    "trait",
    "A true remark might make the room tense.",
    "I hold it. Keeping the room easy is part of my job.",
    "I risk it if it is true. Ease that kills the true thing is too expensive.",
  ),
  I(
    "y1",
    "weather",
    "contrary",
    "trait",
    "The day turns against you.",
    "I go quiet and small. I want less contact until the feeling drops.",
    "I keep my ordinary size. I can still answer a message or finish a small task.",
  ),
  I(
    "y2",
    "weather",
    "contrary",
    "trait",
    "You made a mistake in front of people.",
    "I replay it and want to disappear.",
    "I wince, then I stay in the room.",
  ),
  I(
    "y3",
    "weather",
    "contrary",
    "trait",
    "An invitation arrives on a low day.",
    "I decline. Being seen would cost more than it would give.",
    "I still go, or I leave the decision until I am at the door.",
  ),
  I(
    "y4",
    "weather",
    "contrary",
    "trait",
    "Work that usually works will not move.",
    "I take it as a sign I should stop and hide out.",
    "I change the task or the hour and I stay in motion.",
  ),
  I(
    "v1",
    "weather",
    "storm",
    "trait",
    "A plan collapses.",
    "I spike. Heat, voice, a rush to fix it or to get out.",
    "I go still enough to see the next piece. The feeling is there; it does not run the room.",
  ),
  I(
    "v2",
    "weather",
    "storm",
    "trait",
    "Someone is careless with your work.",
    "I feel it immediately, and they can tell.",
    "I can hold the reaction until I choose what to say.",
  ),
  I(
    "v3",
    "weather",
    "storm",
    "trait",
    "Good news and bad news arrive in the same afternoon.",
    "I swing with both. Other people can read the weather on my face.",
    "I stay closer to the middle. The day can change without taking me with it.",
  ),
  I(
    "v4",
    "weather",
    "storm",
    "trait",
    "You are stuck in a delay, a slow line, a small insult.",
    "It gets loud in me. Small grit becomes a mood.",
    "It stays small. I do not have to make a story out of it.",
  ),
  I(
    "sl1",
    "sight",
    "wonder",
    "looking",
    "You meet someone new at a table, before you know their job or their age.",
    "How they arrive, the name they give, and what is still particular about them.",
    "The details that place them: what they do, how they fit, what I can confirm.",
  ),
  I(
    "sl2",
    "sight",
    "inquiry",
    "looking",
    "You finish a careful analysis of someone's situation.",
    "I look back at the person and ask whether the analysis still fits what I can see.",
    "I keep the working model. I update it when new facts arrive, and I trust it until they do.",
  ),
  I(
    "kl1",
    "keeping",
    "crossing",
    "looking",
    "You are asked to explain a year of your work in one minute.",
    "The story of what I kept, what I finished, and what I would not abandon.",
    "A brief list of results, roles, and outcomes that would sit cleanly in someone else's summary.",
  ),
  I(
    "kl2",
    "keeping",
    "file",
    "looking",
    "A project is almost done, but it is messy.",
    "Finish what is actually in front of me, mess and all.",
    "Pause to reorganize and label, so the last stretch is clean to hand over.",
  ),
  I(
    "el1",
    "entrance",
    "warmth",
    "looking",
    "You introduce yourself.",
    "The username or nickname I actually live in, said plainly.",
    "The name that reads cleanly on a form, followed by the work that explains why I am here.",
  ),
  I(
    "el2",
    "entrance",
    "role",
    "looking",
    "A group needs someone to go first.",
    "I step in as a person who can start the work.",
    "I take the lead so the group has a clear person in charge, and I treat that seat as part of getting the work done.",
  ),
  I(
    "cl1",
    "court",
    "neighbor",
    "looking",
    "Someone you care about is in trouble.",
    "A whole life that needs company, help, and time.",
    "A situation I can diagnose: what kind of trouble it is, what usually works, and the next useful step.",
  ),
  I(
    "cl2",
    "court",
    "rule",
    "looking",
    "A room has an unspoken order.",
    "I notice it, then I keep treating people as people.",
    "I read it carefully. Knowing how the room is arranged helps me move without stepping on anyone.",
  ),
  I(
    "wl1",
    "weather",
    "contrary",
    "looking",
    "The day is against you. Work that usually works will not move.",
    "Treat it as weather. I do the small necessary thing and wait for a better current.",
    "Treat it as information. I change the plan, measure what failed, and correct course.",
  ),
  I(
    "wl2",
    "weather",
    "storm",
    "looking",
    "Someone gives you a mark for your day, your work, or your luck.",
    "Take it as a weather report I can use or ignore. I still walk out the door.",
    "Take it as useful feedback. A high mark means the method is working; a low mark means I should adjust.",
  ),
];

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffled<T>(list: T[], rand: () => number): T[] {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = items[i];
    items[i] = items[j]!;
    items[j] = swap!;
  }
  return items;
}

/** Session deck: item order shuffled, exactly half the plus poles on the right. */
export function presentDeck(seed: number): PresentedItem[] {
  const rand = lcg(seed);
  const items = shuffled(ITEMS, rand);
  const flips = shuffled(
    items.map((_, index) => index < Math.floor(items.length / 2)),
    rand,
  );
  return items.map((item, index) => ({ item, flip: Boolean(flips[index]) }));
}

export function displayPoles(item: BrainItem, flip: boolean): { left: string; right: string } {
  if (flip) return { left: item.minus, right: item.plus };
  return { left: item.plus, right: item.minus };
}

/** Canonical 0 is the plus pole (high trait, or Letter-looking). */
export function toCanonical(displayed: BrainChoice, flip: boolean): BrainChoice {
  return (flip ? 4 - displayed : displayed) as BrainChoice;
}

export function answersFromDeck(deck: PresentedItem[], displayed: BrainChoice[]): BrainChoice[] {
  const byId = new Map<string, BrainChoice>();
  deck.forEach((row, index) => {
    const choice = displayed[index];
    if (choice == null) return;
    byId.set(row.item.id, toCanonical(choice, row.flip));
  });
  return ITEMS.map((item) => byId.get(item.id) ?? 2);
}

export function plusLean(choice: BrainChoice): number {
  return 100 - (choice / BRAIN_SCALE) * 100;
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

export function markOf(lean: number): BrainMark {
  const n = roundLean(lean);
  if (n >= 75) return "strong";
  if (n >= 60) return "clear";
  if (n >= 40) return "mixed";
  if (n >= 25) return "light";
  return "quiet";
}

export function gradeOf(lean: number): BrainGrade {
  const n = roundLean(lean);
  if (n >= 96) return "A+";
  if (n >= 88) return "A";
  if (n >= 80) return "A-";
  if (n >= 71) return "B+";
  if (n >= 62) return "B";
  if (n >= 56) return "B-";
  if (n >= 50) return "C+";
  if (n >= 44) return "C";
  if (n >= 39) return "C-";
  if (n >= 32) return "D+";
  if (n >= 24) return "D";
  if (n >= 16) return "D-";
  return "F";
}

export function verdictOfGrade(grade: BrainGrade): BrainVerdict {
  if (grade === "A+" || grade === "A" || grade === "A-" || grade === "B+" || grade === "B") {
    return "letter";
  }
  if (grade === "B-" || grade === "C+" || grade === "C" || grade === "C-") return "circuit";
  return "number";
}

export const GRADE_CAPTION: Record<BrainGrade, string> = {
  "A+": "A perfect Letter brain. You start with the living thing in front of you and you stay with it.",
  A: "A Letter brain. The whole person comes first, and the pieces are allowed to help.",
  "A-": "A Letter brain with a sharp eye for detail. You still come back to the face.",
  "B+": "Mostly Letter-brained. You look at people first, and you use the file when it serves them.",
  B: "Letter-brained, with a working file. You can sort pieces without forgetting who they belong to.",
  "B-": "The circuit is close. You still prefer the living thing, but the pieces pull hard.",
  "C+": "Circuit-kept, leaning toward the letter. You go out into the pieces and you mostly come home.",
  C: "Circuit-kept. See the whole, use the pieces, come back. That is the practice.",
  "C-": "Circuit-kept, leaning toward the file. The pieces are loud, and the return is still possible.",
  "D+": "A number brain is beginning to lead. The file arrives faster than the face.",
  D: "Number-brained. You are skilled with pieces, ranks, and totals, and they tend to speak first.",
  "D-": "A number brain at work. The living thing is easy to file before it has finished arriving.",
  F: "Led by numbers. A number brain: the pieces have the last word.",
};

export const GRADE_LEGEND =
  "A+ is a perfect Letter brain. F is a person led by numbers, a number brain. This mark is how you look. The five seats are how you actually work, and they are allowed to disagree with the mark.";

const COMBO: Record<BrainDomainId, Record<BrainCombo, { gold: string; shadow: string }>> = {
  sight: {
    HH: {
      gold: "You stay with a thing long enough to see it, and you also like taking it apart. Wonder starts. Inquiry reports back.",
      shadow: "The only failure here is forgetting the last step. See, take apart, and look back.",
    },
    HL: {
      gold: "You trust the particular. Faces, rooms, and odd details land in you before a theory does.",
      shadow: "If you never take a thing apart, you can stay enchanted and never understand the work. Let inquiry help, then come back.",
    },
    LH: {
      gold: "You reach for structure quickly. A clean question is how you enter; the living surface can wait.",
      shadow: "A sharp map that never returns to the face is how a person gets replaced by a diagram.",
    },
    LL: {
      gold: "You take the useful reading and move on. Seeing is for doing, not for lingering.",
      shadow: "Speed is a gift until you have filed a life before it finished arriving. Stay one extra minute.",
    },
  },
  keeping: {
    HH: {
      gold: "You finish, and you keep a file that can travel. Path and order are both on duty.",
      shadow: "Keep the file in service of the crossing, not the other way around.",
    },
    HL: {
      gold: "You cross. A messy promise that actually leaves the room matters more to you than a perfect plan that never does.",
      shadow: "Finishing is not the same as refusing to plan. A path still needs a next step you can name.",
    },
    LH: {
      gold: "You are gifted at order: labels, sequences, a packet someone else could run.",
      shadow: "A life can be perfectly labeled and still unlived. Complete one crossing.",
    },
    LL: {
      gold: "You keep things loose. You can still move when the plan dies.",
      shadow: "The risk is a life of fresh starts and lost objects. Finish one small thing you already began.",
    },
  },
  entrance: {
    HH: {
      gold: "You arrive warm and you can take the seat. People meet you, and they know who is starting the work.",
      shadow: "Do not let the role eat the person who walked in wearing it.",
    },
    HL: {
      gold: "You bring weather into a room. The name you live in is enough; you do not need the front chair.",
      shadow: "Warmth without a seat can vanish. Say what you are here to do.",
    },
    LH: {
      gold: "You know how to go first. A stalled group can use you.",
      shadow: "The work now is to let them meet you, not only the person in charge.",
    },
    LL: {
      gold: "You enter quietly and you do not grab the floor. When you do speak, it tends to be the thing the room actually needed.",
      shadow: "Quiet is not the same as absent. Once in a while, take the first step so the work can start.",
    },
  },
  court: {
    HH: {
      gold: "You care, and you keep the forms that let a table run. Compassion with manners.",
      shadow: "Use the rule to protect the table, not to file the guests.",
    },
    HL: {
      gold: "You meet people as neighbors. Help already in the room is something you can ask for.",
      shadow: "Compassion that never names a boundary becomes fusion. Neighbors still get to have their own breath.",
    },
    LH: {
      gold: "You keep peace by keeping the rules clear. A table with you at it knows how to proceed.",
      shadow: "The risk is a well-run table with no one left to ask. Look up from the manners.",
    },
    LL: {
      gold: "You do not fuss over feelings or forms. Directness is your kindness.",
      shadow: "Directness can land as cold if you never look up. Ask one person how they actually are.",
    },
  },
  weather: {
    HH: {
      gold: "A hard day pulls you in and also spikes. You feel weather twice.",
      shadow: "Feel it. Then do one small next step that is still yours, so the day does not get the last word.",
    },
    HL: {
      gold: "You go quiet when the house is withdrawn. That can be wisdom, and it can be a closed door.",
      shadow: "Waiting can become hiding. Do the day's small work even when you want to disappear.",
    },
    LH: {
      gold: "You stay out in the day, and the swings are loud. Other people can tell.",
      shadow: "Feel the weather. Do not appoint it as fate, and do not make a small delay into a verdict.",
    },
    LL: {
      gold: "A low day does not get the last word. You stay even, which is a gift.",
      shadow: "Evenness can look like you do not care. Let one true feeling be visible, then keep walking.",
    },
  },
};

const INVITE: Record<BrainDomainId, string> = {
  sight: "Before noon, look at one person or one problem without ranking it. When you have seen it, you may count, and then you have to look back.",
  keeping: "Finish one small crossing you already started. Do not start a neater version of it instead.",
  entrance: "Walk into one room as the name you actually use, and let that be enough for the first minute.",
  court: "Ask one person for help they already have, without turning it into a ranking of who is ahead.",
  weather: "If today is against you, do one small necessary thing and do not let a mark tell you what that means about your life.",
};

function comboOf(a: number, b: number): BrainCombo {
  return `${a >= 50 ? "H" : "L"}${b >= 50 ? "H" : "L"}` as BrainCombo;
}

function aspectScore(id: BrainAspectId, lean: number): BrainAspectScore {
  const mark = markOf(lean);
  return {
    id,
    name: ASPECT_NAME[id],
    job: ASPECT_JOB[id],
    lean: roundLean(lean),
    mark,
    markName: MARK_NAME[mark],
  };
}

function typeTitle(verdict: BrainVerdict, aspects: BrainAspectScore[]): string {
  const ranked = [...aspects].sort((a, b) => b.lean - a.lean);
  const first = ranked[0];
  const second = ranked[1];
  if (!first || !second) return VERDICT_NAME[verdict];
  if (first.lean - second.lean < 8 && Math.abs(first.lean - 50) < 8) return VERDICT_NAME[verdict];
  return `${VERDICT_NAME[verdict]} · ${first.name} and ${second.name}`;
}

function patternOf(aspects: BrainAspectScore[]): string {
  const ranked = [...aspects].sort((a, b) => b.lean - a.lean);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  if (!top || !bottom) return "";
  if (top.lean - bottom.lean < 8) {
    return "The ten aspects sit close together. None of them is shouting.";
  }
  const tiedLow = ranked.filter((row) => row.lean === bottom.lean).length;
  if (tiedLow > 2) {
    return `${top.name} leads. The other seats sit closer to the middle.`;
  }
  return `${top.name} leads. ${bottom.name} is the quiet seat.`;
}

function headlineOf(verdict: BrainVerdict, name: string): string {
  if (verdict === "letter") {
    return `${name} looks first at the whole living thing in front of them, and only then at the pieces. That is Letter-brained looking.`;
  }
  if (verdict === "number") {
    return `${name} is skilled with pieces, files, and totals. Number-brained looking is useful until it forgets to come back to the person.`;
  }
  return `${name} already goes out into the count and comes home to the person. That is the circuit kept, which is the practice, not a tie.`;
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
  if (ITEMS.length !== BRAIN_ITEM_COUNT) return null;
  const byAspect: Partial<Record<BrainAspectId, number[]>> = {};
  const lookingByDomain: Record<BrainDomainId, number[]> = {
    sight: [],
    keeping: [],
    entrance: [],
    court: [],
    weather: [],
  };
  const looking: number[] = [];
  ITEMS.forEach((item, index) => {
    const lean = plusLean(answers[index] ?? 2);
    if (item.kind === "looking") {
      looking.push(lean);
      lookingByDomain[item.domain].push(lean);
      return;
    }
    const bucket = byAspect[item.aspect] ?? [];
    bucket.push(lean);
    byAspect[item.aspect] = bucket;
  });
  const aspects: BrainAspectScore[] = (Object.keys(ASPECT_NAME) as BrainAspectId[]).map((id) =>
    aspectScore(id, mean(byAspect[id] ?? [50])),
  );
  const aspectMap = Object.fromEntries(aspects.map((row) => [row.id, row])) as Record<
    BrainAspectId,
    BrainAspectScore
  >;
  const domains: BrainDomainScore[] = (Object.keys(DOMAIN_META) as BrainDomainId[]).map((id) => {
    const [firstId, secondId] = DOMAIN_META[id].aspects;
    const first = aspectMap[firstId]!;
    const second = aspectMap[secondId]!;
    const trait = roundLean(mean([first.lean, second.lean]));
    const combo = comboOf(first.lean, second.lean);
    const louder = first.lean >= second.lean ? firstId : secondId;
    const mark = markOf(trait);
    const copy = COMBO[id][combo];
    return {
      id,
      name: DOMAIN_META[id].name,
      job: DOMAIN_META[id].job,
      lean: trait,
      mark,
      markName: MARK_NAME[mark],
      louder,
      louderName: ASPECT_NAME[louder],
      combo,
      aspects: [first, second],
      gold: copy.gold,
      shadow: copy.shadow,
    };
  });
  const lean = roundLean(mean(looking));
  const grade = gradeOf(lean);
  const verdict = verdictOf(lean);
  const trimmed = nameRaw?.trim() ?? "";
  const guest = trimmed.length === 0;
  const name = guest ? GUEST_NAME : trimmed.replace(/^@+/, "");
  const weakestLooking = (Object.keys(DOMAIN_META) as BrainDomainId[])
    .map((id) => ({ id, lean: mean(lookingByDomain[id]) }))
    .sort((a, b) => a.lean - b.lean)[0];
  return {
    answers,
    name,
    guest,
    lean,
    grade,
    gradeCaption: GRADE_CAPTION[grade],
    verdict,
    verdictName: VERDICT_NAME[verdict],
    title: typeTitle(verdict, aspects),
    headline: headlineOf(verdict, name),
    pattern: patternOf(aspects),
    invitation: INVITE[weakestLooking?.id ?? "sight"],
    domains,
    aspects,
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
  return `${reading.name} is ${reading.title}\n${reading.grade} · ${reading.verdictName}`;
}

export const SCALE_LABELS = [
  "Much more this",
  "Closer to this",
  "Both",
  "Closer to that",
  "Much more that",
] as const;
