import { CIRCUIT_CLOSE } from "./brief";

export type DoctrineSection = {
  kicker: string;
  title: string;
  paragraphs: string[];
};

/**
 * The argument for the system as it actually runs.
 * Teaching voice: complete sentences, one metaphor per section at most.
 */
export const DOCTRINE_PREFACE = [
  "We read the username you actually use. We do not read your legal name or your birthday, and we do not add the letters into one lucky digit. The first letter is how you enter. The next two, by how often they return, are how you work and where you work. Luck is which of those letters have an easy time today.",
  "This page is the reason the tools are shaped this way. The Brief is the crash course. The cheat sheet is the pocket script. What follows is the argument, written so you can finish it standing up.",
];

export const DOCTRINE: DoctrineSection[] = [
  {
    kicker: "The circuit",
    title: "The Master and the Emissary",
    paragraphs: [
      "There are two ways of looking at a life. One way looks at the whole living thing: this username, this day, this act you will stand behind. The other way looks at pieces, which means letters, dates, sums, and scores. Counting is useful. Calling the count the person is the mistake.",
      "Iain McGilchrist told this as the fable of the Master and his Emissary. The Master is the way of seeing that looks at the whole. The Emissary is the way of seeing that looks at isolated facts and measurements. The Emissary was hired to help, then to come home and report. We take the fable, not the brain maps.",
      "Letterology is that circuit kept. See the whole. Use the pieces. Come back.",
    ],
  },
  {
    kicker: "The refusal",
    title: "What we will not do",
    paragraphs: [
      "Numerology takes a name apart, assigns numbers, adds them, and treats the total as the person. That last step is what we refuse. A total is a useful file. It is not a portrait of someone you actually know.",
      "Astrology asks a birth hour to become a weather report. That work is serious in its own house. This house asks a different question: what letters did you put into the world, and what work do those letters already know how to do?",
      "Luck is not fate. Luck is willingness, which means which letters run warm today and which withdraw. You use that weather to time a decision. You do not obey it.",
    ],
  },
  {
    kicker: "The material",
    title: "We read the username you chose",
    paragraphs: [
      "A legal name is an inheritance. It was spoken over you before you could refuse it. A username is the name you walk around in, either because you chose it or because you lived inside it long enough that it does work.",
      "That is why the door asks for the username you use. The at-sign is optional. Only A through Z are read. Digits become letters, so 1 is A and 0 is the Fool. Accents fall away so a mark from another tongue can still name a role.",
    ],
  },
  {
    kicker: "The path",
    title: "Why the first letter is the role, and why the next two are weight",
    paragraphs: [
      "The first letter of the first word is the role, because a role is how you enter. We do not let the most common letter take that seat, because that would make entrance a popularity contest. We do not let the last letter take it, because that would make the role an ending.",
      "After the first letter we count weight. A letter that returns, a letter that opens a word, and a letter that closes one all count. The two letters that weigh most after the first become how you tend to work and where that work wants to happen. Those three seats are one Letter Path. We name it so it is not a secret code.",
    ],
  },
  {
    kicker: "The wheel",
    title: "Why the alphabet is the court",
    paragraphs: [
      "Speech already divided itself into twenty-six public marks. We did not invent a smaller wheel so we could look more like a calculator. Each letter names a house with an old face, such as Seeker or Fool, as a likeness, not a creed. You can refuse the likeness. A system you cannot refuse is a church.",
      "Each house keeps three allies and three enemies. Allies complete a job this role cannot finish alone. Enemies are the blind spot that keeps the role honest. They are not villains. If an allied letter is already in the handle, that help is in the name. If it is not, the help comes from other people.",
    ],
  },
  {
    kicker: "The day",
    title: "Why a day uses the same wheel",
    paragraphs: [
      "A day is read the same way a name is read, so time does not get a second religion. The date names a role: the thirteenth is M. The two-week stretch says how the season is working. The weekday says what today is about. Year and month color the background. They do not get to rename Tuesday.",
      "Your luck today is the meeting of your Letter Path with that court. A number on the screen is a weather report. It is not a king. If your usual method withdraws, do not force it. If today's letter is already in your handle, the day is using something you already carry.",
    ],
  },
  {
    kicker: "The inverse",
    title: "Why we write amounts as letters, and why a bond is a fit",
    paragraphs: [
      "A number arrives looking neutral. It is still a compression of rank, year, money, or quantity. We write amounts as letters so they can live in the same house as a name. A is one. Z is twenty-six. AA is twenty-seven. We do not wrap J back into A, because J is the tenth role. Zero is a blank, which we call the Fool.",
      "Two usernames are two piles of letters. We compare roles, methods, places, shared spelling, and help one name already carries that the other is missing. The number is a fit of materials. It is not a forecast, and it is not a reason to stay or leave.",
    ],
  },
  {
    kicker: "The ethic",
    title: "A portrait can be used. It cannot be obeyed.",
    paragraphs: [
      "A reading you can use names the path, today's willingness, one move to lean into, one move to wait on, and who to ask. If it cannot do that before noon, it is decoration. You are in charge of the room. The site is a tool. Use the portrait. Do not obey it.",
      "CC33 is the club. Letterology is the reading. You do not have to believe any of this. You only have to admit that you chose some letters, or some letters were chosen for the day, and that those letters can be looked at without being worshipped. Looking, then counting, then looking again is the practice.",
    ],
  },
];

export const DOCTRINE_CLOSE = CIRCUIT_CLOSE;
