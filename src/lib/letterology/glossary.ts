export type Opacity = "high" | "medium" | "low";

export interface GlossEntry {
  id: string;
  term: string;
  metaphor: string;
  plain: string;
  opacity: Opacity;
  surfaces: string[];
}

/**
 * End-to-end audit of coined language.
 * Keep the metaphor. The `plain` line is what a first-time reader needs.
 */
export const GLOSSARY: GlossEntry[] = [
  {
    id: "handle",
    term: "Handle",
    metaphor: "The handle you live under. The handle is the destiny.",
    plain: "Your username. That string of letters is the only material this reading uses.",
    opacity: "high",
    surfaces: ["home", "name form", "share cards"],
  },
  {
    id: "house",
    term: "House",
    metaphor: "The letters you chose sit a house — Seeker, Caregiver, Rebel, Hermit.",
    plain: "The role a letter names. A username sits a house by its first letter.",
    opacity: "high",
    surfaces: ["home", "reading", "houses", "circle", "atlas", "year"],
  },
  {
    id: "sit",
    term: "Sit",
    metaphor: "The first letter sits the house. Today sits the House of the Warrior.",
    plain: "Occupies, or names. A letter sits a house the way a date sits a weekday — it is the seat, not a spell.",
    opacity: "high",
    surfaces: ["home", "reading", "year", "generated copy"],
  },
  {
    id: "weight",
    term: "Weight",
    metaphor: "The two letters that weigh most after that set how you work and where you work.",
    plain: "How much a letter counts. Repeats count more. The first letter of a name, and other first and last letters, count extra.",
    opacity: "high",
    surfaces: ["home", "reading", "houses"],
  },
  {
    id: "manner",
    term: "Manner",
    metaphor: "The next two letters by weight set the manner and the field.",
    plain: "How you work — the letter that weighs most after the first.",
    opacity: "high",
    surfaces: ["reading", "houses", "year"],
  },
  {
    id: "field",
    term: "Field",
    metaphor: "The field is where you work. The weekday is the field.",
    plain: "Where the work happens — the next letter by weight, or, on a day, what the weekday is about.",
    opacity: "high",
    surfaces: ["reading", "houses", "year"],
  },
  {
    id: "triad",
    term: "Triad",
    metaphor: "Three letters. First is the house; the next two are manner and field.",
    plain: "A three-letter code: role, how, where. ALE means Seeker, working by luminosity, on the path of expansion.",
    opacity: "high",
    surfaces: ["houses", "letter path card"],
  },
  {
    id: "letter-path",
    term: "Letter Path",
    metaphor: "Your Letter Path is three letters: house, manner, field.",
    plain: "The three-letter figure a username sits. First letter is the role; the next two are how and where you work.",
    opacity: "high",
    surfaces: ["reading", "houses", "circle", "atlas"],
  },
  {
    id: "cc33",
    term: "CC33",
    metaphor: "A CC33 house.",
    plain: "The club. Letterology is the reading; CC33 is whose house it is.",
    opacity: "high",
    surfaces: ["home", "header", "footer", "share cards"],
  },
  {
    id: "allies",
    term: "Allies",
    metaphor: "Allies complete the job.",
    plain: "Three other houses that help this one finish. They are complements, not friends in the ordinary sense.",
    opacity: "high",
    surfaces: ["home", "reading", "circle", "houses", "year", "atlas"],
  },
  {
    id: "enemies",
    term: "Enemies",
    metaphor: "Enemies keep it honest. An enemy is not a villain.",
    plain: "Three houses that show this one's blind spot. They push back so the role cannot lie to itself.",
    opacity: "high",
    surfaces: ["home", "reading", "circle", "houses", "year", "atlas"],
  },
  {
    id: "destiny",
    term: "Destiny",
    metaphor: "The handle is the destiny. This is a portrait, not a prediction.",
    plain: "The name is the material, not a forecast. Nothing here tells the future.",
    opacity: "high",
    surfaces: ["home", "footer", "reading"],
  },
  {
    id: "horoscope",
    term: "Letterological Horoscope",
    metaphor: "Letterological Horoscope",
    plain: "A reading of this username. Same shape as a horoscope; the sky is the alphabet.",
    opacity: "high",
    surfaces: ["reading"],
  },
  {
    id: "wheel",
    term: "Wheel",
    metaphor: "The alphabet stands in a wheel, A at the top. Twenty-six seats on one wheel.",
    plain: "The twenty-six houses arranged in a ring, A at the top, so each role has neighbors, allies, and opposites.",
    opacity: "high",
    surfaces: ["reading", "circle", "home", "year"],
  },
  {
    id: "vowels",
    term: "Vowels · inner",
    metaphor: "Vowels lean inward. Consonants lean outward.",
    plain: "Vowels describe the private life. Consonants describe how you show up.",
    opacity: "high",
    surfaces: ["atlas", "reading"],
  },
  {
    id: "consonants",
    term: "Consonants · outer",
    metaphor: "The consonants speak of luminosity in the outer life.",
    plain: "How the name acts in public — work, rooms, the face other people get.",
    opacity: "medium",
    surfaces: ["reading"],
  },
  {
    id: "tradition",
    term: "Tradition",
    metaphor: "Pearson Seeker · Campbell's departure",
    plain: "Old names for the same figure, from psychology and myth. Color, not a rule.",
    opacity: "high",
    surfaces: ["houses", "atlas", "letter path card"],
  },
  {
    id: "correspondence",
    term: "Correspondence",
    metaphor: "Air · East · first hour",
    plain: "Traditional atmosphere — element, direction, image. Not an instruction.",
    opacity: "high",
    surfaces: ["houses", "atlas", "letter path card"],
  },
  {
    id: "realm",
    term: "Realm",
    metaphor: "The realm is the Threshold. Path of the Hearth, the Spark, the Well.",
    plain: "The kind of place this work happens in. A nickname for the field, not a map.",
    opacity: "high",
    surfaces: ["letter path card", "houses"],
  },
  {
    id: "fortnight",
    term: "Fortnight",
    metaphor: "For fourteen days the sun sits in the House of the Orphan.",
    plain: "The current two-week seat on the year-wheel. There are twenty-six of them, one per letter.",
    opacity: "high",
    surfaces: ["home", "year", "reading"],
  },
  {
    id: "hinge",
    term: "Hinge",
    metaphor: "The leftover day or two are the Fool's hinge.",
    plain: "The leftover day or two between one year-walk and the next, around mid-March. No numbered house to sit.",
    opacity: "high",
    surfaces: ["home", "year", "reading"],
  },
  {
    id: "climate",
    term: "Climate",
    metaphor: "Year and month are climate around this day. They do not sit the house.",
    plain: "Background color from the calendar year and the month. Mood, not today's job.",
    opacity: "high",
    surfaces: ["home", "year", "reading"],
  },
  {
    id: "court",
    term: "Court",
    metaphor: "Day court. Fortnight court. Year and month keep their courts.",
    plain: "A letter's usual helpers and pushbacks — its three allies and three enemies.",
    opacity: "high",
    surfaces: ["year", "home"],
  },
  {
    id: "station",
    term: "Station of the Seeker",
    metaphor: "The year-walk begins at the Station of the Seeker on 21 March.",
    plain: "March 21, where the year starts over at A. Same idea as a solstice or new year.",
    opacity: "medium",
    surfaces: ["year"],
  },
  {
    id: "sun",
    term: "The sun",
    metaphor: "The sun is in the House of the Orphan. The sun walks the circle.",
    plain: "A way of saying which two-week seat the calendar is in. Not astronomy.",
    opacity: "medium",
    surfaces: ["home", "year"],
  },
  {
    id: "wear",
    term: "Wear",
    metaphor: "The 13th wears that house.",
    plain: "The date's number names a letter (1 is A, 13 is M). That letter is today's house.",
    opacity: "high",
    surfaces: ["year"],
  },
  {
    id: "grain",
    term: "Grain",
    metaphor: "The day's grain is not yours. Your manner rubs the fortnight's grain.",
    plain: "The way a house tends to work — its texture. Friction means today's texture is not yours.",
    opacity: "high",
    surfaces: ["reading", "year"],
  },
  {
    id: "visiting",
    term: "Visiting",
    metaphor: "M is visiting — it is not in the name.",
    plain: "Today's letter does not appear in the username. Meet it as a guest, not a verdict.",
    opacity: "medium",
    surfaces: ["reading"],
  },
  {
    id: "homecoming",
    term: "Homecoming",
    metaphor: "Homecoming in the House of the Seeker.",
    plain: "Today matches your house. You are on home ground.",
    opacity: "medium",
    surfaces: ["reading"],
  },
  {
    id: "kinship-weather",
    term: "Kinship",
    metaphor: "Kinship: Lover with Warrior.",
    plain: "Today is an ally of your house. The day helps the work you already do.",
    opacity: "medium",
    surfaces: ["reading"],
  },
  {
    id: "crossing",
    term: "Crossing",
    metaphor: "A crossing in the House of the Warrior.",
    plain: "Today has a relationship to your house, but it is not a simple match.",
    opacity: "high",
    surfaces: ["reading"],
  },
  {
    id: "friction",
    term: "Friction",
    metaphor: "Friction: Lover meets Hermit.",
    plain: "Today pushes against your house. Useful, if you do not pretend it is easy.",
    opacity: "medium",
    surfaces: ["reading"],
  },
  {
    id: "exile",
    term: "Exile",
    metaphor: "Exile weather — House of the Magician.",
    plain: "Today is strongly against your grain. Do the day's work; do not make it your identity.",
    opacity: "high",
    surfaces: ["reading"],
  },
  {
    id: "ordinary",
    term: "Ordinary day",
    metaphor: "An ordinary day in the House of the Warrior.",
    plain: "No special bond between your house and today's house. Still a real day.",
    opacity: "low",
    surfaces: ["reading"],
  },
  {
    id: "kindred",
    term: "Kindred",
    metaphor: "Same manner and field, sitting in an allied house.",
    plain: "The same how and where, lived by a role that helps yours.",
    opacity: "medium",
    surfaces: ["reading"],
  },
  {
    id: "atlas",
    term: "Atlas",
    metaphor: "The twenty-six fields.",
    plain: "A page for every letter: its meaning, its house, its inner and outer face.",
    opacity: "low",
    surfaces: ["atlas"],
  },
  {
    id: "almanac",
    term: "Almanac",
    metaphor: "The year on the wheel.",
    plain: "The calendar: which house holds this fortnight, this month, this year, and this date.",
    opacity: "low",
    surfaces: ["year"],
  },
  {
    id: "portrait",
    term: "Portrait",
    metaphor: "This is a portrait, not a prediction.",
    plain: "A likeness made from the letters you already carry. It describes; it does not forecast.",
    opacity: "low",
    surfaces: ["home", "footer", "reading"],
  },
  {
    id: "pigment",
    term: "Pigment",
    metaphor: "Amber sits the Seeker. The wheel walks the spectrum back to ochre.",
    plain: "The color of a letter. A sits dawn gold; the rest walk the color wheel in order. Each pigment has a mineral name.",
    opacity: "high",
    surfaces: ["circle", "houses", "reading"],
  },
  {
    id: "mix",
    term: "Mix",
    metaphor: "Cobalt with vermilion and jade.",
    plain: "A Letter Path’s color. Three letter-pigments combined: the house is half the pot, manner three-tenths, field two-tenths.",
    opacity: "high",
    surfaces: ["circle", "houses", "reading"],
  },
  {
    id: "bond",
    term: "Bond",
    metaphor: "Two handles sit a bond.",
    plain: "A reading of two usernames together — how their roles, methods, and letters meet.",
    opacity: "high",
    surfaces: ["bond", "home", "reading"],
  },
  {
    id: "affinity",
    term: "Affinity",
    metaphor: "Affinity 78.",
    plain: "A 0–100 fit of the two names: houses, how they work, shared letters, and missing allies the other already carries.",
    opacity: "high",
    surfaces: ["bond", "certificate"],
  },
  {
    id: "certificate",
    term: "Certificate of Bond",
    metaphor: "Certified by CC33.",
    plain: "A shareable card of the pair: both names, the bond’s title, and the affinity. Made to post.",
    opacity: "medium",
    surfaces: ["bond"],
  },
  {
    id: "count",
    term: "The Count",
    metaphor: "We ask a number to sit a house.",
    plain: "Numbers must sit as letters. A count has a court, a seat, the walks that made it, and Letter Paths from spelling and from places.",
    opacity: "high",
    surfaces: ["count", "key", "home"],
  },
  {
    id: "seat",
    term: "Seat",
    metaphor: "2026 sits X — Trickster.",
    plain: "The one house a whole number occupies, the same rule as a date or year. 1 is A. 13 is M. 26 is Z. 27 is A again.",
    opacity: "high",
    surfaces: ["count", "year"],
  },
  {
    id: "spelling",
    term: "Spelling",
    metaphor: "2026 spells B F B F.",
    plain: "Each digit becomes a letter. 1 is A through 9 is I. 0 is F, the Fool. That string is then read like a username.",
    opacity: "high",
    surfaces: ["count"],
  },
  {
    id: "zero",
    term: "Zero",
    metaphor: "Zero is the Fool.",
    plain: "There is no 0th of the month. 0 sits F, Tarot’s unnumbered card. 6 also sits F, as the sixth house. Same figure, two doors.",
    opacity: "high",
    surfaces: ["count", "key"],
  },
];

const BY_ID = new Map(GLOSSARY.map((entry) => [entry.id, entry]));

export function entryOf(id: string): GlossEntry {
  const found = BY_ID.get(id);
  if (!found) {
    throw new Error(`Unknown glossary id: ${id}`);
  }
  return found;
}

export function gloss(id: string): string {
  return entryOf(id).plain;
}

export function termOf(id: string): string {
  return entryOf(id).term;
}

export const TRIAD_LABELS = {
  house: { term: "House", id: "house" as const },
  manner: { term: "Manner", id: "manner" as const },
  field: { term: "Field", id: "field" as const },
};

export const WEATHER_COPY: Record<
  string,
  { label: string; gloss: string }
> = {
  homecoming: {
    label: "Homecoming",
    gloss: "Same house. Two lives inside one role — not one person twice.",
  },
  kinship: {
    label: "Kinship",
    gloss: "Allied houses. They complete a job the other started.",
  },
  crossing: {
    label: "Crossing",
    gloss: "Useful difference. They meet at an angle and still make something.",
  },
  friction: {
    label: "Friction",
    gloss: "Opposing houses. The argument is the work, not a failure.",
  },
  exile: {
    label: "Exile",
    gloss: "Opposite grain, and neither name carries the missing ally.",
  },
  hinge: {
    label: "Hinge",
    gloss: "Leftover days between year-walks. No numbered house.",
  },
  ordinary: {
    label: "Unmarked",
    gloss: "No official bond. They get to write one.",
  },
  pact: {
    label: "Pact",
    gloss: "Each name already carries an ally the other is missing. That is the deal.",
  },
  forge: {
    label: "Forge",
    gloss: "Heat plus common letters. They make things by arguing well.",
  },
  orbit: {
    label: "Orbit",
    gloss: "One leans in, one leans out, and the spellings barely overlap. They visit.",
  },
  echo: {
    label: "Echo",
    gloss: "Different roles, same way of working. One method, two lives.",
  },
  harvest: {
    label: "Harvest",
    gloss: "The place is right and the gifts are already in the names.",
  },
  veil: {
    label: "Veil",
    gloss: "Both names lean inward. The private life is loud; the room still needs a face.",
  },
  carnival: {
    label: "Carnival",
    gloss: "Both names lean outward and work differently. Plenty of room; keep an inner hour.",
  },
};

export const METHOD_PLAIN =
  "We read the letters of a username. The first letter names a role. The two letters that show up most after that describe how you tend to work, and what you tend to work on. Some roles help this one finish. Some roles push back so it does not fool itself. The name is the material. Nothing here predicts the future.";

export const CALENDAR_PLAIN =
  "The year is split into twenty-six two-week seats, one per letter, starting 21 March. Today's date names a role. The current two-week seat says how the season is working. The weekday says what today's work is about. The calendar year and the month only color the background — they do not rename the day.";

export const BOND_PLAIN =
  "Type two usernames. We compare the role each first letter names, then how each tends to work, then where. Allies complete a job. Enemies keep it honest. Shared letters are common ground. If one name already carries an ally the other is missing, that is a gift. The number is a fit, not a forecast.";

