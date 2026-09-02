/**
 * Voice law — every public line obeys this.
 *
 * 1. Name the move first. We looked at the letters of this username.
 * 2. Say what it means in ordinary life. So this name starts as a Seeker.
 * 3. Then the metaphor may decorate. Never instead of 1 and 2.
 * 4. Because / so / that means. If a tired person cannot repeat the rule, rewrite.
 * 5. One idea per sentence.
 * 6. Proper nouns stay (CC33, Letter Path, Seeker, The Count, Stoicheia). Translate next.
 * 7. No house-verb in UI. Ban list is FORBIDDEN_UI.
 * 8. Buttons are verbs a guest already knows.
 * 9. Share lines stay short.
 * 10. Portraits get one caption. Essays live in sheets and Why.
 */
export const VOICE = {
  homeHero:
    "Type a username. We read its letters — not your birthday, not your legal name — then tell you today’s luck and whether an act will travel.",
  homeReadTitle: "Read a username",
  homeReadLede:
    "The first letter is the role. The next two, by how often they come back, are how you tend to work and where that work wants to happen. Together they are a Letter Path. Today’s court says whether that Path runs warm.",
  homeBondLede:
    "Type two usernames. We compare their roles, how each works, where, which letters they share, and which help one already has that the other is missing. The number is a fit, not a forecast.",
  homeCountLede:
    "We write amounts as letters so we can count without digits. A is one. Z is twenty-six. AA is twenty-seven. The Fool is a blank — nothing, not a digit.",
  homeCountCta: "Write a number as letters",
  loginTitle: "Sign in",
  loginLede:
    "Continue with Google or Apple, then pick the username you actually use. We only read A through Z. Your legal name stays off the page.",
  loginXSoon: "X needs its own app.",
  loginGuest: "Read without signing in",
  claimTitle: "Claim this username",
  claimLede:
    "Type the username you actually use. The Letter Path updates as you type, because those letters are what we read.",
  claimHint: "@ is optional. Accents fall away. Only A–Z count.",
  nameFormHint: "@ is optional. Accents fall away. Only A–Z count.",
  countKicker: "CC33 · The Count",
  countLede:
    "We write amounts as letters on purpose, so the page never has to say a digit. A is one. Z is twenty-six. AA is twenty-seven. The Fool is a blank — nothing, not a letter. You can type a regular number once. We will translate it and not say it back.",
  countConfessLabel: "Or type a regular number",
  countConfessButton: "Show the letters",
  countEmpty: "That has no digits we can write as letters. Try 2026, or type letters like BYX.",
  stoicheiaLede:
    "A second instrument, from the Greek alphabet. Twenty-four letters, night first. First and last are the road — proodos and epistrophe. Vowels are a hymn sung in order. Consonants are the civic body. The total is isopsephy: an hour of the sum, not a lucky digit. This is not Letterology in other clothes.",
  stoicheiaButton: "Read this name",
  stoicheiaHint:
    "Greek or Latin both work. C becomes Κ, TH becomes Θ, PH becomes Φ, J becomes Ι. Accents fall away. Anything that cannot become one of the twenty-four is dropped.",
  stoicheiaEmpty:
    "We could not turn that into Greek letters. Try a Latin username, or type it in Greek.",
  doctrineAbstract:
    "We read usernames, not birth names. First letter is the role. The next two by how often they return are how you work and where. Luck is the day’s willingness. Letterize an act to time it. Use the reading. Do not spend it.",
  footerLine:
    "Official instrument. Usernames, not birth names. Luck is willingness. The decision is yours.",
  moreLetters: "More about these letters",
  anotherUsername: "Another username",
  countNightNote:
    "The Count is still the Latin walk. Night is only the room. A still means one.",
  twoLatinLede: "Two usernames. One card that is only about this pair.",
  twoTableLede: "Guest and host. A duty, not a score.",
  twoStadiumLede: "A contest. Six prizes from the letters, not a fate.",
  lettersLatinLede: "Twenty-six houses. Tap a letter to read it.",
  lettersGreekLede: "Twenty-four hours, night first. Tap a letter to read it.",
  pathCaption: "Role, then how you work, then where — from the letters we counted.",
  sheetTitle: "Cheat sheet",
  sheetLede:
    "Condensed instrument. Read the letters in the room. One role, one charge.",
  askTitle: "Ask the letters",
  askLede:
    "Type the username you use and a question. We letterize both, meet them with today’s court, and answer. Luck is willingness. The decision is yours.",
  askHint:
    "Ask in ordinary words. Should, will, how, when, who — or two options split by or. We read the letters of the matter, not the mood word.",
  glyphLede:
    "Play as the letter c against living numbers. Five closed chapters, then the Numberomicons. Sixty ledgers.",
  gamesHome: "The club keeps two games.",
  starWordsLede:
    "Pilot the C-wing. Letters on the wing. Lizards in the count. Dualis waits at the Press.",
} as const;

/** Phrases that must not appear in product-door or generated UI copy. Why may still argue. */
export const FORBIDDEN_UI = [
  /sits the house/i,
  /sit your house/i,
  /sit a handle/i,
  /sit a number/i,
  /sit a house/i,
  /sits a house/i,
  /sits a bond/i,
  /wears that house/i,
  /render as letters/i,
  /numbers are unacceptable/i,
  /\bchiton\b/i,
  /handle is the destiny/i,
  /omphalos/i,
  /letterological horoscope/i,
  /old number/i,
  /civic labor/i,
];
