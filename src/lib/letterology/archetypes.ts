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
    myth: "You leave a life that isn't yours and start one that is.",
    correspondence: "Air · East · first hour",
    doctrine:
      "Stop living someone else's plan. Collecting experiences is not the same as becoming someone. Pick a direction and keep a promise to it.",
    shadow:
      "You restart so often nothing finishes. Restlessness looks like destiny. You keep shopping for a self.",
    gold:
      "One choice you actually follow through. Wanting becomes a plan you can walk.",
    calling:
      "You stand as the Seeker. You already know this version of your life is too small. Wanting more is not drama. It is information.",
    method:
      "The manner is rising. You start before you feel ready. You take the first real step instead of waiting for a perfect plan.",
    field:
      "The realm is the Threshold — the gap between the life you have and the one you keep thinking about. It only changes if you move.",
    doubled:
      "When the Seeker doubles, you start twice and finish nothing. Complete one crossing.",
    invitation: "Say what you actually want, then do one thing that matches it.",
  },
  B: {
    letter: "B",
    house: "House of the Caregiver",
    noun: "Caregiver",
    adj: "Devoted",
    realm: "Hearth",
    tradition: "Pearson Caregiver · the Great Mother",
    myth: "You make people and projects safe enough to grow.",
    correspondence: "Earth · North · the vessel",
    doctrine:
      "Care is deciding what you will protect, and for how long, without owning it. Protection with no door becomes control.",
    shadow:
      "You disappear into other people's needs, or you hold them so tight they cannot breathe.",
    gold:
      "People can stay close to you and still be themselves.",
    calling:
      "You stand as the Caregiver. Feeding, keeping, and guarding is real work. You make a home of two things that chose each other.",
    method:
      "The manner is devoted keeping. You hold what would fall apart. You know the difference between loyalty and control.",
    field:
      "The realm is the Hearth — a place a body can rest. Without that, nobody recovers.",
    doubled:
      "When the Caregiver doubles, care becomes fusion. Hold without gripping. Let people have their own breath.",
    invitation: "Keep what is actually alive. Let go of the care that is really control.",
  },
  C: {
    letter: "C",
    house: "House of the Rebel",
    noun: "Rebel",
    adj: "Wild",
    realm: "Spark",
    tradition: "Pearson Outlaw · the necessary no",
    myth: "You say no when a rule has stopped serving people.",
    correspondence: "Fire · South · the first break",
    doctrine:
      "A polite lie is still a lie. You are not against order. You are against dead order. A clean no makes room for a better yes.",
    shadow:
      "You blow things up to prove you are free, then have nothing left to live in.",
    gold:
      "One refusal that actually improves the situation.",
    calling:
      "You stand as the Rebel. You are not chaos for sport. You are why a dishonest room does not stay quiet.",
    method:
      "The manner is wild ignition. You start the change other people only complain about, and you do it in public.",
    field:
      "The realm is the Spark — the first honest sentence, the first break with a bad rule. After that comes the work of not becoming the next bad rule.",
    doubled:
      "When the Rebel doubles, you start fires and tend none of them. Stay long enough to see if the change helps.",
    invitation: "Start one change worth keeping, then stay long enough to make it livable.",
  },
  D: {
    letter: "D",
    house: "House of the Hermit",
    noun: "Hermit",
    adj: "Hidden",
    realm: "Well",
    tradition: "Tarot IX · Jung's inward turn",
    myth: "You go quiet long enough to see clearly, then you bring it back.",
    correspondence: "Earth · midnight · the lantern",
    doctrine:
      "Some truths die if you perform them too soon. Solitude is a method, not a personality. Go in, face what you have been avoiding, and come back with something people can use.",
    shadow:
      "You hide and call it purity. Insight turns into contempt for ordinary people.",
    gold:
      "Private seeing that becomes useful. You return.",
    calling:
      "You stand as the Hermit. Depth is not shyness. You prefer the practice to the announcement.",
    method:
      "The manner is hidden descent. You stay with what is not clear yet. You will not be hurried by people who only live on the surface.",
    field:
      "The realm is the Well — the quiet work that changes you. What you learn there is meant to be used in daylight.",
    doubled:
      "When the Hermit doubles, you go so far in you forget to come back. Bring something with you.",
    invitation: "Let one private practice become visible. Depth that never speaks starts lying to itself.",
  },
  E: {
    letter: "E",
    house: "House of the Explorer",
    noun: "Explorer",
    adj: "Open",
    realm: "Horizon",
    tradition: "Pearson Explorer · the wider world",
    myth: "You leave a small map so the life can get larger.",
    correspondence: "Air · the far edge · the open road",
    doctrine:
      "The world is larger than the wound. Leaving is useful when fear has shrunk your life. Leaving as a habit is just a nicer cage.",
    shadow:
      "New places, same self. You postpone closeness and call it freedom.",
    gold:
      "A wider life that still has a home. You come back larger, not just farther.",
    calling:
      "You stand as the Explorer. Where the Seeker leaves an old self, you leave an old map. You make more room than the situation asked for, and someone usually needs it.",
    method:
      "The manner is open widening. You grow by walking into what you cannot name yet. You trust the part of you that says there is more world than this argument.",
    field:
      "The realm is the Horizon — the next range, not an excuse to never arrive. You can outgrow a story without betraying the people in it.",
    doubled:
      "When the Explorer doubles, everything is distant and nothing is close. Grow in one direction.",
    invitation: "Expand toward one place you could actually love, not every empty distance at once.",
  },
  F: {
    letter: "F",
    house: "House of the Fool",
    noun: "Fool",
    adj: "Free",
    realm: "Gate",
    tradition: "Tarot 0 · Pearson Fool · beginner's mind",
    myth: "You start without pretending you already know who you are.",
    correspondence: "Aether · the unnumbered card · the cliff",
    doctrine:
      "You cannot enter a new life wearing the full armor of the old one. The Fool is not stupid. The Fool is unowned. Beginner's mind means attention that has not yet become a résumé.",
    shadow:
      "You never commit. You stay light by never putting your weight down, and call that wisdom.",
    gold:
      "You travel light and still keep one promise.",
    calling:
      "You stand as the Fool. You have not signed the contract that says you must already know who you are. Joy and risk arrive together, or not at all.",
    method:
      "The manner is free. You leave room in the day. You move as you actually need to move, and you will not be shamed for traveling light — only asked, eventually, to land.",
    field:
      "The realm is the Gate — an opening you choose and keep choosing. Freedom is a daily refusal to be herded by fear, fashion, or last year's self.",
    doubled:
      "When the Fool doubles, nothing is vowed. Stay freely. One promise is what keeps freedom from becoming drift.",
    invitation: "Keep the open space, and give it one promise that is still yours.",
  },
  G: {
    letter: "G",
    house: "House of the Creator",
    noun: "Creator",
    adj: "Generative",
    realm: "Grove",
    tradition: "Pearson Creator · the living work",
    myth: "You make something that was not there yesterday.",
    correspondence: "Earth · spring · the green work",
    doctrine:
      "Unused ability turns against you. The Creator is not only for artists. It is the need to bring something into form. What you will not make, you will eventually criticize. What you tend, grows.",
    shadow:
      "You cannot stop producing, or you only make to be seen making. The work dies of attention.",
    gold:
      "A piece of work that outlives a mood. You leave the room more habitable than you found it.",
    calling:
      "You stand as the Creator. You do not collect projects. You stay until something living stands where there was only intention. Talent comes and goes. Tending is a decision.",
    method:
      "The manner is generative. You see what wants to live and you help it. You stay through the unglamorous season.",
    field:
      "The realm is the Grove — work, children of the mind, rooms of practice that grow because someone refused to leave. It keeps giving after you are tired.",
    doubled:
      "When the Creator doubles, nothing is allowed to rest. Let one thing lie fallow.",
    invitation: "Tend one living work, and let it rest when it asks.",
  },
  H: {
    letter: "H",
    house: "House of the Prophet",
    noun: "Prophet",
    adj: "Far-seeing",
    realm: "Vista",
    tradition: "The prophetic voice · conscience of the group",
    myth: "You say what the group said it loved, when the group has started living otherwise.",
    correspondence: "Air · the high place · the unwelcome word",
    doctrine:
      "The prophet is not a fortune-teller and not a brand. You remember the vow. Hope without a backbone is entertainment. A backbone without hospitality is a weapon.",
    shadow:
      "You live so far ahead of the room that you cannot sit down. The future becomes a stick you use on people.",
    gold:
      "A longer honesty that still feeds people. You speak the far line and keep the near table.",
    calling:
      "You stand as the Prophet. You will not let a family, a craft, or a culture forget its own vow. You see what is coming. The task is to say it in a language the living can hear, then stay for the meal.",
    method:
      "The manner is far-seeing. You offer the longer view without forcing anyone to kneel to it. Hospitality is how your vision stays from becoming a sermon.",
    field:
      "The realm is the Vista — the far line that organizes today's table. A vision that cannot help anyone through an ordinary day is just talk.",
    doubled:
      "When the Prophet doubles, the near is neglected. Set the nearest table. The future is fed by the present meal.",
    invitation: "Keep the far line, and be decent to the person already in the room.",
  },
  I: {
    letter: "I",
    house: "House of the Sage",
    noun: "Sage",
    adj: "Lucid",
    realm: "Lamp",
    tradition: "Pearson Sage · Jung's Wise Old One",
    myth: "You would rather understand than win.",
    correspondence: "Air · Mercury's study · the inner lamp",
    doctrine:
      "Understanding is a form of love. Display is not. The Sage would rather be accurate than impressive. Insight that never leaves the study is furniture. Insight that never sat still is only opinion.",
    shadow:
      "You collect knowledge the way a dragon collects gold, and nobody else gets any light.",
    gold:
      "A seeing you can share at an ordinary table. The inside and the outside match.",
    calling:
      "You stand as the Sage. Imagination lives in you first as a private room. That is correct. The second move is also required: let one unused insight help someone who is trying to see.",
    method:
      "The manner is lucid. You keep the thought honest before you show it. You revise. You wait until the sentence is true, then you risk saying it.",
    field:
      "The realm is the Lamp. A lamp is not a bonfire. It is a small, tended brightness for work, reading, and the people you will not leave confused.",
    doubled:
      "When the Sage doubles, the study locks. Speak one private seeing. Unused light starts looking like wisdom if you sit among it long enough.",
    invitation: "Say one unused insight out loud, and let ordinary life test it.",
  },
  J: {
    letter: "J",
    house: "House of the Hero",
    noun: "Hero",
    adj: "Steadfast",
    realm: "Road",
    tradition: "Jung / Campbell · the heroic journey",
    myth: "You leave, pay a real cost, and come back with something people can use.",
    correspondence: "Fire · the ordeal · the road home",
    doctrine:
      "Courage that never comes home is just travel with better scars. The hero leaves, is changed, and returns with a skill, a truth, or a medicine the village did not have. If you cannot come home, you have not finished.",
    shadow:
      "The fight never ends because rest would ask who you are without it.",
    gold:
      "A cost that became useful. You went, you paid, you returned. Other people can use what you learned.",
    calling:
      "You stand as the Hero — not the statue, the traveler who will not look away. Joy is part of how you travel, or the road is only punishment. You move a life from a smaller honesty to a larger one.",
    method:
      "The manner is steadfast travel. You take the next mile when the prize is not visible. You do not confuse delay with destiny.",
    field:
      "The realm is the Road — the honest miles between a smaller self and a larger duty. Arrival is part of the work. So is sitting down among the people you left.",
    doubled:
      "When the Hero doubles, you never arrive. A journey that cannot rest is just exile with better branding.",
    invitation: "Take the next honest mile, and let joy come along instead of waiting at the end.",
  },
  K: {
    letter: "K",
    house: "House of the Orphan",
    noun: "Orphan",
    adj: "Kindred",
    realm: "Table",
    tradition: "Pearson Orphan · the search for belonging",
    myth: "You learn that home is made, not inherited.",
    correspondence: "Water · the lost child · the made table",
    doctrine:
      "The world is not automatically kind. The work is to refuse to become unkind in return. The people who build the best tables often remember being left outside one.",
    shadow:
      "You collect only the wounded and call that family. The stranger stays outside to prove the wound was real.",
    gold:
      "Chosen family with a spare chair. You know how to make belonging because you know what its absence costs.",
    calling:
      "You stand as the Orphan — not as a wound to display, as the beginning of real kinship. You understand by standing with people. What you know wants to be useful to someone specific.",
    method:
      "The manner is kindred. You knit family and chosen family. Kindness is not decoration on your intelligence. It is how you think.",
    field:
      "The realm is the Table — the place the outsider is fed and the insider is asked to make room. A key that only opens for blood is just a lock with a story.",
    doubled:
      "When the Orphan doubles, the room closes around the wound. Leave a place for the one who does not yet belong.",
    invitation: "Offer one precise kindness to kin, then one to someone who has no claim on you yet.",
  },
  L: {
    letter: "L",
    house: "House of the Lover",
    noun: "Lover",
    adj: "Radiant",
    realm: "Flame",
    tradition: "Pearson Lover · Eros as a path",
    myth: "You will not live uncommitted to beauty, body, or a beloved.",
    correspondence: "Water and fire · Venus · the chosen flame",
    doctrine:
      "Desire is a teacher, not a lifestyle. The Lover lets beauty, body, and a beloved change what they will do next. Passion that cannot stay is only hunger. Passion that cannot rest is only performance.",
    shadow:
      "You spend all the heat on almost-loves. Fatigue hides behind charm.",
    gold:
      "A warmth that stays after the first shine. You go first, you sleep, you return.",
    calling:
      "You stand as the Lover. You lead by going first in warmth. This is not collapse. It is putting your heat where you said it belongs.",
    method:
      "The manner is radiant. Care is your form of authority. You make a room visible, and you know when you need rest.",
    field:
      "The realm is the Flame — not the firework, the fire that actually cooks. Passion here is loyalty with heat. Heat that never becomes care is only a show.",
    doubled:
      "When the Lover doubles, brightness performs and fatigue hides. Rest. Love that cannot sleep becomes display.",
    invitation: "Give your attention to one true thing. Stop lighting every hallway.",
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
      "Force without a worthy object is just restlessness in armor. The Warrior is not the brawler and not the martyr. It is the part of you that can keep a boundary, finish a hard hour, and put the weapon down.",
    shadow:
      "Every hour is a campaign. You cannot pause without feeling weak, so meaning never catches up.",
    gold:
      "A clean edge in service of something living. The fight you refuse is as important as the one you take.",
    calling:
      "You stand as the Warrior. This is not violence. It is a practice that has begun to carry itself. You give scattered energy a spine. People remember what they were for, near you.",
    method:
      "The manner is swift and rhythmic. You move toward mastery, not just activity. You return to the work when mood would like a different war.",
    field:
      "The realm is the Wheel — work that continues. Real strength is showing up again tomorrow, not the one blow people remember.",
    doubled:
      "When the Warrior doubles, speed outruns meaning. Pause. A fight without a worthy object is just restlessness in armor.",
    invitation: "Give the real work a daily return, and know which battles are beneath you.",
  },
  N: {
    letter: "N",
    house: "House of the Healer",
    noun: "Healer",
    adj: "Gentle",
    realm: "Garden",
    tradition: "Jung's wounded healer · the medicine path",
    myth: "You noticed your own wound and made a job of tending.",
    correspondence: "Water · Chiron · the garden rows",
    doctrine:
      "You can only help with what you are willing to go through yourself. Healing is not fixing people so they stop bothering the room. It is restoring what is already trying to live. A healer who will not be healed becomes a subtle tyrant of care.",
    shadow:
      "You notice everyone except yourself. Care becomes control, or you abandon what was just starting to root.",
    gold:
      "Tending that includes the tender. You keep life workable — for others and for yourself — without needing to be needed.",
    calling:
      "You stand as the Healer. You notice before you fix. Care, in you, has no condescension. You see what needs feeding while others are still arguing about the problem.",
    method:
      "The manner is gentle feeding. You tend what is young, tender, or not yet named. You do not confuse a dramatic cure with the slow work of making a body, a friendship, or a day able to continue.",
    field:
      "The realm is the Garden — the rows where recovery actually happens. No one applauds a well-watered root. That is how you know you are close to the real work.",
    doubled:
      "When the Healer doubles, the feeder starves. Include yourself. Taking care of the healer is not vanity.",
    invitation: "Feed what is already alive in you. Then feed what is alive near you. In that order.",
  },
  O: {
    letter: "O",
    house: "House of the Priestess",
    noun: "Priestess",
    adj: "Receptive",
    realm: "Circle",
    tradition: "Tarot II · the sacred vessel",
    myth: "You hold a room so something true can enter without being forced.",
    correspondence: "Water · the Moon · the held room",
    doctrine:
      "Mystery needs a rim or it spills. The rim must not become a wall. The Priestess is a vocation, not a gender. You do not haul the unseen into the room. You make the room fit to be entered.",
    shadow:
      "Empty ritual, or every door open until the room is only a draft. You call the chill holy.",
    gold:
      "People can enter, be changed, and leave intact. Order serves openness. Openness has a shape.",
    calling:
      "You stand as the Priestess. You open, and you keep the opening from becoming chaos. This is not a performance of the sacred. It is hospitality toward what cannot be scheduled.",
    method:
      "The manner is receptive. You make order that can still admit a guest, a chance, a second beginning. You know when to speak and when speaking would scare the thing away.",
    field:
      "The realm is the Circle. A circle is a decision about what belongs inside tonight. Too tight, and life cannot enter. Too loose, and nothing can ripen.",
    doubled:
      "When the Priestess doubles, the circle freezes into empty rite. Open one real door, and keep the room behind it warm.",
    invitation: "Open the door that is actually yours to open, and give the space a simple, kept order.",
  },
  P: {
    letter: "P",
    house: "House of the Ruler",
    noun: "Ruler",
    adj: "Sovereign",
    realm: "Crown",
    tradition: "Pearson Ruler · sacred kingship",
    myth: "You make order so other people can flourish inside it.",
    correspondence: "Fire and earth · the Sun · the ring of responsibility",
    doctrine:
      "Power is the permission to set the conditions others live under. That is not domination. It is the vow to keep the land workable and the people able to plan. The risk is mistaking the office for yourself. A crown that cannot listen is only a hat.",
    shadow:
      "Purpose becomes a tyrant. You would rather be obeyed than be in contact, and you call the loneliness dignity.",
    gold:
      "Order that still breathes. You aim the room without erasing the people in it.",
    calling:
      "You stand as the Ruler. Purpose, in you, is presence with a direction. You are not here to dominate. You are here to give scattered lives a shape they can trust, including your own.",
    method:
      "The manner is sovereign aiming. You turn potential into a sequence of kept days. Passion waits for a worthy object, which is how it becomes a plan instead of a mood.",
    field:
      "The realm is the Crown: not jewelry, the ring of responsibility. Whoever wears it must stay larger than their favorite plan, or the land dries out around a single idea.",
    doubled:
      "When the Ruler doubles, the script hardens. Let purpose stay larger than one aim. A crown that cannot listen is only a hat.",
    invitation: "Name the work that would still matter if it were slower, then do the next inch of it.",
  },
  Q: {
    letter: "Q",
    house: "House of the Mystic",
    noun: "Mystic",
    adj: "Quiet",
    realm: "Cloister",
    tradition: "The contemplative path · union with the real",
    myth: "You prefer a living question to a crowded answer.",
    correspondence: "Aether · the inner courtyard · the unspeakable",
    doctrine:
      "The real will not be herded by a clever sentence. Union means a life no longer split against itself. A rapture that cannot wash a dish is only aesthetic. A dish washed with no interior is only hygiene. The path wants both.",
    shadow:
      "You use silence as an exit. Ordinary people become noise on the way to an experience.",
    gold:
      "A question you can live near. Quiet that still loves the world.",
    calling:
      "You stand as the Mystic. You would rather touch the real thing and leave the rest than win an argument about the whole. Quiet quality is how you love. That love is stricter than it looks.",
    method:
      "The manner is quiet questioning. You will not be rushed into a cheap version of the true. You wait. You discard. You keep the one thing that still rings when the fashion has gone dull.",
    field:
      "The realm is the Cloister — not escape, the inner courtyard from which life can be seen without being owned by its noise. You go there to return more accurately, not to disappear.",
    doubled:
      "When the Mystic doubles, the ordinary day is despised. Live near the question without leaving the living.",
    invitation: "Ask the one question that would change the week, and stay beside it without needing an audience.",
  },
  R: {
    letter: "R",
    house: "House of the Bard",
    noun: "Bard",
    adj: "Attuned",
    realm: "Song",
    tradition: "The Celtic bard · the resonant word",
    myth: "You restore a group to itself by finding the true note.",
    correspondence: "Air · the throat · the true note",
    doctrine:
      "People come back to themselves through a sound they recognize. The Bard is not an entertainer first. The Bard is a tuner. You hear when a conversation, a grief, or a day has gone sharp, and you can bring it back to pitch.",
    shadow:
      "You become the room's mood. Charm replaces the thing that needed saying.",
    gold:
      "A note that is yours, offered in time. Meaning people can actually use.",
    calling:
      "You stand as the Bard. You restore pitch. This is why people tell you things they did not plan to tell. They can hear themselves better in your presence, which is a responsibility.",
    method:
      "The manner is attuned returning. You listen until the signal is clean. You refuse to interrupt a true sound with a cleverer one.",
    field:
      "The realm is the Song — a pattern a body can enter. If it cannot be lived, it is not yet a song. It is only an idea with rhythm attached.",
    doubled:
      "When the Bard doubles, echo replaces voice. Change key when the old one is spent.",
    invitation: "Listen for the note that is yours, and return to it once before night.",
  },
  S: {
    letter: "S",
    house: "House of the Weaver",
    noun: "Weaver",
    adj: "Shared",
    realm: "Weave",
    tradition: "The fate-weavers · synergy of souls",
    myth: "Strength that comes from joining, not from standing alone.",
    correspondence: "Earth · the loom · the unseen pattern",
    doctrine:
      "Nothing important happens as a solo. Lives are threads. The cloth is the point. Keep one thread that is still yours, or you vanish into the pattern you serve.",
    shadow:
      "You disappear into the we. Or you force joins that wanted to stay two.",
    gold:
      "Combinations no single part could invent. You belong without dissolving.",
    calling:
      "You stand as the Weaver. You make combinations. You can feel when two lives, two ideas, or two hours want to be more together than apart, and you have the patience to let the join set.",
    method:
      "The manner is shared joining. You braid people, efforts, timings. The strongest seams are often the ones no one applauds.",
    field:
      "The realm is the Weave — relationship, timing, and meaning as one cloth. You also live with loose ends. A finished tapestry with no new thread is a funeral.",
    doubled:
      "When the Weaver doubles, the self dissolves into the pattern. Keep one unsurrendered thread.",
    invitation: "Join what wants joining, and keep a name that is still yours.",
  },
  T: {
    letter: "T",
    house: "House of the Alchemist",
    noun: "Alchemist",
    adj: "Fierce",
    realm: "Crucible",
    tradition: "Hermetic art · Pearson Destroyer · death and rebirth",
    myth: "Dissolve what is false. Rebuild what is true.",
    correspondence: "Fire · the blackening · the vessel that can take heat",
    doctrine:
      "Some forms must die for the next form to live. Dissolve, then recombine. You will not keep a dead story walking. The hard season is allowed. Making a lifestyle of crisis is not.",
    shadow:
      "You torch what needed tending. Transformation becomes an addiction. Ordinary happiness looks like a failure of nerve.",
    gold:
      "A necessary ending that was not cruel. You named what was over, crossed, and stayed to tend what remained.",
    calling:
      "You stand as the Alchemist. Truth, in you, costs something. You midwife change not by cruelty, but by refusing the comfortable lie. People may experience this as loss. Sometimes it is. Not every loss is a mistake.",
    method:
      "The manner is fierce crossing. You will not live in an expired story. Tension is the heat that makes a new shape possible. Trust comes after the old skin is shed, not before.",
    field:
      "The realm is the Crucible: a container that can take heat without leaking. Change without a container is only a burn. You are responsible for the container as much as for the flame.",
    doubled:
      "When the Alchemist doubles, crisis becomes a style. Tend what the last fire revealed. Not every day is for the furnace.",
    invitation: "Name the one thing that is already over, and cross with as much tenderness as courage.",
  },
  U: {
    letter: "U",
    house: "House of the Peacemaker",
    noun: "Peacemaker",
    adj: "Whole",
    realm: "Vessel",
    tradition: "Jung's Self · the union of opposites",
    myth: "You can hold two true things without making either of them smaller.",
    correspondence: "Water · the bowl · the meeting of opposites",
    doctrine:
      "Wholeness is not sameness. Peace is not the absence of edge. It is a container that can bear a quarrel without splitting the world in two.",
    shadow:
      "Niceness. You paper conflict until it returns as illness, spite, or a sudden break.",
    gold:
      "A we that does not require a smaller I. Two honest forces stand in one room.",
    calling:
      "You stand as the Peacemaker — not the smoother of conflict, the holder of opposites. Charm asks people to get along. The vessel asks them to stay true and still remain in the room.",
    method:
      "The manner is whole-making. You look for the understanding that lets two honest forces stand together. You will disappoint people who wanted you to pick a smaller side.",
    field:
      "The realm is the Vessel — the bowl that can hold difference without cracking. Too fine, it shatters. Too thick, nothing can be tasted.",
    doubled:
      "When the Peacemaker doubles, conflict is papered. Let one necessary edge remain. Unity that cannot bear a quarrel is only niceness.",
    invitation: "Hold the whole, and keep one unblended contour of yourself.",
  },
  V: {
    letter: "V",
    house: "House of the Oracle",
    noun: "Oracle",
    adj: "Vivid",
    realm: "Sanctum",
    tradition: "The Pythia · vocation as seeing",
    myth: "You see a future with a face, and then you take the next ordinary step.",
    correspondence: "Aether · Delphi · the inner temple",
    doctrine:
      "A vision without a body is a daydream with better lighting. Vocation means an image rises and you live toward it in ordinary inches. An oracle that will not take the next step is only theater.",
    shadow:
      "You live in the picture and starve the path. The vision hardens into a statue you serve.",
    gold:
      "A picture you are willing to be seen seeing — and a humble step that belongs to it.",
    calling:
      "You stand as the Oracle — seer, not soothsayer. This is vocation, not prediction. You see the shape of a life while it is still only an idea, and you are willing to be seen seeing it. That willingness is the real risk.",
    method:
      "The manner is vivid pointing. You name a direction with enough life that others can walk toward it. You keep the image warm by remaining human beside it.",
    field:
      "The realm is the Sanctum — the private room where the picture is received before it is announced. What is received in private must be tested in public, or it remains a private religion.",
    doubled:
      "When the Oracle doubles, the near is refused. Take one humble inch that belongs to the picture.",
    invitation: "Tell the true picture, then take the ordinary step that proves you mean it.",
  },
  W: {
    letter: "W",
    house: "House of the Innocent",
    noun: "Innocent",
    adj: "Awake",
    realm: "Dawn",
    tradition: "Pearson Innocent · Jung's Divine Child",
    myth: "You will not let the hurt have the last word on what the world is.",
    correspondence: "Air · first light · the Divine Child",
    doctrine:
      "Astonishment is a form of intelligence. The Innocent is not the person who has never been hurt. Wonder that will not act becomes tourism. Action without wonder becomes a machine.",
    shadow:
      "Looking instead of doing. Or a performed sweetness that refuses the dark and cannot be trusted when the dark arrives.",
    gold:
      "A second beginning that is not amnesia. You see clearly, including the wound, and you still put your hands to the work.",
    calling:
      "You stand as the Innocent. Wonder is wisdom before it hardens into advice. You remain available to being changed by what you see. This is rarer than cleverness, and more useful.",
    method:
      "The manner is awake witnessing. You look again. You restore astonishment as a practical mercy — the kind that makes a tired person able to continue.",
    field:
      "The realm is the Dawn: the hour when the world is not yet argued over. Innocence is a way of beginning again. It is not a way of remaining uninformed.",
    doubled:
      "When the Innocent doubles, looking replaces doing. Put a hand to the work.",
    invitation: "Look again at what you think you already understand, then join two strands with your hands.",
  },
  X: {
    letter: "X",
    house: "House of the Trickster",
    noun: "Trickster",
    adj: "Liminal",
    realm: "Edge",
    tradition: "Jung's Trickster · the holy disruption",
    myth: "You break the false rule so a truer one can appear.",
    correspondence: "Aether · the crossroads · the unmarked variable",
    doctrine:
      "A rule that has begun to lie must be broken before it can be rewritten. The Trickster is not a vandal. A joke that never builds is only sabotage. A disruption that serves life is how the next order gets in.",
    shadow:
      "You stay outside to remain special. Disruption becomes a style, and you cannot bear to be useful inside a room that is working.",
    gold:
      "The missing term, brought back across the line. Rooms become more honest. The rare thing serves more than your difference.",
    calling:
      "You stand as the Trickster. The rare thing in you is not a costume. It is medicine. Rooms become more honest when you arrive, even if they do not thank you at once.",
    method:
      "The manner is liminal. You work from the margin. You bring the missing term into a finished room — then you help set the table again, or the trick was only cruelty.",
    field:
      "The realm is the Edge: crossings, extremes, the honesty of the unmapped. The gift is movement between worlds, not a permanent address in exile. Messengers deliver, then they leave the house standing.",
    doubled:
      "When the Trickster doubles, exile becomes a habit. Let the rare thing serve more than your difference.",
    invitation: "Honor what does not match the pattern, and bring it back so others can use it.",
  },
  Y: {
    letter: "Y",
    house: "House of the Shapeshifter",
    noun: "Shapeshifter",
    adj: "Yielding",
    realm: "Fork",
    tradition: "Campbell's shapeshifter · the flexible soul",
    myth: "A self that can turn without breaking.",
    correspondence: "Water · the moon's face · the living hinge",
    doctrine:
      "Identity is something you do, not a costume you keep. Yielding is intelligence. Yielding without a spine is how a person becomes a hallway.",
    shadow:
      "You can be anyone, so you are no one. Empathy becomes a leak. Every yes is temporary, and nothing can build on you.",
    gold:
      "A self that can turn and still keep a vow. You adapt without disappearing.",
    calling:
      "You stand as the Shapeshifter. Yearning, in you, has learned both yes and not-yet. People call this the empath. The older word is a soul that refuses to become a statue of itself.",
    method:
      "The manner is yielding. You bend where bending is wisdom. You know how to say yes without becoming a door anyone may walk through.",
    field:
      "The realm is the Fork — the place a life can still choose. A fork is not an excuse to walk both roads until you starve. It is a real choice, still open.",
    doubled:
      "When the Shapeshifter doubles, the stand is postponed. Let one yes become a spine.",
    invitation: "Bend where bending is wisdom. Then keep one unbent vow.",
  },
  Z: {
    letter: "Z",
    house: "House of the Magician",
    noun: "Magician",
    adj: "Complete",
    realm: "Peak",
    tradition: "Pearson Magician · will made form",
    myth: "You bring the inner picture and the outer day into line.",
    correspondence: "Fire · the peak · the aligned will",
    doctrine:
      "Inner picture and outer day can be brought into line. That is work, not a spell you buy. Manifestation is a will clean enough to use. The peak is a visit. The world is the rest of the mountain.",
    shadow:
      "You live at altitude and call ordinary life a failure of vision. Intensity without descent.",
    gold:
      "A season of clean will, then a walk back down. Power that can become ordinary again.",
    calling:
      "You stand as the Magician. This is not stagecraft. It is intensity without waste. You raise the ceiling of a room by refusing the lukewarm. People feel, near you, that a life can actually be aimed — which is why you must stay kind to the part of them that is still climbing.",
    method:
      "The manner is complete concentration. You will spend a season on a single height. The duty is to know when the season has done its work.",
    field:
      "The realm is the Peak — a place to visit with the whole self, not a climate to inhabit. The magician who cannot descend has mistaken the summit for the world.",
    doubled:
      "When the Magician doubles, the climb starves the descent. Come down. Power that cannot become ordinary is only inflation.",
    invitation: "Give zeal one worthy height, and practice the walk back down as part of the work.",
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
  const repeats: string[] = [];
  if (triad[0] === triad[1] || triad[0] === triad[2]) repeats.push(a.doubled);
  if (triad[1] === triad[2] && triad[1] !== triad[0]) repeats.push(b.doubled);

  return [
    a.calling,
    b.method,
    c.field,
    ...repeats,
    `${title} is ${a.noun.toLowerCase()} work done in a ${b.adj.toLowerCase()} way, on the path of the ${c.realm}.`,
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
  const others = inventory.filter((item) => item.letter !== signature);
  const second = others[0]?.letter ?? signature;
  const third = others[1]?.letter ?? others[0]?.letter ?? signature;
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
