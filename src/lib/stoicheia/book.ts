import { type Charge } from "./cratylus";
import { milesianValue } from "./milesian";
import { STOICHEIA, type Stoich } from "./letters";

export type Element = "fire" | "air" | "water" | "earth";

export type BreathKind = "vowel" | "bare" | "middle" | "aspirate" | "liquid" | "double" | "edge";

export type MouthPlace = "open" | "lips" | "teeth" | "throat" | "nose" | "double" | "edge";

export type GrammarKind = "vowel" | "semivowel" | "mute";

export type ValueBand = "ones" | "tens" | "hundreds";

export type LetterBook = {
  letter: Stoich;
  spoken: string;
  greekName: string;
  order: number;
  orderLine: string;
  mouth: string;
  place: MouthPlace;
  placeLine: string;
  grammar: GrammarKind;
  grammarLine: string;
  element: Element;
  elementLine: string;
  breath: BreathKind;
  breathLine: string;
  charge: Charge;
  does: string;
  cratylus: string;
  asFirst: string;
  asLast: string;
  asMedial: string;
  asOnly: string;
  inHymn: string;
  inSoma: string;
  fails: string;
  works: string;
  valueBand: ValueBand;
  valueLine: string;
};

/**
 * The 24 as a book, not a list.
 * Sound from the mouth (Cratylus + the old grammar). Element from Empedocles via phonetics.
 * Bare / middle / aspirate is the mute series (ψιλά / μέσα / δασέα).
 * Semivowel is Dionysius Thrax’s ἡμίφωνα — liquids, the edge, the doubles.
 * Milesian weight is the same mark used as a number. ϛ ϟ ϡ never sit a name.
 */
export const BOOK: Record<string, LetterBook> = {
  Α: {
    letter: "Α",
    spoken: "alpha",
    greekName: "ἄλφα",
    order: 1,
    orderLine: "The first of the twenty-four. Night-mind. The civic day has just begun, and the fire is banked.",
    mouth: "The mouth opens. No collision. This is the first sound a person can make without choosing a wall. Nothing is stopped, nothing is cut. Air leaves, and that leaving is the letter.",
    place: "open",
    placeLine: "No wall. The jaw drops and the breath is the whole fact.",
    grammar: "vowel",
    grammarLine: "A vowel — φωνῆεν. Sung, never weighed as public work.",
    element: "air",
    elementLine: "Air — breath that has not yet met a surface.",
    breath: "vowel",
    breathLine: "The first of the seven. Moon. Becoming that does not ask permission.",
    charge: "open",
    does: "it opens",
    cratylus: "Plato’s mouth-doctrine treats alpha as the large and the open: what lets other sounds happen. A name that begins here has not yet chosen a wall. That is a gift and a delay.",
    asFirst: "The name enters by opening. Night-mind. A beginning that does not apologize for being unfinished.",
    asLast: "The name finishes by opening again. What looked like an ending is a second start. People will wait for a close that does not come.",
    asMedial: "In the middle, alpha is a pause that is still breath. The mouth opens between two collisions. A room appears inside the word.",
    asOnly: "The whole name is an opening. There is no public work on the page and no last hour different from the first. Live as a threshold, or find consonants elsewhere.",
    inHymn: "Moon. Selene. The tide. What starts here is allowed to be unfinished. Do not light it just to prove you can.",
    inSoma: "Alpha is not public work. If it leads the consonants, the fold has gone wrong.",
    fails: "You open every door and walk through none. Becoming becomes a habit of not arriving.",
    works: "You start the true thing before you have a speech for it. Other people can enter.",
    valueBand: "ones",
    valueLine: "One. The first unit. A beginning you can count on one finger.",
  },
  Β: {
    letter: "Β",
    spoken: "beta",
    greekName: "βῆτα",
    order: 2,
    orderLine: "The second. The first collision. Night has a lip now.",
    mouth: "The lips meet and voice. A soft wall. Something is held, then released with sound. You can hear the person inside the stop.",
    place: "lips",
    placeLine: "Both lips. Voiced. The door is a mouth.",
    grammar: "mute",
    grammarLine: "A mute stop — ἄφωνον — the middle of the lip series (Π Β Φ).",
    element: "earth",
    elementLine: "Earth — a stop you can hear from inside.",
    breath: "middle",
    breathLine: "The voiced member of Π Β Φ. Not bare, not breathed. The middle.",
    charge: "hold",
    does: "it stops on the lip",
    cratylus: "A voiced lip-stop is a vessel. It keeps, then speaks. The Cratylus treats such stops as what puts a bound on a thing so it can be named.",
    asFirst: "The name enters as a voiced stop. The door is already a mouth. Someone is speaking as they arrive.",
    asLast: "The name finishes on the lip. The last act is to hold, then let go with voice. An ending people can hear.",
    asMedial: "In the middle, beta is a soft wall the word has to pass. It keeps a beat, then voices it. A name with beta inside has a chamber.",
    asOnly: "The whole name is one voiced lip-stop. A vessel with no hymn. Public work without a private weather on the page.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work that keeps and then speaks. A vessel, not a blade. Use it to hold a city, a cup, a person — not to advertise the hold.",
    fails: "You keep everything behind the lip and call the silence depth. The room never hears the voice.",
    works: "You hold what is yours, then say it. The stop becomes a gift, not a lock.",
    valueBand: "ones",
    valueLine: "Two. The first pair. A unit that has already met another.",
  },
  Γ: {
    letter: "Γ",
    spoken: "gamma",
    greekName: "γάμμα",
    order: 3,
    orderLine: "The third. A hollow in the night.",
    mouth: "The tongue lifts in the throat and voices. A hollow. A cup you can hear. The sound has a room inside it before it leaves.",
    place: "throat",
    placeLine: "The back of the tongue. Voiced. Space you can hear.",
    grammar: "mute",
    grammarLine: "A mute stop — the middle of the throat series (Κ Γ Χ).",
    element: "earth",
    elementLine: "Earth — a stop that holds a space inside it.",
    breath: "middle",
    breathLine: "The voiced member of Κ Γ Χ. A cup, not a click, not a scrape.",
    charge: "hold",
    does: "it cups",
    cratylus: "Gamma is the gluey and the hollow: what gathers a shape by making a space, not by cutting one. A name that cups can keep a craft.",
    asFirst: "The name enters by making a hollow. Room for something that is not here yet. People step into a space, not a point.",
    asLast: "The name finishes as a cup. It leaves a place, not a period. The last fact is a room.",
    asMedial: "In the middle, gamma holds a hollow between other marks. The word has an inside. Craft lives there.",
    asOnly: "The whole name is one voiced hollow. A cup with no hymn. The public work is to keep a space, not to fill the air.",
    inHymn: "Not a vowel.",
    inSoma: "Public work that holds a hollow. Craft, not a shout. A workshop, a hull, a throat that knows how to keep.",
    fails: "You make rooms and never invite anyone in. The hollow becomes a hide.",
    works: "You keep a space that other people can work in. The cup is used.",
    valueBand: "ones",
    valueLine: "Three. A unit that has become a group. The first small crowd.",
  },
  Δ: {
    letter: "Δ",
    spoken: "delta",
    greekName: "δέλτα",
    order: 4,
    orderLine: "The fourth. Two sides meet and stay met.",
    mouth: "The tongue touches the teeth and voices. A bind. Two sides meet and do not bounce off. The stop has loyalty in it.",
    place: "teeth",
    placeLine: "Tongue to the ridge behind the teeth. Voiced. A join you can hear.",
    grammar: "mute",
    grammarLine: "A mute stop — the middle of the tooth series (Τ Δ Θ).",
    element: "earth",
    elementLine: "Earth — a stop that joins.",
    breath: "middle",
    breathLine: "The voiced member of Τ Δ Θ. Not a bare halt, not a holy breath. A bind.",
    charge: "stay",
    does: "it binds",
    cratylus: "Delta is binding and deciding. The mouth puts two things together and leaves them together. A name that binds has already made a promise.",
    asFirst: "The name enters already bound. A promise is in the first mark. People meet a decision, not a maybe.",
    asLast: "The name finishes by binding. The last act is to keep two things together. An ending that is a knot.",
    asMedial: "In the middle, delta is the join the word is built around. Other letters arrive and leave; this one keeps them related.",
    asOnly: "The whole name is one voiced bind. A knot with no hymn. The public work is loyalty, or a decision that will not come undone.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work of joining. Loyalty, a knot, a vote that stays. Do not bind what should be able to leave.",
    fails: "You bind everything so nothing can move. Loyalty becomes a trap.",
    works: "You keep the two things that actually belong together, and you let the rest unbind.",
    valueBand: "ones",
    valueLine: "Four. A square unit. Something that can stand.",
  },
  Ε: {
    letter: "Ε",
    spoken: "epsilon",
    greekName: "ἒ ψιλόν",
    order: 5,
    orderLine: "The fifth. The short follow. A message in the night.",
    mouth: "A short open follow. The breath goes on without climbing. The lips do not round. The jaw does not drop as far as alpha. It is a step, not a room.",
    place: "open",
    placeLine: "Open, short, unrounded. A crossing of air.",
    grammar: "vowel",
    grammarLine: "A vowel. Mercury. The short breath that carries a word across a boundary.",
    element: "air",
    elementLine: "Air — the short breath that carries a message.",
    breath: "vowel",
    breathLine: "The second of the seven. Hermes. Crossing, speech, the theft of a locked meaning.",
    charge: "open",
    does: "it follows",
    cratylus: "Epsilon is the letter of going-after and of the short true word. It does not stay to be worshipped. It delivers, then leaves.",
    asFirst: "The name enters as a crossing. Speech before a house. A messenger is already on the road.",
    asLast: "The name finishes mid-sentence. A messenger who does not stay for the answer. People will feel the door still swinging.",
    asMedial: "In the middle, epsilon is the short follow between two larger facts. It carries one of them toward the other. Do not ask it to be a house.",
    asOnly: "The whole name is one short crossing. No consonant to land on. Live as a message, or borrow a body from the city.",
    inHymn: "Hermes. Carry one true word across a boundary. Do not pretend the boundary was not there.",
    inSoma: "Not a consonant.",
    fails: "You never stop crossing. Every room is a corridor. No one can leave a message for you.",
    works: "You take the one word that was locked and put it where it can be heard. Then you go.",
    valueBand: "ones",
    valueLine: "Five. A handful. The last small count before the skipped numeral.",
  },
  Ζ: {
    letter: "Ζ",
    spoken: "zeta",
    greekName: "ζῆτα",
    order: 6,
    orderLine: "The sixth letter, and the seventh number. Between Ε and Η the numeral ϛ sits — never a name-letter.",
    mouth: "A seethe. Voice and cut together. Rare in Greek, and it sounds like it. The tongue is at the teeth and the air is already an edge.",
    place: "edge",
    placeLine: "Teeth and voice and cut. Neither a clean stop nor a clean vowel.",
    grammar: "semivowel",
    grammarLine: "A semivowel — ἡμίφωνον — the leftover sound. Half breath, half blow.",
    element: "fire",
    elementLine: "Fire — a rare edge that will not sit still.",
    breath: "edge",
    breathLine: "Not a mute, not a hymn. The old tables leave zeta with sigma as a cut of air that has a voice.",
    charge: "cut",
    does: "it seethes",
    cratylus: "Zeta is shaking and seething: the sound of a thing that will not be a clean office. Use it as heat. Do not ask it for a title.",
    asFirst: "The name enters already in motion and already cut. No quiet threshold. People meet heat first.",
    asLast: "The name finishes as a hiss that has a voice. It will not close cleanly. The last sound keeps working after the mouth has left.",
    asMedial: "In the middle, zeta is a rare heat the word has to pass through. One seethe. Do not stack them.",
    asOnly: "The whole name is one seethe. No hymn, no clean stop. Public work that will not look like a job.",
    inHymn: "Not a vowel.",
    inSoma: "Public work that will not be a clean office. Use it as heat, not as a title. A name that lives here lives on an edge.",
    fails: "You seethe at everything so nothing can be a craft. Heat without a forge.",
    works: "You put the rare heat where a stuck thing needed to move, and then you stop.",
    valueBand: "ones",
    valueLine: "Seven. The letter skipped the seat of ϛ. Six was never a name. Zeta is already past the leftover numeral.",
  },
  Η: {
    letter: "Η",
    spoken: "eta",
    greekName: "ἦτα",
    order: 7,
    orderLine: "The seventh. The long open. Desire that has time.",
    mouth: "A long open. The breath stays. The jaw is more open than epsilon and it does not hurry. This is the vowel of taking time.",
    place: "open",
    placeLine: "Open, long, unrounded. Air that is willing to remain.",
    grammar: "vowel",
    grammarLine: "A vowel. Venus. The long note of the hymn.",
    element: "air",
    elementLine: "Air held long — the vowel of binding.",
    breath: "vowel",
    breathLine: "The third of the seven. Aphrodite. Binding that is not yet a chain.",
    charge: "open",
    does: "it stretches",
    cratylus: "Eta is length and wanting. The mouth stays open because something is not finished. Stay long enough to see whether it is love or a net.",
    asFirst: "The name enters already wanting, and already taking time. The first fact is duration.",
    asLast: "The name finishes on a long open. It does not snap shut. People will feel the last note still in the room.",
    asMedial: "In the middle, eta is the long held breath between two other facts. The name has a want that is not the beginning or the end.",
    asOnly: "The whole name is one long open. Desire without a body of consonants. Live as a note, or find a city that will hold you.",
    inHymn: "Aphrodite. Binding that is not yet a chain. Stay long enough to see which. Do not call every long note love.",
    inSoma: "Not a consonant.",
    fails: "You stretch every hour so nothing can finish. Wanting becomes the whole work.",
    works: "You stay with the one bond that is real, long enough for it to become visible.",
    valueBand: "ones",
    valueLine: "Eight. A long unit. Two fours. Time you can still hold in one hand.",
  },
  Θ: {
    letter: "Θ",
    spoken: "theta",
    greekName: "θῆτα",
    order: 8,
    orderLine: "The eighth. The last of the ones. A stop that has been given air.",
    mouth: "The tongue at the teeth, and breath through. A stop that has been given air. The halt is holy because it still has breath in it.",
    place: "teeth",
    placeLine: "Tongue to the teeth, with breath. The wall is open on purpose.",
    grammar: "mute",
    grammarLine: "A mute stop — the breathed member of Τ Δ Θ. δασύ.",
    element: "fire",
    elementLine: "Fire — the tooth-stop with breath in it.",
    breath: "aspirate",
    breathLine: "The aspirate of the tooth series. Not bare, not merely voiced. A halt that still has flame.",
    charge: "cut",
    does: "it breathes a stop",
    cratylus: "Theta is the placed and the offered: a stop you can still breathe through. The old tables treat it as a mark you set down, not a wall you hide behind.",
    asFirst: "The name enters as a holy stop — a halt that has breath. Something is being placed on the threshold.",
    asLast: "The name finishes with breath through a wall. An ending that still has air in it. Not a slam.",
    asMedial: "In the middle, theta is a breathed halt the word has to observe. A small rite inside the name.",
    asOnly: "The whole name is one breathed stop. A placement with no hymn. Public work that is both a halt and a flame.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work that is both a halt and a flame. Do not use it only as a blade. Place something. Let people breathe through the halt.",
    fails: "You make every pause a ritual so no one can move. Holiness becomes delay.",
    works: "You stop the room long enough to set one true thing down, and then the air goes on.",
    valueBand: "ones",
    valueLine: "Nine. The last of the ones. After this the mouth starts counting by tens.",
  },
  Ι: {
    letter: "Ι",
    spoken: "iota",
    greekName: "ἰῶτα",
    order: 9,
    orderLine: "The ninth. The first ten. A shaft, not a room.",
    mouth: "The thinnest breath. It goes through. The tongue is high, the opening is a slit. A point of air. Not a room.",
    place: "open",
    placeLine: "The narrowest open. A shaft. Almost a cut already.",
    grammar: "vowel",
    grammarLine: "A vowel. The sun. One shaft of the hymn.",
    element: "air",
    elementLine: "Air as a point — the piercing.",
    breath: "vowel",
    breathLine: "The fourth of the seven. Helios. The piercing that makes a day visible.",
    charge: "cut",
    does: "it pierces",
    cratylus: "Iota is thinness and going-through. Plato gives it to what is slender, what moves through a thing without becoming the thing. Tell the true thing. Leave room for the body that hears it.",
    asFirst: "The name enters as a single true thing. No weather yet. Only light. People meet a point, not a climate.",
    asLast: "The name finishes as a point. It does not linger to be liked. The last fact is sharp and small.",
    asMedial: "In the middle, iota is a shaft through the word. A thin true thing the other letters have to live with.",
    asOnly: "The whole name is one shaft. Light without a house. Live as a true thing, or you will become only a needle.",
    inHymn: "Helios. Tell the true thing. Leave room for the body that hears it. A shaft is not a hearth.",
    inSoma: "Not a consonant.",
    fails: "You pierce every room and call it honesty. No one can sit near the light.",
    works: "You say the one thin true thing, then you stop talking so the body can use it.",
    valueBand: "tens",
    valueLine: "Ten. The first measure. A unit has become a decade of the mouth.",
  },
  Κ: {
    letter: "Κ",
    spoken: "kappa",
    greekName: "κάππα",
    order: 10,
    orderLine: "The tenth. A catch in the throat. Night’s lock.",
    mouth: "The throat closes, no voice. A catch. The bare stop of the back of the mouth. Something is about to be said and is not said yet.",
    place: "throat",
    placeLine: "The back of the tongue, unvoiced, no extra breath. A lock.",
    grammar: "mute",
    grammarLine: "A mute stop — the bare member of Κ Γ Χ. ψιλόν.",
    element: "earth",
    elementLine: "Earth — the unvoiced throat-stop.",
    breath: "bare",
    breathLine: "The bare of the throat series. No voice, no extra breath. A clean catch.",
    charge: "hold",
    does: "it catches in the throat",
    cratylus: "Kappa is the halt at the back of the mouth: a no that has no speech in it yet. Useful as a lock. Deadly as a personality.",
    asFirst: "The name enters as a catch. Something is about to be said and is not said yet. People meet a held breath.",
    asLast: "The name finishes in the throat. A last hold. A refusal to be easy. The door clicks.",
    asMedial: "In the middle, kappa is a lock the word must pass. A craft-catch. One clean no inside the name.",
    asOnly: "The whole name is one bare catch. A lock with no hymn. The public work is keeping, or refusing.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work of catching and keeping. A lock, a craft, a no that has no speech in it. Do not live only as a lock.",
    fails: "You catch every word in the throat so nothing can be given. The lock becomes the house.",
    works: "You keep the one thing that should be kept, and you let the rest be said.",
    valueBand: "tens",
    valueLine: "Twenty. A double ten. A measure that has already repeated.",
  },
  Λ: {
    letter: "Λ",
    spoken: "lambda",
    greekName: "λάμβδα",
    order: 11,
    orderLine: "The eleventh. The tongue yields. The first liquid of the night.",
    mouth: "The tongue yields. Air slides around it. No wall is completed. This is the smooth. People can come in.",
    place: "teeth",
    placeLine: "The tongue near the teeth, and air around it. A slide, not a stop.",
    grammar: "semivowel",
    grammarLine: "A semivowel — the first liquid. Binding without a grip.",
    element: "water",
    elementLine: "Water — the liquid that will not make a wall.",
    breath: "liquid",
    breathLine: "A binding sound. Not a stop. Not a hymn. Plato’s letter of the smooth.",
    charge: "stay",
    does: "it yields",
    cratylus: "Lambda is smoothness and gliding. The mouth refuses a collision. A name that yields can still bind — the way water binds a stone by going around it.",
    asFirst: "The name enters by yielding. A smooth threshold. People can come in without knocking the lip.",
    asLast: "The name finishes without a collision. It leaves the way water leaves a stone. No last blow.",
    asMedial: "In the middle, lambda is the yield the word is built on. If it doubles — ΛΛ — the tongue yields twice. The name will not let the first yield finish.",
    asOnly: "The whole name is one yield. Water with no hymn and no stop. Public work that binds without gripping.",
    inHymn: "Not a vowel.",
    inSoma: "Public work that binds without gripping. Loyalty that still has a door. A name that lives here should remain enterable.",
    fails: "You yield so completely that nothing is kept. Smoothness becomes absence.",
    works: "You let people in and you still know which stone is yours.",
    valueBand: "tens",
    valueLine: "Thirty. Three tens. A measure that has become a small host.",
  },
  Μ: {
    letter: "Μ",
    spoken: "mu",
    greekName: "μῦ",
    order: 12,
    orderLine: "The twelfth. Last of the night offices. A hum. Gathering.",
    mouth: "The lips close and the sound stays in the face. Gathering. A hum. The city can still be fed from here.",
    place: "nose",
    placeLine: "Lips closed, air through the nose. The sound never leaves the face entirely.",
    grammar: "semivowel",
    grammarLine: "A semivowel — the inward liquid of the lips. Gathering.",
    element: "water",
    elementLine: "Water — the nasal that gathers inward.",
    breath: "liquid",
    breathLine: "A binding sound. Held in the face, not thrown. Night’s last office is a store-room.",
    charge: "stay",
    does: "it gathers",
    cratylus: "Mu is closing-in and gathering. The mouth keeps the sound as a store. A name that gathers can feed a room — or hoard it.",
    asFirst: "The name enters already gathering. A room is being made in the first mark. People arrive to a store, not a speech.",
    asLast: "The name finishes as a hum. What was said stays in the mouth a moment longer. The last fact is kept.",
    asMedial: "In the middle, mu is the store-room of the word. Other letters come and go. This one keeps grain.",
    asOnly: "The whole name is one gather. A hum with no hymn. Public work of feeding, storing, making a city possible.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work of gathering. People, grain, a city that can still be fed. Do not hoard the store and call it care.",
    fails: "You gather everything and release nothing. The store becomes a tomb.",
    works: "You keep enough, and you feed the room that is actually here.",
    valueBand: "tens",
    valueLine: "Forty. Four tens. A measure that can provision a small house.",
  },
  Ν: {
    letter: "Ν",
    spoken: "nu",
    greekName: "νῦ",
    order: 13,
    orderLine: "The thirteenth. First of the day watch. Interior. The inside of a word.",
    mouth: "The tongue closes and the sound stays in. Interior. You hear the inside of the word more than the edge of it.",
    place: "nose",
    placeLine: "Tongue closed, air through the nose. An inside, not a throw.",
    grammar: "semivowel",
    grammarLine: "A semivowel — Plato’s letter of the inside.",
    element: "water",
    elementLine: "Water — the inward nasal.",
    breath: "liquid",
    breathLine: "A binding sound that stays in. The first day-letter is not a sunrise. It is an interior.",
    charge: "stay",
    does: "it stays in",
    cratylus: "Nu is inwardness. The sound does not throw itself at the room. A name that stays in has a hearth — or a hide.",
    asFirst: "The name enters already interior. The first fact is an inside. People meet a private life that is not yet a performance.",
    asLast: "The name finishes inward. It does not throw the last sound at the room. The last fact is kept in.",
    asMedial: "In the middle, nu is the interior the word is built around. A hearth inside the name.",
    asOnly: "The whole name is one interior. A kept sound with no hymn. Public work that is a hearth, not a speech.",
    inHymn: "Not a vowel.",
    inSoma: "Public work that keeps an interior. A hearth that is not a performance. Let one person in. Do not call the lock a mystery.",
    fails: "You stay so far in that no one can find the hearth. Interior becomes exile.",
    works: "You keep an inside, and you let the right person sit at it.",
    valueBand: "tens",
    valueLine: "Fifty. Five tens. A measure that has become a company.",
  },
  Ξ: {
    letter: "Ξ",
    spoken: "xi",
    greekName: "ξεῖ",
    order: 14,
    orderLine: "The fourteenth. Two collisions in one mark: throat-stop and cut of air.",
    mouth: "Two collisions in one seat: a throat-stop and a cut of air. Κ + Σ. The mouth does two civic acts before the next letter arrives.",
    place: "double",
    placeLine: "Throat, then edge. Two blows. Heavier on purpose.",
    grammar: "semivowel",
    grammarLine: "A double — two mutes’ work in one mark. The old tables weigh it as two.",
    element: "fire",
    elementLine: "Fire — a double blow.",
    breath: "double",
    breathLine: "A double letter. Two civic acts in one seat. Heavier on purpose.",
    charge: "cut",
    does: "it doubles the blow",
    cratylus: "Xi is the doubled blow. Not a mood. A fact of spelling: one mark, two collisions. A name that starts here has no single, simple threshold.",
    asFirst: "The name enters already twice. No single, simple threshold. People meet two jobs at the door.",
    asLast: "The name finishes with two collisions. An ending that will not be quiet. The last act hits twice.",
    asMedial: "In the middle, xi is a double blow the word has to survive. Name both jobs. Do not pretend it is one soft letter.",
    asOnly: "The whole name is one double blow. Two offices, no hymn. The public work is already too much for one title.",
    inHymn: "Not a vowel.",
    inSoma: "The office, if it leads, is a double blow. Do not pretend it is a soft job. Say both collisions out loud.",
    fails: "You hit twice so no one can answer. The double becomes cruelty.",
    works: "You do both jobs that the mark actually contains, and you name them both.",
    valueBand: "tens",
    valueLine: "Sixty. Six tens. A measure that has already become a burden.",
  },
  Ο: {
    letter: "Ο",
    spoken: "omicron",
    greekName: "ὂ μικρόν",
    order: 15,
    orderLine: "The fifteenth. A short round. A decision in the mouth.",
    mouth: "A short round. The lips make a circle and close it. Not the long harvest of omega. A decision, small and finished.",
    place: "open",
    placeLine: "Rounded, short, closed. Air as a circle that has already chosen.",
    grammar: "vowel",
    grammarLine: "A vowel. Mars. Force that has chosen.",
    element: "air",
    elementLine: "Air as a closed circle — short, decided.",
    breath: "vowel",
    breathLine: "The fifth of the seven. Ares. Fight the thing that is actually on you.",
    charge: "close",
    does: "it rounds",
    cratylus: "Omicron is the small close. The mouth has made a circle. Options are no longer the point. Fight the thing that is actually on you, and put the rest down.",
    asFirst: "The name enters already decided. A mouth that has made a circle. People meet a choice, not a climate.",
    asLast: "The name finishes as a short close. No long farewell. The last fact is a decision.",
    asMedial: "In the middle, omicron is a small closed circle the word passes through. A decision that is not the ending yet.",
    asOnly: "The whole name is one short close. Force without consonants. Live as a decision, or you will become only a fist.",
    inHymn: "Ares. Fight the thing that is actually on you. Put the rest down. A circle is not a war with everyone.",
    inSoma: "Not a consonant.",
    fails: "You close every question so nothing can be learned. Decision becomes a weapon.",
    works: "You choose the one fight that is real, and you let the other circles stay open.",
    valueBand: "tens",
    valueLine: "Seventy. Seven tens. A measure that has the choir’s count in it.",
  },
  Π: {
    letter: "Π",
    spoken: "pi",
    greekName: "πεῖ",
    order: 16,
    orderLine: "The sixteenth. The last of the tens. A door closed from the outside.",
    mouth: "The lips shut. No voice. The bare lip-stop. A door closed from the outside. Something is being kept back on purpose.",
    place: "lips",
    placeLine: "Both lips, unvoiced, no extra breath. A closed door.",
    grammar: "mute",
    grammarLine: "A mute stop — the bare member of Π Β Φ. ψιλόν.",
    element: "earth",
    elementLine: "Earth — the unvoiced lip-stop.",
    breath: "bare",
    breathLine: "The bare of the lip series. No voice, no flame. A clean shut.",
    charge: "hold",
    does: "it shuts the lip",
    cratylus: "Pi is the closed lip. The mouth refuses to voice the stop. Useful. Do not live only as a lock that other people have to knock on.",
    asFirst: "The name enters as a closed lip. Something is being kept back on purpose. People meet a door, not a greeting.",
    asLast: "The name finishes by shutting. A last no that has no voice in it. The lip is the period.",
    asMedial: "In the middle, pi is a closed door inside the word. A kept thing. The name has a room that is not for everyone.",
    asOnly: "The whole name is one shut lip. A door with no hymn. Public work of keeping back.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work of the closed door. Useful. Do not live only as a lock. Open it for the one guest who is actually owed.",
    fails: "You shut every lip so nothing can be offered. The door becomes the whole house.",
    works: "You keep back what should be kept, and you open the lip when the guest is real.",
    valueBand: "tens",
    valueLine: "Eighty. Eight tens. After this the numeral ϟ sits — never a name-letter — and the hundreds begin.",
  },
  Ρ: {
    letter: "Ρ",
    spoken: "rho",
    greekName: "ῥῶ",
    order: 17,
    orderLine: "The seventeenth. The first hundred. The tongue shakes.",
    mouth: "The tongue shakes. Motion. Plato’s letter of rushing and breaking. Air is not stopped; it is agitated.",
    place: "teeth",
    placeLine: "The tongue at the ridge, shaking. A current, not a pool.",
    grammar: "semivowel",
    grammarLine: "A semivowel — the running liquid. Binding that will not sit.",
    element: "water",
    elementLine: "Water in motion — a current, not a pool.",
    breath: "liquid",
    breathLine: "A binding sound that will not sit. The liquid that runs. Often written with rough breath (ῥ) — a catch before the run.",
    charge: "run",
    does: "it runs",
    cratylus: "Rho is motion: rushing, breaking, flowing, trembling. The Cratylus gives it almost every verb of going. A name that runs will not stay at a desk.",
    asFirst: "The name enters already running. No still threshold. People meet a current.",
    asLast: "The name finishes in motion. It leaves while still going. The last fact is a road.",
    asMedial: "In the middle, rho is the current the word rides. If it doubles — ΡΡ — the run will not let the first shake finish.",
    asOnly: "The whole name is one run. A current with no hymn. Public work that is a road.",
    inHymn: "Not a vowel.",
    inSoma: "Public work that will not stay at a desk. A road, a current, a messenger. Sit down long enough to know which road.",
    fails: "You run from every still room and call it fate. Motion becomes flight.",
    works: "You take the one road that is actually yours, and you let the other currents pass.",
    valueBand: "hundreds",
    valueLine: "A hundred. The first civic weight. The table has gotten expensive.",
  },
  Σ: {
    letter: "Σ",
    spoken: "sigma",
    greekName: "σῖγμα",
    order: 18,
    orderLine: "The eighteenth. Air cut through a narrow. Final ς is the same letter.",
    mouth: "Air cut through a narrow. A hiss. The blow without a stop. The tongue makes a channel and the breath becomes an edge.",
    place: "edge",
    placeLine: "A narrow channel at the teeth. No voice required. A cut of air.",
    grammar: "semivowel",
    grammarLine: "A semivowel — the clean cut. Final ς is a writing tail, not a twenty-fifth seat.",
    element: "fire",
    elementLine: "Fire as air forced through a cut.",
    breath: "edge",
    breathLine: "Not a mute stop. A cut of air. Final ς is the same letter in a last seat.",
    charge: "cut",
    does: "it cuts air",
    cratylus: "Sigma is blowing, shivering, the cold edge of air. Useful for truth. Dangerous as a habit. A name that lives on the hiss will start to cut what it meant to name.",
    asFirst: "The name enters as a cut of air. Speech that has already chosen an edge. People meet a blade first.",
    asLast: "The name finishes as a hiss. An ending you can still hear after the mouth has closed. Final ς is this same fact, written with a tail.",
    asMedial: "In the middle, sigma is the edge the word is sharpened on. If it doubles — ΣΣ — the cut repeats. Use that rarely.",
    asOnly: "The whole name is one cut of air. An edge with no hymn. Public work of truth, or of habit-as-blade.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work of the edge. Useful for truth. Dangerous as a habit. Put the blade down when the true thing has been said.",
    fails: "You cut every sentence so nothing can be loved. The edge becomes the whole mouth.",
    works: "You use the hiss for the one true thing, and then you let the air be air again.",
    valueBand: "hundreds",
    valueLine: "Two hundred. A double civic weight. The edge has gotten expensive.",
  },
  Τ: {
    letter: "Τ",
    spoken: "tau",
    greekName: "ταῦ",
    order: 19,
    orderLine: "The nineteenth. The bare halt. A period at the end of a sentence.",
    mouth: "The tongue at the teeth. No voice. The bare halt. Nothing extra. A clean end, or a clean stop in the middle of work.",
    place: "teeth",
    placeLine: "Tongue to the ridge, unvoiced, no extra breath. A period.",
    grammar: "mute",
    grammarLine: "A mute stop — the bare member of Τ Δ Θ. ψιλόν.",
    element: "earth",
    elementLine: "Earth — the unvoiced tooth-stop.",
    breath: "bare",
    breathLine: "The bare of the tooth series. A clean halt. Law, craft, a period.",
    charge: "stay",
    does: "it halts",
    cratylus: "Tau is rest and the halt. The mouth stops a thing so it can be a fact. A name that halts can be law — or a full stop where a life needed a comma.",
    asFirst: "The name enters as a halt. The first act is to stop something. People meet a period before a sentence.",
    asLast: "The name finishes by stopping. A clean end. No extra breath. The last fact is a period.",
    asMedial: "In the middle, tau is the halt the word observes. A craft-stop. One clean no inside the day.",
    asOnly: "The whole name is one halt. A period with no hymn. Public work of law, or of ending.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work of the halt. Law, craft, a period at the end of a sentence. Do not halt what is still alive.",
    fails: "You stop everything so nothing can finish in its own time. Law becomes a lid.",
    works: "You halt the one thing that should stop, and you let the rest keep moving.",
    valueBand: "hundreds",
    valueLine: "Three hundred. A triple civic weight. The halt has the force of a city.",
  },
  Υ: {
    letter: "Υ",
    spoken: "upsilon",
    greekName: "ὖ ψιλόν",
    order: 20,
    orderLine: "The twentieth. A mix. The wet high vowel.",
    mouth: "A mix. The lips round and the breath stays high. Neither fully open nor fully closed. Weather in the mouth.",
    place: "open",
    placeLine: "Rounded and high. Air mixed. Not alpha’s room, not omicron’s fist.",
    grammar: "vowel",
    grammarLine: "A vowel. Zeus. Law that still weathers.",
    element: "air",
    elementLine: "Air mixed — the wet high vowel.",
    breath: "vowel",
    breathLine: "The sixth of the seven. Zeus as sky, not as a fist. A rule that can still welcome a stranger.",
    charge: "open",
    does: "it mixes",
    cratylus: "Upsilon is mixture and the wet high. The mouth will not give you a single weather. Keep one promise to a stranger. Keep one promise to yourself.",
    asFirst: "The name enters already mixed. Not a simple beginning. People meet weather, not a point.",
    asLast: "The name finishes as a mix. It will not give you a single last weather. The last fact is a sky.",
    asMedial: "In the middle, upsilon is the mix the word has to weather. A high wet note that is not the start or the harvest.",
    asOnly: "The whole name is one mix. Sky without consonants. Live as weather that can still keep a promise.",
    inHymn: "Zeus. Keep one promise to a stranger. Keep one promise to yourself. Law that still weathers is not a fist.",
    inSoma: "Not a consonant.",
    fails: "You mix every rule so nothing can be kept. Weather becomes an excuse.",
    works: "You let the sky change, and you still keep the one promise that makes a guest safe.",
    valueBand: "hundreds",
    valueLine: "Four hundred. A heavy civic weight. Weather that costs.",
  },
  Φ: {
    letter: "Φ",
    spoken: "phi",
    greekName: "φεῖ",
    order: 21,
    orderLine: "The twenty-first. The lip-stop with breath in it. A flare.",
    mouth: "The lips, and breath through them. A stop that has been given flame. Visible at once. No quiet lip.",
    place: "lips",
    placeLine: "Both lips, with breath. A door that shows its fire.",
    grammar: "mute",
    grammarLine: "A mute stop — the breathed member of Π Β Φ. δασύ.",
    element: "fire",
    elementLine: "Fire — the lip-stop with breath in it.",
    breath: "aspirate",
    breathLine: "The aspirate of the lip series. A flare. Appearance, light, a public flame.",
    charge: "cut",
    does: "it flares",
    cratylus: "Phi is the blown stop: a wall that has been given air on purpose. Visible. Useful as light. Deadly as a life spent only on display.",
    asFirst: "The name enters as a flare. Visible at once. No quiet lip. People meet light first.",
    asLast: "The name finishes as a flare. An ending people can see. The last fact is public.",
    asMedial: "In the middle, phi is the visible fire the word cannot hide. A public flame inside the name.",
    asOnly: "The whole name is one flare. Light with no hymn. Public work of showing.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work that shows. Appearance, light, a public flame. Do not live only as display. Light something that needs to be seen.",
    fails: "You flare at every door so nothing can be private. Light becomes vanity.",
    works: "You make visible the one thing that was hidden and needed to be seen, then you let the flame be ordinary.",
    valueBand: "hundreds",
    valueLine: "Five hundred. A weight of showing. The flare has a price.",
  },
  Χ: {
    letter: "Χ",
    spoken: "chi",
    greekName: "χεῖ",
    order: 22,
    orderLine: "The twenty-second. The throat-stop with breath. A scrape.",
    mouth: "The throat, and breath through it. A scrape. The back of the mouth on fire. The first contact is rough on purpose.",
    place: "throat",
    placeLine: "The back of the tongue, with breath. A rough wall.",
    grammar: "mute",
    grammarLine: "A mute stop — the breathed member of Κ Γ Χ. δασύ.",
    element: "fire",
    elementLine: "Fire — the throat-stop with breath in it.",
    breath: "aspirate",
    breathLine: "The aspirate of the throat series. A scrape. Useful when something false has stuck.",
    charge: "cut",
    does: "it scrapes",
    cratylus: "Chi is abrasion: a stop you can still breathe through, and the breath is rough. Useful on what is false. Do not scrape the living.",
    asFirst: "The name enters as a scrape. The first contact is rough on purpose. People meet heat at the back of the mouth.",
    asLast: "The name finishes in the throat with breath. Not a clean click. A last heat.",
    asMedial: "In the middle, chi is the abrasion the word applies to itself. Something false is being scraped out.",
    asOnly: "The whole name is one scrape. Rough fire with no hymn. Public work of taking something stuck off a surface.",
    inHymn: "Not a vowel.",
    inSoma: "Civic work that abrades. Useful when something false has stuck. Do not scrape the living. Name the false thing, then stop.",
    fails: "You scrape every surface so nothing can heal. Roughness becomes the whole craft.",
    works: "You take off the one false thing that had stuck, and you leave the living unharmed.",
    valueBand: "hundreds",
    valueLine: "Six hundred. A weight of abrasion. The scrape has a city’s force.",
  },
  Ψ: {
    letter: "Ψ",
    spoken: "psi",
    greekName: "ψεῖ",
    order: 23,
    orderLine: "The twenty-third. The other double: lip-stop and cut of air. Π + Σ.",
    mouth: "Two collisions: lip-stop and cut of air. Π + Σ. The other double. The mouth shuts, then hisses, in one seat.",
    place: "double",
    placeLine: "Lips, then edge. Two blows from the front of the mouth.",
    grammar: "semivowel",
    grammarLine: "A double — two civic acts in one mark. The soul-word ψυχή begins here: a fact of spelling, not a spell.",
    element: "fire",
    elementLine: "Fire — the other double blow.",
    breath: "double",
    breathLine: "A double letter. Two civic acts in one seat. Heavier on purpose.",
    charge: "cut",
    does: "it doubles the blow",
    cratylus: "Psi is the other doubled blow, from the lips. One mark, two collisions. If this leads the public work, name both jobs. The beginning of ψυχή is not a metaphysics. It is Π and Σ in one seat.",
    asFirst: "The name enters already twice, from the lips. No single first fact. People meet two edges at the door.",
    asLast: "The name finishes with lip and cut together. An ending that has two edges.",
    asMedial: "In the middle, psi is a double blow the word has to admit. Name both jobs. Do not call it a mood.",
    asOnly: "The whole name is one double blow from the lips. Two offices, no hymn.",
    inHymn: "Not a vowel. (The soul-word ψυχή begins here — a fact of spelling, not a spell.)",
    inSoma: "If this leads the public work, the office is a double blow. Name both jobs. Do not hide behind the soul-word.",
    fails: "You hit twice from the lips so the room cannot answer. The double becomes a performance of depth.",
    works: "You do both collisions the mark contains — the shut and the cut — and you say that they are two.",
    valueBand: "hundreds",
    valueLine: "Seven hundred. A near-last civic weight. Two blows at the price of a city.",
  },
  Ω: {
    letter: "Ω",
    spoken: "omega",
    greekName: "ὦ μέγα",
    order: 24,
    orderLine: "The last of the twenty-four. The long close. Harvest. Let it be last.",
    mouth: "A long round. The last vowel. Time in the mouth. It closes and keeps closing. Not omicron’s short decision — a harvest.",
    place: "open",
    placeLine: "Rounded, long, closing. Air as an ending that takes time.",
    grammar: "vowel",
    grammarLine: "A vowel. Kronos. The last note of the hymn.",
    element: "air",
    elementLine: "Air as harvest — the long close.",
    breath: "vowel",
    breathLine: "The last of the seven. Saturn. An ending that does not need theatre.",
    charge: "close",
    does: "it closes",
    cratylus: "Omega is the large close. The mouth has time, and it uses the time to end. Name the one thing that is already over. Let it be over.",
    asFirst: "The name enters already at the end. A strange start: harvest before planting. People meet a last note first.",
    asLast: "The name finishes as omega. The proper last. Let it be last. The pair alpha-and-omega is this fact, written as a road.",
    asMedial: "In the middle, omega is a harvest that is not yet the end of the word. A long close inside a life that still has letters after it.",
    asOnly: "The whole name is one long close. Harvest without consonants. Live as an ending that does not need a speech.",
    inHymn: "Kronos. Name the one thing that is already over. Let it be over. A last note is not a funeral unless you make it one.",
    inSoma: "Not a consonant.",
    fails: "You end everything so nothing can ripen. Harvest becomes a refusal to plant.",
    works: "You let the one thing that is over be over, and you do not perform the ending.",
    valueBand: "hundreds",
    valueLine: "Eight hundred. The last name-weight. After this the numeral ϡ sits — never a name-letter.",
  },
};

export function bookOf(letter: Stoich): LetterBook {
  return BOOK[letter] ?? BOOK.Α!;
}

export function elementOf(letter: Stoich): Element {
  return bookOf(letter).element;
}

export function bookGlance(letter: Stoich): string {
  const book = bookOf(letter);
  return `${book.spoken} — ${book.does}. ${book.elementLine} ${book.breathLine}`;
}

export type ElementMix = {
  fire: number;
  air: number;
  water: number;
  earth: number;
  lead: Element;
  tied: Element[];
  line: string;
};

const ELEMENT_NAMES: Record<Element, string> = {
  fire: "fire — breath through a stop, heat, a double blow",
  air: "air — the vowels, the sung weather",
  water: "water — the binding sounds, what gathers and yields",
  earth: "earth — the hard stops, what holds and halts",
};

export function elementMixOf(letters: Stoich[]): ElementMix {
  const mix: ElementMix = { fire: 0, air: 0, water: 0, earth: 0, lead: "air", tied: ["air"], line: "" };
  for (const letter of letters) mix[elementOf(letter)] += 1;
  const ranked = (["fire", "air", "water", "earth"] as Element[]).sort((a, b) => mix[b] - mix[a]);
  const lead = ranked[0] ?? "air";
  const tied = ranked.filter((el) => mix[el] === mix[lead] && mix[el] > 0);
  mix.lead = lead;
  mix.tied = tied.length > 0 ? tied : [lead];
  const count = letters.length;
  const leadPhrase =
    mix.tied.length > 1
      ? `split between ${mix.tied.join(" and ")}`
      : ELEMENT_NAMES[lead];
  mix.line =
    count === 0
      ? "No letters, no mouth."
      : `Of ${count} letter${count === 1 ? "" : "s"}, the mouth is mostly ${leadPhrase}. Fire ${mix.fire}, air ${mix.air}, water ${mix.water}, earth ${mix.earth} — counted, not folded.`;
  return mix;
}

export type LetterWalk = {
  letter: Stoich;
  index: number;
  place: "first" | "last" | "only" | "medial";
  book: LetterBook;
  roleLine: string;
  milesian: number;
};

export function walkLetters(letters: Stoich[]): LetterWalk[] {
  return letters.map((letter, index) => {
    const book = bookOf(letter);
    const place =
      letters.length === 1 ? "only" : index === 0 ? "first" : index === letters.length - 1 ? "last" : "medial";
    const roleLine =
      place === "only"
        ? book.asOnly
        : place === "first"
          ? book.asFirst
          : place === "last"
            ? book.asLast
            : book.asMedial;
    return { letter, index, place, book, roleLine, milesian: milesianValue(letter) };
  });
}

export const DIPHTHONGS: { pair: string; letters: [Stoich, Stoich]; line: string }[] = [
  { pair: "ΑΙ", letters: ["Α", "Ι"], line: "AI — opening into a shaft. Becoming that turns sharp." },
  { pair: "ΕΙ", letters: ["Ε", "Ι"], line: "EI — following into a shaft. The old ‘is’: a crossing that becomes true." },
  { pair: "ΟΙ", letters: ["Ο", "Ι"], line: "OI — a round that thins. Almost. A decision that has a point." },
  { pair: "ΥΙ", letters: ["Υ", "Ι"], line: "UI — mix into a shaft. Weather that becomes a point." },
  { pair: "ΑΥ", letters: ["Α", "Υ"], line: "AU — opening into a mix. A start that will not stay simple." },
  { pair: "ΕΥ", letters: ["Ε", "Υ"], line: "EU — following into a mix. The old ‘well’: a crossing that weathers." },
  { pair: "ΟΥ", letters: ["Ο", "Υ"], line: "OU — a round that mixes. The closed diphthong. Two closings that still move." },
  { pair: "ΗΙ", letters: ["Η", "Ι"], line: "EI written long — a stretch that thins. Desire that becomes a point." },
  { pair: "ΩΙ", letters: ["Ω", "Ι"], line: "OI written long — a harvest that thins. An ending with a shaft in it." },
];

export function diphthongsIn(letters: Stoich[]): { pair: string; at: number; line: string }[] {
  const found: { pair: string; at: number; line: string }[] = [];
  for (let i = 0; i < letters.length - 1; i += 1) {
    const pair = `${letters[i]}${letters[i + 1]}`;
    const hit = DIPHTHONGS.find((row) => row.pair === pair);
    if (hit) found.push({ pair: hit.pair, at: i, line: hit.line });
  }
  return found;
}

export function diphthongPartnersOf(letter: Stoich): typeof DIPHTHONGS {
  return DIPHTHONGS.filter((row) => row.letters.includes(letter as Stoich));
}

export function geminatesIn(letters: Stoich[]): { letter: Stoich; at: number; line: string }[] {
  const found: { letter: Stoich; at: number; line: string }[] = [];
  for (let i = 0; i < letters.length - 1; i += 1) {
    const letter = letters[i];
    if (!letter || letter !== letters[i + 1]) continue;
    const book = bookOf(letter);
    found.push({
      letter,
      at: i,
      line: `${letter}${letter} — ${book.spoken} twice. The mouth does it again (${book.does}) before the next letter. A doubled mark is one fact said again, not a new seat.`,
    });
  }
  return found;
}

/** Rough breathing (spiritus asper). A catch before the vowel, not a twenty-fifth letter. */
export function roughBreath(raw: string): boolean {
  return raw.normalize("NFD").includes("\u0314");
}

/** Iota subscript (ᾳ ῃ ῳ). The same letter as Ι, written small under a long vowel. */
export function iotaSubscript(raw: string): boolean {
  return raw.normalize("NFD").includes("\u0345");
}

/** Final sigma is Σ. The tail is a writing custom. */
export function hasFinalSigma(raw: string): boolean {
  return /ς/.test(raw);
}

export function bookComplete(): boolean {
  return STOICHEIA.every((letter) => Boolean(BOOK[letter])) && Object.keys(BOOK).length === 24;
}

export function letterLineOf(input: {
  mix: ElementMix;
  diphthongs: { pair: string; line: string }[];
  geminates: { letter: Stoich; line: string }[];
  rough: boolean;
  iotaUnder: boolean;
  finalSigma: boolean;
}): string {
  const bits = [input.mix.line];
  if (input.diphthongs.length > 0) {
    bits.push(`Sung pairs in the name: ${input.diphthongs.map((row) => row.pair).join(", ")}.`);
  }
  if (input.geminates.length > 0) {
    bits.push(input.geminates.map((row) => row.line).join(" "));
  }
  if (input.rough) {
    bits.push(
      "The name carries rough breath — a catch in the throat before a vowel. The ancients wrote it as a mark, not as a twenty-fifth letter.",
    );
  }
  if (input.iotaUnder) {
    bits.push("An iota sits under a long vowel. The same letter as Ι, written small. Not a new seat.");
  }
  if (input.finalSigma) {
    bits.push("Final ς is Σ. The tail is a writing custom, not another letter.");
  }
  return bits.join(" ");
}
