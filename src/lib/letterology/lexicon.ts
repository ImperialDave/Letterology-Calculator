import type { Letter, LetterTheme, TensionPair } from "./types";

export const LEXICON: Record<Letter, LetterTheme> = {
  A: {
    letter: "A",
    name: "Aspiration",
    keywords: ["ambition", "authenticity", "awakening", "abundance"],
    essence:
      "A is the first step spoken aloud. It names the appetite to become, the upright beginning that will not stay small.",
    inner: "Inwardly, A keeps a private hunger for a truer life — not louder, but more itself.",
    outer: "Outwardly, A leans forward: it starts things, names them, and asks the room to rise.",
    gift: "You tend to meet the world as a beginning. Wanting, in you, is a form of honesty.",
    challenge:
      "Aspiration without choosing becomes restlessness. The invitation is to let appetite become a single, kept vow.",
    invitation: "Notice where you are already standing at a threshold, and step as if the name were true.",
    complements: ["D", "N", "G"],
  },
  B: {
    letter: "B",
    name: "Binding",
    keywords: ["balance", "belonging", "bravery", "beauty"],
    essence:
      "B is the letter that holds. It gathers what would scatter and makes a home of two things that chose each other.",
    inner: "Inwardly, B seeks a center that can be trusted — a balance that is felt, not performed.",
    outer: "Outwardly, B makes circles: friendships, rooms, loyalties, the quiet courage of staying.",
    gift: "You carry the gift of making people and ideas belong to one another.",
    challenge:
      "Binding can become enclosure. The invitation is to hold without gripping, to belong without disappearing.",
    invitation: "Ask what is worth keeping — and what is asking to be released with care.",
    complements: ["C", "F", "X"],
  },
  C: {
    letter: "C",
    name: "Catalysis",
    keywords: ["curiosity", "courage", "creation", "change"],
    essence:
      "C is the spark that will not leave a still room still. It is curiosity with a match in its hand.",
    inner: "Inwardly, C is a restlessness of mind — a need to turn the object over and see the other face.",
    outer: "Outwardly, C starts reactions: conversations, projects, departures, the first honest sentence.",
    gift: "You tend to be the reason something begins that would not have begun without you.",
    challenge:
      "Catalysis without patience can burn the very thing it meant to awaken. Change needs a vessel.",
    invitation: "Choose one reaction worth starting, and stay long enough to see what it becomes.",
    complements: ["B", "R", "D"],
  },
  D: {
    letter: "D",
    name: "Depth",
    keywords: ["discipline", "determination", "discernment", "devotion"],
    essence:
      "D is the descent. It prefers the root to the blossom, the kept practice to the bright announcement.",
    inner: "Inwardly, D is a long attention — a willingness to stay with what is not yet clear.",
    outer: "Outwardly, D shows as craft, loyalty, and the unfashionable work of finishing.",
    gift: "You tend to give things the dignity of time. What you devote yourself to, you change.",
    challenge:
      "Depth can become a well with no ladder. The invitation is to bring something back to the surface.",
    invitation: "Let one devotion be visible. Depth that never speaks still wants a witness.",
    complements: ["E", "F", "L"],
  },
  E: {
    letter: "E",
    name: "Expansion",
    keywords: ["empathy", "evolution", "energy", "emergence"],
    essence:
      "E is the opening of the ribcage. It is the letter that says there is more room than you were using.",
    inner: "Inwardly, E is a widening of feeling — empathy as a kind of weather you walk through.",
    outer: "Outwardly, E reaches: new people, new work, the next version of a life already in motion.",
    gift: "You tend to make more space than the situation asked for — and someone always needs it.",
    challenge:
      "Expansion without a shoreline becomes diffusion. Emergence still needs a shape.",
    invitation: "Grow in one direction with feeling, not in every direction with haste.",
    complements: ["D", "P", "S"],
  },
  F: {
    letter: "F",
    name: "Freedom",
    keywords: ["focus", "faith", "flow", "fidelity"],
    essence:
      "F is the open gate and the chosen path through it. Freedom here is not escape; it is uncoerced attention.",
    inner: "Inwardly, F protects a private sovereignty — the right to move as the inner weather asks.",
    outer: "Outwardly, F shows as independence, clean focus, and a refusal to be owned by noise.",
    gift: "You tend to keep a corridor of air around your life. Others breathe easier near it.",
    challenge:
      "Freedom without fidelity is only weather. The invitation is to choose, and then stay freely.",
    invitation: "Ask what you would still choose if no one were watching — then give it your focus.",
    complements: ["B", "D", "P"],
  },
  G: {
    letter: "G",
    name: "Growth",
    keywords: ["gratitude", "grace", "grounding", "generosity"],
    essence:
      "G is the green fact: what is tended increases. It is growth with roots, not merely accumulation.",
    inner: "Inwardly, G is a patient becoming — gratitude as the soil in which the next self can stand.",
    outer: "Outwardly, G gives. It grounds rooms, feeds work, and makes increase look like courtesy.",
    gift: "You tend to leave people and projects larger than you found them, without making a speech of it.",
    challenge:
      "Growth that never winters becomes exhaustion. Grace includes the fallow field.",
    invitation: "Tend one living thing — a craft, a friendship, a practice — as if increase were already promised.",
    complements: ["X", "Z", "N"],
  },
  H: {
    letter: "H",
    name: "Horizon",
    keywords: ["harmony", "honesty", "hope", "hospitality"],
    essence:
      "H is the far line that organizes the walk. It is hope with a backbone, and a door left unlatched.",
    inner: "Inwardly, H keeps faith with a farther self — honesty as the only reliable compass.",
    outer: "Outwardly, H hosts: it makes a climate in which other people can tell the truth.",
    gift: "You tend to hold a longer view, and to offer it without forcing anyone to share it.",
    challenge:
      "Horizon-gazing can neglect the ground underfoot. Hospitality begins with the nearest person.",
    invitation: "Keep the far line, and set one honest table today.",
    complements: ["I", "K", "P"],
  },
  I: {
    letter: "I",
    name: "Illumination",
    keywords: ["insight", "integrity", "imagination", "interiority"],
    essence:
      "I is the inner lamp. It is the letter of the solitary yes — insight before applause.",
    inner: "Inwardly, I is a well-lit room that not everyone is invited into. Imagination lives there first.",
    outer: "Outwardly, I appears as integrity: a life whose inside and outside are trying to rhyme.",
    gift: "You tend to see the pattern before it is fashionable, and to keep faith with what you see.",
    challenge:
      "Interiority can become a locked study. Illumination is meant, eventually, to fall on a shared table.",
    invitation: "Bring one private insight into speech. Light unused is only furniture.",
    complements: ["S", "U", "H"],
  },
  J: {
    letter: "J",
    name: "Journey",
    keywords: ["joy", "justice", "judgment", "juxtaposition"],
    essence:
      "J is the road that thinks. It is motion with a conscience — joy that does not look away.",
    inner: "Inwardly, J compares, weighs, and will not rest in a false peace.",
    outer: "Outwardly, J travels, argues, celebrates, and places unlikely things beside each other until they speak.",
    gift: "You tend to move a life (your own or another's) from here to a more just there.",
    challenge:
      "The journey can become a refusal to arrive. Judgment needs a place to set its pack down.",
    invitation: "Take the next honest mile, and let joy be part of the equipment, not the prize at the end.",
    complements: ["K", "O", "S"],
  },
  K: {
    letter: "K",
    name: "Kinship",
    keywords: ["knowledge", "kindness", "key", "kinship"],
    essence:
      "K is the key left on the table for one's people. It is knowledge that wants to be useful to someone named.",
    inner: "Inwardly, K is a loyalty of mind — you understand by standing with.",
    outer: "Outwardly, K knits: family, chosen family, the small republic of those who know your real name.",
    gift: "You tend to be the person who remembers, who opens, who makes knowledge feel like kindness.",
    challenge:
      "Kinship can become a closed room. The key is also meant for the stranger who knocks.",
    invitation: "Offer one precise kindness to someone who already has a claim on you — then one who does not.",
    complements: ["J", "H", "Q"],
  },
  L: {
    letter: "L",
    name: "Luminosity",
    keywords: ["love", "light", "leadership", "loyalty"],
    essence:
      "L is light that has chosen a person. It is love as a form of leadership: the willingness to go first in warmth.",
    inner: "Inwardly, L is a steady lamp — loyalty to what (and whom) has already been loved.",
    outer: "Outwardly, L clarifies a room. People find their edges in your light, and sometimes their courage.",
    gift: "You tend to make the better thing visible, and to stay with it after the first shine fades.",
    challenge:
      "Luminosity can perform brightness and hide fatigue. Love that leads must also rest.",
    invitation: "Shine on one true thing. Do not spend the whole lamp on the hallway.",
    complements: ["D", "I", "W"],
  },
  M: {
    letter: "M",
    name: "Momentum",
    keywords: ["mindfulness", "mystery", "mastery", "movement"],
    essence:
      "M is mass in motion. It is the letter of the practice that has begun to carry itself.",
    inner: "Inwardly, M holds both mystery and method — attention that does not flatten what it studies.",
    outer: "Outwardly, M is work with a pulse: movement toward mastery, not merely activity.",
    gift: "You tend to get things moving and keep them moving until they have a life of their own.",
    challenge:
      "Momentum can outrun meaning. The invitation is to pause without losing the current.",
    invitation: "Choose the motion that is already true, and give it the dignity of a daily return.",
    complements: ["N", "Q", "F"],
  },
  N: {
    letter: "N",
    name: "Nurture",
    keywords: ["novelty", "nobility", "noticing", "nourishment"],
    essence:
      "N is the hand that notices before it fixes. It is nurture as a form of nobility — care without condescension.",
    inner: "Inwardly, N is a fine attention to what is young, tender, or not yet named.",
    outer: "Outwardly, N feeds: people, ideas, rooms, the unglamorous work of keeping life edible.",
    gift: "You tend to see what needs feeding while others are still arguing about the menu.",
    challenge:
      "Nurture can forget the nurturer. Novelty for its own sake can abandon what was just beginning to root.",
    invitation: "Feed what is already alive in you. Noticing yourself is not vanity; it is maintenance.",
    complements: ["A", "M", "Q"],
  },
  O: {
    letter: "O",
    name: "Opening",
    keywords: ["openness", "order", "opportunity", "origin"],
    essence:
      "O is the circle that does not close against the world. It is origin and opportunity in the same breath.",
    inner: "Inwardly, O is a willingness to be revised — openness as a discipline, not a mood.",
    outer: "Outwardly, O makes order that can still admit a guest, a chance, a second beginning.",
    gift: "You tend to leave a door unlatched in systems that prefer locks.",
    challenge:
      "Opening without order becomes a draft. Opportunity needs a frame, or it will not stay.",
    invitation: "Open one true door, and give the room behind it a simple, kept order.",
    complements: ["D", "P", "Q"],
  },
  P: {
    letter: "P",
    name: "Purpose",
    keywords: ["passion", "patience", "presence", "potential"],
    essence:
      "P is the point of the spear and the patience to carve it. Purpose here is presence with a direction.",
    inner: "Inwardly, P is a heat that wants a worthy object — passion that has agreed to wait.",
    outer: "Outwardly, P aims. It turns potential into a sequence of kept days.",
    gift: "You tend to give scattered energy a spine. People remember what they were for, near you.",
    challenge:
      "Purpose can harden into a script. Potential is larger than any single aim.",
    invitation: "Name the work that would still matter if it were slower. Then be present to the next inch of it.",
    complements: ["F", "E", "Y"],
  },
  Q: {
    letter: "Q",
    name: "Quest",
    keywords: ["quiet", "quality", "questioning", "quintessence"],
    essence:
      "Q is the rare letter of the real question. It prefers quiet quality to a crowded answer.",
    inner: "Inwardly, Q is a monastic curiosity — the wish to touch the quintessence and leave the rest.",
    outer: "Outwardly, Q goes looking. It will cross a desert for a better question.",
    gift: "You tend to refuse the cheap version. Your standards are a form of love.",
    challenge:
      "The quest can despise the ordinary day. Quiet is not the same as withdrawal from the living.",
    invitation: "Ask the one question that would change the week, and live near it without demanding an audience.",
    complements: ["N", "K", "M"],
  },
  R: {
    letter: "R",
    name: "Resonance",
    keywords: ["resilience", "reflection", "rhythm", "reverence"],
    essence:
      "R is the sounding board. It is the letter that answers vibration with a truer tone.",
    inner: "Inwardly, R reflects until the signal is clean — reverence as a way of listening.",
    outer: "Outwardly, R keeps rhythm: returning, recovering, making a life that can be danced as well as endured.",
    gift: "You tend to restore pitch — in a conversation, a team, a day that had gone sharp.",
    challenge:
      "Resonance can become mere echo. Resilience is not the same as never changing key.",
    invitation: "Listen for the note that is yours, and return to it once before the day is over.",
    complements: ["C", "T", "W"],
  },
  S: {
    letter: "S",
    name: "Synergy",
    keywords: ["strength", "serenity", "sincerity", "synthesis"],
    essence:
      "S is the braid. It is strength that comes from things agreeing to be more together than apart.",
    inner: "Inwardly, S seeks a serene honesty — sincerity that does not need to raise its voice.",
    outer: "Outwardly, S composes: people, ideas, efforts, the quiet architecture of we.",
    gift: "You tend to make combinations that no single part could have invented.",
    challenge:
      "Synergy can dissolve the self into the braid. Synthesis still needs a name that is yours.",
    invitation: "Join what wants joining, and keep one unsurrendered thread of your own.",
    complements: ["I", "E", "U"],
  },
  T: {
    letter: "T",
    name: "Transformation",
    keywords: ["truth", "trust", "tension", "transcendence"],
    essence:
      "T is the crossing. It is truth that costs something, and the tension that makes a new shape possible.",
    inner: "Inwardly, T will not live in a story that has expired. Trust is offered after the old skin is shed.",
    outer: "Outwardly, T marks thresholds: the hard conversation, the changed work, the life that no longer fits.",
    gift: "You tend to midwife necessary change — not by force, but by refusing the comfortable lie.",
    challenge:
      "Transformation can become a habit of crisis. Some truths want tending, not another fire.",
    invitation: "Name the one thing that is already over. Cross with as much tenderness as courage.",
    complements: ["B", "R", "Y"],
  },
  U: {
    letter: "U",
    name: "Unity",
    keywords: ["understanding", "uniqueness", "unfolding", "uprightness"],
    essence:
      "U is the vessel that holds difference without erasing it. Unity here includes the unique.",
    inner: "Inwardly, U is an unfolding toward wholeness — uprightness as a spine, not a pose.",
    outer: "Outwardly, U reconciles. It looks for the understanding that lets two true things stand together.",
    gift: "You tend to make a we that does not require anyone to become a smaller I.",
    challenge:
      "Unity can paper over a needed conflict. Understanding is not the same as agreement at any cost.",
    invitation: "Hold the whole, and let one unique edge of yourself remain unblended.",
    complements: ["I", "S", "X"],
  },
  V: {
    letter: "V",
    name: "Vision",
    keywords: ["vitality", "virtue", "vulnerability", "vocation"],
    essence:
      "V is the far-seeing that still has a pulse. Vision here is vocation with blood in it.",
    inner: "Inwardly, V is a vivid picture of a life that would be worth the risk of being seen.",
    outer: "Outwardly, V points. It names a direction with enough vitality that others can walk toward it.",
    gift: "You tend to see the shape of a future while it is still only weather, and to say so.",
    challenge:
      "Vision can refuse the humble near. Vulnerability is what keeps vocation from becoming a statue.",
    invitation: "Tell the true picture, then take one unglamorous step that belongs to it.",
    complements: ["D", "P", "W"],
  },
  W: {
    letter: "W",
    name: "Wonder",
    keywords: ["wisdom", "will", "witness", "weaving"],
    essence:
      "W is the open eye that has not agreed to be bored. Wonder is wisdom before it hardens into advice.",
    inner: "Inwardly, W stays available to being changed by what it sees.",
    outer: "Outwardly, W weaves and witnesses: it connects strands, and it is willing to be present without fixing.",
    gift: "You tend to restore astonishment — a rare and practical mercy.",
    challenge:
      "Wonder can float above the will to act. Witnessing is not always enough; some looms need a hand.",
    invitation: "Look again at something you think you already understand. Then weave one new connection.",
    complements: ["D", "L", "R"],
  },
  X: {
    letter: "X",
    name: "Edge",
    keywords: ["the rare", "the extreme", "the crossing", "the unknown"],
    essence:
      "X is the mark at the margin. It is the rare letter of the crossing, the unknown variable, the life that will not stay inside the lines.",
    inner: "Inwardly, X keeps a private wilderness — a refusal to be fully mapped.",
    outer: "Outwardly, X appears as the unusual choice, the sharp talent, the place where you do not resemble the family pattern.",
    gift: "You tend to bring the missing variable. Rooms become more honest when you arrive.",
    challenge:
      "The edge can become exile as a habit. Crossing is a journey; it is not a permanent address.",
    invitation: "Honor what is rare in you, and let it serve something that is not only yourself.",
    complements: ["B", "G", "U"],
  },
  Y: {
    letter: "Y",
    name: "Yielding",
    keywords: ["yearning", "youth", "yes", "the flexible axis"],
    essence:
      "Y is the fork that can still bend. It is yearning that has learned the word yes — and the word not-yet.",
    inner: "Inwardly, Y is a young, living hinge: a self that can turn without breaking.",
    outer: "Outwardly, Y adapts, consents, redirects. Flexibility becomes a form of intelligence.",
    gift: "You tend to keep options humane. You know how to say yes without becoming a door anyone may walk through.",
    challenge:
      "Yielding can postpone a necessary stand. Yearning needs, eventually, a chosen direction.",
    invitation: "Bend where bending is wisdom. Then let one yes become a spine.",
    complements: ["A", "P", "Z"],
  },
  Z: {
    letter: "Z",
    name: "Zenith",
    keywords: ["zeal", "zen", "final intensity", "the pure peak"],
    essence:
      "Z is the last letter and the high point. It is zeal that has been distilled — intensity without waste.",
    inner: "Inwardly, Z wants the pure version: the peak experience, the finished thought, the undiluted yes.",
    outer: "Outwardly, Z concentrates. It will spend a season on a single altitude.",
    gift: "You tend to raise the ceiling of a room simply by refusing the lukewarm.",
    challenge:
      "The zenith is a place to visit. Living only at the peak starves the climb, and the descent.",
    invitation: "Give your zeal one worthy summit, and practice coming down with as much grace as you climbed.",
    complements: ["Y", "G", "N"],
  },
};

export const TENSIONS: TensionPair[] = [
  {
    a: "A",
    b: "N",
    title: "Aspiration and Nurture",
    copy: "The drive to become meets the duty to tend. A recurring invitation: let ambition feed what is already alive, rather than abandoning it for a shinier summit.",
  },
  {
    a: "A",
    b: "Y",
    title: "Aspiration and Yielding",
    copy: "The upright will meets the flexible axis. You tend to live in the argument between striving and surrender — a productive argument, if neither side is exiled.",
  },
  {
    a: "B",
    b: "C",
    title: "Binding and Catalysis",
    copy: "The wish to hold meets the wish to change. Loyalty and ignition share a house in you; the work is to know when a bond is a home and when it is a lid.",
  },
  {
    a: "B",
    b: "F",
    title: "Binding and Freedom",
    copy: "Belonging and sovereignty pull in a living opposition. You tend to want a door that latches and a window that opens. Both are honest.",
  },
  {
    a: "B",
    b: "T",
    title: "Binding and Transformation",
    copy: "What you keep and what you must shed speak at once. The invitation is to let some loyalties complete their season without calling the ending a betrayal.",
  },
  {
    a: "B",
    b: "X",
    title: "Binding and Edge",
    copy: "The circle of belonging meets the mark at the margin. You may feel most yourself slightly outside the very rooms you help to make.",
  },
  {
    a: "C",
    b: "R",
    title: "Catalysis and Resonance",
    copy: "The spark and the sounding board. You start reactions and you also hear when the tone has gone wrong. Use both: ignite, then tune.",
  },
  {
    a: "D",
    b: "E",
    title: "Depth and Expansion",
    copy: "The well and the widening sky. You tend to want both the long descent and the larger room. Grow from a root, not from a rumor.",
  },
  {
    a: "D",
    b: "F",
    title: "Depth and Freedom",
    copy: "Discipline and the open gate. A classic, fruitful tension: the practice that makes you free, and the freedom that must not dissolve the practice.",
  },
  {
    a: "D",
    b: "O",
    title: "Depth and Opening",
    copy: "The descent meets the unlatched door. You can go far in and still admit weather. Let order serve openness, not replace it.",
  },
  {
    a: "D",
    b: "V",
    title: "Depth and Vision",
    copy: "The root system and the far picture. Vision without depth is a poster; depth without vision is a cellar. You carry the materials of both.",
  },
  {
    a: "D",
    b: "W",
    title: "Depth and Wonder",
    copy: "The long attention meets the open eye. Do not let mastery make you unimpressible, or wonder keep you from the unglamorous hour.",
  },
  {
    a: "D",
    b: "L",
    title: "Depth and Luminosity",
    copy: "The well and the lamp. You are asked to go down and to shine. Bring something back; do not hide the light in the shaft.",
  },
  {
    a: "F",
    b: "P",
    title: "Freedom and Purpose",
    copy: "The open corridor and the aimed spear. Direction need not be a cage, and freedom need not be aimless. You live in that negotiation.",
  },
  {
    a: "G",
    b: "X",
    title: "Growth and Edge",
    copy: "The tended field meets the unmarked margin. Increase is real in you, and so is the refusal to be only what grows on schedule.",
  },
  {
    a: "H",
    b: "I",
    title: "Horizon and Illumination",
    copy: "The far line and the inner lamp. Outer hope and inner sight can argue over who leads. Let them take watches.",
  },
  {
    a: "I",
    b: "S",
    title: "Illumination and Synergy",
    copy: "The private lamp and the public braid. You see alone and you make with others. Neither gift should colonize the other.",
  },
  {
    a: "I",
    b: "U",
    title: "Illumination and Unity",
    copy: "Interior uniqueness meets the wish to hold the whole. You are asked to belong without dimming the inner room.",
  },
  {
    a: "J",
    b: "K",
    title: "Journey and Kinship",
    copy: "The road and the table. You may feel torn between going and staying-for. The living answer is often a journey that still writes home.",
  },
  {
    a: "M",
    b: "N",
    title: "Momentum and Nurture",
    copy: "The current and the feeding. Speed can starve what it carries. You are invited to move, and to nourish the moving thing.",
  },
  {
    a: "N",
    b: "Q",
    title: "Nurture and Quest",
    copy: "The tending hand and the rare question. Care can postpone the search; the search can neglect the living. Both are your work.",
  },
  {
    a: "Y",
    b: "Z",
    title: "Yielding and Zenith",
    copy: "The bendable axis and the pure peak. Flexibility and intensity share this name. Climb, then know how to yield the summit back to air.",
  },
];

export function themeOf(letter: Letter): LetterTheme {
  return LEXICON[letter] ?? LEXICON.X;
}

export function findTension(a: Letter, b: Letter): TensionPair | undefined {
  return TENSIONS.find(
    (t) => (t.a === a && t.b === b) || (t.a === b && t.b === a),
  );
}
