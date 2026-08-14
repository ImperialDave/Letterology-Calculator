import type { Horoscope } from "@/lib/letterology/types";

export type HandleSource = "x" | "google" | "linked";

export type RecentBond = { a: string; b: string };

export type HouseProfile = {
  uid: string;
  handle: string;
  displayHandle: string;
  source: HandleSource;
  xScreenName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastSeenAt: number;
  recents: string[];
  recentBonds: RecentBond[];
};

export type Sitting = {
  profile: HouseProfile;
  horoscope: Horoscope;
};
