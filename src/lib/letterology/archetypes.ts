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
  correspondence: string;
  doctrine: string;
  shadow: string;
  gold: string;
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
    correspondence: "Air · East · the first hour",
    doctrine:
      "The inner law is simple: a borrowed life will not hold. In the old maps this is the departure — you leave the village not because you hate it, but because something in you has already heard a farther name. The work is not to collect experiences. The work is to become the person who could keep a promise to that name.",
    shadow:
      "Restlessness dressed as destiny. Many thresholds, no crossing. The persona keeps shopping for a self.",
    gold:
      "A single kept vow. Appetite becomes direction. The unlived life is no longer a rumor; it is a path underfoot.",
    calling:
      "You stand as the Seeker. Jung called this the moment the ego notices it has been wearing someone else's face. Pearson named the figure who will not live that way. Wanting, in you, is not greed and it is not drama. It is soul-honesty: the body already knows the room is one size too small.",
    method:
      "The manner is rising. You begin before the map is finished. You treat the unlived life as a vow rather than a mood, and you take the first honest step while the old name is still warm in the mouth.",
    field:
      "The realm is the Threshold — the thin place between the known story and the true one. Contemplatives call it the veil. Folk stories call it the first gate. Either way, it is not scenery. It is a door that will not open from the sofa.",
    doubled:
      "When the Seeker doubles, craving multiplies and nothing is finished. Two beginnings will not make a self. Complete one crossing.",
    invitation:
      "Name the life you are already leaning toward in the body, and cross one threshold as if that name were already true.",
  },
  B: {
    letter: "B",
    house: "House of the Caregiver",
    noun: "Caregiver",
    adj: "Devoted",
    realm: "Hearth",
    tradition: "Pearson Caregiver · the Great Mother",
    myth: "The oldest work after birth itself: making a world safe enough to grow in.",
    correspondence: "Earth · North · the vessel",
    doctrine:
      "The inner law is that nothing living thrives in a draft. The Great Mother is not sweetness; she is the intelligence that builds a rim around a fire so the fire can cook. To care is to decide what will be protected, and for how long, without turning the protected thing into a possession.",
    shadow:
      "Fusion dressed as love. The other is kept so close they cannot breathe, or you disappear inside their need and call it virtue.",
    gold:
      "A hearth that warms without consuming. Belonging with a door. People and ideas can stay, and still remain themselves.",
    calling:
      "You stand as the Caregiver — kin to the mother of grain, the nurse of gods, the one who makes a climate. Pearson placed this among the ego's first tasks: to feed, keep, and guard. You make a home of two things that have chosen each other, and you do not call that small work.",
    method:
      "The manner is devoted keeping. You hold what would scatter. You know the difference between a bond and a lid. Loyalty, in you, is a craft with edges.",
    field:
      "The realm is the Hearth — the circle in which a nervous system can rest. Without a hearth, the Seeker has nowhere to return, the Warrior nowhere to put the sword down, the Lover nowhere to sleep. Every other house is weather until someone builds this.",
    doubled:
      "When the Caregiver doubles, belonging thickens into fusion. Hold without gripping. Let the ones you tend have their own breath.",
    invitation:
      "Keep what is actually living. Release what has become a lid dressed as love.",
  },
  C: {
    letter: "C",
    house: "House of the Rebel",
    noun: "Rebel",
    adj: "Wild",
    realm: "Spark",
    tradition: "Pearson Outlaw · the necessary no",
    myth: "Every order that has gone to sleep needs a figure who will not pretend.",
    correspondence: "Fire · South · the unlicensed flame",
    doctrine:
      "The inner law is that a polite lie is still a lie. The Rebel is not the enemy of order; the Rebel is the enemy of dead order — the rule that no longer serves the life it claimed to protect. A holy no is how a culture, or a person, avoids dying of its own manners.",
    shadow:
      "Contradiction as a personality. You burn the house to prove you are not trapped in it, then stand in the ash with nothing to tend.",
    gold:
      "One true refusal that makes room for a truer yes. Ignition with a vessel. Change that can be lived in.",
    calling:
      "You stand as the Rebel — Pearson's Outlaw, cousin to every trickster who would not bow to a sleeping king. You are not chaos for sport. You are the reason a still room does not stay dishonestly still. The first honest sentence in a dishonest system often sounds like trouble. It is not always trouble.",
    method:
      "The manner is wild ignition. You start the reaction others only complain about. Curiosity, in you, carries a match — and you are willing to strike it in public.",
    field:
      "The realm is the Spark: the first refusal, the first laugh that breaks a spell, the first flame that changes the air and cannot be unspoken. After the spark comes the long work of not becoming the thing you overthrew.",
    doubled:
      "When the Rebel doubles, ignition stacks and nothing is tended. Stay long enough to see whether the flame warms or only consumes.",
    invitation:
      "Start one reaction worth keeping, then give it a vessel so it can become a life instead of a scene.",
  },
  D: {
    letter: "D",
    house: "House of the Hermit",
    noun: "Hermit",
    adj: "Hidden",
    realm: "Well",
    tradition: "Tarot IX · Jung's inward turn",
    myth: "The lantern in the wilderness: wisdom that will not perform.",
    correspondence: "Earth · midnight · the lantern",
    doctrine:
      "The inner law is that some truths will not survive applause. The Hermit withdraws not to punish the world, but to hear the signal under the noise. Jung treated solitude as a method of individuation: you go down far enough to meet what you have been avoiding, and you bring back only what can live in daylight.",
    shadow:
      "Exile mistaken for purity. The well has no ladder. Insight hoarded until it sours into contempt for ordinary people.",
    gold:
      "A private seeing that becomes useful. Depth with a return ticket. The lantern is carried back to the road.",
    calling:
      "You stand as the Hermit — the Tarot's ninth mystery, the walker with a lamp who has left the marketplace on purpose. Depth is not shyness in you. It is a vocation. You prefer the root to the announcement, the kept practice to the bright career of being understood.",
    method:
      "The manner is hidden descent. You give long attention to what is not yet clear. You will not be hurried by those who live only at the surface and call that honesty.",
    field:
      "The realm is the Well — the shaft that changes whoever stays. What you fetch from below is meant, eventually, to be drunk in the open air. A mystery that never feeds anyone is only a private museum.",
    doubled:
      "When the Hermit doubles, the shaft goes deeper and the ladder is forgotten. Bring something back. Solitude is a method, not a citizenship.",
    invitation:
      "Let one private devotion become visible. Depth still wants a witness, or it begins to lie to itself.",
  },
  E: {
    letter: "E",
    house: "House of the Explorer",
    noun: "Explorer",
    adj: "Open",
    realm: "Horizon",
    tradition: "Pearson Explorer · the wider world",
    myth: "The soul that will not confuse a familiar cage with a home.",
    correspondence: "Air · the far edge · the open road",
    doctrine:
      "The inner law is that the world is larger than the wound. The Explorer does not leave because the village is worthless; the Explorer leaves because a life mapped only by fear is already a smaller country than the one you were born for. Distance, rightly used, is medicine. Distance used as a habit is only another cage with a better view.",
    shadow:
      "Tourism of the soul. New places, same self. Intimacy postponed in the name of freedom until nothing is close enough to change you.",
    gold:
      "A wider life that still has a shoreline. Movement that teaches. You come home larger, not merely farther.",
    calling:
      "You stand as the Explorer — Pearson's figure of freedom through distance. Where the Seeker leaves an old self, you leave an old map. You make more room than the situation asked for, and someone always needs that air. Feeling, in you, is not a private weather system; it is a climate others can enter.",
    method:
      "The manner is open widening. You grow a life by walking into what you do not yet know how to name. You trust the body when it says: there is more world than this argument.",
    field:
      "The realm is the Horizon — the far line that organizes the walk. Expansion here is not escape. It is the knowledge, older than language, that a person can outgrow a story without betraying the people inside it.",
    doubled:
      "When the Explorer doubles, space multiplies until nothing is intimate. Grow in one direction. A horizon is a guide, not a refusal to arrive.",
    invitation:
      "Expand toward a shoreline you can love, not toward every empty distance at once.",
  },
  F: {
    letter: "F",
    house: "House of the Fool",
    noun: "Fool",
    adj: "Free",
    realm: "Gate",
    tradition: "Tarot 0 · Pearson Fool · beginner's mind",
    myth: "The zero before the numbered life: sacred innocence with a staff and a cliff.",
    correspondence: "Aether · the unnumbered card · the cliff",
    doctrine:
      "The inner law is that you cannot enter a new life wearing the full armor of the old one. The Fool is not stupid. The Fool is unowned. Zero, in the Tarot, is not nothing; it is the only number that can become any other number. Zen called this beginner's mind: attention that has not yet agreed to be a résumé.",
    shadow:
      "Refusal to vow anything. Freedom as weather. You stay light by never putting your weight down, and call the emptiness wisdom.",
    gold:
      "A chosen lightness. You travel unburdened and still keep one fidelity. The gate stays open because you are not hiding in it.",
    calling:
      "You stand as the Fool — the card before the numbered life, Pearson's holy beginner. This is uncoerced attention: a soul that has not signed the contract that says you must already know who you are. The old stories put a dog at your heels and a cliff at your feet. Both are honest. Joy and risk arrive together, or not at all.",
    method:
      "The manner is free. You keep a corridor of air around the day. You move as the inner weather asks, and you will not be shamed for traveling light — only asked, eventually, to land.",
    field:
      "The realm is the Gate: an opening that remains chosen. Freedom here is a discipline, not a mood. It is the daily refusal to be herded by fear, fashion, or the person you were last year.",
    doubled:
      "When the Fool doubles, the gate swings so wide that nothing is vowed. Stay freely. Fidelity is what keeps freedom from becoming weather.",
    invitation:
      "Keep the corridor of air, and give it one fidelity that is still yours.",
  },
  G: {
    letter: "G",
    house: "House of the Creator",
    noun: "Creator",
    adj: "Generative",
    realm: "Grove",
    tradition: "Pearson Creator · the living work",
    myth: "The impulse that cannot only witness — it must make.",
    correspondence: "Earth · spring · the green work",
    doctrine:
      "The inner law is that unused life turns against its owner. The Creator is not a personality type for artists; it is the human need to bring something into form that was not there yesterday. In older language this is participation in the world's ongoing making. What you will not make, you will eventually criticize. What you tend, increases.",
    shadow:
      "Production without winter. You cannot stop making, or you make only to be seen making. The grove becomes a factory, and the living thing dies of attention.",
    gold:
      "A work that can outlive a mood. Increase with roots. You leave the world slightly more habitable than you found it.",
    calling:
      "You stand as the Creator — Pearson's maker of worlds, however small. Growth, in you, has roots. You do not merely accumulate projects; you tend until something living stands where there was only intention. This is closer to gardening than to genius. Genius is a weather. Tending is a vow.",
    method:
      "The manner is generative. Gratitude is your soil — not niceness, the accurate seeing that something wants to live and you are in a position to help it. You stay through the unglamorous season.",
    field:
      "The realm is the Grove: lives, crafts, children of the mind, rooms of practice that grow because someone refused to leave. A grove is not a monument. It is a place that keeps making shade after you are tired.",
    doubled:
      "When the Creator doubles, the green thickens until nothing can winter. Allow a fallow. Even a grove needs a clearing.",
    invitation:
      "Tend one living work as if increase were already promised — and let it rest when it asks.",
  },
  H: {
    letter: "H",
    house: "House of the Prophet",
    noun: "Prophet",
    adj: "Far-seeing",
    realm: "Vista",
    tradition: "The prophetic voice · conscience of the tribe",
    myth: "The one who sees the farther order and must speak it without becoming a tyrant of hope.",
    correspondence: "Air · the high place · the unwelcome word",
    doctrine:
      "The inner law is that a people die first in their speech. The prophet is not a fortune-teller and not a brand. In the Hebrew and older desert sense, the prophet is the one who remembers what the tribe said it loved, and says so when the tribe has begun to live otherwise. Hope without a backbone is entertainment. A backbone without hospitality is a weapon.",
    shadow:
      "Moral grandeur. You live so far ahead of the room that you cannot set a plate. The future becomes a stick you use on the present.",
    gold:
      "A longer honesty that still feeds people. You speak the far line and keep the near table. Vision stays human.",
    calling:
      "You stand as the Prophet — the figure who holds a longer honesty. Every tradition has this voice: the one who will not let a family, a craft, or a culture forget its own vow. You see the weather coming. The task is to say it in a language the living can hear, and then to stay for the meal.",
    method:
      "The manner is far-seeing. You offer the longer view without forcing anyone to kneel to it. Hospitality is how your vision stays from becoming a sermon.",
    field:
      "The realm is the Vista — the far line that organizes today's table. A prophecy that cannot cook, console, or keep a promise is only weather talk with better adjectives.",
    doubled:
      "When the Prophet doubles, the line recedes and the near is neglected. Set the nearest table. The future is fed by the present meal.",
    invitation:
      "Keep the far line, and be hospitable to the person already in the room.",
  },
  I: {
    letter: "I",
    house: "House of the Sage",
    noun: "Sage",
    adj: "Lucid",
    realm: "Lamp",
    tradition: "Pearson Sage · Jung's Wise Old One",
    myth: "Insight before applause: the inner lamp that does not need a stage.",
    correspondence: "Air · Mercury's study · the inner lamp",
    doctrine:
      "The inner law is that understanding is a form of love, and display is not. The Sage would rather be accurate than impressive. Jung's Wise Old Man and Wise Old Woman are not gurus; they are the psyche's own capacity to see a pattern without needing to own it. Illumination that never leaves the study is only furniture. Illumination that never sat still is only opinion.",
    shadow:
      "The locked study. Knowing as superiority. You collect insight the way a dragon collects gold, and the village goes unlit.",
    gold:
      "A seeing that can be shared at an ordinary table. Integrity: the inside and the outside begin to rhyme.",
    calling:
      "You stand as the Sage — Pearson's seeker of truth, the figure who would rather understand than win. Imagination lives in you first as a private room. That is correct. The second movement is also required: to let one unused light fall where someone else is trying to see.",
    method:
      "The manner is lucid. You keep the inner light faithful before it is shown. You revise. You wait until the sentence is true, then you risk saying it.",
    field:
      "The realm is the Lamp. A lamp is not a bonfire. It is a small, tended brightness meant for work, reading, and the faces of the people you will not abandon to their confusion.",
    doubled:
      "When the Sage doubles, the study locks. Speak one private seeing. Light unused is furniture, and furniture begins to look like wisdom if you sit among it long enough.",
    invitation:
      "Bring one unused insight into speech, and let ordinary life test it.",
  },
  J: {
    letter: "J",
    house: "House of the Hero",
    noun: "Hero",
    adj: "Steadfast",
    realm: "Road",
    tradition: "Jung / Campbell · the heroic journey",
    myth: "The one who leaves, suffers a real cost, and returns with something the village can use.",
    correspondence: "Fire · the ordeal · the road home",
    doctrine:
      "The inner law is that courage without a return is only tourism with better scars. Campbell's hero leaves, is unmade, and comes back with a gift — a skill, a truth, a medicine the village did not have. Jung read the same pattern inside the psyche: the ego must face what it feared and bring the gold back into daily life. If you cannot come home, you have not finished.",
    shadow:
      "The pack that never drops. Endless ordeal as identity. You need a dragon more than you need a table, because rest would ask who you are without the fight.",
    gold:
      "A cost that became medicine. You went, you paid, you returned. Other people can use what you learned.",
    calling:
      "You stand as the Hero — not the swaggering statue, the traveler who will not look away. This is motion with a conscience. Joy, in you, is not a prize at the end; it is part of the equipment, or the road becomes only punishment. You move a life from a smaller honesty to a larger one.",
    method:
      "The manner is steadfast travel. You take the next mile when the prize is not visible. You place unlikely things beside each other until they speak. You do not confuse delay with destiny.",
    field:
      "The realm is the Road — the honest miles between a smaller self and a larger duty. Arrival is part of heroism. So is washing the dust off and sitting down among the people you left.",
    doubled:
      "When the Hero doubles, the pack never drops. Arrive somewhere. A journey that cannot rest becomes exile with better branding.",
    invitation:
      "Take the next honest mile, and let joy be part of the equipment, not a prize withheld until the end.",
  },
  K: {
    letter: "K",
    house: "House of the Orphan",
    noun: "Orphan",
    adj: "Kindred",
    realm: "Table",
    tradition: "Pearson Orphan · the search for belonging",
    myth: "The child who learns that home is made, not merely inherited.",
    correspondence: "Water · the lost child · the made table",
    doctrine:
      "The inner law is that exile can become a craft. The Orphan is not a life sentence; it is the moment you discover the world is not automatically kind, and then refuse to become unkind in return. Pearson put this figure after the Innocent: paradise ends, and the real work of kinship begins. The ones who build the best tables are often those who remember being left outside one.",
    shadow:
      "A closed room of the wounded. You collect only those who share the injury, and call that family. The stranger stays in the cold to prove the wound was real.",
    gold:
      "Chosen kinship with a spare chair. You know how to make belonging because you know what its absence costs.",
    calling:
      "You stand as the Orphan — not as a wound to display, as the beginning of real kinship. You understand by standing with. Knowledge, in you, wants to be useful to someone named. This is why a name said correctly can feel like food. You have always known that.",
    method:
      "The manner is kindred. You knit family and chosen family, the small republic of those who know a real name. Kindness is not decoration on your intelligence. It is how your intelligence works.",
    field:
      "The realm is the Table — the place the excluded are fed and the insider is asked to make room. A key that only opens for blood is not yet a key. It is a lock with a story.",
    doubled:
      "When the Orphan doubles, the room closes around the wound. Leave a place for the one who does not yet belong. Belonging that cannot welcome is only a prettier exile.",
    invitation:
      "Offer one precise kindness to kin, then one to someone who has no claim on you yet.",
  },
  L: {
    letter: "L",
    house: "House of the Lover",
    noun: "Lover",
    adj: "Radiant",
    realm: "Flame",
    tradition: "Pearson Lover · Eros as a path to the Self",
    myth: "The one who will not live uncommitted to beauty, body, or beloved.",
    correspondence: "Water and fire · Venus · the chosen flame",
    doctrine:
      "The inner law is that Eros is a teacher, not a lifestyle. The Lover is not merely the one who falls in love. The Lover is the one who lets beauty, body, and beloved rearrange the will. Jung treated this current as a way the Self approaches — through the person, the art, the world you cannot remain lukewarm toward. Passion that cannot stay is only hunger. Passion that cannot rest is only performance.",
    shadow:
      "Brightness as display. You spend the whole lamp on the hallway of almost-loves, and the one true thing goes unlit. Fatigue hides behind radiance.",
    gold:
      "A chosen warmth that stays after the first shine. Love as leadership: you go first, and you sleep, and you return.",
    calling:
      "You stand as the Lover — Pearson's figure of union. Light, in you, has chosen a person, a craft, a world. You lead by going first in warmth. This is not softness as collapse. It is the older meaning of devotion: you put your heat where you have said it belongs.",
    method:
      "The manner is radiant. Care is your form of authority. You make a room visible because you will not hoard the lamp, and you know when the lamp needs oil.",
    field:
      "The realm is the Flame — not the firework, the hearth-fire that cooks and consoles. Passion here is loyalty with heat. A flame that cannot cook is only a show for the dark.",
    doubled:
      "When the Lover doubles, brightness performs and fatigue hides. Rest the lamp. Love that cannot sleep becomes display.",
    invitation:
      "Shine on one true thing. Do not spend the whole light on the hallway of almost-loves.",
  },
  M: {
    letter: "M",
    house: "House of the Warrior",
    noun: "Warrior",
    adj: "Swift",
    realm: "Wheel",
    tradition: "Pearson Warrior · disciplined action",
    myth: "Strength that has agreed to serve something, not merely to win.",
    correspondence: "Fire · Mars · the kept edge",
    doctrine:
      "The inner law is that force without a worthy object is only restlessness in armor. The Warrior is not the brawler and not the martyr. The Warrior is the part of the psyche that can keep a boundary, finish a difficult hour, and put the weapon down. In the old training, the sword was consecrated — meaning it had a purpose larger than the person holding it. Without that, you only get better at fighting.",
    shadow:
      "Speed as virtue. Every hour is a campaign. You cannot pause without feeling unmanned, and so meaning never catches the motion.",
    gold:
      "A clean edge in service of a living thing. Consistency. The fight you refuse is as holy as the one you take.",
    calling:
      "You stand as the Warrior — Pearson's figure of brave action and kept limits. This is not violence. It is mass in motion: a practice that has begun to carry itself. You give scattered energy a spine. People remember what they were for, near you, because you will not flatter a fog.",
    method:
      "The manner is swift and rhythmic. You move toward mastery, not merely activity. The day's work has a pulse. You return to it when mood would like a different war.",
    field:
      "The realm is the Wheel — action that continues, the old sense of karma as deed with consequence. A warrior's holiness is the daily return, not the single blow that gets remembered.",
    doubled:
      "When the Warrior doubles, speed outruns meaning. Pause without losing the current. A fight without a worthy object is only restlessness in armor.",
    invitation:
      "Give the true motion the dignity of a daily return, and know which battles are beneath you.",
  },
  N: {
    letter: "N",
    house: "House of the Healer",
    noun: "Healer",
    adj: "Gentle",
    realm: "Garden",
    tradition: "Jung's wounded healer · the medicine path",
    myth: "The one who noticed their own wound and made a vocation of tending.",
    correspondence: "Water · Chiron · the garden rows",
    doctrine:
      "The inner law is that you can only midwife what you are willing to undergo. Chiron, the wounded teacher, is the old name for this: the injury did not disqualify you; it educated your hands. Healing is not fixing people so they stop bothering the room. Healing is the unglamorous restoration of what is already trying to live. A healer who will not be healed becomes a subtle tyrant of care.",
    shadow:
      "The feeder who starves. You notice everyone except the one doing the noticing. Care becomes control, or novelty abandons what was just beginning to root.",
    gold:
      "Tending that includes the tender. You keep life edible — for others and for yourself — without making a religion of being needed.",
    calling:
      "You stand as the Healer. You notice before you fix. Care, in you, has no condescension. Contemporary language calls this energy work or holding space; the older word is simply ministry to what is alive. You see what needs feeding while others are still arguing about the menu.",
    method:
      "The manner is gentle feeding. You tend what is young, tender, or not yet named. You do not confuse a dramatic cure with the slow work of making a body, a friendship, or a day able to continue.",
    field:
      "The realm is the Garden — the rows where recovery actually happens. No one applauds a well-watered root. That is how you know you are close to the real work.",
    doubled:
      "When the Healer doubles, the feeder can starve. Include yourself in the noticing. Maintenance of the healer is not vanity.",
    invitation:
      "Feed what is already alive in you. Then feed what is alive near you. In that order, or both fail.",
  },
  O: {
    letter: "O",
    house: "House of the Priestess",
    noun: "Priestess",
    adj: "Receptive",
    realm: "Circle",
    tradition: "Tarot II · the sacred vessel",
    myth: "The one who holds the space in which the unseen can enter without being forced.",
    correspondence: "Water · the Moon · the temenos",
    doctrine:
      "The inner law is that mystery needs a rim or it spills, and the rim must not become a wall. The Priestess — a vocation, not a gender — is the temple-keeper of the in-between. The Greeks called a held sacred space a temenos: a circle in which something larger than the ego may arrive. Lunar intelligence knows by receiving. You do not haul the unseen into the room. You make the room fit to be entered.",
    shadow:
      "Rite without life. The circle freezes. You police the atmosphere, or you open every door until the space is only a draft and call the chill holy.",
    gold:
      "A living threshold. People can enter, be changed, and leave intact. Order serves openness; openness has a shape.",
    calling:
      "You stand as the Priestess — the High Priestess of the Tarot, keeper of the veil between the said and the unsayable. Origin and opportunity live in the same breath in you. You open, and you keep the opening from becoming weather. This is not performance of the sacred. It is hospitality toward what cannot be scheduled.",
    method:
      "The manner is receptive. You make order that can still admit a guest, a chance, a second beginning. You know when to speak and when the speaking would scare the thing away.",
    field:
      "The realm is the Circle. A circle is a decision about what belongs inside tonight. Too tight, and life cannot enter. Too loose, and nothing can ripen.",
    doubled:
      "When the Priestess doubles, the circle freezes into rite without life. Unlatch one true door, and keep the room behind it warm.",
    invitation:
      "Open the door that is actually yours to open, and give the space a simple, kept order.",
  },
  P: {
    letter: "P",
    house: "House of the Ruler",
    noun: "Ruler",
    adj: "Sovereign",
    realm: "Crown",
    tradition: "Pearson Ruler · sacred kingship",
    myth: "The one who creates order so that others may flourish inside it.",
    correspondence: "Fire and earth · the Sun · the ring of responsibility",
    doctrine:
      "The inner law is that power is the permission to make a climate. Sacred kingship, in the old sense, was not domination; it was the vow to keep the land fertile and the people unbewildered. The Ruler's ego-risk is inflation — mistaking the office for the Self. The Ruler's gift is a spine other people can plan a harvest around. A crown that cannot listen is only a hat.",
    shadow:
      "The hardened script. Purpose becomes a tyrant. You would rather be obeyed than be in contact, and you call the loneliness dignity.",
    gold:
      "Order that still breathes. You aim the room without erasing the people in it. Authority as weather others can grow in.",
    calling:
      "You stand as the Ruler — Pearson's sovereign, the sacred king and queen of older myth. Purpose, in you, is presence with a direction. You are not here to dominate. You are here to give scattered lives a shape they can trust, including your own.",
    method:
      "The manner is sovereign aiming. You turn potential into a sequence of kept days. Passion has agreed, in you, to wait for a worthy object — which is how passion becomes policy instead of weather.",
    field:
      "The realm is the Crown: not jewelry, the ring of responsibility. Whoever wears it must remain larger than their favorite plan, or the land dries out around a single idea.",
    doubled:
      "When the Ruler doubles, the script hardens. Let purpose stay larger than one aim. A crown that cannot listen is only a hat.",
    invitation:
      "Name the work that would still matter if it were slower, then be present to the next inch of it.",
  },
  Q: {
    letter: "Q",
    house: "House of the Mystic",
    noun: "Mystic",
    adj: "Quiet",
    realm: "Cloister",
    tradition: "The contemplative path · union with the Real",
    myth: "The one who prefers the living question to the crowded answer.",
    correspondence: "Aether · the inner courtyard · the unspeakable",
    doctrine:
      "The inner law is that the Real will not be herded by a clever sentence. The mystic — monk, sufi, desert mother, quiet neighbor — crosses a kind of desert for a better question. Union is the old word for what Jung called the Self: not a trance, a life no longer split against itself. A rapture that cannot wash a dish is only aesthetic. A dish washed without any interior is only hygiene. The path wants both.",
    shadow:
      "Contempt for the ordinary day. You use silence as exit. The living are treated as noise on the way to an experience.",
    gold:
      "A question you can live near. Quiet that still loves the world. The unspeakable makes the spoken more exact, not less.",
    calling:
      "You stand as the Mystic. Pearson has no perfect name for you; the contemplative traditions do. You would rather touch the quintessence and leave the rest than win an argument about the whole. Quiet quality is how you love. That love is stricter than it looks.",
    method:
      "The manner is quiet questioning. You will not be rushed into a cheap version of the true. You wait. You discard. You keep the one thing that still rings when everything fashionable has gone dull.",
    field:
      "The realm is the Cloister — not escape from life, the inner courtyard from which life can be seen without being owned by its noise. You go there to return more accurately, not to disappear.",
    doubled:
      "When the Mystic doubles, the ordinary day is despised. Live near the question without leaving the living.",
    invitation:
      "Ask the one question that would alter the week, and stay beside it without demanding an audience.",
  },
  R: {
    letter: "R",
    house: "House of the Bard",
    noun: "Bard",
    adj: "Attuned",
    realm: "Song",
    tradition: "The Celtic bard · the resonant word",
    myth: "The one who restores a people to themselves by finding the true note.",
    correspondence: "Air · the throat · the true note",
    doctrine:
      "The inner law is that a people come back to themselves through a sound they recognize. Before psychology there were songs that held grief, law, and memory in one pattern a body could enter. The Bard is not an entertainer first. The Bard is a tuner. You hear when a conversation, a grief, or a day has gone sharp, and you have the strange authority to return it to pitch — sometimes with a word, sometimes with a silence that is shaped like music.",
    shadow:
      "Echo instead of voice. You become the room's mood. Resilience curdles into never changing key, or charm replaces the thing that needed saying.",
    gold:
      "A note that is yours, offered in time. Meaning people can hum. The tribe remembers who it is when you speak.",
    calling:
      "You stand as the Bard — memory-keeper, sounding board, the one who answers vibration with a truer tone. You restore pitch. This is why people tell you things they did not plan to tell. They can hear themselves better in your presence, which is a responsibility.",
    method:
      "The manner is attuned returning. You listen until the signal is clean. Reverence is your way of hearing — not piety, the refusal to interrupt a true sound with a cleverer one.",
    field:
      "The realm is the Song: a pattern a nervous system can enter. If it cannot be lived in the body, it is not yet a song. It is only an idea with rhythm attached.",
    doubled:
      "When the Bard doubles, echo can replace voice. Change key when the old one is spent. Resilience is not the same as never modulating.",
    invitation:
      "Listen for the note that is yours, and return to it once before night.",
  },
  S: {
    letter: "S",
    house: "House of the Weaver",
    noun: "Weaver",
    adj: "Shared",
    realm: "Weave",
    tradition: "The fate-weavers · synergy of souls",
    myth: "The Norns, the Fates, the spider at the center: strength that comes from joining.",
    correspondence: "Earth · the loom · the unseen pattern",
    doctrine:
      "The inner law is that nothing important happens as a solo. The old fate-weavers — Norns, Moirai, the spider at the world's navel — were not cruel so much as accurate: lives are threads, and the cloth is the point. Jung's move toward the Self is a weaving of what had been split. Synchronicity is the same teaching in another dialect: meaning shows up as a join you did not force. Keep one thread that is still yours, or you vanish into the pattern you serve.",
    shadow:
      "Self-erasure in the name of we. You become the braid and lose the name. Or you force joins that wanted to remain two.",
    gold:
      "A living cloth. Combinations no single part could invent. You belong without dissolving, and you join without colonizing.",
    calling:
      "You stand as the Weaver — older than the modern self. You make combinations. Synergy is not a corporate word in you; it is the quiet architecture of we. You can feel when two lives, two ideas, or two hours want to be more together than apart, and you have the patience to let the join set.",
    method:
      "The manner is shared joining. You braid people, efforts, timings. Sincerity does not need to raise its voice. The strongest seams are often the ones no one applauds.",
    field:
      "The realm is the Weave — relationship, timing, and meaning as one cloth. You live at the loom, which means you also live with loose ends. A finished tapestry with no new thread is a funeral.",
    doubled:
      "When the Weaver doubles, the self dissolves into the pattern. Keep one unsurrendered thread. A we that has no I is only a prettier erasure.",
    invitation:
      "Join what wants joining, and keep a name that is still yours.",
  },
  T: {
    letter: "T",
    house: "House of the Alchemist",
    noun: "Alchemist",
    adj: "Fierce",
    realm: "Crucible",
    tradition: "Hermetic art · Pearson Destroyer · death and rebirth",
    myth: "Solve et coagula: dissolve what is false, recombine what is true.",
    correspondence: "Fire · nigredo · the vessel that can take heat",
    doctrine:
      "The inner law is that some forms must die for the next form to live. The alchemists wrote solve et coagula — dissolve, then recombine — because they had watched this in metal and in the soul. Pearson's Destroyer is the same figure without the laboratory: the one who will not keep a dead story walking. Nigredo, the blackening, is allowed. So is the return of gold. What is not allowed is making a lifestyle of the furnace.",
    shadow:
      "Crisis as a style. You torch what needed tending. Transformation becomes an addiction, and ordinary happiness looks like a failure of nerve.",
    gold:
      "A necessary death that was not cruel. You named what was over, crossed, and stayed to tend what the fire revealed.",
    calling:
      "You stand as the Alchemist — hermetic cousin to the Destroyer. Truth, in you, costs something. You midwife change not by cruelty, but by refusing the comfortable lie. People may experience this as loss. Sometimes it is. Not every loss is a mistake.",
    method:
      "The manner is fierce crossing. You will not live in an expired story. Tension is the heat that makes a new shape possible. Trust comes after the old skin is shed, not before — which is why trust, when it comes, is real.",
    field:
      "The realm is the Crucible: the vessel that can take fire without leaking. Transformation without a vessel is only a burn. You are responsible for the vessel as much as for the flame.",
    doubled:
      "When the Alchemist doubles, crisis becomes a style. Tend what the last fire revealed. Not every day is for the furnace.",
    invitation:
      "Name the one thing that is already over, and cross with as much tenderness as courage.",
  },
  U: {
    letter: "U",
    house: "House of the Peacemaker",
    noun: "Peacemaker",
    adj: "Whole",
    realm: "Vessel",
    tradition: "Jung's Self · the union of opposites",
    myth: "The one who can hold two true things without making either of them smaller.",
    correspondence: "Water · the bowl · coincidentia oppositorum",
    doctrine:
      "The inner law is that wholeness is not sameness. Jung called the aim of the work the Self: a life large enough to include what the ego wanted to exile. The old philosophers called the same mystery coincidentia oppositorum — the meeting of opposites without a murder. Peace, here, is not the absence of edge. It is the presence of a container that can bear a quarrel without splitting the world in two.",
    shadow:
      "Niceness. You paper conflict until the real thing goes underground and returns as illness, spite, or a sudden break. Unity becomes a muzzle.",
    gold:
      "A we that does not require a smaller I. Two honest forces stand in one room. The vessel holds.",
    calling:
      "You stand as the Peacemaker — not the smoother of conflict, the holder of opposites. You make a we that does not require anyone to become a lesser version of themselves. This is harder than charm. Charm asks people to get along. The vessel asks them to stay true and still remain in the room.",
    method:
      "The manner is whole-making. You look for the understanding that lets two honest forces stand together. Uprightness is a spine, not a pose. You will disappoint people who wanted you to pick a smaller side.",
    field:
      "The realm is the Vessel — the bowl that can hold difference without cracking. If the bowl is too fine, it shatters. If it is too thick, nothing can be tasted. You live in that calibration.",
    doubled:
      "When the Peacemaker doubles, conflict is papered. Let one necessary edge remain. Unity that cannot bear a quarrel is only niceness.",
    invitation:
      "Hold the whole, and keep one unblended contour of yourself.",
  },
  V: {
    letter: "V",
    house: "House of the Oracle",
    noun: "Oracle",
    adj: "Vivid",
    realm: "Sanctum",
    tradition: "The Pythia · vocation as seeing",
    myth: "The one who sees a future with a face, and therefore a pulse.",
    correspondence: "Aether · Delphi · the inner temple",
    doctrine:
      "The inner law is that a vision without a body is a daydream with better lighting. The Pythia sat over a cleft in the earth — meaning the seeing came up from below, not down from a pedestal. Vocation is the same structure: an image rises that has blood in it, and you are asked to live toward it in unglamorous inches. An oracle that will not take the next ordinary step is only theater.",
    shadow:
      "Refusal of the near. You live in the picture and starve the path. Vulnerability is avoided, so the vision hardens into a statue you serve.",
    gold:
      "A picture you are willing to be seen seeing — and a humble step that belongs to it. Sight incarnate.",
    calling:
      "You stand as the Oracle — seer, not soothsayer. This is vocation, not prediction. You see the shape of a life while it is still only weather, and you are willing to be seen seeing it. That willingness is the real risk. The picture was never the hard part.",
    method:
      "The manner is vivid pointing. You name a direction with enough vitality that others can walk toward it. You keep the image warm by remaining human beside it.",
    field:
      "The realm is the Sanctum — the inner temple where the picture is received before it is announced. What is received in private must be tested in public, or it remains a private religion.",
    doubled:
      "When the Oracle doubles, the near is refused. Take one humble inch that belongs to the picture. Sight without incarnation is only daydream.",
    invitation:
      "Tell the true picture, then take the ordinary step that proves you mean it.",
  },
  W: {
    letter: "W",
    house: "House of the Innocent",
    noun: "Innocent",
    adj: "Awake",
    realm: "Dawn",
    tradition: "Pearson Innocent · Jung's Divine Child",
    myth: "The open eye that has not agreed to be bored.",
    correspondence: "Air · first light · the Divine Child",
    doctrine:
      "The inner law is that astonishment is a form of intelligence. The Innocent is not the person who has never been hurt. The Innocent is the one who will not let the hurt have the last word on what the world is. Jung's Divine Child is the psyche's capacity to begin again without lying about what it knows. Wonder that will not act becomes tourism of the soul. Action without wonder becomes a machine.",
    shadow:
      "Looking instead of doing. Or a performed sweetness that refuses the dark and so cannot be trusted when the dark arrives.",
    gold:
      "A second beginning that is not amnesia. You see clearly, including the wound, and you still join two strands with your hands.",
    calling:
      "You stand as the Innocent — Pearson's first figure, the Divine Child who has not agreed to be bored. Wonder is wisdom before it hardens into advice. You remain available to being changed by what you see. This is rarer than cleverness, and more useful.",
    method:
      "The manner is awake witnessing. You look again. You restore astonishment as a practical mercy — the kind that makes a tired person able to continue.",
    field:
      "The realm is the Dawn: the hour when the world is not yet argued over. Innocence is a way of beginning again. It is not a way of remaining uninformed.",
    doubled:
      "When the Innocent doubles, looking can replace doing. Put a hand to the weave. Wonder that will not act becomes tourism of the soul.",
    invitation:
      "Look again at what you think you already understand, then join two strands with your hands.",
  },
  X: {
    letter: "X",
    house: "House of the Trickster",
    noun: "Trickster",
    adj: "Liminal",
    realm: "Edge",
    tradition: "Jung's Trickster · the holy disruption",
    myth: "Hermes, Coyote, Loki: the figure who breaks the false rule so a truer one can appear.",
    correspondence: "Aether · the crossroads · the unmarked variable",
    doctrine:
      "The inner law is that a rule which has begun to lie must be broken before it can be rewritten. The Trickster — Hermes at the boundary, Coyote in the desert, the jester who may say the king is naked — is not a vandal. The Trickster is medicine that arrives as inconvenience. Jung took this figure seriously: the psyche sends a disruption when the official story has become too clean to be true. A joke that never builds is only sabotage. A disruption that serves life is how the next order gets in.",
    shadow:
      "Exile as a brand. You stay outside to remain special. Disruption becomes a style, and you cannot bear to be useful inside a room that is working.",
    gold:
      "The missing term, brought back across the line. Rooms become more honest. The rare thing serves more than your difference.",
    calling:
      "You stand as the Trickster — the unmarked variable, the life that will not stay inside lines that have begun to lie. The rare thing in you is not a costume. It is medicine. Rooms become more honest when you arrive, even if they do not thank you at once. That delay is part of the office.",
    method:
      "The manner is liminal. You work from the margin. You bring the unknown term into a finished room and watch the furniture rearrange — then you help set the table again, or the trick was only cruelty.",
    field:
      "The realm is the Edge: crossings, extremes, the honesty of the unmapped. The gift is movement between worlds, not a permanent address in exile. Hermes was a messenger. Messengers deliver, and then they leave the house standing.",
    doubled:
      "When the Trickster doubles, exile becomes a habit and disruption a style. Let the rare thing serve more than your difference.",
    invitation:
      "Honor what does not resemble the pattern, and bring it back across the line so others can use it.",
  },
  Y: {
    letter: "Y",
    house: "House of the Shapeshifter",
    noun: "Shapeshifter",
    adj: "Yielding",
    realm: "Fork",
    tradition: "Campbell's shapeshifter · anima and the flexible soul",
    myth: "Proteus, the moon, the empath: a self that can turn without breaking.",
    correspondence: "Water · the moon's face · the living hinge",
    doctrine:
      "The inner law is that identity is a verb. Proteus would not be held, and that was his wisdom and his danger. Campbell's shapeshifter teaches the hero that allies change form — which is also how the inner life works. Jung's anima and animus arrive this way: the otherness inside you that will not stay in one costume. Yielding is intelligence. Yielding without a spine is how a soul becomes a hallway.",
    shadow:
      "The postponed stand. You can be anyone, so you are no one. Empathy becomes a leak. Every yes is temporary, and nothing can build on you.",
    gold:
      "A self that can turn and still keep a vow. Flexibility with a hinge, not a smear. You adapt without disappearing.",
    calling:
      "You stand as the Shapeshifter — Campbell's ambiguous ally, the one who teaches that a living identity will not fossilize. Yearning, in you, has learned both yes and not-yet. Contemporary language calls this the empath. The older word is simply a soul that refuses to become a statue of itself.",
    method:
      "The manner is yielding. You bend where bending is wisdom. You know how to say yes without becoming a door anyone may walk through. That second half is the whole art.",
    field:
      "The realm is the Fork — the place a life can still choose. You keep options humane. A fork is not an excuse to walk both roads until you starve. It is the dignity of a real choice, still open, not yet wasted.",
    doubled:
      "When the Shapeshifter doubles, the stand is postponed. Let one yes become a spine. A self that can be anything will finally be no one.",
    invitation:
      "Bend where bending is wisdom. Then keep one unbent vow.",
  },
  Z: {
    letter: "Z",
    house: "House of the Magician",
    noun: "Magician",
    adj: "Complete",
    realm: "Peak",
    tradition: "Pearson Magician · will made form",
    myth: "The one who knows that inner image and outer event can be brought into rhyme.",
    correspondence: "Fire · the peak · the aligned will",
    doctrine:
      "The inner law is that the inner picture and the outer day can be brought into rhyme — and that this is work, not a spell you purchase. The Magician is Pearson's figure of transformation through alignment, the Tarot's lesson after the Fool: attention becomes a tool. Manifestation, in the older sense, is simply a will clean enough to use. Jung warned that when the ego steals the Self's fire, the result is inflation — a person who cannot come down. The peak is a visit. The world is the rest of the mountain.",
    shadow:
      "Inflation. You live at altitude and call ordinary life a failure of vision. Intensity without descent. The lukewarm are treated as a different species.",
    gold:
      "A season of clean will, then a graceful walk down. The unseen made practicable. Power that can become ordinary again.",
    calling:
      "You stand as the Magician. This is not stagecraft. It is zeal distilled: intensity without waste. You raise the ceiling of a room by refusing the lukewarm. You make the unseen practicable. People feel, near you, that a life can actually be aimed — which is why you must remain kind to the part of them that is still climbing.",
    method:
      "The manner is complete concentration. You will spend a season on a single altitude. That is the gift. The corresponding duty is to know when the season has done its work.",
    field:
      "The realm is the Peak — a place to visit with the whole self, not a climate to inhabit. The magician who cannot descend has mistaken the summit for the world, and the world, unvisited, grows wild in their absence.",
    doubled:
      "When the Magician doubles, the climb starves the descent. Come down with grace. Power that cannot become ordinary is only inflation.",
    invitation:
      "Give zeal one worthy height, and practice the walk back down as part of the work.",
  },
};

export function houseOf(letter: Letter): LetterRole {
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
    a.doctrine,
    b.method,
    c.field,
    ...repeats,
    `${title} is not a costume. It is ${a.noun.toLowerCase()} work done in a ${b.adj.toLowerCase()} manner, on the path of the ${c.realm}. The letter-fields of ${themeOf(x).name.toLowerCase()}, ${themeOf(y).name.toLowerCase()}, and ${themeOf(z).name.toLowerCase()} are only the weather of that work.`,
  ].join(" ");
}

function buildSummary(a: LetterRole, b: LetterRole, c: LetterRole): string {
  return `${a.house} · ${b.adj} aspect · path of the ${c.realm}`;
}

export function archetypeOf(triad: Triad): Archetype {
  const [x, y, z] = triad;
  const a = houseOf(x);
  const b = houseOf(y);
  const c = houseOf(z);
  const title = buildTitle(a, b, c, triad);
  return {
    triad,
    code: `${x}${y}${z}`,
    title,
    house: a.house,
    houseLetter: x,
    tradition: a.tradition,
    myth: a.myth,
    correspondence: a.correspondence,
    doctrine: a.doctrine,
    shadow: a.shadow,
    gold: a.gold,
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
  correspondence: string;
  doctrine: string;
  shadow: string;
  gold: string;
}[] {
  return ALPHABET.map((letter) => {
    const role = houseOf(letter);
    return {
      letter,
      house: role.house,
      noun: role.noun,
      tradition: role.tradition,
      myth: role.myth,
      realm: role.realm,
      correspondence: role.correspondence,
      doctrine: role.doctrine,
      shadow: role.shadow,
      gold: role.gold,
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
