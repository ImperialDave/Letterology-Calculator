export const FESTIVALS: { month: string; name: string; line: string }[] = [
  {
    month: "Hekatombaion",
    name: "the Panathenaia",
    line: "the city’s gift to Athena — a robe, a procession, the clever city reminding itself who it is",
  },
  {
    month: "Metageitnion",
    name: "the neighborhood sacrifice",
    line: "neighbors share an altar. Small piety. Stay for the meal, not only the vow",
  },
  {
    month: "Boedromion",
    name: "the Greater Mysteries",
    line: "Eleusis opens; the road goes down. What you learn there is for the living, not for display",
  },
  {
    month: "Pyanepsion",
    name: "the bean-boiling",
    line: "Apollo’s autumn pot — first fruits in a simple dish. Feed someone. Do not found a religion over dinner",
  },
  {
    month: "Maimakterion",
    name: "the storm month",
    line: "Zeus as weather, not as law. Hold the tiller. Do not worship the wind",
  },
  {
    month: "Poseideon",
    name: "the rural Dionysia",
    line: "the village play in the wet. Let the mask be a mask. Come back as yourself",
  },
  {
    month: "Gamelion",
    name: "the sacred marriage",
    line: "a vow the month takes seriously. Keep what you chose. Release what you only trapped",
  },
  {
    month: "Anthesterion",
    name: "the Anthesteria",
    line: "the dead sit at the table. Pour for the guest who cannot answer. Then close the door",
  },
  {
    month: "Elaphebolion",
    name: "the City Dionysia",
    line: "the city watches itself on stage. Tell the true story. Do not live only as the chorus",
  },
  {
    month: "Mounichion",
    name: "Artemis of the bay",
    line: "the uncut grove at the water. Guard one wild thing. Let one guest approach",
  },
  {
    month: "Thargelion",
    name: "the first fruits",
    line: "a gift, and a scapegoat. Offer what is ripe. Do not offer a person in its place",
  },
  {
    month: "Skirophorion",
    name: "the white parasol",
    line: "the year is carried to its end. Finish. Do not start a new identity on the last day",
  },
];

export function festivalOf(monthName: string) {
  return FESTIVALS.find((row) => row.month === monthName) ?? FESTIVALS[0]!;
}
