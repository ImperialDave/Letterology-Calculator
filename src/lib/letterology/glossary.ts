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
 * English is the voice. Proper nouns stay.
 * `plain` is what the site should say. `metaphor` is an example, not a heading.
 */
export const GLOSSARY: GlossEntry[] = [
  {
    id: "handle",
    term: "Handle",
    metaphor: "The username you chose. We read that, not your legal name.",
    plain: "Your username. That string of letters is the only material this reading uses.",
    opacity: "high",
    surfaces: ["home", "name form", "share cards"],
  },
  {
    id: "house",
    term: "House",
    metaphor: "The first letter names a house — Seeker, Caregiver, Rebel, Hermit.",
    plain: "The role a letter names. A username gets that role from its first letter.",
    opacity: "high",
    surfaces: ["home", "reading", "houses", "circle", "atlas", "year"],
  },
  {
    id: "sit",
    term: "Sit",
    metaphor: "The first letter is the role. Today is the Warrior.",
    plain: "Is, or names. The first letter of a username is that role. The 13th is M. Not a spell.",
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
    metaphor: "How you work.",
    plain: "How you work — the letter that weighs most after the first.",
    opacity: "high",
    surfaces: ["reading", "houses", "year"],
  },
  {
    id: "field",
    term: "Field",
    metaphor: "Where you work. On a day, what today is about.",
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
    plain: "The three-letter figure of a username. First letter is the role; the next two are how and where you work.",
    opacity: "high",
    surfaces: ["reading", "houses", "circle", "atlas"],
  },
  {
    id: "luck",
    term: "Luck",
    metaphor: "Willingness, not fate.",
    plain: "The meeting of your Letter Path with today's court. A score and a verdict you can use before noon.",
    opacity: "high",
    surfaces: ["home", "reading"],
  },
  {
    id: "favorable",
    term: "Favorable current",
    metaphor: "Doors ajar.",
    plain: "Today's date-house plus its allies. These letters run warm. Names and acts that carry them travel.",
    opacity: "high",
    surfaces: ["home", "reading", "almanac"],
  },
  {
    id: "contrary",
    term: "Contrary current",
    metaphor: "Proceed gently.",
    plain: "Today's enemies. These letters withdraw. Keep the step small, or wait one court.",
    opacity: "high",
    surfaces: ["home", "reading", "almanac"],
  },
  {
    id: "decision",
    term: "Decision",
    metaphor: "Letterize the act.",
    plain: "An act, read as a name. We ask: is this your kind of move, and is that house willing today?",
    opacity: "high",
    surfaces: ["home", "reading"],
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
    metaphor: "The username is the material. This is a portrait, not a prediction.",
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
    metaphor: "For fourteen days the two-week stretch is the Orphan.",
    plain: "The current two-week seat on the year-wheel. There are twenty-six of them, one per letter.",
    opacity: "high",
    surfaces: ["home", "year", "reading"],
  },
  {
    id: "hinge",
    term: "Hinge",
    metaphor: "The leftover day or two are the Fool's hinge.",
    plain: "The leftover day or two between one year-walk and the next, around mid-March. No numbered two-week house.",
    opacity: "high",
    surfaces: ["home", "year", "reading"],
  },
  {
    id: "climate",
    term: "Climate",
    metaphor: "Year and month are background around this day. They do not rename today.",
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
    metaphor: "The 13th is M, the Magician.",
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
    metaphor: "Same how and where, lived by a role that helps yours.",
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
    metaphor: "Amber is the Seeker. The wheel walks the spectrum back to ochre.",
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
    metaphor: "Two usernames, one card.",
    plain: "A reading of two usernames together — how their roles, methods, and letters meet.",
    opacity: "high",
    surfaces: ["bond", "home", "reading"],
  },
  {
    id: "affinity",
    term: "Affinity",
    metaphor: "Affinity 78.",
    plain: "A 0–100 fit of the two spellings: roles, how they work, shared letters, and help one already has that the other is missing. Not a forecast.",
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
    id: "doctrine",
    term: "The Doctrine",
    metaphor: "Why the system is shaped the way it is.",
    plain: "The argument, written backward from the mechanics. The Key is the dictionary. The Doctrine is the reason.",
    opacity: "medium",
    surfaces: ["doctrine", "footer", "key"],
  },
  {
    id: "count",
    term: "The Count",
    metaphor: "We write amounts as letters.",
    plain: "A is one. Z is twenty-six. AA is twenty-seven. The whole amount also has a role, the same way a date does.",
    opacity: "high",
    surfaces: ["count", "key", "home"],
  },
  {
    id: "seat",
    term: "Seat",
    metaphor: "That amount’s role is X, the Trickster.",
    plain: "The one role a whole amount has, the same rule as a date or year. 1 is A. 13 is M. 26 is Z. 27 is A again.",
    opacity: "high",
    surfaces: ["count", "year"],
  },
  {
    id: "spelling",
    term: "Spelling",
    metaphor: "Old digits can be written as letters too.",
    plain: "Each old digit becomes a letter (1 is A through 9 is I; 0 is the Fool). That is a translation, not the count.",
    opacity: "high",
    surfaces: ["count"],
  },
  {
    id: "zero",
    term: "Zero",
    metaphor: "Zero is the Fool.",
    plain: "There is no 0th of the month. 0 is F, the Fool — Tarot’s unnumbered card. 6 is also F, as the sixth house. Same figure, two doors.",
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
  house: { term: "Role", id: "house" as const },
  manner: { term: "How", id: "manner" as const },
  field: { term: "Where", id: "field" as const },
};

export const WEATHER_COPY: Record<
  string,
  { label: string; gloss: string }
> = {
  homecoming: {
    label: "Homecoming",
    gloss: "Same house. Two lives inside one role — not one person twice. Use the familiar work; do not disappear into it.",
  },
  kinship: {
    label: "Kinship",
    gloss: "Allied houses. They complete a job the other started. Let the missing piece come from the other name.",
  },
  crossing: {
    label: "Crossing",
    gloss: "Useful difference. They meet at an angle and still make something. Stay long enough to see what it is.",
  },
  friction: {
    label: "Friction",
    gloss: "Opposing houses. The argument is the work, not a failure. Keep it useful; do not make it a verdict.",
  },
  exile: {
    label: "Exile",
    gloss: "Opposite texture, and neither name carries the missing ally. Do the day’s job; do not make it your identity.",
  },
  hinge: {
    label: "Hinge",
    gloss: "Leftover days between years. No numbered house. Travel light. Finish one small thing.",
  },
  ordinary: {
    label: "Unmarked",
    gloss: "No official bond. They get to write one. An unmarked day is still a real day.",
  },
  pact: {
    label: "Pact",
    gloss: "Each name already carries an ally the other is missing. That is the deal: trade the help you actually have.",
  },
  forge: {
    label: "Forge",
    gloss: "Heat plus common letters. They make things by arguing well. Keep the heat on the work, not on the person.",
  },
  orbit: {
    label: "Orbit",
    gloss: "One leans in, one leans out, and the spellings barely overlap. They visit. Do not force a house they did not ask for.",
  },
  echo: {
    label: "Echo",
    gloss: "Different roles, same way of working. One method, two lives. Name the method so it does not become a secret.",
  },
  harvest: {
    label: "Harvest",
    gloss: "The place is right and the gifts are already in the names. Take what is ripe. Do not plant a new field today.",
  },
  veil: {
    label: "Veil",
    gloss: "Both names lean inward. The private life is loud; the room still needs a face. Give the day one public hour.",
  },
  carnival: {
    label: "Carnival",
    gloss: "Both names lean outward and work differently. Plenty of room; keep an inner hour so the feast does not eat the person.",
  },
};

export const METHOD_PLAIN =
  "We read the letters of a username. The first letter names a role — how you enter. The two letters that show up most after that describe how you tend to work, and what kind of place that work wants. Some roles help this one finish a job it cannot finish alone. Some roles push back so it does not fool itself. The name is what we read. Nothing here predicts the future. Use the portrait to notice. Do not obey it.";

export const CALENDAR_PLAIN =
  "The year is split into twenty-six two-week seats, one per letter, starting 21 March. Today's date names a role — the job of the day. The current two-week seat says how the season is working. The weekday says what today's work is about: same role, ally, or counterweight. The calendar year and the month only color the background — they do not rename the day. Leftover days before the next 21 March have no numbered role. Travel light.";

export const BOND_PLAIN =
  "Type two usernames. We compare the role each first letter names, then how each tends to work, then where. Allies complete a job. Enemies keep it honest. Shared letters are common ground. If one name already carries an ally the other is missing, that is a gift — help already in the spelling. The number is a fit, not a forecast. A high fit can still be a trap. A hard weather can still be a life’s work.";

