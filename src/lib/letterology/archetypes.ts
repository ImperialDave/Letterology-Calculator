import type { Archetype, Letter, LetterInventory, Triad } from "./types";
import { ALPHABET } from "./types";
import { themeOf } from "./lexicon";

interface LetterRole {
  letter: Letter;
  house: string;
  noun: string;
  adj: string;
  realm: string;
  tradition: string;
  myth: string;
  calling: string;
  method: string;
  field: string;
  doubled: string;
  invitation: string;
}

const ROLES: Record<Letter, LetterRole> = {
  A: {
    letter: "A",
    house: "House of the Seeker",
    noun: "Seeker",
    adj: "Rising",
    realm: "Threshold",
    tradition: "Pearson Seeker · Campbell's departure",
    myth: "Before there is a hero, there is only the honest ache to become.",
    calling:
      "You stand as the Seeker — the first figure of every true myth. Jung described this as the ego leaving a borrowed persona; Carol Pearson named it the Seeker. Wanting, in you, is not greed. It is soul-honesty: the refusal to live a life that is only costume.",
    method:
      "The manner is rising: you begin. You treat the unlived life as a vow rather than a mood, and you step toward it before the map is finished.",
    field:
      "The realm is the Threshold — the thin place between the known name and the true one. Contemplative teaching calls this the veil; the old stories call it the first gate.",
    doubled:
      "When the Seeker returns, appetite doubles and nothing is finished. Two beginnings will not make a self. Complete one crossing.",
    invitation: "Choose one threshold you already feel in the body, and cross it as if the new name were already true.",
  },
  B: {
    letter: "B",
    house: "House of the Caregiver",
    noun: "Caregiver",
    adj: "Devoted",
    realm: "Hearth",
    tradition: "Pearson Caregiver · the Great Mother",
    myth: "The oldest work after birth itself: making a world safe enough to grow in.",
    calling:
      "You stand as the Caregiver — kin to the Great Mother of every tradition. Pearson placed this figure among the ego's first tasks: to protect, feed, and keep. You make a home of two things that have chosen each other, and you do not call that small.",
    method:
      "The manner is devoted keeping. You hold what would scatter, without turning the hold into a cage. Belonging is your craft.",
    field:
      "The realm is the Hearth — the circle in which a nervous system can rest. Without a hearth, every other archetype is only weather.",
    doubled:
      "When the Caregiver returns, belonging thickens into fusion. Hold without gripping. Let the ones you tend have their own breath.",
    invitation: "Keep what is living. Release what has become a lid dressed as love.",
  },
  C: {
    letter: "C",
    house: "House of the Rebel",
    noun: "Rebel",
    adj: "Wild",
    realm: "Spark",
    tradition: "Pearson Outlaw · the necessary no",
    myth: "Every order that has gone to sleep needs a figure who will not pretend.",
    calling:
      "You stand as the Rebel — Pearson's Outlaw, the holy no that keeps a culture from dying of its own manners. You are not chaos for its own sake. You are the reason a still room does not stay dishonestly still.",
    method:
      "The manner is wild ignition. You start the reaction others only complain about. Curiosity, in you, carries a match.",
    field:
      "The realm is the Spark — the first honest sentence, the first refusal, the first flame that changes the air and cannot be unspoken.",
    doubled:
      "When the Rebel returns, ignition stacks and nothing is tended. Stay long enough to see whether the flame warms or only consumes.",
    invitation: "Start one reaction worth keeping, then give it a vessel so it can become a life.",
  },
  D: {
    letter: "D",
    house: "House of the Hermit",
    noun: "Hermit",
    adj: "Hidden",
    realm: "Well",
    tradition: "Tarot IX · Jung's inward turn",
    myth: "The lantern in the wilderness: wisdom that will not perform.",
    calling:
      "You stand as the Hermit — the Tarot's ninth mystery, Jung's necessary withdrawal. You prefer the root to the announcement. Depth is not shyness in you; it is a vocation.",
    method:
      "The manner is hidden descent. You give long attention to what is not yet clear, and you will not be hurried by those who live only at the surface.",
    field:
      "The realm is the Well — the shaft that changes whoever stays. What you fetch from below is meant, eventually, to be drunk in the open air.",
    doubled:
      "When the Hermit returns, the shaft goes deeper and the ladder is forgotten. Bring something back. Solitude is a method, not a citizenship.",
    invitation: "Let one private devotion become visible. Depth still wants a witness.",
  },
  E: {
    letter: "E",
    house: "House of the Explorer",
    noun: "Explorer",
    adj: "Open",
    realm: "Horizon",
    tradition: "Pearson Explorer · the wider world",
    myth: "The soul that will not confuse a familiar cage with a home.",
    calling:
      "You stand as the Explorer — Pearson's figure of freedom through distance. Where the Seeker leaves an old self, you leave an old map. You make more room than the situation asked for, and someone always needs that air.",
    method:
      "The manner is open widening. Feeling, in you, is a climate others can enter. You grow a life by walking into what you do not yet know how to name.",
    field:
      "The realm is the Horizon — the far line that organizes the walk. Expansion here is not escape; it is the body's knowledge that the world is larger than the wound.",
    doubled:
      "When the Explorer returns, space multiplies until nothing is intimate. Grow in one direction. A horizon is a guide, not a refusal to arrive.",
    invitation: "Expand toward a shoreline you can love, not toward every empty distance at once.",
  },
  F: {
    letter: "F",
    house: "House of the Fool",
    noun: "Fool",
    adj: "Free",
    realm: "Gate",
    tradition: "Tarot 0 · Pearson Fool · beginner's mind",
    myth: "The zero before the numbered life: sacred innocence with a staff and a cliff.",
    calling:
      "You stand as the Fool — the Tarot's unnumbered card, Pearson's holy beginner. This is not stupidity. It is uncoerced attention: a soul that has not yet agreed to be owned by its own résumé. Zen calls it beginner's mind; the old stories call it the open gate.",
    method:
      "The manner is free. You keep a corridor of air around the day. You move as the inner weather asks, and you will not be shamed for traveling light.",
    field:
      "The realm is the Gate — an opening that remains chosen. Freedom here is a discipline: the daily refusal to be herded by fear or fashion.",
    doubled:
      "When the Fool returns, the gate swings so wide that nothing is vowed. Stay freely. Fidelity is what keeps freedom from becoming weather.",
    invitation: "Keep the corridor of air, and give it one fidelity that is still yours.",
  },
  G: {
    letter: "G",
    house: "House of the Creator",
    noun: "Creator",
    adj: "Generative",
    realm: "Grove",
    tradition: "Pearson Creator · the living work",
    myth: "The impulse that cannot only witness — it must make.",
    calling:
      "You stand as the Creator — Pearson's maker of worlds, however small. Growth, in you, has roots. You do not merely accumulate; you tend until something living stands where there was only intention.",
    method:
      "The manner is generative. Gratitude is your soil. You increase what you touch because you stay with it through the unglamorous season.",
    field:
      "The realm is the Grove — lives, crafts, and children of the mind that grow because someone refused to leave.",
    doubled:
      "When the Creator returns, the green thickens until nothing can winter. Allow a fallow. Even a grove needs a clearing.",
    invitation: "Tend one living work as if increase were already promised — and let it rest when it asks.",
  },
  H: {
    letter: "H",
    house: "House of the Prophet",
    noun: "Prophet",
    adj: "Far-seeing",
    realm: "Vista",
    tradition: "The prophetic voice · the vision-holder",
    myth: "The one who sees the farther order and must speak it without becoming a tyrant of hope.",
    calling:
      "You stand as the Prophet — not a fortune-teller, but the figure who holds a longer honesty. Every tradition has this voice: the one who will not let the tribe forget what it said it loved. Hope, in you, has a backbone, and a door left unlatched.",
    method:
      "The manner is far-seeing. You offer the longer view without forcing anyone to kneel to it. Hospitality is how your vision stays human.",
    field:
      "The realm is the Vista — the far line that organizes today's table. A prophecy that cannot set a plate is only weather talk.",
    doubled:
      "When the Prophet returns, the line recedes and the near is neglected. Set the nearest table. The future is fed by the present meal.",
    invitation: "Keep the far line, and be hospitable to the person already in the room.",
  },
  I: {
    letter: "I",
    house: "House of the Sage",
    noun: "Sage",
    adj: "Lucid",
    realm: "Lamp",
    tradition: "Pearson Sage · Jung's Wise Old One",
    myth: "Insight before applause: the inner lamp that does not need a stage.",
    calling:
      "You stand as the Sage — Pearson's seeker of truth, Jung's Wise Old Man and Wise Old Woman. You would rather understand than win. Imagination lives in you first as a private room, and only later as a gift to the table.",
    method:
      "The manner is lucid. You keep the inner light faithful before it is shown. Integrity, for you, is when the inside and the outside begin to rhyme.",
    field:
      "The realm is the Lamp — illumination meant, eventually, for shared work. A locked study is only half a wisdom.",
    doubled:
      "When the Sage returns, the study locks and the village goes unlit. Speak one private seeing. Light unused is furniture.",
    invitation: "Bring one unused insight into speech, and let it be tested by ordinary life.",
  },
  J: {
    letter: "J",
    house: "House of the Hero",
    noun: "Hero",
    adj: "Steadfast",
    realm: "Road",
    tradition: "Jung / Campbell · the heroic journey",
    myth: "The one who leaves, suffers a real cost, and returns with something the village can use.",
    calling:
      "You stand as the Hero — Campbell's traveler, Jung's figure of the ego learning courage. This is not swagger. It is motion with a conscience: joy that does not look away from what is unjust. You move a life from here to a more honest there.",
    method:
      "The manner is steadfast travel. You place unlikely things beside each other until they speak. You take the next mile even when the prize is not visible.",
    field:
      "The realm is the Road — the honest miles between a smaller self and a larger duty. Arrival is part of heroism; so is coming home.",
    doubled:
      "When the Hero returns, the pack never drops. Arrive somewhere. A journey that cannot rest becomes only exile with better branding.",
    invitation: "Take the next honest mile, and let joy be part of the equipment, not a prize withheld until the end.",
  },
  K: {
    letter: "K",
    house: "House of the Orphan",
    noun: "Orphan",
    adj: "Kindred",
    realm: "Table",
    tradition: "Pearson Orphan · the search for belonging",
    myth: "The child who learns that home is made, not merely inherited.",
    calling:
      "You stand as the Orphan — Pearson's figure of the fall from innocence into a world that is not always kind. This is not a wound to hide. It is the beginning of real kinship: knowledge that wants to be useful to someone named. You understand by standing with.",
    method:
      "The manner is kindred. You knit family, chosen family, the small republic of those who know a real name. Kindness, in you, is a form of intelligence.",
    field:
      "The realm is the Table — the place where the excluded are fed and the insider is asked to make room. The key is meant for the stranger as well as the kin.",
    doubled:
      "When the Orphan returns, the room can close around the wound. Leave a place for the one who does not yet belong. Belonging that cannot welcome is only a prettier exile.",
    invitation: "Offer one precise kindness to kin, then one to someone who has no claim on you yet.",
  },
  L: {
    letter: "L",
    house: "House of the Lover",
    noun: "Lover",
    adj: "Radiant",
    realm: "Flame",
    tradition: "Pearson Lover · Eros and union",
    myth: "The one who will not live uncommitted to beauty, body, or beloved.",
    calling:
      "You stand as the Lover — Pearson's figure of union, the erotic current Jung treated as a path toward the Self. Light, in you, has chosen a person, a craft, a world. Love is how you lead: you go first in warmth, and you stay after the first shine.",
    method:
      "The manner is radiant. Care is your form of authority. You make a room visible because you will not hoard the lamp.",
    field:
      "The realm is the Flame — not the firework, the hearth-fire that cooks and consoles. Passion here is loyalty with heat.",
    doubled:
      "When the Lover returns, brightness performs and fatigue hides. Rest the lamp. Love that cannot sleep becomes display.",
    invitation: "Shine on one true thing. Do not spend the whole light on the hallway of almost-loves.",
  },
  M: {
    letter: "M",
    house: "House of the Warrior",
    noun: "Warrior",
    adj: "Swift",
    realm: "Wheel",
    tradition: "Pearson Warrior · disciplined action",
    myth: "Strength that has agreed to serve something, not merely to win.",
    calling:
      "You stand as the Warrior — Pearson's figure of boundaries and brave action. This is not violence. It is mass in motion: a practice that has begun to carry itself. You give scattered energy a spine.",
    method:
      "The manner is swift and rhythmic. You move toward mastery, not merely activity. The day's work has a pulse, and you return to it.",
    field:
      "The realm is the Wheel — action that continues. A warrior's holiness is consistency, not the single blow.",
    doubled:
      "When the Warrior returns, speed outruns meaning. Pause without losing the current. A fight without a worthy object is only restlessness in armor.",
    invitation: "Give the true motion the dignity of a daily return, and know which battles are beneath you.",
  },
  N: {
    letter: "N",
    house: "House of the Healer",
    noun: "Healer",
    adj: "Gentle",
    realm: "Garden",
    tradition: "Jung's wounded healer · the medicine path",
    myth: "The one who noticed their own wound and made a vocation of tending.",
    calling:
      "You stand as the Healer — Chiron's lineage, the wounded healer Jung took seriously. You notice before you fix. Care, in you, has no condescension. Contemporary spiritual language calls this energy work; the older word is simply ministry to what is alive.",
    method:
      "The manner is gentle feeding. You tend what is young, tender, or not yet named. You keep life edible.",
    field:
      "The realm is the Garden — the unglamorous rows where recovery actually happens. Healing is maintenance raised to an art.",
    doubled:
      "When the Healer returns, the feeder can starve. Include yourself in the noticing. A healer who will not be healed becomes a subtle tyrant of care.",
    invitation: "Feed what is already alive in you. Maintenance of the healer is not vanity.",
  },
  O: {
    letter: "O",
    house: "House of the Priestess",
    noun: "Priestess",
    adj: "Receptive",
    realm: "Circle",
    tradition: "Tarot II · the sacred vessel",
    myth: "The one who holds the space in which the unseen can enter without being forced.",
    calling:
      "You stand as the Priestess — the High Priestess of the Tarot, a vocation rather than a gender: the temple-keeper of the threshold between worlds. Origin and opportunity live in the same breath in you. You open, and you keep the opening from becoming a draft. This is lunar intelligence: knowing by receiving.",
    method:
      "The manner is receptive. You make order that can still admit a guest, a chance, a second beginning. The sacred, for you, is a hospitality.",
    field:
      "The realm is the Circle — a temenos, a held space. Mystery needs a rim or it spills; the rim must not become a wall.",
    doubled:
      "When the Priestess returns, the circle can freeze into rite without life. Unlatch one true door, and keep the room behind it warm.",
    invitation: "Open the door that is actually yours to open, and give the space a simple, kept order.",
  },
  P: {
    letter: "P",
    house: "House of the Ruler",
    noun: "Ruler",
    adj: "Sovereign",
    realm: "Crown",
    tradition: "Pearson Ruler · sacred kingship",
    myth: "The one who creates order so that others may flourish inside it.",
    calling:
      "You stand as the Ruler — Pearson's sovereign, the sacred king and queen of older myth. Purpose, in you, is presence with a direction. You are not here to dominate. You are here to give scattered lives a spine, and to be the weather others can plan a harvest in.",
    method:
      "The manner is sovereign aiming. You turn potential into a sequence of kept days. Passion has agreed, in you, to wait for a worthy object.",
    field:
      "The realm is the Crown — not jewelry, the ring of responsibility. Power is the permission to make a climate.",
    doubled:
      "When the Ruler returns, the script hardens. Let purpose stay larger than one aim. A crown that cannot listen is only a hat.",
    invitation: "Name the work that would still matter if it were slower, then be present to the next inch of it.",
  },
  Q: {
    letter: "Q",
    house: "House of the Mystic",
    noun: "Mystic",
    adj: "Quiet",
    realm: "Cloister",
    tradition: "The contemplative path · union with the Real",
    myth: "The one who prefers the living question to the crowded answer.",
    calling:
      "You stand as the Mystic — cousin to the monk, the sufi, the desert mother. Pearson has no perfect name for you; the contemplative traditions do. You would cross a desert for a better question. Quiet quality is how you love the world.",
    method:
      "The manner is quiet questioning. You touch toward the quintessence and leave the rest. You will not be rushed into a cheap version of the true.",
    field:
      "The realm is the Cloister — not escape from life, the inner courtyard from which life can be seen without noise. Union is the mystic's word for what psychology calls the Self.",
    doubled:
      "When the Mystic returns, the ordinary day is despised. Live near the question without leaving the living. A rapture that cannot wash a dish is only aesthetic.",
    invitation: "Ask the one question that would alter the week, and stay beside it without demanding an audience.",
  },
  R: {
    letter: "R",
    house: "House of the Bard",
    noun: "Bard",
    adj: "Attuned",
    realm: "Song",
    tradition: "The Celtic bard · the resonant word",
    myth: "The one who restores a people to themselves by finding the true note.",
    calling:
      "You stand as the Bard — the memory-keeper, the one who answers vibration with a truer tone. Before psychology there were songs that held a tribe together. You restore pitch — in a conversation, a grief, a day that had gone sharp.",
    method:
      "The manner is attuned returning. You listen until the signal is clean. Reverence is your way of hearing. Rhythm is how a life becomes danceable.",
    field:
      "The realm is the Song — a pattern a nervous system can enter. Meaning, for you, is something that can be hummed.",
    doubled:
      "When the Bard returns, echo can replace voice. Change key when the old one is spent. Resilience is not the same as never modulating.",
    invitation: "Listen for the note that is yours, and return to it once before night.",
  },
  S: {
    letter: "S",
    house: "House of the Weaver",
    noun: "Weaver",
    adj: "Shared",
    realm: "Weave",
    tradition: "The fate-weavers · synergy of souls",
    myth: "The Norns, the Fates, the spider at the center: strength that comes from joining.",
    calling:
      "You stand as the Weaver — older than the modern self. You make combinations no single thread could invent. Synergy is not a corporate word in you; it is the quiet architecture of we. Jung's move toward the Self is a weaving of what had been split.",
    method:
      "The manner is shared joining. You braid people, ideas, efforts. Sincerity does not need to raise its voice.",
    field:
      "The realm is the Weave — the cloth of relationship, timing, and meaning. You live where separate lives agree to be more together than apart.",
    doubled:
      "When the Weaver returns, the self can dissolve into the pattern. Keep one unsurrendered thread. A we that has no I is only a prettier erasure.",
    invitation: "Join what wants joining, and keep a name that is still yours.",
  },
  T: {
    letter: "T",
    house: "House of the Alchemist",
    noun: "Alchemist",
    adj: "Fierce",
    realm: "Crucible",
    tradition: "Hermetic art · Pearson Destroyer · death and rebirth",
    myth: "Solve et coagula: dissolve what is false, recombine what is true.",
    calling:
      "You stand as the Alchemist — hermetic cousin to Pearson's Destroyer. You know that some forms must die for the next form to live. Truth, in you, costs something. You midwife necessary change not by cruelty, but by refusing the comfortable lie.",
    method:
      "The manner is fierce crossing. You will not live in an expired story. Tension is the heat that makes a new shape possible. Trust comes after the old skin is shed.",
    field:
      "The realm is the Crucible — the vessel that can take fire without leaking. Transformation without a vessel is only a burn. The blackening is allowed here; so is the return of gold.",
    doubled:
      "When the Alchemist returns, crisis can become a style. Tend what the last fire revealed. Not every day is for the furnace.",
    invitation: "Name the one thing that is already over, and cross with as much tenderness as courage.",
  },
  U: {
    letter: "U",
    house: "House of the Peacemaker",
    noun: "Peacemaker",
    adj: "Whole",
    realm: "Vessel",
    tradition: "Jung's Self · the union of opposites",
    myth: "The one who can hold two true things without making either of them smaller.",
    calling:
      "You stand as the Peacemaker — not the smoother of conflict, the holder of opposites. Jung called the aim of the work the Self: a wholeness that includes the unique instead of sanding it off. You make a we that does not require anyone to become a smaller I.",
    method:
      "The manner is whole-making. You look for the understanding that lets two honest forces stand together. Uprightness is a spine, not a pose.",
    field:
      "The realm is the Vessel — the bowl that can hold difference without cracking. Peace, here, is not the absence of edge. It is the presence of a large enough container.",
    doubled:
      "When the Peacemaker returns, conflict can be papered. Let one necessary edge remain. Unity that cannot bear a quarrel is only niceness.",
    invitation: "Hold the whole, and keep one unblended contour of yourself.",
  },
  V: {
    letter: "V",
    house: "House of the Oracle",
    noun: "Oracle",
    adj: "Vivid",
    realm: "Sanctum",
    tradition: "The Pythia · vocation as seeing",
    myth: "The one who sees a future with a face, and therefore a pulse.",
    calling:
      "You stand as the Oracle — the seer, the Pythia, the one whose vision has blood in it. This is vocation, not prediction. You see the shape of a life while it is still only weather, and you are willing to be seen seeing it.",
    method:
      "The manner is vivid pointing. You name a direction with enough vitality that others can walk toward it. Vulnerability is what keeps the vision from becoming a statue.",
    field:
      "The realm is the Sanctum — the inner temple where the picture is received before it is announced. An oracle that will not take an unglamorous step is only theater.",
    doubled:
      "When the Oracle returns, the near is refused. Take one humble inch that belongs to the picture. Sight without incarnation is only daydream.",
    invitation: "Tell the true picture, then take the ordinary step that proves you mean it.",
  },
  W: {
    letter: "W",
    house: "House of the Innocent",
    noun: "Innocent",
    adj: "Awake",
    realm: "Dawn",
    tradition: "Pearson Innocent · Jung's Divine Child",
    myth: "The open eye that has not agreed to be bored.",
    calling:
      "You stand as the Innocent — Pearson's first archetype, Jung's Divine Child. Wonder is wisdom before it hardens into advice. You remain available to being changed by what you see. This is not naivety that refuses the dark; it is a refusal to let the dark have the last word on astonishment.",
    method:
      "The manner is awake witnessing. You look again. You weave new connections. You restore astonishment as a practical mercy.",
    field:
      "The realm is the Dawn — the hour when the world is not yet argued over. Innocence is a way of beginning again without lying about what you know.",
    doubled:
      "When the Innocent returns, looking can replace doing. Put a hand to the weave. Wonder that will not act becomes tourism of the soul.",
    invitation: "Look again at what you think you already understand, then join two strands with your hands.",
  },
  X: {
    letter: "X",
    house: "House of the Trickster",
    noun: "Trickster",
    adj: "Liminal",
    realm: "Edge",
    tradition: "Jung's Trickster · the holy disruption",
    myth: "Hermes, Coyote, Loki: the figure who breaks the false rule so a truer one can appear.",
    calling:
      "You stand as the Trickster — Jung's necessary disruptor, the unmarked variable. You will not stay inside lines that have begun to lie. The rare thing in you is not a brand; it is medicine. Rooms become more honest when you arrive, even if they do not thank you at once.",
    method:
      "The manner is liminal. You work from the margin. You bring the unknown term into a finished room and watch the furniture rearrange.",
    field:
      "The realm is the Edge — crossings, extremes, the honesty of the unmapped. The trickster's gift is movement between worlds, not a permanent address in exile.",
    doubled:
      "When the Trickster returns, exile can become a habit and disruption a style. Let the rare thing serve more than your difference. A joke that never builds is only sabotage.",
    invitation: "Honor what does not resemble the pattern, and bring it back across the line so others can use it.",
  },
  Y: {
    letter: "Y",
    house: "House of the Shapeshifter",
    noun: "Shapeshifter",
    adj: "Yielding",
    realm: "Fork",
    tradition: "Campbell's shapeshifter · the flexible soul",
    myth: "Proteus, the moon, the empath: a self that can turn without breaking.",
    calling:
      "You stand as the Shapeshifter — Campbell's ambiguous ally, the one who teaches that identity is living. Yearning, in you, has learned both yes and not-yet. Contemporary language calls this the empath; the older word is simply a soul that will not fossilize.",
    method:
      "The manner is yielding. You bend where bending is wisdom. Flexibility is intelligence, not the absence of a spine.",
    field:
      "The realm is the Fork — the place a life can still choose. You keep options humane. You know how to say yes without becoming a door anyone may walk through.",
    doubled:
      "When the Shapeshifter returns, the stand is postponed. Let one yes become a spine. A self that can be anything will finally be no one.",
    invitation: "Bend where bending is wisdom. Then keep one unbent vow.",
  },
  Z: {
    letter: "Z",
    house: "House of the Magician",
    noun: "Magician",
    adj: "Complete",
    realm: "Peak",
    tradition: "Pearson Magician · will made form",
    myth: "The one who knows that inner image and outer event can be brought into rhyme.",
    calling:
      "You stand as the Magician — Pearson's figure of transformation through alignment, the Tarot's first numbered lesson after the Fool. This is not stagecraft. It is zeal distilled: intensity without waste. You raise the ceiling of a room by refusing the lukewarm. You make the unseen practicable.",
    method:
      "The manner is complete concentration. You will spend a season on a single altitude. Manifestation, in the older sense, is simply this: a will that has become as clean as a tool.",
    field:
      "The realm is the Peak — a place to visit with the whole self, not a climate to live in. The magician who cannot descend has mistaken the summit for the world.",
    doubled:
      "When the Magician returns, the climb starves the descent. Come down with grace. Power that cannot become ordinary is only inflation — what Jung warned against when the ego steals the Self's fire.",
    invitation: "Give zeal one worthy height, and practice the walk back down as part of the work.",
  },
};

function roleOf(letter: Letter): LetterRole {
  return ROLES[letter] ?? ROLES.X;
}

function triadHash(triad: Triad): number {
  let h = 2166136261;
  for (const letter of triad.join("")) {
    h ^= letter.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildTitle(a: LetterRole, b: LetterRole, c: LetterRole, triad: Triad): string {
  const [x, y, z] = triad;
  if (x === y && y === z) return `The Pure ${a.noun}`;
  if (x === y && y !== z) return `The Double ${a.noun} of the ${c.realm}`;

  const pattern = triadHash(triad) % 2;
  if (pattern === 1) return `The ${a.noun} of the ${b.adj} ${c.realm}`;
  return `The ${b.adj} ${a.noun} of the ${c.realm}`;
}

function buildPortrait(a: LetterRole, b: LetterRole, c: LetterRole, triad: Triad, title: string): string {
  const [x, y, z] = triad;
  const repeats: string[] = [];
  if (x === y || x === z) repeats.push(a.doubled);
  if (y === z && y !== x) repeats.push(b.doubled);

  return [
    a.calling,
    b.method,
    c.field,
    ...repeats,
    `${title} gathers three currents: ${themeOf(x).name.toLowerCase()} as the house, ${themeOf(y).name.toLowerCase()} as the manner, and ${themeOf(z).name.toLowerCase()} as the field of work.`,
  ].join(" ");
}

function buildSummary(a: LetterRole, b: LetterRole, c: LetterRole): string {
  return `${a.house} · ${b.adj} aspect · path of the ${c.realm}`;
}

export function archetypeOf(triad: Triad): Archetype {
  const [x, y, z] = triad;
  const a = roleOf(x);
  const b = roleOf(y);
  const c = roleOf(z);
  const title = buildTitle(a, b, c, triad);
  return {
    triad,
    code: `${x}${y}${z}`,
    title,
    house: a.house,
    houseLetter: x,
    tradition: a.tradition,
    myth: a.myth,
    summary: buildSummary(a, b, c),
    portrait: buildPortrait(a, b, c, triad, title),
    invitation: `${a.invitation} ${c.invitation}`,
  };
}

export function frequencyRank(inventory: LetterInventory[]): LetterInventory[] {
  return [...inventory].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.firstIndex - right.firstIndex;
  });
}

export function pickTriad(inventory: LetterInventory[], signature: Letter): Triad {
  const freq = frequencyRank(inventory);
  const others = freq.filter((item) => item.letter !== signature);
  const second = others[0]?.letter ?? freq[0]?.letter ?? signature;
  const third =
    others[1]?.letter ??
    freq.find((item) => item.letter !== second)?.letter ??
    second;
  return [signature, second, third];
}

export function kindredArchetypes(triad: Triad, limit = 8): Archetype[] {
  const [primary, second, third] = triad;
  const complements = themeOf(primary).complements;
  const seen = new Set<string>([`${primary}${second}${third}`]);
  const out: Archetype[] = [];

  const candidates: Triad[] = [];
  for (const letter of complements) {
    if (letter !== second) candidates.push([primary, letter, third]);
    if (letter !== third) candidates.push([primary, second, letter]);
  }
  for (const letter of ALPHABET) {
    if (letter === primary || letter === second || letter === third) continue;
    candidates.push([primary, second, letter]);
    candidates.push([primary, letter, third]);
  }

  for (const next of candidates) {
    const code = next.join("");
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(archetypeOf(next));
    if (out.length >= limit) break;
  }
  return out;
}

export function houseArchetypes(primary: Letter): { manner: Letter; items: Archetype[] }[] {
  return ALPHABET.map((second) => ({
    manner: second,
    items: ALPHABET.map((third) => archetypeOf([primary, second, third])),
  }));
}

export function allHouseNames(): {
  letter: Letter;
  house: string;
  noun: string;
  tradition: string;
  myth: string;
  realm: string;
}[] {
  return ALPHABET.map((letter) => {
    const role = roleOf(letter);
    return {
      letter,
      house: role.house,
      noun: role.noun,
      tradition: role.tradition,
      myth: role.myth,
      realm: role.realm,
    };
  });
}

export const ARCHETYPE_COUNT = 26 * 26 * 26;

export function parseTriadCode(raw: string | undefined): Triad | null {
  if (!raw) return null;
  const code = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (code.length < 3) return null;
  const a = code[0];
  const b = code[1];
  const c = code[2];
  if (!ALPHABET.includes(a) || !ALPHABET.includes(b) || !ALPHABET.includes(c)) return null;
  return [a, b, c];
}
