/**
 * English is the voice of the product.
 * Proper nouns stay (Seeker, Letter Path, The Count, Stoicheia, CC33).
 * Process jargon dies. If a word needs a glossary to click a button, the button is wrong.
 */
export const VOICE = {
  homeHero:
    "Type a username. The first letter names a role — Seeker, Lover, Rebel, and the rest. The two letters that show up most after that say how that role works, and where the work happens. Allies complete a job this role cannot finish alone. Enemies are the blind spot, not the villain — the work you will not look at. Use the portrait to notice what you already carry. Do not obey it. Nothing here predicts the future.",
  homeReadTitle: "Read a username",
  homeReadLede:
    "The first letter is the role you enter as. The next two, by how often they return, say how you tend to work and what kind of place that work wants. Together they are a Letter Path — a likeness, not a verdict.",
  homeBondLede:
    "Compare two usernames. We look at the role each first letter names, how each tends to work, where, which letters they share, and which allies one already carries that the other is missing. The card is only for this pair. The number is a fit, not a forecast.",
  homeCountLede:
    "We write amounts as letters so we can count without digits. A is one. Z is a full walk of twenty-six. AA is one more than a full walk. The Fool is the blank page — nothing, not a digit. You can add and step forward without ever saying a number.",
  homeCountCta: "Write a number as letters",
  loginTitle: "Sign in",
  loginLede:
    "X brings the username you already post under. Google lets you claim one. We only read A through Z. The legal name stays off the page.",
  loginGuest: "Read without signing in",
  claimTitle: "Claim this username",
  claimLede: "Type the username you use. The Letter Path updates as you type. Those letters are the only material.",
  claimHint: "@ is optional. Accents fold away. Only A–Z are read.",
  nameFormHint: "@ is optional. Accents fold away. Only A–Z are read.",
  countKicker: "CC33 · Letter-count",
  countLede:
    "We write amounts as letters so we can count without digits. A is one. Z is twenty-six. AA is twenty-seven. The Fool is the blank — nothing, not a letter. Type an old number only so we can translate it. The reading will not say it back.",
  countConfessLabel: "I still have an old number",
  countConfessButton: "Show the letters",
  countEmpty: "That has no digits to turn into letters.",
  stoicheiaLede:
    "A second reading, from the Greek alphabet. Twenty-four letters, night first. The first letter is how the name enters; the last is how it finishes. Vowels are sung in the order they appear — a ladder of planets, not a pile. Consonants are the public work. The total was already a spelling. This is not Letterology in other clothes.",
  stoicheiaButton: "Read this name",
  stoicheiaHint:
    "Greek or Latin both work. C becomes Κ, TH becomes Θ, PH becomes Φ, J becomes Ι. Accents fold away. What cannot become one of the twenty-four is dropped.",
  stoicheiaEmpty: "That name has no Greek letters we can fold. Try the Latin letters, or a Greek spelling.",
  doctrineAbstract:
    "We read usernames, not birth names. The first letter is the role. The next two by weight are how you work and where. We do not predict. We do not turn twenty-six letters into one digit. The portrait can be used. It cannot be obeyed.",
} as const;

/** Phrases that must not appear in product-door copy. Doctrine may still argue; UI may not. */
export const FORBIDDEN_UI = [
  /sits the house/i,
  /sit your house/i,
  /sit a handle/i,
  /sit a number/i,
  /render as letters/i,
  /numbers are unacceptable/i,
  /\bchiton\b/i,
  /handle is the destiny/i,
];
