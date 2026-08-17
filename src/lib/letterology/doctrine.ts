export type DoctrineSection = {
  kicker: string;
  title: string;
  paragraphs: string[];
};

/**
 * The argument for the system as it actually runs.
 * Written backward from the mechanics so every rule looks like a consequence.
 */
export const DOCTRINE_PREFACE = [
  "We read usernames, not birth names. The first letter is the role. The next two, by how often they return, are how you work and where. We do not predict. We do not turn letters into one digit.",
  "Letterology is not a forecast. It is a way of looking. It takes the marks a person already chose to live under — a username, a date, a count — and reads them with the same seriousness other arts reserve for the sky. The sky is not ours. The alphabet is.",
  "What follows is not a manual. The Key is the manual. This is the reason the machine is shaped the way it is. Every rule on the site was chosen. This page says why those choices, and not others, are the ones that can be kept.",
];

export const DOCTRINE: DoctrineSection[] = [
  {
    kicker: "The refusal",
    title: "What we will not do",
    paragraphs: [
      "A system that tells the future has already decided the person is finished. We do not do that. A system that reads a birth name as fate has already decided the person is property of a record office. We do not do that. A system that folds twenty-six letters into nine digits has already decided that difference is an inconvenience. We do not do that.",
      "Numerology asks a name to become a number so a life can be held in one hand. Astrology asks a birth hour to become a weather report. Both are serious in their own houses. This house is different. We ask only: what letters did you put into the world, and what work do those letters already know how to do?",
      "The sentence on every portrait is not decoration. This is a portrait, not a prediction. A portrait can be wrong about a soul and still be true about a face. We claim the face.",
    ],
  },
  {
    kicker: "The material",
    title: "We read the username you chose",
    paragraphs: [
      "A legal name is an inheritance. It was spoken over you before you could refuse it. A username is a vow. You chose it in public, or you accepted the one the room gave you and then lived inside it long enough that it became a second skin. Either way, it is the name that does work.",
      "That is why the door does not ask for your legal name. It asks for the username you use. @ is optional because the at-sign is furniture. Only A through Z are read, because those are the twenty-six roles. Accents fold so a mark from another tongue can still name a role without being punished for its origin.",
      "If you sit the house with X, the screen name arrives as the handle and is not offered back for editing. Destiny you already posted under is not a preference. If you come by Google, you claim. Claiming is not branding. It is taking responsibility for a spelling.",
    ],
  },
  {
    kicker: "The first mark",
    title: "Why the first letter is the role",
    paragraphs: [
      "A house is a role, not a personality. The first letter of the first token is the first mark the handle makes on the world. Before repetition, before weight, before the clever middle, there is the threshold. That threshold is the house.",
      "We could have let the most common letter sit the house. That would have made the role a popularity contest. We could have let the last letter sit it. That would have made the role an ending. A role is how you enter. So the first letter enters.",
      "L is the Lover. A is the Seeker. The rest of the name may argue, complete, or betray that entrance. It does not get to pretend the entrance did not happen.",
    ],
  },
  {
    kicker: "How and where",
    title: "Why manner and field are weight, not order",
    paragraphs: [
      "Once the house is sat, the question is not who you are. The question is how the work is done, and in what kind of place. Those are the second and third seats of the Letter Path: manner and field.",
      "Order after the first letter is an accident of spelling. Weight is not. A letter that returns, a letter that opens a word, a letter that closes one — these are decisions the handle keeps making. The engine counts them. Repeats count more because insistence is information. First and last letters of a token count extra because edges are where a name touches the air.",
      "The two letters that weigh most after the signature become manner and field. Three letters, one path. The path has a title because a nameless triad is a code, and a code is how you hide from the person you are reading. We name it so it can be spoken.",
    ],
  },
  {
    kicker: "Twenty-six, not twelve",
    title: "Why the alphabet is the wheel",
    paragraphs: [
      "Twelve is a sky count. It is months, signs, hours doubled. It is a good count for bodies that orbit. It is a poor count for speech. Speech already divided itself into twenty-six public marks. Everyone who can read this page already carries the set. We did not invent a zodiac and then rent it letters. We took the set that was already the commons.",
      "Each letter sits a house with an old face — Seeker, Caregiver, Rebel, Hermit, Fool — because those figures were already doing the work of describing roles before we arrived. Pearson, Campbell, the tarot: these are correspondences, not creeds. A likeness. The house doctrine is written in plain English so it can be refused. A system you cannot refuse is a church.",
      "A sits amber at dawn and the wheel walks the spectrum to ochre at Z. Color is not garnish. It is the house made visible at the size of a seal. Three seats pour one mix: the house half the pot, manner three-tenths, field two-tenths. The role leads. How you work colors it. Where you work tints it. That is the Letter Path as a single fact you can see.",
    ],
  },
  {
    kicker: "The court",
    title: "Allies complete. Enemies keep honest.",
    paragraphs: [
      "A role that has no one to finish its work is a pose. A role that has no one to contradict it is a lie. Each house therefore keeps a court: three allies, three enemies. The allies are not friends. They are the figures that complete the job. The enemies are not villains. They are the blind spot — the house that will not let this one sleep.",
      "The circle is a graph, not a mood board. Distance is walked. An official ally sits one hop. An unrelated house may sit two hops or five. We used to pretend those distances were the same — four buckets, and everything that was not kin was simply “none.” That was a laziness. The live reading uses the actual walks: hops, resonance, the cost of carrying one name’s letters across to another. Unrelated is not a single country.",
      "If a handle already carries an allied letter, that help is in the name. If it does not, the help comes from outside — which is to say, from other people. That is not a defect. It is a map of who you will have to ask.",
    ],
  },
  {
    kicker: "Breath and contact",
    title: "Vowels lean in. Consonants lean out.",
    paragraphs: [
      "A vowel is a sound you can hold with the mouth open. A consonant is a sound that requires a collision. The inner life is held. The outer life collides. So vowels describe the private weather, consonants the public work.",
      "Y is the exception that proves the rule: a vowel only after it has already begun, never as the first step. The signature Y would be a start. We do not let it pretend to be breath until it has already entered as a mark.",
    ],
  },
  {
    kicker: "One clock",
    title: "Why a day uses the same wheel",
    paragraphs: [
      "If time used another alphabet we would have two religions in one house. So a day is read as a name is read. The date names the role — the thirteenth is M, as a username beginning with M is M. The two-week stretch sets how the season works: fourteen days, one letter, A to Z from the twenty-first of March. The weekday is what today is about, drawn from that stretch’s own helpers and pushbacks: the role, then its three allies, then its three enemies.",
      "The civil year and the month have roles too. They are background. They color the air. They do not get to rename Tuesday. A system that lets the year rename the day has already decided that the large always owns the small. We do not grant that.",
      "The leftover day or two before the next twenty-first of March have no numbered role. They belong to the Fool. The year has finished the circle and has not begun again. Travel light. That leftover is the same Fool as the blank when a count has nothing to write.",
    ],
  },
  {
    kicker: "Two handles",
    title: "A bond is a fit of materials, not a verdict",
    paragraphs: [
      "Two usernames are two piles of letters. We do not ask if they are soulmates. We ask how the piles meet: role, method, place, overlap of spelling, gifts (an ally one is missing that the other already carries), temper, court, spark. Eight measures, because one number is how you hide an argument.",
      "The affinity is a fit. It is not a forecast. A high fit can be a trap. A hard weather can be a life’s work. The certificate names the pair because an unnamed comparison is a scoreboard, and a scoreboard is numerology in a nicer font.",
      "The title, the rooms, the debt, the argument — these are composed from the two names. They cannot be reused on another pair. If the sentences could migrate, they were never about these two.",
    ],
  },
  {
    kicker: "The inverse",
    title: "We write amounts as letters",
    paragraphs: [
      "A number arrives claiming neutrality. It is not neutral. It is a compression: of rank, of year, of money, of a phone that can reach a body. Numerology accepted that compression and then compressed further, folding the leftover into a single digit so the hand could close.",
      "We refuse the fold. An amount is written as letters or it is not read. A is one. Z is twenty-six. AA is twenty-seven. The whole amount also has a role — the same letter a date or a year already uses — so a year and that year’s amount cannot disagree. If the amount walked the twenty-six more than once, those walks are letters too. Nested, not reduced.",
      "Zero is the Fool as absence: you write nothing. Six is the Fool as the sixth role, only when an old digit arrives. Same figure, two doors. There is no 0th of the month, so zero cannot name a date-role; it is the blank, which the calendar already knew. J is not 1. J is the tenth role. To wrap J back to A is to say the walk never happened.",
      "The old number may be typed so we can translate it. The reading will not say it back.",
    ],
  },
  {
    kicker: "The ethic",
    title: "A portrait can be used. It cannot be obeyed.",
    paragraphs: [
      "If this system made you safer by being true, it would still be a portrait. If it made you interesting by being false, it would still be a portrait. Use it as you use a good likeness: to notice what you already carry, to see the ally you keep refusing, to name the day’s grain without confusing it for a verdict.",
      "Do not spend the reading. Do not let a Letter Path become an excuse. The Seeker who never crosses is not fulfilling a house. They are hiding in one. The enemy house is not your villain. It is the work you will not look at.",
      "No sentence here is generated by a model that forgets tomorrow. The copy is composed from tables you can open. If the system cannot show its work, it has become a priest.",
    ],
  },
  {
    kicker: "The club",
    title: "CC33",
    paragraphs: [
      "Letterology is the reading. CC33 is whose house it is. The club did not rent a personality system. It took the alphabet — the one tool every member already used to appear in public — and asked it to tell the truth about the marks it was already making.",
      "Read a username. Compare two. Write an amount as letters. Walk the year. The names stay — Seeker, Fool, Letter Path — because they are the product. The rest is English, because a house that cannot welcome a guest is only a vault.",
      "You do not have to believe any of this. You only have to admit that you chose some letters, or some letters were chosen for the day, and that those letters can be looked at without being worshipped. That looking is the practice.",
    ],
  },
];

export const DOCTRINE_CLOSE =
  "This is a portrait, not a prediction. The letters you already carry are the material.";
