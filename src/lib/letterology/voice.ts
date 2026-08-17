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
    "Type a username. We read its letters — not your birthday, not your legal name — and show the role those letters name.",
  homeReadTitle: "Read a username",
  homeReadLede:
    "The first letter is the role. The next two, by how often they come back, are how you tend to work and where that work wants to happen. Together they are a Letter Path. A likeness, not a verdict.",
  homeBondLede:
    "Type two usernames. We compare their roles, how each works, where, which letters they share, and which help one already has that the other is missing. The number is a fit, not a forecast.",
  homeCountLede:
    "We write amounts as letters so we can count without digits. A is one. Z is twenty-six. AA is twenty-seven. The Fool is a blank — nothing, not a digit.",
  homeCountCta: "Write a number as letters",
  loginTitle: "Sign in",
  loginLede:
    "Continue with Google, then pick the username you actually use. We only read A through Z. Your legal name stays off the page.",
  loginXSoon: "X needs its own app. Google works now.",
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
    "A second reading, from the Greek alphabet. Twenty-four letters. The first letter is how the name arrives. The last is how it leaves. Vowels are a song in the order they appear. Consonants are the public work. The total is an old way of writing a number as letters. This is not Letterology in other clothes.",
  stoicheiaButton: "Read this name",
  stoicheiaHint:
    "Greek or Latin both work. C becomes Κ, TH becomes Θ, PH becomes Φ, J becomes Ι. Accents fall away. Anything that cannot become one of the twenty-four is dropped.",
  stoicheiaEmpty:
    "We could not turn that into Greek letters. Try a Latin username, or type it in Greek.",
  doctrineAbstract:
    "We read usernames, not birth names. First letter is the role. The next two by how often they return are how you work and where. We do not predict. We do not crush twenty-six letters into one digit. Use the portrait. Do not obey it.",
  footerLine:
    "A portrait of a username, not a prediction — we describe the letters you already use. We do not tell the future.",
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
