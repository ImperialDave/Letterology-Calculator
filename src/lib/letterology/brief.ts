import { houseOf } from "./archetypes";
import { buildHoroscope } from "./engine";
import { themeOf } from "./lexicon";

export const CIRCUIT_CLOSE =
  "See the whole. Use the pieces. Come back. The decision is yours.";

/** Hindu-Arabic figures are number-brain. The Brief writes quantities as Romans. */
export function toRoman(value: number): string {
  if (value <= 0) return "";
  const glyphs: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rest = Math.floor(value);
  let out = "";
  for (const [n, mark] of glyphs) {
    while (rest >= n) {
      out += mark;
      rest -= n;
    }
  }
  return out;
}

export const EXAMPLE_HANDLE = "lovelace";

export const NEVER_SAY = [
  "This is your destiny.",
  "The legal name is the real one.",
  "A close fit means you should stay.",
  "A hard day means you are unlucky.",
  "The pile of letters is the person.",
  "Greek is Latin in other clothes.",
] as const;

export const SAY_THIS = [
  "This is a portrait of the letters you already use.",
  "We read the username you walk around in.",
  "How the II names meet is a fit of materials, not a reason to stay or leave.",
  "A hard day is weather. Do a small necessary thing.",
  "Whatever the name can carry is not the name itself.",
  "Greek is a II instrument. Do not translate it into Latin in the room.",
] as const;

export type BriefLayout = "hero" | "prose" | "compare" | "path" | "speech" | "close";

export type BriefColumn = {
  kicker: string;
  title: string;
  body: string;
};

export type BriefPathMark = {
  letter: string;
  label: string;
  line: string;
};

export type BriefSlide = {
  id: string;
  kicker: string;
  title: string;
  lede?: string;
  paragraphs: string[];
  notes: string[];
  layout: BriefLayout;
  left?: BriefColumn;
  right?: BriefColumn;
  path?: BriefPathMark[];
};

function examplePath(): BriefPathMark[] {
  const reading = buildHoroscope(EXAMPLE_HANDLE);
  if (!reading) {
    throw new Error(`${EXAMPLE_HANDLE} must letterize`);
  }
  const [role, manner, field] = reading.triad;
  const enter = houseOf(role);
  const how = themeOf(manner);
  const where = themeOf(field);
  return [
    {
      letter: role,
      label: "Role · how the name enters",
      line: `${enter.noun}. ${enter.myth}`,
    },
    {
      letter: manner,
      label: "How the work gets done",
      line: how.essence,
    },
    {
      letter: field,
      label: "Where the work wants to happen",
      line: where.essence,
    },
  ];
}

function exampleParagraphs(): string[] {
  const reading = buildHoroscope(EXAMPLE_HANDLE);
  if (!reading) {
    throw new Error(`${EXAMPLE_HANDLE} must letterize`);
  }
  const [role, manner, field] = reading.triad;
  const enter = houseOf(role);
  return [
    `The username ${EXAMPLE_HANDLE} arrives as ${role}, then ${manner}, then ${field}: the ${enter.noun}, working by ${themeOf(manner).name.toLowerCase()}, in the realm of ${themeOf(field).name.toLowerCase()}.`,
    `The ${enter.noun} is how this name enters. ${enter.myth}`,
    "Do not invent a soul to go with it. Read the path, give the invitation, and stop.",
  ];
}

function exampleNotes(): string[] {
  const reading = buildHoroscope(EXAMPLE_HANDLE);
  if (!reading) {
    throw new Error(`${EXAMPLE_HANDLE} must letterize`);
  }
  return [
    `The path title on the site is “${reading.archetype.title}.” Say it only if they ask for the name of the path.`,
    "If they want more, open the live reading at letterology.club with this same username.",
  ];
}

export function briefSlides(): BriefSlide[] {
  return [
    {
      id: "title",
      layout: "hero",
      kicker: "CC33",
      title: "Letterology",
      lede: "A training for people who will read a name in public, and then stop talking.",
      paragraphs: [
        "You are here to learn a way of looking. When you leave this room you should be able to meet a username as a face, say what kind of path it is, notice whether today will have the move, and hand someone a portrait without turning it into a sermon.",
      ],
      notes: [
        "Open in full screen. The guest should see the slide, not your notes.",
        "Say the club name once. Then start teaching the II ways of looking.",
      ],
    },
    {
      id: "hour",
      layout: "prose",
      kicker: "The hour",
      title: "What you should be able to do when we finish",
      paragraphs: [
        "You should be able to take the username someone actually uses and read it out loud as a path: how they enter, how they tend to work, and where that work wants to happen.",
        "You should be able to hold that path up against today and say whether the day will have the move, without turning weather into fate.",
        "You should be able to hand them a card and leave the room. If you are still explaining yourself after that, you are preaching.",
      ],
      notes: [
        "If they only remember a handful of things, they are these: the username, the path, and the weather of the day.",
        "The Brief is public. Anyone may take it. The ethic is how they share afterward.",
      ],
    },
    {
      id: "brains",
      layout: "compare",
      kicker: "The whole point",
      title: "A Letter brain and a number brain are II habits of attention",
      lede: "They are not II species of person. Most of us use both before lunch. The club trains habit I, and it keeps habit II from becoming king.",
      paragraphs: [
        "Iain McGilchrist told this as the fable of the Master and his Emissary. The Master looks at the whole living thing in the room. The Emissary goes out to file, measure, and sort, then is supposed to come home and report. We take the fable, not the brain maps. A Letter brain is the Master at work. A number brain is the Emissary who stayed out so long he forgot there was a face to return to.",
      ],
      left: {
        kicker: "Letter-brained",
        title: "Start with the living thing",
        body: "You begin with the person in the room: this username, this day, this act they will stand behind. You read the marks they already put into the world, and you treat those marks as a face you can meet. Letters are how a life shows up in public. A Letter brain stays with that face long enough to see it, and only then notices the details that would help a clerk.",
      },
      right: {
        kicker: "Number-brained",
        title: "Start with what can be filed",
        body: "You begin with rank, year, price, a lucky pile someone can hold in I hand. That habit is excellent for storage, for clocks, for a drawer of M lives. It becomes a problem when the filing is treated as the person, and the face is thrown away so the drawer will close.",
      },
      notes: [
        "Stay on this slide until they can say the difference in their own words.",
        "If they leave thinking we hate measurement, you overplayed the right column. Measurement is a servant. The failure is making it the person.",
      ],
    },
    {
      id: "refuse",
      layout: "prose",
      kicker: "The refusal",
      title: "We keep the suspicion. We throw out the last step.",
      paragraphs: [
        "Numerology was right that a name is not noise. A person chose some letters, or lived inside them long enough that those letters do work, and that is already a fact worth reading.",
        "It was wrong about what to do next. It broke the name into values, piled them, and called the pile a soul. That last step is a clerk’s trick. It is a poor way to look at someone you actually know.",
        "Letterology keeps the suspicion and refuses the pile. The person was the whole name the pile could not hold.",
      ],
      notes: [
        "Do not mock anyone who used a life-path reading. They already asked the right first question.",
        "If someone says this is Numerology with extra steps, you missed the last step we throw out.",
      ],
    },
    {
      id: "return",
      layout: "prose",
      kicker: "The practice",
      title: "Look. Notice. Look back.",
      paragraphs: [
        "A Letter brain does not refuse detail. It refuses to stop at detail. After you have looked closely at the letters of a name, a day, or an act, you look back at the human they came from.",
        "That last look is the whole practice. Without it you have a clever filing system with nicer stationery. With it, the details report home, and the person remains the person.",
        CIRCUIT_CLOSE,
      ],
      notes: [
        "This is the slide you point at if they ask whether we are anti-math. We are anti-replacement.",
      ],
    },
    {
      id: "material",
      layout: "prose",
      kicker: "The material",
      title: "We read the username you walk around in",
      paragraphs: [
        "A legal name was spoken over you before you could refuse it. It belongs to a record office. A username is the name that does work in public: you chose it, or you lived inside it long enough that it became another skin.",
        "That is why the door asks for the username you use. The at-sign is furniture. Accents fall away so a mark from another tongue can still name a role. Anything that is not a letter becomes a letter, or it is dropped. We are here to read a face made of letters, not a form.",
      ],
      notes: [
        "If the handle begins with something that is not a letter, say plainly that it becomes a letter and may name the role.",
        "Do not ask for a birthday. Do not ask for a legal name. Those are the record office’s materials, not ours.",
      ],
    },
    {
      id: "path",
      layout: "prose",
      kicker: "The path",
      title: "How a name becomes a reading",
      paragraphs: [
        "The first letter of the first word is how the name enters the room. That entrance is the role. A role is not a personality, and it is not a popularity contest among the letters that appear most often. It is the threshold.",
        "After that we notice which letters keep coming back, especially at the beginning and the end of a word, because those are the places a name touches the air. The letters that keep returning tell you how this person tends to work, and what kind of place that work wants.",
        "Together they are I Letter Path: role, how, and where. We name the path so it is not a secret code. A nameless triad is how you hide from the person you are reading.",
      ],
      notes: [
        "Role, then how, then where. If you scramble the order, you are hiding.",
        "Do not let them hunt for a IV letter that explains everything. The path is the reading.",
      ],
    },
    {
      id: "example",
      layout: "path",
      kicker: "Worked example",
      title: `@${EXAMPLE_HANDLE}`,
      paragraphs: exampleParagraphs(),
      path: examplePath(),
      notes: exampleNotes(),
    },
    {
      id: "luck",
      layout: "prose",
      kicker: "Luck",
      title: "Weather, not fate",
      paragraphs: [
        "A day is read the same way a name is read, so time does not get a II religion. The date names a letter, the way a username names a role. That letter keeps allies who complete its work, and pushbacks that keep it honest. Together they are today’s court.",
        "Your luck today is the meeting of your path with that court. If your usual way of working withdraws, do not force it. If today’s letter is already in the handle, the day is using something you already carry.",
        "What the screen reports is weather. You use it to time a decision. You do not obey it.",
      ],
      notes: [
        "Willingness means which letters run warm today, and which withdraw.",
        "If they ask whether a hard day means they are unlucky, say no. It means keep the step small.",
      ],
    },
    {
      id: "decision",
      layout: "prose",
      kicker: "A decision",
      title: "Read the act the same way you read the name",
      paragraphs: [
        "A decision is also a name. Quit, ask them, ship the launch, stay: those are letters too, and they enter a room the same way a username does.",
        "Ask II questions only. Is this my kind of move? Is that house willing today? Then you still walk out the door. The site can time the act. It cannot take the walk for you.",
      ],
      notes: [
        "If they want a III check, ask whether they will stand behind the whole thing, or file it and forget it.",
      ],
    },
    {
      id: "two",
      layout: "prose",
      kicker: "A pair of names",
      title: "A fit of materials, not a soulmate",
      paragraphs: [
        "We look at how II usernames meet: their roles, their ways of working, the letters they share, and the help one already carries that the other is missing.",
        "That meeting is a fit of materials. It is not a forecast, and it is not a reason to stay or leave. A close fit can still be a trap. A hard weather can still be a life’s work. Name the pair. An unnamed comparison is how you hide an argument.",
      ],
      notes: [
        "Do not let them turn the pair into a verdict. The certificate names these II, and only these II.",
      ],
    },
    {
      id: "amounts",
      layout: "prose",
      kicker: "Amounts",
      title: "A year has to live in the same house as a name",
      paragraphs: [
        "When a year or a price arrives, it claims to be neutral. It is still only a compression of a life: rank, date, money, a way of reaching a body.",
        "We write it in letters so it has to live in the same house as a name, instead of sitting apart as a rival religion. The blank is the Fool: nothing written, not a secret fate. You may type the old figure once so we can translate it. The reading will not say it back.",
      ],
      notes: [
        "If they want the walk of A through Z, send them to the amounts page. Do not teach arithmetic in this room.",
      ],
    },
    {
      id: "greek",
      layout: "prose",
      kicker: "Tongue II",
      title: "Greek is not Latin in other clothes",
      paragraphs: [
        "First and last letters are the road: how the name enters, and how it finishes. Vowels are sung in order; they are not piled as a clerk would pile them. Whatever the name can carry is an hour it leans toward, not a lucky stand-in for the person.",
        "Flip the tongue when you want that instrument. Do not translate one into the other in the room. Collapsing II honest instruments into I map is the number brain’s favorite kindness.",
      ],
      notes: [
        "This is I slide on purpose. If they want the Greek warrant, send them to Why.",
        "Do not map a Latin house onto a Greek hour. That is how you lie with a smile.",
      ],
    },
    {
      id: "speech",
      layout: "speech",
      kicker: "Speech",
      title: "Never say this. Say this instead.",
      paragraphs: [
        "If destiny, legal-name supremacy, or a lucky pile is coming out of your mouth, stop. The cheat sheet carries the same list, so nobody has to memorize Why.",
      ],
      notes: [
        "Read the left column as a confession of how Numerology talks. Read the right column as how the club talks.",
      ],
    },
    {
      id: "leave",
      layout: "close",
      kicker: "The close",
      title: "How you leave the room",
      paragraphs: [
        "Open letterology.club. Type their username. Read the path and today’s luck. Give them I thing they can do before noon. Then stop talking.",
        "Point them at Why if they want the argument, at the cheat sheet if they will read someone else tomorrow, and at the portrait of looking if they want to see their own Letter brain.",
        CIRCUIT_CLOSE,
      ],
      notes: [
        "Your job is a clean reading and a clean exit. The site does the rest.",
        "Do not add a closing prophecy. Hand them the card.",
      ],
    },
  ];
}

export const BRIEF_FOOTER = "CC33 · letterology.club";
