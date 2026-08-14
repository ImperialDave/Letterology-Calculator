import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { HouseCircle } from "@/components/letterology/HouseCircle";
import { Explain } from "@/components/letterology/Gloss";
import { Button } from "@/components/ui/button";
import { copyToClipboard, openXIntent } from "@/lib/letterology/clipboard";
import type { BondAxes, BondReading } from "@/lib/letterology/compatibility";
import { hopPhrase } from "@/lib/letterology/geometry";
import { mixPair, pigmentOf } from "@/lib/letterology/pigment";
import { dayReadingOf } from "@/lib/letterology/day-reading";
import { WEATHER_COPY } from "@/lib/letterology/glossary";
import { themeOf } from "@/lib/letterology/lexicon";
import {
  bondCardImageUrl,
  bondTitle,
  bondUrl,
  composeXPost,
  nameToSlug,
  publicSiteOrigin,
  tweetBond,
} from "@/lib/letterology/share";
import type { Letter, MeetKind } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<MeetKind, string> = {
  same: "same",
  ally: "allies",
  enemy: "enemies",
  none: "unrelated",
};

const AXIS_ORDER: { key: keyof BondAxes; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "method", label: "Method" },
  { key: "place", label: "Place" },
  { key: "overlap", label: "Letters" },
  { key: "exchange", label: "Gifts" },
  { key: "temper", label: "Temper" },
  { key: "court", label: "Court" },
  { key: "spark", label: "Spark" },
];

const webLinkClass =
  "inline-flex h-12 items-center justify-between rounded-xl bg-raised px-4 font-display text-sm text-ink shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]";

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const total = 22;
    let raf = 0;
    const tick = () => {
      frame += 1;
      setValue(Math.round((target * frame) / total));
      if (frame < total) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export function BondView({ bond }: { bond: BondReading }) {
  const shown = useCountUp(bond.affinity);
  const origin = publicSiteOrigin();
  const url = bondUrl(bond.a.displayName, bond.b.displayName, origin);
  const image = bondCardImageUrl(bond.a.displayName, bond.b.displayName, origin);
  const title = bondTitle(bond.a.displayName, bond.b.displayName, bond.title);
  const post = useMemo(
    () =>
      composeXPost(
        tweetBond({
          a: bond.a.displayName,
          b: bond.b.displayName,
          title: bond.title,
          affinity: bond.affinity,
        }),
        url,
      ),
    [bond, url],
  );
  const dayA = dayReadingOf(bond.a);
  const dayB = dayReadingOf(bond.b);
  const weather = WEATHER_COPY[bond.weather] ?? { label: bond.headline, gloss: "" };
  const [copied, setCopied] = useState<"x" | "link" | "share" | "post" | null>(null);

  async function mark(kind: "x" | "link" | "share" | "post") {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="stagger-in space-y-8">
      <header className="flex flex-col items-center text-center">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">Certificate of Bond</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          Eight measures, then a name for the pair. The number is a fit — not a forecast.
        </p>
        <div className="mt-6 flex w-full max-w-xl items-end justify-between gap-3">
          <PersonMark
            letter={bond.a.signature}
            name={bond.a.displayName}
            house={bond.seats[0].aNoun}
            code={bond.a.archetype.code}
            align="left"
          />
          <AffinityRing value={shown} mix={mixPair(bond.a.signature, bond.b.signature).css} />
          <PersonMark
            letter={bond.b.signature}
            name={bond.b.displayName}
            house={bond.seats[0].bNoun}
            code={bond.b.archetype.code}
            align="right"
          />
        </div>
        <p className="mt-6 font-display text-xs tracking-[0.18em] text-primary uppercase">{weather.label}</p>
        {weather.gloss ? <p className="mt-1 max-w-md text-sm text-muted">{weather.gloss}</p> : null}
        <p className="mt-3 font-display text-xs tracking-[0.2em] text-muted uppercase">{bond.epithet}</p>
        <h2 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">{bond.title}</h2>
        <p className="mt-2 font-display text-sm tracking-[0.14em] text-muted uppercase">
          {bond.sigil} · {bond.headline}
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/90">{bond.verdict}</p>
        <p className="mt-3 font-display text-ink">{bond.invitation}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/80">{bond.plainly}</p>
      </header>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="The eight measures">
          Each bar is its own question. Role is the first letters. Method is how they work. Place is
          where. Letters are shared spelling, by weight. Gifts are missing allies the other already
          carries. Temper is inward versus outward. Court is how often each name sits in the other’s
          allies. Spark is honest argument.
        </Explain>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {AXIS_ORDER.map((axis) => (
            <AxisMeter
              key={axis.key}
              label={axis.label}
              value={bond.axes[axis.key]}
              hint={bond.axisHints[axis.key]}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="Path on the graph">
          The twenty-six houses are a 3-regular graph — each has three allies. Distance is hops
          along those allies, not the alphabet’s order. Resonance blends that walk with the
          graph’s spectrum. A 1 is an official ally. A 4 is a long walk.
        </Explain>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <PathCard
            label="House"
            hops={bond.geometry.hops.house}
            resonance={bond.geometry.resonance.house}
            a={bond.seats[0].aNoun}
            b={bond.seats[0].bNoun}
          />
          <PathCard
            label="Manner"
            hops={bond.geometry.hops.manner}
            resonance={bond.geometry.resonance.manner}
            a={bond.seats[1].aNoun}
            b={bond.seats[1].bNoun}
          />
          <PathCard
            label="Field"
            hops={bond.geometry.hops.field}
            resonance={bond.geometry.resonance.field}
            a={bond.seats[2].aNoun}
            b={bond.seats[2].bNoun}
          />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink/85">
          The two spellings, moved across the wheel: letter-fit {bond.geometry.overlapJS},
          transport {bond.geometry.transport}, circular fit {bond.geometry.circleFit}. Mean walk{" "}
          {bond.geometry.meanHop.toFixed(1)} hops.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-border)]">
        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-stretch sm:p-7">
          <div className="relative w-full max-w-lg rounded-lg bg-raised p-5 text-ink outline outline-1 -outline-offset-1 outline-primary-fg/20 sm:p-7">
            <CornerMarks />
            <p className="text-center font-display text-[0.65rem] tracking-[0.28em] text-primary uppercase">
              CC33
            </p>
            <p className="mt-2 text-center font-display text-xs tracking-[0.2em] text-muted uppercase">
              Certificate of Bond
            </p>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-6xl leading-none text-primary">{bond.a.signature}</p>
                <p className="mt-1 font-display text-sm text-ink">{bond.a.displayName}</p>
              </div>
              <p className="font-display text-3xl text-primary">{bond.affinity}</p>
              <div className="text-right">
                <p className="font-display text-6xl leading-none text-primary">{bond.b.signature}</p>
                <p className="mt-1 font-display text-sm text-ink">{bond.b.displayName}</p>
              </div>
            </div>
            <p className="mt-4 text-center font-display text-xs tracking-[0.16em] text-muted uppercase">
              {bond.epithet}
            </p>
            <h3 className="mt-2 text-center font-display text-2xl leading-tight text-ink">{bond.title}</h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink/80">{bond.invitation}</p>
            <img
              src="/seal.jpg"
              alt=""
              width={56}
              height={56}
              className="mx-auto mt-5 size-14 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <p className="font-display text-xs tracking-[0.22em] uppercase opacity-80">Share the certificate</p>
              <p className="mt-2 text-sm leading-relaxed text-primary-fg/85">
                Copy this post, or open X. The card is the picture — both names sit on it.
              </p>
            </div>
            <figure className="mt-4 rounded-lg bg-primary-fg/10 px-4 py-3 outline outline-1 -outline-offset-1 outline-primary-fg/15">
              <figcaption className="font-display text-[0.65rem] tracking-[0.18em] text-primary-fg/65 uppercase">
                What X will receive
              </figcaption>
              <p className="mt-2 whitespace-pre-wrap font-display text-sm leading-relaxed">{post.caption}</p>
              <p className="mt-3 break-all font-display text-xs tracking-wide text-primary-fg/70">{url}</p>
            </figure>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="bg-primary-fg text-primary hover:bg-primary-fg/90"
                onClick={async () => {
                  if (await copyToClipboard(post.text)) await mark("x");
                }}
              >
                {copied === "x" ? <Check /> : <Copy />}
                {copied === "x" ? "Copied for X" : "Copy for X"}
              </Button>
              <Button
                variant="outline"
                className="bg-primary-fg/15 text-primary-fg hover:bg-primary-fg/25"
                onClick={async () => {
                  if (await copyToClipboard(url)) await mark("link");
                }}
              >
                {copied === "link" ? "Link copied" : "Copy link"}
              </Button>
              <Button
                className="bg-ink text-primary-fg hover:bg-ink/90"
                onClick={async () => {
                  if (typeof navigator.share !== "function") {
                    if (await copyToClipboard(post.text)) await mark("x");
                    return;
                  }
                  try {
                    await navigator.share({ title, text: post.caption, url });
                    await mark("share");
                  } catch {
                    // cancelled
                  }
                }}
              >
                <Share2 />
                {copied === "share" ? "Shared" : "Share"}
              </Button>
              <Button
                className="bg-ink text-primary-fg hover:bg-ink/90"
                onClick={() => {
                  openXIntent(post.href);
                  void mark("post");
                }}
              >
                <ExternalLink />
                {copied === "post" ? "Opening X" : "Post on X"}
              </Button>
            </div>
            <img
              src={image}
              alt={title}
              width={480}
              height={252}
              className="mt-4 hidden w-full max-w-sm rounded-lg outline outline-1 -outline-offset-1 outline-primary-fg/20 lg:block"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {bond.seats.map((seat) => (
          <article key={seat.seat} className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
            <Explain title={seat.label}>
              {seat.seat === "house"
                ? "The role each first letter names."
                : seat.seat === "manner"
                  ? "How each name tends to work."
                  : "Where each name’s work happens."}
            </Explain>
            <div className="mt-4 flex items-end justify-between gap-3">
              <LetterLink letter={seat.a} noun={seat.aNoun} />
              <span className="font-display text-xs tracking-[0.14em] text-muted uppercase">
                {KIND_LABEL[seat.kind]}
              </span>
              <LetterLink letter={seat.b} noun={seat.bNoun} align="right" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/85">{seat.copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Explain title="What they make">
            The third thing — shared letters, plus the two fields side by side.
          </Explain>
          <p className="mt-3 text-sm leading-relaxed text-ink/90">{bond.made}</p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Explain title="What they owe">
            Gifts are allies one name already carries for the other.
          </Explain>
          <p className="mt-3 text-sm leading-relaxed text-ink/90">{bond.owed}</p>
        </article>
        <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
          <Explain title="The argument">
            Each name’s live tension, and the seat that pushes back.
          </Explain>
          <p className="mt-3 text-sm leading-relaxed text-ink/90">{bond.argument}</p>
        </article>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="Four rooms">
          A day in the pair — morning, work, the fight, and how they come back. Not a script. A
          portrait of the hours.
        </Explain>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <RoomCard title="Morning" copy={bond.rooms.morning} />
          <RoomCard title="Work" copy={bond.rooms.work} />
          <RoomCard title="Fight" copy={bond.rooms.fight} />
          <RoomCard title="Repair" copy={bond.rooms.repair} />
        </div>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <Explain title="On the wheel">
          The outer ring is the color wheel — one mineral per letter. Gold lines are allies.
          Dark seats are enemies. Tap a letter to open that house.
        </Explain>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/85">
          {bond.a.displayName} sits {bond.a.signature}. {bond.b.displayName} sits {bond.b.signature}.
        </p>
        <div className="mt-6">
          <HouseCircle selected={bond.a.signature} partner={bond.b.signature} asLinks />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <LetterBucket title="Shared letters" note="Common ground in both names." letters={bond.shared} />
        <LetterBucket
          title={`${bond.a.displayName} gifts`}
          note="Allies the other name is missing."
          letters={bond.giftsBtoA}
        />
        <LetterBucket
          title={`${bond.b.displayName} gifts`}
          note="Allies the other name is missing."
          letters={bond.giftsAtoB}
        />
      </section>

      {dayA && dayB ? (
        <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
          <Explain title="How they meet today">
            Each handle has its own weather for this date. Open the almanac to walk the day.
          </Explain>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <DayMeet reading={dayA} />
            <DayMeet reading={dayB} />
          </div>
        </section>
      ) : null}

      <nav className="grid gap-3 sm:grid-cols-2">
        <Link to="/" search={{ name: bond.a.displayName }} className={webLinkClass}>
          <span>Read {bond.a.displayName}</span>
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
        <Link to="/" search={{ name: bond.b.displayName }} className={webLinkClass}>
          <span>Read {bond.b.displayName}</span>
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
        <Link
          to="/archetypes"
          search={{ house: bond.a.signature, code: bond.a.archetype.code }}
          className={webLinkClass}
        >
          <span>{bond.seats[0].aNoun} house</span>
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
        <Link
          to="/archetypes"
          search={{ house: bond.b.signature, code: bond.b.archetype.code }}
          className={webLinkClass}
        >
          <span>{bond.seats[0].bNoun} house</span>
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
        <Link
          to="/p/$slug"
          params={{ slug: nameToSlug(bond.a.displayName) }}
          search={{ date: undefined }}
          className={webLinkClass}
        >
          <span>{bond.a.displayName} portrait</span>
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
        <Link
          to="/p/$slug"
          params={{ slug: nameToSlug(bond.b.displayName) }}
          search={{ date: undefined }}
          className={webLinkClass}
        >
          <span>{bond.b.displayName} portrait</span>
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
      </nav>
    </div>
  );
}

function PersonMark({
  letter,
  name,
  house,
  code,
  align,
}: {
  letter: Letter;
  name: string;
  house: string;
  code: string;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="font-display text-6xl leading-none sm:text-7xl" style={{ color: pigmentOf(letter).css }}>{letter}</p>
      <p className="mt-2 font-display text-lg leading-tight text-ink">{name}</p>
      <p className="text-sm text-muted">{house}</p>
      <p className="font-display text-xs tracking-[0.14em] text-muted uppercase">{code}</p>
    </div>
  );
}

function AffinityRing({ value, mix }: { value: number; mix?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="affinity-ring grid size-24 place-items-center rounded-full sm:size-28"
        style={{ ["--affinity" as string]: value, ["--affinity-mix" as string]: mix }}
      >
        <div className="grid size-[4.5rem] place-items-center rounded-full bg-raised sm:size-24">
          <span className="font-display text-3xl leading-none text-primary sm:text-4xl">{value}</span>
        </div>
      </div>
      <p className="mt-2 font-display text-xs tracking-[0.16em] text-muted uppercase">Affinity</p>
    </div>
  );
}

function AxisMeter({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
        <p className="font-display text-sm text-ink">{value}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-sm leading-snug text-muted">{hint}</p>
    </div>
  );
}

function PathCard({
  label,
  hops,
  resonance,
  a,
  b,
}: {
  label: string;
  hops: number;
  resonance: number;
  a: string;
  b: string;
}) {
  return (
    <article className="border-t border-ink/10 pt-4 sm:border-0 sm:pt-0">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">
        {hops} hop{hops === 1 ? "" : "s"}
      </p>
      <p className="mt-1 text-sm text-muted">{hopPhrase(hops)}</p>
      <p className="mt-2 text-sm leading-snug text-ink/85">
        {a} → {b}. Resonance {resonance}.
      </p>
    </article>
  );
}

function RoomCard({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="border-t border-ink/10 pt-4">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/90">{copy}</p>
    </article>
  );
}

function LetterLink({
  letter,
  noun,
  align,
}: {
  letter: Letter;
  noun: string;
  align?: "right";
}) {
  return (
    <Link
      to="/atlas"
      search={{ letter }}
      className={cn("min-w-0", align === "right" ? "text-right" : "text-left")}
    >
      <span className="font-display text-3xl leading-none" style={{ color: pigmentOf(letter).css }}>{letter}</span>
      <span className="mt-1 block truncate text-sm text-muted">{noun}</span>
    </Link>
  );
}

function LetterBucket({ title, note, letters }: { title: string; note: string; letters: Letter[] }) {
  return (
    <article className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{title}</p>
      <p className="mt-1 text-sm text-muted">{note}</p>
      {letters.length === 0 ? (
        <p className="mt-4 text-sm text-ink/70">None in this pair.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {letters.map((letter) => (
            <Link
              key={letter}
              to="/atlas"
              search={{ letter }}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-bg px-3 font-display text-ink shadow-[var(--shadow-border)]"
            >
              {letter}
              <span className="sr-only"> {themeOf(letter).name}</span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

function DayMeet({
  reading,
}: {
  reading: NonNullable<ReturnType<typeof dayReadingOf>>;
}) {
  return (
    <div>
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{reading.person.displayName}</p>
      <p className="mt-2 font-display text-xl text-ink">{reading.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/80">{reading.invitation}</p>
      <Link
        to="/almanac"
        search={{ name: reading.person.displayName, date: reading.iso }}
        className="mt-3 inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
      >
        Open in the almanac
      </Link>
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t border-l border-primary/40" />
      <span className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t border-r border-primary/40" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-primary/40" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-primary/40" />
    </>
  );
}
