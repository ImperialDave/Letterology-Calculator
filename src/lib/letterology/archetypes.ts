import type { Archetype, Letter, LetterInventory, Triad } from "./types";
import { ALPHABET } from "./types";
import { themeOf } from "./lexicon";
import { readingOf } from "./reading";

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
      "You stand as the Seeker. You know this life is too small. Say what you want instead, and take one step toward it this week.",
    method:
      "Rising is the method, not a second personality. Take the first real step before the plan is perfect. Do not hunt for a new personality instead of moving.",
    field:
      "The work happens at the Threshold. That is the gap between the life you have and the life you want. The gap closes only when you move.",
    doubled:
      "When the Seeker doubles, you start twice and finish nothing. Finish one change before you start another.",
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
      "You stand as the Caregiver. Your job is to help people and projects grow. Care for them without taking over their lives.",
    method:
      "Devotion is the method, not a second personality. Pick one person, habit, or promise and stay with it. Care is not the same as control.",
    field:
      "The work happens at the Hearth. That is a place where a person can rest. If you never rest there yourself, the care runs out.",
    doubled:
      "When the Caregiver doubles, you hold people so tight they cannot breathe. Help them, and let them stay themselves.",
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
      "You stand as the Rebel. Your job is to say no when a rule is hurting people. One clear no is enough. Do not smash the whole room to prove a point.",
    method:
      "Wild is the method, not a second personality. Do the change other people only complain about, and do it where others can see it. Start with a clear no.",
    field:
      "The work happens at the Spark. That is the first honest break with a bad rule. After you break it, stay and build something people can live with.",
    doubled:
      "When the Rebel doubles, you start fires and put none of them out. Stay long enough to see if the change helps.",
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
      "You stand as the Hermit. Your job is to get quiet, see what is true, and bring one useful thing back. Depth is not the same as hiding.",
    method:
      "Hidden is the method, not a second personality. Stay with what is not clear yet. Do not rush a private decision into a public announcement.",
    field:
      "The work happens at the Well. You get quiet long enough to see what is true, and you bring what you learn back into the day.",
    doubled:
      "When the Hermit doubles, you go so far inward that you forget to come back. Bring one useful thing with you.",
    invitation: "Let one private practice become visible. If you never say it out loud, you start lying to yourself.",
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
      "You stand as the Explorer. Your job is to make life bigger than the old map. Go farther, and still keep a home you can return to.",
    method:
      "Open is the method, not a second personality. Widen the job past the argument in front of you. Distance by itself is not the point.",
    field:
      "The work happens on the Horizon. That is the next real place, not an excuse to never arrive. You can outgrow a story and still treat people well.",
    doubled:
      "When the Explorer doubles, everything is far away and nothing is close. Grow in one direction and keep one home.",
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
      "You stand as the Fool. Your job is to start before you feel ready. Keep one promise so the start does not turn into drifting.",
    method:
      "Free is the method, not a second personality. Begin before you have the old excuses ready. You still have to land somewhere.",
    field:
      "The work happens at the Gate. That is an opening you choose and keep choosing. Freedom here means fear and last year's self do not push you around.",
    doubled:
      "When the Fool doubles, nothing is promised. Keep one promise. That is what stops freedom from becoming drift.",
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
      "You stand as the Creator. Your job is to make something that was not there yesterday and keep taking care of it. Showing up matters more than talent.",
    method:
      "Generative is the method, not a second personality. Stay until something real stands where there was only an idea. Help it through the boring middle.",
    field:
      "The work happens in the Grove. That is a living piece of work that keeps giving after you are tired. Let it rest when it needs rest.",
    doubled:
      "When the Creator doubles, nothing is allowed to rest. Let one thing stop for a while.",
    invitation: "Take care of one living project, and let it rest when it needs rest.",
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
      "You stand as the Prophet. Your job is to say the hard truth about what is coming, in words people can use, and then stay for the ordinary day.",
    method:
      "Far-seeing is the method, not a second personality. Offer the longer view without making people bow to it. Say it so a normal person can act on it.",
    field:
      "The work happens on the Vista. That is the far view that should organize today's tasks. A vision that cannot help anyone through a normal day is only talk.",
    doubled:
      "When the Prophet doubles, you neglect the people in the room. Feed today. The future depends on the present meal.",
    invitation: "Keep the long view, and be decent to the person already in the room.",
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
      "You stand as the Sage. Your job is to understand before you speak, then share one insight that helps someone. Knowledge that stays locked up helps no one.",
    method:
      "Lucid is the method, not a second personality. Keep the thought honest before you show it. Revise until the sentence is true, then say it.",
    field:
      "The work happens at the Lamp. That is a small clear light for real work. It is not a speech, and it is not a locked study.",
    doubled:
      "When the Sage doubles, you study and never speak. Say one private insight out loud.",
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
      "You stand as the Hero. Your job is to do the hard part, pay a real cost, and come back with something people can use. A fight that never comes home is not finished.",
    method:
      "Steadfast is the method, not a second personality. Take the next step when the prize is not visible yet. Moving is not the same as arriving.",
    field:
      "The work happens on the Road. Those are the honest miles between a smaller truth and a larger duty. Coming home and sitting down is part of the work.",
    doubled:
      "When the Hero doubles, you never arrive. Rest. A trip that cannot stop is just leaving with a better story.",
    invitation: "Take the next honest step, and let some joy come with you instead of waiting until the end.",
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
      "You stand as the Orphan. Your job is to build belonging, not to display a wound. Make room for someone who does not belong yet.",
    method:
      "Kindred is the method, not a second personality. Do the work beside one specific person. Kindness decides who the work is for.",
    field:
      "The work happens at the Table. Feed the outsider, and ask the insider to make room. A welcome that only works for family is still a closed door.",
    doubled:
      "When the Orphan doubles, the room closes around the old hurt. Leave a chair for the person who does not belong yet.",
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
      "You stand as the Lover. Your job is to put real attention on one person or one thing, then rest. Do not light up every room to prove you are alive.",
    method:
      "Radiant is the method, not a second personality. Put your attention where you said it belongs, then stop. Warmth that never rests turns into a show.",
    field:
      "The work happens at the Flame. Use it to take care of one real thing, not to put on a show. Attention that never becomes care is only performance.",
    doubled:
      "When the Lover doubles, you look bright and feel exhausted. Rest. Love that cannot sleep becomes a show.",
    invitation: "Give your attention to one true thing. Stop trying to brighten every room.",
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
      "You stand as the Warrior. This is not about violence. Your job is to aim scattered effort at one goal, finish the hard hour, and then stop.",
    method:
      "Swift is the method, not a second personality. Move toward a goal that matters, and stop when the hour is over. Speed without a reason is restlessness.",
    field:
      "The work happens on the Wheel. That means you show up again tomorrow. Real strength is the return, not one dramatic blow.",
    doubled:
      "When the Warrior doubles, speed runs past the reason. Pause. A fight with nothing worth protecting is only restlessness.",
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
      "You stand as the Healer. Your job is to notice what needs care before you try to fix it. Include yourself. Help without talking down to people.",
    method:
      "Gentle is the method, not a second personality. Notice first, then help. A dramatic fix is not the same as a day that can continue.",
    field:
      "The work happens in the Garden. Recovery happens one small tending at a time. Include yourself in the tending.",
    doubled:
      "When the Healer doubles, you feed everyone except yourself. Include yourself. Caring for the helper is part of the job.",
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
      "You stand as the Priestess. Your job is to hold a calm room so something true can be said. This is hospitality, not a performance.",
    method:
      "Receptive is the method, not a second personality. Keep enough order that a guest can still enter. Know when more talking would scare the truth away.",
    field:
      "The work happens in the Circle. Decide what belongs in the room tonight. Too tight, and life cannot enter. Too loose, and nothing gets finished.",
    doubled:
      "When the Priestess doubles, the room turns into an empty routine. Open one real door, and keep that room warm.",
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
      "You stand as the Ruler. Your job is to give people a shape they can trust. Set fair order. Do not collect obedience for its own sake.",
    method:
      "Sovereign is the method, not a second personality. Turn a wish into days you actually keep. Aim the work without erasing the people in it.",
    field:
      "The work happens under the Crown. That means the responsibility, not a costume. Care about more than one favorite plan.",
    doubled:
      "When the Ruler doubles, the plan gets rigid. Listen. A rule that cannot hear people is only control.",
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
      "You stand as the Mystic. Your job is to stay with the one question that would change your week. Do the ordinary work too.",
    method:
      "Quiet is the method, not a second personality. Do not rush a cheap version of the truth. Drop what is fake, and keep the one thing that still matters.",
    field:
      "The work happens in the Cloister. That is a quiet place where noise does not own you. Go there so you can come back clearer.",
    doubled:
      "When the Mystic doubles, you look down on ordinary days. Stay with the question, and stay with the people.",
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
      "You stand as the Bard. Your job is to say the true feeling, not the charming one. People open up near you. Treat that as a responsibility.",
    method:
      "Attuned is the method, not a second personality. Listen until you know what is actually true. Do not cover a true feeling with a clever line.",
    field:
      "The work happens in the Song. That means a feeling people can live, not just hear. If nobody can act on it, it is not ready.",
    doubled:
      "When the Bard doubles, you echo the room and lose your own voice. Change the tune when the old one is used up.",
    invitation: "Say the feeling that is actually yours, and come back to it once before night.",
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
      "You stand as the Weaver. Your job is to join people or tasks that work better together. Keep one part that is still yours, or you disappear into the group.",
    method:
      "Shared is the method, not a second personality. Connect the people and the timing, then let the join settle. The best connections are often quiet.",
    field:
      "The work happens in the Weave. People and timing are the same job here. Keep one strand that is still yours.",
    doubled:
      "When the Weaver doubles, you disappear into the group. Keep one part of the work that is still yours.",
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
      "You stand as the Alchemist. Your job is to name what is already over and change it without being cruel. Not every day needs a crisis.",
    method:
      "Fierce is the method, not a second personality. Stop living inside a story that is finished. Bring the change, and protect what still helps.",
    field:
      "The work happens in the Crucible. That is a place strong enough for a real change. You are responsible for what you keep, not only for what you end.",
    doubled:
      "When the Alchemist doubles, crisis becomes a lifestyle. Take care of what the last change showed you.",
    invitation: "Name the one thing that is already over, and make the change with as much care as courage.",
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
      "You stand as the Peacemaker. Your job is to hold two true things in one room. Do not hide the fight until it comes back as resentment.",
    method:
      "Whole is the method, not a second personality. Look for a way both honest sides can stay. You will disappoint people who wanted the easy side.",
    field:
      "The work happens in the Vessel. That means a bowl big enough for a real argument. If it is too thin, it breaks. If it is too thick, nobody can tell what is inside.",
    doubled:
      "When the Peacemaker doubles, you cover the fight. Leave one necessary hard edge. Peace that cannot bear a quarrel is only niceness.",
    invitation: "Hold both sides, and keep one part of yourself that you do not give away.",
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
      "You stand as the Oracle. Your job is to name a clear picture of the life you want, then take one ordinary step toward it. A picture you will not walk toward is a daydream.",
    method:
      "Vivid is the method, not a second personality. Describe the direction clearly enough that someone can walk toward it. Stay ordinary next to the picture so it does not become a statue you serve.",
    field:
      "The work happens in the Sanctum. See the picture before you announce it. If it stays only private, it becomes a private rule.",
    doubled:
      "When the Oracle doubles, you skip the near step. Take one small action that belongs to the picture.",
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
      "You stand as the Innocent. Your job is to look again, including at the hurt, and still do the work. Wonder that never acts is only watching.",
    method:
      "Awake is the method, not a second personality. Look again at what you think you already know, then put a hand on the work. Seeing is not the same as doing.",
    field:
      "The work happens at Dawn. That is a way to begin again, not a way to stay uninformed. Use the fresh look, then act.",
    doubled:
      "When the Innocent doubles, looking replaces doing. Put a hand on the work.",
    invitation: "Look again at what you think you already understand, then do one practical thing with your hands.",
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
      "You stand as the Trickster. Your job is to break the rule that is lying, then stay and help build a better one. A joke that builds nothing is only sabotage.",
    method:
      "Liminal is the method, not a second personality. Bring the missing piece into a room that thinks it is finished, then help set the plan again.",
    field:
      "The work happens at the Edge. That is the honest place outside the old map. Visit it. Do not live there.",
    doubled:
      "When the Trickster doubles, staying outside becomes a habit. Let the unusual thing help other people, not only your difference.",
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
      "You stand as the Shapeshifter. Your job is to bend when bending is smart, and to keep one promise you will not break. If you can be anyone, people cannot count on you.",
    method:
      "Yielding is the method, not a second personality. Bend where the situation requires it, and keep one promise straight. You can say yes without letting everyone walk through you.",
    field:
      "The work happens at the Fork. That is a real choice that is still open. It is not permission to walk both roads until you are exhausted.",
    doubled:
      "When the Shapeshifter doubles, you postpone the choice. Let one yes become something people can count on.",
    invitation: "Bend where bending is wise. Then keep one promise you will not break.",
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
      "You stand as the Magician. Your job is to aim at one goal worth the effort, then come back and live a normal day. Intensity that never comes down helps no one.",
    method:
      "Complete is the method, not a second personality. Spend a season on one goal, and know when that season is done. Then return to ordinary life.",
    field:
      "The work happens at the Peak. Visit with your whole attention. Do not try to live there. The walk back down is part of the work.",
    doubled:
      "When the Magician doubles, the climb replaces the return. Come down. Power that cannot become a normal day is only showing off.",
    invitation: "Pick one goal worth the effort, and practice coming back down to a normal day.",
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

function buildSummary(a: LetterRole, b: LetterRole, c: LetterRole): string {
  return `${a.house} · ${b.adj} aspect · path of the ${c.realm}`;
}

export function archetypeOf(triad: Triad): Archetype {
  const [x, y, z] = triad;
  const a = houseOf(x);
  const b = houseOf(y);
  const c = houseOf(z);
  const title = buildTitle(a, b, c, triad);
  const reading = readingOf(triad);
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
    shadow: reading.shadow,
    gold: reading.gold,
    summary: buildSummary(a, b, c),
    portrait: reading.portrait,
    invitation: reading.invitation,
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
