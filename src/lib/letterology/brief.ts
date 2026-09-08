import { houseOf } from "./archetypes";
import { buildHoroscope } from "./engine";
import { themeOf } from "./lexicon";

export const CIRCUIT_CLOSE =
  "See the whole. Use the pieces. Come back. The decision is yours.";

export const EXAMPLE_HANDLE = "lovelace";

export const NEVER_SAY = [
  "This is your destiny.",
  "The legal name is the real one.",
  "High fit means stay.",
  "A low day means you are unlucky.",
  "The total is a lucky number.",
  "Greek is Latin in other clothes.",
] as const;

export const SAY_THIS = [
  "This is a portrait of the letters you already use.",
  "We read the username you walk around in.",
  "The number is a fit of materials, not a reason to stay or leave.",
  "A low day is weather. Do a small necessary thing.",
  "The total is something the name can carry. It is not the name.",
  "Greek is a second instrument. Do not translate it into Latin in the room.",
] as const;

export type BriefSlide = {
  id: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  notes: string[];
};

function exampleParagraphs(): string[] {
  const reading = buildHoroscope(EXAMPLE_HANDLE);
  if (!reading) {
    throw new Error(`${EXAMPLE_HANDLE} must letterize`);
  }
  const [role, manner, field] = reading.triad;
  const enter = houseOf(role);
  const how = themeOf(manner);
  const where = themeOf(field);
  return [
    `The username ${EXAMPLE_HANDLE} letterizes as ${role}, then ${manner}, then ${field}.`,
    `The first letter is the ${enter.noun}, which is how this name enters the room.`,
    `The manner is ${how.name.toLowerCase()}, which is how the work tends to get done.`,
    `The field is ${where.name.toLowerCase()}, which is the kind of place that work wants.`,
    `The invitation from the first house is this: ${enter.invitation}`,
  ];
}

function exampleNotes(): string[] {
  const reading = buildHoroscope(EXAMPLE_HANDLE);
  if (!reading) {
    throw new Error(`${EXAMPLE_HANDLE} must letterize`);
  }
  return [
    `Do not improvise a soul. Read the three seats, then the invitation, then stop.`,
    `The path title on the site is “${reading.archetype.title}.” Say it only if they ask for the name of the path.`,
    `If they want more, open the live reading at letterology.club with this same username.`,
  ];
}

export function briefSlides(): BriefSlide[] {
  return [
    {
      id: "title",
      kicker: "CC33",
      title: "Letterology",
      paragraphs: [
        "This is a short brief for people who will share a reading.",
        "You will learn what we read, how a path is made, what luck is, and how to leave the room without preaching.",
      ],
      notes: [
        "Open in full screen. The guest should see the slide, not your notes.",
        "Say the club name once. Then start teaching.",
      ],
    },
    {
      id: "hour",
      kicker: "The hour",
      title: "What this is for",
      paragraphs: [
        "After this you should be able to read a username out loud.",
        "You should be able to time a decision against today.",
        "You should be able to hand someone a card without turning it into a sermon.",
      ],
      notes: [
        "If they only remember three things, they are these: username, path, weather.",
        "The Brief is public. Anyone may take it. The ethic is how they share afterward.",
      ],
    },
    {
      id: "refuse",
      kicker: "The refusal",
      title: "We do not add a name into a lucky number",
      paragraphs: [
        "Numerology takes a name apart, assigns numbers, adds them, and treats the total as the person.",
        "We keep the suspicion that a name means something.",
        "We throw out the last step, because a total is not a person.",
      ],
      notes: [
        "Do not mock anyone who used life-path numbers. They already asked the right first question.",
        "If someone says this is Numerology with extra steps, you missed this slide.",
      ],
    },
    {
      id: "circuit",
      kicker: "The circuit",
      title: "See the whole. Use the pieces. Come back.",
      paragraphs: [
        "First look at the whole living thing: this username, this day, this act you will stand behind.",
        "Then you may count letters, dates, and sums. Those counts are useful.",
        "Then you look back at the person they came from.",
        "Iain McGilchrist called those two ways of seeing the Master and the Emissary. The Master looks at the whole. The Emissary looks at pieces. The Emissary is a good servant and a bad king. We take the fable, not the brain maps.",
      ],
      notes: [
        "Say Master and Emissary once. Define them in the next breath as two ways of seeing.",
        "The rest of the hour is this circuit applied to a handle, a day, and a decision.",
      ],
    },
    {
      id: "material",
      kicker: "The material",
      title: "We read the username you use",
      paragraphs: [
        "A legal name was given before you could refuse it.",
        "A username is the name you walk around in.",
        "We read A through Z of that handle. Digits become letters. Accents fall away.",
      ],
      notes: [
        "One is A. Zero is the Fool, which means a blank, not a secret fate.",
        "If the handle starts with a digit, that digit becomes a letter and may name the role. Say that plainly if it comes up.",
      ],
    },
    {
      id: "path",
      kicker: "The path",
      title: "How a Latin reading works",
      paragraphs: [
        "The first letter of the first word is the role, which is how you enter.",
        "After that we count which letters return most often, including extra weight at the edges of a word.",
        "The next two heaviest letters are how you tend to work, and where that work wants to happen.",
        "Those three seats are one Letter Path. We name it so it is not a secret code.",
      ],
      notes: [
        "Role, then how, then where. If you scramble the order, you are hiding.",
        "Do not let them hunt for a fourth letter that “explains everything.” Three seats are the reading.",
      ],
    },
    {
      id: "example",
      kicker: "Worked example",
      title: `@${EXAMPLE_HANDLE}`,
      paragraphs: exampleParagraphs(),
      notes: exampleNotes(),
    },
    {
      id: "luck",
      kicker: "Luck",
      title: "Weather, not fate",
      paragraphs: [
        "Each date names a letter, the way the thirteenth is M.",
        "That letter has three helpers and three pushbacks. Together they are today’s court.",
        "Your luck today is the meeting of your path with that court.",
        "A high number on the screen is a weather report. It is not a verdict you obey.",
      ],
      notes: [
        "Willingness means which letters run warm today, and which withdraw.",
        "If they ask whether a low day means they are unlucky, say no. It means keep the step small.",
      ],
    },
    {
      id: "decision",
      kicker: "A decision",
      title: "Letterize the act",
      paragraphs: [
        "A decision is also a name. Read the act the same way you read a handle.",
        "Ask two questions: is this my kind of move, and is that house willing today?",
        "You still walk out the door.",
      ],
      notes: [
        "The site can time the act. It cannot take the walk for them.",
        "If they want a third check, ask whether they will stand behind the whole thing, or file it as a score and forget it.",
      ],
    },
    {
      id: "two",
      kicker: "Two handles",
      title: "A fit of materials, not a soulmate",
      paragraphs: [
        "We compare roles, methods, places, shared letters, and help one name already carries that the other is missing.",
        "The number is a fit of materials.",
        "It is not a forecast, and it is not a reason to stay or leave.",
      ],
      notes: [
        "A high fit can still be a trap. A hard weather can still be a life’s work.",
        "Name the pair. An unnamed comparison is a scoreboard.",
      ],
    },
    {
      id: "count",
      kicker: "The Count",
      title: "Write amounts as letters",
      paragraphs: [
        "A number is a compression of rank, year, price, or quantity.",
        "We write it as letters so it can live in the same system as a name.",
        "A is one. Z is twenty-six. AA is twenty-seven.",
        "We do not wrap J back into A. Zero is a blank, which we call the Fool.",
      ],
      notes: [
        "They may type an ordinary number once so we can translate it. The reading will not say that number back.",
        "Counting is allowed. Calling the count the person is the mistake.",
      ],
    },
    {
      id: "greek",
      kicker: "The second tongue",
      title: "Greek is not Latin in other clothes",
      paragraphs: [
        "First and last letters are the road: how the name enters, and how it finishes.",
        "Vowels are sung in order. They are not weighed as a tally.",
        "The sum lands on an hour, not a lucky digit. A sum is something the name can carry. It is not the name.",
        "Flip the tongue when you want that instrument. Do not translate one into the other in the room.",
      ],
      notes: [
        "This is one slide on purpose. If they want the Greek warrant, send them to Why.",
        "Do not map a Latin house onto a Greek hour. That is how you lie with a smile.",
      ],
    },
    {
      id: "speech",
      kicker: "Speech",
      title: "Never say / say this",
      paragraphs: [
        `Never say: ${NEVER_SAY.join(" ")}`,
        `Say this instead: ${SAY_THIS.join(" ")}`,
      ],
      notes: [
        "If you hear destiny, legal-name supremacy, or lucky totals coming out of your mouth, stop and read this slide again.",
        "The cheat sheet carries the same list. They do not have to memorize Why.",
      ],
    },
    {
      id: "leave",
      kicker: "The close",
      title: "How you leave the room",
      paragraphs: [
        "Open letterology.club. Type their username. Read the path and today’s luck.",
        "Give them one thing they can do before noon. Then stop talking.",
        "Point them at Why if they want the argument, and at the cheat sheet if they will read someone else tomorrow.",
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
