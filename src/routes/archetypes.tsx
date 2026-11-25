import { createFileRoute, Link } from "@tanstack/react-router";
import { archetypeOf, houseOf, parseTriadCode } from "@/lib/letterology/archetypes";
import { alliesOf } from "@/lib/letterology/circle";
import { readingOf } from "@/lib/letterology/reading";
import { pageCardMeta } from "@/lib/letterology/share";
import { pigmentOf } from "@/lib/letterology/pigment";
import { ALPHABET, type Letter, type Triad } from "@/lib/letterology/types";
import { AppShell } from "@/components/SiteChrome";

type Search = { house?: Letter; code?: string };

function asLetter(raw: unknown): Letter | undefined {
  if (typeof raw !== "string") return undefined;
  const letter = raw.trim().toUpperCase();
  return ALPHABET.includes(letter) ? letter : undefined;
}

export const Route = createFileRoute("/archetypes")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const code = typeof search.code === "string" ? search.code.trim() : "";
    return {
      house: asLetter(search.house),
      code: code.length > 0 ? code : undefined,
    };
  },
  head: () =>
    pageCardMeta({
      title: "Letter Path",
      description: "A role, a manner, and a realm. Read how the three houses work together.",
      path: "/archetypes",
      imagePath: "/og.jpg",
    }),
  component: ArchetypesPage,
});

function ArchetypesPage() {
  const { house, code } = Route.useSearch();
  const triad = parseTriadCode(code);

  return (
    <AppShell current="letters">
      {code && !triad ? <BadCode /> : null}
      {!code && house ? <HouseBook letter={house} /> : null}
      {triad ? <PathReading triad={triad} /> : null}
      {!code && !house ? <HouseIndex /> : null}
    </AppShell>
  );
}

function HouseIndex() {
  return (
    <div>
      <header>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Houses</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          Each letter is a house. On a Letter Path it sits in one of three seats: the role you
          enter as, the way the work is done, or the room where it happens. The same house is a
          different sentence in each seat.
        </p>
      </header>
      <HouseGrid />
    </div>
  );
}

function BadCode() {
  return (
    <div>
      <header>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">That is not a letter path.</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/85">
          A path is three letters, A through Z. The first is the role, the second is how you work,
          and the third is where the work happens.
        </p>
      </header>
      <HouseGrid />
    </div>
  );
}

function HouseGrid() {
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {ALPHABET.map((letter) => {
        const house = houseOf(letter);
        return (
          <li key={letter}>
            <Link
              to="/archetypes"
              search={{ house: letter, code: undefined }}
              className="block min-h-11 rounded-xl bg-raised p-4 shadow-[var(--shadow-border)]"
            >
              <span className="font-display text-3xl leading-none" style={{ color: pigmentOf(letter).css }}>
                {letter}
              </span>
              <span className="mt-2 block font-display text-xl text-ink">{house.noun}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">{house.myth}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function HouseBook({ letter }: { letter: Letter }) {
  const house = houseOf(letter);
  const allies = alliesOf(letter);
  const draft: Triad = [letter, allies[0], allies[1]];

  return (
    <div>
      <header>
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">{letter}</p>
        <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{house.house}</h1>
        <p className="mt-3 max-w-xl italic text-ink/75">{house.myth}</p>
        <p className="mt-3 max-w-xl text-sm text-ink/70">
          Old tables call this {house.tradition} — {house.correspondence}. A likeness, not a creed.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink/90">{house.doctrine}</p>
      </header>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SeatCard kicker="As a role" title={house.noun} body={house.calling} />
        <SeatCard kicker="As how" title={house.adj} body={house.method} />
        <SeatCard kicker="As where" title={house.realm} body={house.field} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SeatCard kicker="When it fails" title="The house alone" body={house.shadow} />
        <SeatCard kicker="When it works" title="The house alone" body={house.gold} />
      </div>
      <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
        A path needs two more letters. This one starts with the allies of {house.noun}. Change any
        seat to read a different combination.
      </p>
      <div className="mt-6">
        <PathReading triad={draft} primary={false} />
      </div>
    </div>
  );
}

function PathReading({ triad, primary = true }: { triad: Triad; primary?: boolean }) {
  const reading = readingOf(triad);
  const archetype = archetypeOf(triad);
  const [role, manner, field] = triad;
  const roleHouse = houseOf(role);
  const mannerHouse = houseOf(manner);
  const fieldHouse = houseOf(field);

  return (
    <article>
      <header>
        <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Letter Path</p>
        {primary ? (
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{archetype.title}</h1>
        ) : (
          <h2 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{archetype.title}</h2>
        )}
        <p className="mt-2 text-sm tracking-wide text-muted">
          {reading.code} · {archetype.house}
        </p>
        <p className="mt-3 max-w-xl text-sm text-ink/70">
          Old tables call the role {archetype.tradition} — {archetype.correspondence}. A likeness,
          not a creed.
        </p>
      </header>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SeatCard kicker={`Role · ${role}`} title={roleHouse.noun} body={reading.role} />
        <SeatCard kicker={`How · ${manner}`} title={mannerHouse.adj} body={reading.manner} />
        <SeatCard kicker={`Where · ${field}`} title={fieldHouse.realm} body={reading.field} />
      </div>
      <section className="mt-6 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-xs tracking-[0.16em] text-muted uppercase">How they work</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink/90">{reading.together}</p>
      </section>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SeatCard kicker="When it fails" title="This path" body={reading.shadow} />
        <SeatCard kicker="When it works" title="This path" body={reading.gold} />
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{reading.invitation}</p>
      <SeatPicker triad={triad} />
      <p className="mt-6">
        <Link
          to="/letters"
          search={{ house: role, tongue: undefined }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Open {roleHouse.noun} on the wheel
        </Link>
      </p>
    </article>
  );
}

function SeatCard({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{kicker}</p>
      <h2 className="mt-2 font-display text-2xl text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink/90">{body}</p>
    </section>
  );
}

function SeatPicker({ triad }: { triad: Triad }) {
  const navigate = Route.useNavigate();
  const seats = [
    { index: 0 as const, label: "Role" },
    { index: 1 as const, label: "How" },
    { index: 2 as const, label: "Where" },
  ];

  function choose(index: 0 | 1 | 2, letter: Letter) {
    const next: Triad = [triad[0], triad[1], triad[2]];
    next[index] = letter;
    void navigate({
      search: { code: next.join(""), house: next[0] },
    });
  }

  return (
    <div className="mt-8 space-y-5">
      {seats.map((seat) => (
        <div key={seat.label}>
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{seat.label}</p>
          <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={seat.label}>
            {ALPHABET.map((letter) => {
              const on = triad[seat.index] === letter;
              const pigment = pigmentOf(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(seat.index, letter)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md font-display text-lg"
                  style={{
                    color: on ? pigment.ink : pigment.css,
                    backgroundColor: on ? pigment.css : "transparent",
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
