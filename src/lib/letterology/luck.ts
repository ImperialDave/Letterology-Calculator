import { houseOf } from "./archetypes";
import { almanacOf, type AlmanacDay, type CivilDate } from "./calendar";
import { relationTo } from "./circle";
import { buildHoroscope } from "./engine";
import { themeOf } from "./lexicon";
import type { Horoscope, Letter } from "./types";

export type LuckBand = "open" | "warm" | "workable" | "mixed" | "contrary" | "withdraw";
export type DayCharge = "solar" | "lunar";

export interface SeatLuck {
  letter: Letter;
  role: "house" | "manner" | "field";
  meet: "same" | "ally" | "enemy" | "none";
  current: "favorable" | "contrary" | "quiet";
}

export interface Counsel {
  do: string;
  wait: string;
  ask: string;
}

export interface LuckReading {
  iso: string;
  weekdayName: string;
  charge: DayCharge;
  dateLetter: Letter;
  fortnightLetter: Letter;
  weekdayLetter: Letter;
  favorable: Letter[];
  contrary: Letter[];
  score: number;
  band: LuckBand;
  verdict: string;
  weather: string;
  why: string;
  seats: SeatLuck[];
  counsel: Counsel;
  invitation: string;
}

export interface DecisionReading {
  act: string;
  actLetter: Letter;
  actHouse: string;
  fitToYou: "home" | "ally" | "friction" | "foreign";
  timing: "now" | "today-ok" | "wait" | "reframe";
  score: number;
  headline: string;
  body: string;
  next: string;
}

const BANDS: { min: number; band: LuckBand; verdict: string }[] = [
  { min: 80, band: "open", verdict: "Doors ajar" },
  { min: 65, band: "warm", verdict: "Warm current" },
  { min: 50, band: "workable", verdict: "Workable day" },
  { min: 36, band: "mixed", verdict: "Mixed weather" },
  { min: 20, band: "contrary", verdict: "Proceed gently" },
  { min: 0, band: "withdraw", verdict: "Withdraw and wait" },
];

const ACT_COUNSEL: Record<string, { lean: string; wait: string }> = {
  A: { lean: "start, apply, name the want, leave the old room", wait: "locking a long commitment you have not tested" },
  B: { lean: "keep, host, repair a bond, stay with what is already yours", wait: "a clean break or a public revolt" },
  C: { lean: "say the honest no, start the reaction, scrap the dead rule", wait: "forcing peace or signing a cage" },
  D: { lean: "finish, practice, go quiet and do the unfashionable hour", wait: "announcing a half-made thing" },
  E: { lean: "widen the map, meet new people, take the larger room", wait: "hiding in a familiar cellar" },
  F: { lean: "travel light, refuse ownership, try the unowned option", wait: "a heavy vow or a five-year plan" },
  G: { lean: "make, tend, feed a living project", wait: "burning a thing that is still growing" },
  H: { lean: "tell the longer truth, host the hard conversation", wait: "small talk as a substitute for the real word" },
  I: { lean: "study, write the insight, keep inside and outside matched", wait: "performing certainty you do not have" },
  J: { lean: "take the next mile, argue for a just crossing, come home with something", wait: "starting a journey you mean to abandon" },
  K: { lean: "feed your people, open the spare chair, make knowledge useful", wait: "exile as a brand, or a closed-room loyalty" },
  L: { lean: "go first in warmth, choose the person, make the better thing visible", wait: "cold strategy dressed as love" },
  M: { lean: "train, ship the next inch, keep a fight that already has a pulse", wait: "a war with no end condition" },
  N: { lean: "notice, feed, repair the tender thing before you optimize it", wait: "dropping what is alive for a shinier summit" },
  O: { lean: "open a real door, revise the rule, admit the guest", wait: "a lock you will later regret" },
  P: { lean: "aim, decide, give scattered work a spine", wait: "a script so tight nothing living can enter" },
  Q: { lean: "ask the real question, cut the cheap version, go looking", wait: "crowded answers and performative certainty" },
  R: { lean: "restore pitch, return to the rhythm, say the true note aloud", wait: "echoing a room that has gone sharp" },
  S: { lean: "join, compose, braid efforts that want each other", wait: "dissolving your name into someone else's weave" },
  T: { lean: "end what is already over, cross the threshold, tell the costly truth", wait: "crisis as a habit, or keeping a corpse at the table" },
  U: { lean: "reconcile two true things, hold the we without shrinking", wait: "peace that is only a muzzle" },
  V: { lean: "name the picture, take one ordinary step that belongs to it", wait: "a statue of a future you will not walk toward" },
  W: { lean: "look again, play, make the new connection", wait: "advice that has forgotten astonishment" },
  X: { lean: "make the rare choice, bring the missing variable, cross the lying rule", wait: "exile as identity, or a trick with no return" },
  Y: { lean: "adapt, say the living yes, change shape without lying", wait: "bending until there is no spine left" },
  Z: { lean: "concentrate, finish at full intensity, refuse the lukewarm", wait: "living only on the peak, or a zeal with no descent" },
};

function bandOf(score: number) {
  return BANDS.find((row) => score >= row.min) ?? BANDS[BANDS.length - 1];
}

function meetOf(from: Letter, to: Letter): SeatLuck["meet"] {
  if (from === to) return "same";
  const rel = relationTo(from, to);
  if (rel === "ally") return "ally";
  if (rel === "enemy") return "enemy";
  return "none";
}

function currentOf(letter: Letter, favorable: Letter[], contrary: Letter[]): SeatLuck["current"] {
  if (favorable.includes(letter)) return "favorable";
  if (contrary.includes(letter)) return "contrary";
  return "quiet";
}

function pointsForMeet(meet: SeatLuck["meet"]): number {
  if (meet === "same") return 28;
  if (meet === "ally") return 16;
  if (meet === "enemy") return -14;
  return 2;
}

function pointsForCurrent(current: SeatLuck["current"], carried: boolean): number {
  if (current === "favorable") return carried ? 12 : 6;
  if (current === "contrary") return carried ? -10 : -4;
  return 0;
}

export function luckOf(portrait: Horoscope, date: Date | CivilDate | AlmanacDay = new Date()): LuckReading {
  const day = "dateLetter" in date && "iso" in date ? date : almanacOf(date);
  const present = new Set(portrait.inventory.map((item) => item.letter));
  const favorable = [day.dateLetter, ...day.dateCourt.allies];
  const contrary = [...day.dateCourt.enemies];
  const charge: DayCharge = day.weekdayRole === "enemy" ? "lunar" : "solar";

  const seats: SeatLuck[] = (
    [
      [portrait.triad[0], "house"],
      [portrait.triad[1], "manner"],
      [portrait.triad[2], "field"],
    ] as const
  ).map(([letter, role]) => ({
    letter,
    role,
    meet: meetOf(letter, day.dateLetter),
    current: currentOf(letter, favorable, contrary),
  }));

  let score = 50;
  seats.forEach((seat, index) => {
    const weight = index === 0 ? 1 : index === 1 ? 0.7 : 0.5;
    score += pointsForMeet(seat.meet) * weight;
    score += pointsForCurrent(seat.current, present.has(seat.letter)) * weight;
  });

  favorable.forEach((letter) => {
    if (present.has(letter) && !seats.some((s) => s.letter === letter)) score += 4;
  });
  contrary.forEach((letter) => {
    if (present.has(letter) && !seats.some((s) => s.letter === letter)) score -= 3;
  });

  if (day.fortnight.hinge) score -= 4;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const { band, verdict } = bandOf(score);

  const house = houseOf(portrait.signature);
  const dateHouse = houseOf(day.dateLetter);
  const carriedDate = present.has(day.dateLetter);

  const weather = carriedDate
    ? `Today is ${day.dateLetter}, the ${dateHouse.noun} — and that letter is already in this handle. The day is using something you already carry.`
    : `Today is ${day.dateLetter}, the ${dateHouse.noun}. That letter is not in this handle, so treat the day as a guest with a job, not as a verdict on who you are.`;

  const why = seats
    .map((seat) => {
      const noun = houseOf(seat.letter).noun;
      if (seat.current === "favorable") return `${seat.letter} (${noun}, your ${seat.role}) runs warm today.`;
      if (seat.current === "contrary") return `${seat.letter} (${noun}, your ${seat.role}) withdraws today.`;
      return `${seat.letter} (${noun}, your ${seat.role}) is quiet in today's court.`;
    })
    .join(" ");

  const leanLetters = [portrait.signature, portrait.triad[1], ...favorable].filter(
    (letter, i, arr) => arr.indexOf(letter) === i && !contrary.includes(letter),
  );
  const waitLetters = contrary.slice(0, 2);
  const askLetter = portrait.kinAbsent[0] ?? favorable.find((letter) => !present.has(letter)) ?? "D";

  const counsel: Counsel = {
    do: `Lean into ${leanLetters
      .slice(0, 2)
      .map((letter) => ACT_COUNSEL[letter]?.lean ?? themeOf(letter).gift)
      .join("; ")}.`,
    wait: `Wait on ${waitLetters.map((letter) => ACT_COUNSEL[letter]?.wait ?? themeOf(letter).challenge).join("; ")}.`,
    ask: portrait.kinAbsent[0]
      ? `Ask a ${houseOf(askLetter).noun} (${askLetter}) to finish what this handle cannot finish alone. ${themeOf(askLetter).gift}`
      : `Your allies are already written in the handle. Use them today — do not outsource the job.`,
  };

  const invitation =
    band === "open" || band === "warm"
      ? `Move. The ${house.noun}'s work is willing. Take the step you have been dressing as a plan.`
      : band === "workable" || band === "mixed"
        ? `Work the day you have. Keep one aim. Do not spend the weather as an excuse or as a crown.`
        : `Do the small necessary thing. Do not launch, do not vow, do not pick a fight with a house that is withdrawn. Tomorrow's court will be different. The letters do not change their nature — only their willingness.`;

  return {
    iso: day.iso,
    weekdayName: day.weekdayName,
    charge,
    dateLetter: day.dateLetter,
    fortnightLetter: day.fortnight.letter,
    weekdayLetter: day.weekdayLetter,
    favorable,
    contrary,
    score,
    band,
    verdict,
    weather,
    why,
    seats,
    counsel,
    invitation,
  };
}

export function decide(
  portrait: Horoscope,
  actRaw: string,
  date: Date | CivilDate | AlmanacDay = new Date(),
): DecisionReading | null {
  const act = buildHoroscope(actRaw);
  if (!act) return null;
  const day = "dateLetter" in date && "iso" in date ? date : almanacOf(date);
  const luck = luckOf(portrait, day);
  const actLetter = act.signature;
  const meetYou = meetOf(portrait.signature, actLetter);
  const actCurrent = currentOf(actLetter, luck.favorable, luck.contrary);

  const fitToYou: DecisionReading["fitToYou"] =
    meetYou === "same" ? "home" : meetYou === "ally" ? "ally" : meetYou === "enemy" ? "friction" : "foreign";

  let score = 50;
  if (fitToYou === "home") score += 18;
  if (fitToYou === "ally") score += 12;
  if (fitToYou === "friction") score -= 10;
  if (actCurrent === "favorable") score += 20;
  if (actCurrent === "contrary") score -= 18;
  if (luck.band === "open") score += 10;
  if (luck.band === "warm") score += 6;
  if (luck.band === "contrary") score -= 8;
  if (luck.band === "withdraw") score -= 14;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const timing: DecisionReading["timing"] =
    score >= 70 ? "now" : score >= 52 ? "today-ok" : score >= 34 ? "wait" : "reframe";

  const actHouse = houseOf(actLetter);
  const youHouse = houseOf(portrait.signature);
  const counsel = ACT_COUNSEL[actLetter];

  const headline =
    timing === "now"
      ? `Do it. ${actHouse.noun} work is willing today.`
      : timing === "today-ok"
        ? `You can move — keep it small and honest.`
        : timing === "wait"
          ? `Not this hour. The act is ${actHouse.noun}; the day is not.`
          : `Reframe the act. As written, it fights both your house and the day.`;

  const fitLine =
    fitToYou === "home"
      ? `This act enters as ${actLetter}, the same house you sit. It is your kind of move.`
      : fitToYou === "ally"
        ? `This act is ${actLetter} (${actHouse.noun}), an ally of your ${youHouse.noun}. It completes a job you started.`
        : fitToYou === "friction"
          ? `This act is ${actLetter} (${actHouse.noun}), a counterweight to your ${youHouse.noun}. The argument is real — useful if you do not pretend it is easy.`
          : `This act is ${actLetter} (${actHouse.noun}). It is not your usual country. That can be right. It will cost more attention.`;

  const timeLine =
    actCurrent === "favorable"
      ? `${actLetter} runs warm today. Names and acts that carry it find doors ajar.`
      : actCurrent === "contrary"
        ? `${actLetter} withdraws today. Proceed gently where this letter leads — or wait one court.`
        : `${actLetter} is quiet in today's court. The act will have to carry itself.`;

  const next =
    timing === "now"
      ? `Do the ${counsel?.lean ?? "next honest inch"} before the day cools.`
      : timing === "today-ok"
        ? `Take one reversible step: ${counsel?.lean ?? "the smallest true move"}. Do not make the vow yet.`
        : timing === "wait"
          ? `Hold. Meanwhile do not ${counsel?.wait ?? "force the unwilling thing"}. Check the court again tomorrow.`
          : `Rewrite the act so it starts from your house (${portrait.signature}, ${youHouse.noun}) or from a warm letter today (${luck.favorable.join(", ")}).`;

  return {
    act: act.displayName,
    actLetter,
    actHouse: actHouse.house,
    fitToYou,
    timing,
    score,
    headline,
    body: `${fitLine} ${timeLine}`,
    next,
  };
}

export { meetOf as letterMeet, currentOf as letterCurrent };

export function actCounselOf(letter: Letter): { lean: string; wait: string } {
  return ACT_COUNSEL[letter] ?? ACT_COUNSEL.X!;
}
