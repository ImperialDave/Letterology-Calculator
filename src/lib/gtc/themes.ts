import { MORE_THEMES } from "@/lib/gtc/themes-more";

export type Theme = {
  id: string;
  /** Completes the sentence "Both of your characters ___". */
  line: string;
  examples: string[];
};

const CORE_THEMES: Theme[] = [
  {
    id: "swim",
    line: "cannot swim",
    examples: ["Darth Vader", "C-3PO", "The Wicked Witch of the West", "The Terminator", "Bender", "Johnny 5"],
  },
  {
    id: "fingers",
    line: "have four fingers",
    examples: ["Homer Simpson", "Mickey Mouse", "Sonic the Hedgehog", "Bugs Bunny", "Blossom", "SpongeBob SquarePants"],
  },
  {
    id: "agents",
    line: "are secret agents",
    examples: ["James Bond", "Perry the Platypus", "Ethan Hunt", "Black Widow", "Sterling Archer", "Nick Fury"],
  },
  {
    id: "pieces",
    line: "are made of smaller pieces",
    examples: ["Voltron", "Emmet Brickowski", "Exodia", "Megazord", "Optimus Prime", "Devastator"],
  },
  {
    id: "beasts",
    line: "are beasts",
    examples: ["The Beast", "Chewbacca", "Kong", "Beast", "Falkor", "The Beast from Over the Garden Wall"],
  },
  {
    id: "wings",
    line: "have wings",
    examples: ["Toothless", "Hawkgirl", "Icarus", "Dumbo", "Pit", "Angel"],
  },
  {
    id: "edible",
    line: "are edible",
    examples: ["Gingy", "Stay Puft", "The Gingerbread Man", "Meatwad", "Pillsbury Doughboy", "The Muffin Man"],
  },
  {
    id: "jimmy",
    line: "are named Jimmy",
    examples: ["Jimmy Neutron", "Jimmy Olsen", "Jimmy Hopkins", "Jimmy Valmer", "Jimmy McGill", "Jim Halpert"],
  },
  {
    id: "gloves",
    line: "wear gloves",
    examples: ["Mickey Mouse", "Freddy Krueger", "Mario", "Batman", "Catwoman", "Michael Jackson"],
  },
  {
    id: "mustache",
    line: "have a mustache",
    examples: ["Mario", "Ron Swanson", "Hercule Poirot", "Ned Flanders", "Dick Dastardly", "Albert Einstein"],
  },
  {
    id: "kids",
    line: "are from a children's show",
    examples: ["Bluey", "Dora", "Elmo", "Ms. Frizzle", "Peppa Pig", "Steve from Blue's Clues"],
  },
  {
    id: "sacrifice",
    line: "sacrificed themselves",
    examples: ["Iron Man", "Spock", "Obi-Wan Kenobi", "Bing Bong", "Jack Dawson", "Gandalf"],
  },
  {
    id: "healers",
    line: "are healers",
    examples: ["Mercy", "The Medic", "Aerith", "Dr. House", "Tsunade", "Caduceus Clay"],
  },
  {
    id: "racers",
    line: "are racers",
    examples: ["Lightning McQueen", "Speed Racer", "Captain Falcon", "Dominic Toretto", "Princess Peach", "Sonic"],
  },
  {
    id: "anthro",
    line: "are anthropomorphic",
    examples: ["Bugs Bunny", "Judy Hopps", "Donald Duck", "BoJack Horseman", "Puss in Boots", "Mr. Fox"],
  },
  {
    id: "mask",
    line: "wear a mask",
    examples: ["Spider-Man", "Zorro", "The Mask", "V", "Casey Jones", "Vega"],
  },
  {
    id: "ghosts",
    line: "are ghosts or undead",
    examples: ["Casper", "Beetlejuice", "Jack Skellington", "Slimer", "Hector", "Emily from Corpse Bride"],
  },
  {
    id: "royalty",
    line: "are royalty",
    examples: ["Simba", "Elsa", "Princess Peach", "Aragorn", "Daenerys Targaryen", "Bowser"],
  },
  {
    id: "robots",
    line: "are robots",
    examples: ["WALL-E", "C-3PO", "The Terminator", "Data", "Bender", "R2-D2"],
  },
  {
    id: "water",
    line: "live underwater",
    examples: ["Ariel", "SpongeBob SquarePants", "Aquaman", "Nemo", "Ursula", "King Triton"],
  },
  {
    id: "green",
    line: "are green",
    examples: ["Shrek", "The Hulk", "Yoda", "Kermit", "Piccolo", "The Grinch"],
  },
  {
    id: "teachers",
    line: "are teachers",
    examples: ["Mr. Feeny", "Severus Snape", "Ms. Frizzle", "Yoda", "Edna Krabappel", "Charles Xavier"],
  },
  {
    id: "wall",
    line: "break the fourth wall",
    examples: ["Deadpool", "Fleabag", "Ferris Bueller", "Bugs Bunny", "Abed Nadir", "She-Hulk"],
  },
  {
    id: "weapon",
    line: "can be used as a weapon",
    examples: ["FLUDD", "Yoshi", "Hulk", "R.O.B.", "Piranha Plant", "Mr. Game & Watch"],
  },
  {
    id: "man",
    line: "have “man” in their name",
    examples: ["Batman", "Spider-Man", "Pac-Man", "He-Man", "Mega Man", "Aquaman"],
  },
  {
    id: "time",
    line: "are time travelers",
    examples: ["The Doctor", "Marty McFly", "The Terminator", "Trunks", "Bill S. Preston", "Hiro Nakamura"],
  },
  {
    id: "sidekick",
    line: "travel with a sidekick",
    examples: ["Batman", "Sherlock Holmes", "Shrek", "Don Quixote", "Ash Ketchum", "Mario"],
  },
  {
    id: "villains",
    line: "are villains who think they’re right",
    examples: ["Thanos", "Magneto", "Killmonger", "Light Yagami", "Syndrome", "Javert"],
  },
  {
    id: "food",
    line: "work with food",
    examples: ["SpongeBob SquarePants", "Bob Belcher", "Remy", "Sanji", "Linda Belcher", "Swedish Chef"],
  },
  {
    id: "pirates",
    line: "are pirates",
    examples: ["Jack Sparrow", "Captain Hook", "Monkey D. Luffy", "Guybrush Threepwood", "Elizabeth Swann", "Long John Silver"],
  },
];

export const THEMES: Theme[] = [...CORE_THEMES, ...MORE_THEMES];

export function themeById(id: string): Theme | undefined {
  return THEMES.find((theme) => theme.id === id);
}
