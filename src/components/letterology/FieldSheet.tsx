import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { copyToClipboard } from "@/lib/letterology/clipboard";
import { buildHoroscope } from "@/lib/letterology/engine";
import {
  COUNT_MARKS,
  DAY_WEATHER,
  DECISION_FITS,
  DECISION_TIMING,
  FIELD_VOICE,
  GREEK_STEPS,
  LATIN_STEPS,
  LIKENESS_RULES,
  LUCK_BANDS,
  MOTION_RULES,
  NEVER_SAY,
  TIGHTNESS_RULES,
  TWO_GREEK,
  TWO_LATIN,
  VOWEL_CHOIR,
  greekHours,
  latinHouses,
  sheetPlainText,
  speakGreek,
  speakLatin,
} from "@/lib/letterology/sheet";
import type { Tongue } from "@/lib/letterology/tongue";
import { VOICE } from "@/lib/letterology/voice";
import { readStoicheion } from "@/lib/stoicheia/engine";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-[0.7rem] tracking-[0.18em] text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function LineTable({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row) => (
          <tr key={row.k} className="border-t border-ink/10 align-top">
            <th className="w-[28%] py-1.5 pr-3 text-left font-display font-medium text-ink">{row.k}</th>
            <td className="py-1.5 text-ink/85">{row.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FieldSheet({ tongue }: { tongue: Tongue }) {
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState<"script" | "sheet" | null>(null);
  const latin = useMemo(() => (raw.trim() ? buildHoroscope(raw) : null), [raw]);
  const greek = useMemo(() => (raw.trim() ? readStoicheion(raw) : null), [raw]);
  const script =
    tongue === "el"
      ? greek
        ? speakGreek(greek)
        : raw.trim()
          ? VOICE.stoicheiaEmpty
          : ""
      : latin
        ? speakLatin(latin)
        : raw.trim()
          ? "Not A–Z. Use the username they actually use."
          : "";
  const houses = useMemo(() => latinHouses(), []);
  const hours = useMemo(() => greekHours(), []);
  const steps = tongue === "el" ? GREEK_STEPS : LATIN_STEPS;

  function onPrompt(event: FormEvent) {
    event.preventDefault();
    if (script) void copy("script");
  }

  async function copy(kind: "script" | "sheet") {
    const text = kind === "script" ? script : sheetPlainText(tongue);
    if (!text) return;
    if (await copyToClipboard(text)) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    }
  }

  return (
    <div className="sheet-page space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-[0.65rem] tracking-[0.22em] text-muted uppercase">CC33 · Field</p>
          <h1 className="font-display text-3xl text-ink">Cheat sheet</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/80">{VOICE.sheetLede}</p>
        </div>
        <form onSubmit={onPrompt} className="flex w-full max-w-md gap-2">
          <Input
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            placeholder={tongue === "el" ? "name" : "@name"}
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Username to prompt"
            className="h-11"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center px-3 font-display text-xs tracking-[0.12em] text-primary uppercase"
          >
            {copied === "script" ? "Copied" : "Copy"}
          </button>
        </form>
      </header>

      {script ? (
        <p className="border-l-2 border-primary/50 pl-3 text-sm leading-snug text-ink">
          {script}
          {tongue === "la" && latin ? (
            <span className="mt-1 block font-display text-xs tracking-[0.12em] text-muted uppercase">
              {latin.triad.join("")}
            </span>
          ) : null}
          {tongue === "el" && greek ? (
            <span className="mt-1 block font-display text-xs tracking-[0.12em] text-muted uppercase">
              {greek.road.title}
            </span>
          ) : null}
        </p>
      ) : null}

      <Block title="Method">
        <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-2 text-sm">
              <span className="font-display text-primary">{step.n}</span>
              <span>
                <span className="font-display text-ink">{step.title}. </span>
                <span className="text-ink/80">{step.line}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted">{FIELD_VOICE.map((row) => row.line).join(" ")}</p>
      </Block>

      {tongue === "la" ? (
        <>
          <Block title="Houses — first letter is the role">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="text-left font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase">
                    <th className="pb-1 pr-2">Lt</th>
                    <th className="pb-1 pr-2">Role</th>
                    <th className="pb-1 pr-2">Field</th>
                    <th className="pb-1 pr-2">Do this</th>
                    <th className="pb-1 pr-2">With</th>
                    <th className="pb-1">Against</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map((row) => (
                    <tr key={row.letter} className="border-t border-ink/10 align-top">
                      <td className="py-1 pr-2 font-display text-base text-primary">{row.letter}</td>
                      <td className="py-1 pr-2 font-display text-ink">{row.noun}</td>
                      <td className="py-1 pr-2 text-muted">{row.realm}</td>
                      <td className="py-1 pr-2 text-ink/85">{row.invitation}</td>
                      <td className="py-1 pr-2 font-display text-xs tracking-wider text-muted">{row.allies}</td>
                      <td className="py-1 font-display text-xs tracking-wider text-muted">{row.enemies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>

          <div className="grid gap-7 lg:grid-cols-3">
            <Block title="Luck">
              <LineTable rows={LUCK_BANDS.map((row) => ({ k: row.verdict, v: row.charge }))} />
            </Block>
            <Block title="Letterize the act">
              <LineTable
                rows={[
                  ...DECISION_FITS.map((row) => ({ k: row.fit, v: row.line })),
                  ...DECISION_TIMING.map((row) => ({ k: row.timing, v: row.line })),
                ]}
              />
            </Block>
            <div className="space-y-7">
              <Block title="Two names">
                <LineTable rows={TWO_LATIN.map((row) => ({ k: row.title, v: row.line }))} />
              </Block>
              <Block title="Count">
                <LineTable rows={COUNT_MARKS.map((row) => ({ k: row.mark, v: row.line }))} />
              </Block>
            </div>
          </div>
        </>
      ) : (
        <>
          <Block title="Hours — first enter, last leave">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="text-left font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase">
                    <th className="pb-1 pr-2">Lt</th>
                    <th className="pb-1 pr-2">Hour</th>
                    <th className="pb-1 pr-2">Watch</th>
                    <th className="pb-1 pr-2">Realm</th>
                    <th className="pb-1">Do this</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map((row) => (
                    <tr key={row.letter} className="border-t border-ink/10 align-top">
                      <td className="py-1 pr-2 font-display text-base text-primary">{row.letter}</td>
                      <td className="py-1 pr-2 font-display text-ink">{row.noun}</td>
                      <td className="py-1 pr-2 text-muted">{row.watch}</td>
                      <td className="py-1 pr-2 text-muted">{row.realm}</td>
                      <td className="py-1 text-ink/85">{row.invitation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>

          <div className="grid gap-3 sm:grid-cols-7">
            {VOWEL_CHOIR.map((row) => (
              <div key={row.letter} className="text-center">
                <p className="font-display text-2xl text-primary">{row.letter}</p>
                <p className="font-display text-xs text-ink">{row.face}</p>
                <p className="text-[0.65rem] text-muted">{row.planet}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-7 lg:grid-cols-3">
            <Block title="Motion">
              <LineTable rows={MOTION_RULES.map((row) => ({ k: row.motion, v: row.rule }))} />
            </Block>
            <div className="space-y-7">
              <Block title="Tightness">
                <LineTable rows={TIGHTNESS_RULES.map((row) => ({ k: row.state, v: row.rule }))} />
              </Block>
              <Block title="Likeness">
                <LineTable rows={LIKENESS_RULES.map((row) => ({ k: row.state, v: row.rule }))} />
              </Block>
            </div>
            <div className="space-y-7">
              <Block title="Today">
                <LineTable rows={DAY_WEATHER.map((row) => ({ k: row.weather, v: row.rule }))} />
              </Block>
              <Block title="Two names">
                <LineTable rows={TWO_GREEK.map((row) => ({ k: row.title, v: row.line }))} />
              </Block>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-ink/15 pt-4">
        <p className="max-w-3xl text-xs leading-relaxed text-muted">
          Do not say: {NEVER_SAY.join(" · ")}
        </p>
        <div className="flex gap-4 print:hidden">
          <button
            type="button"
            onClick={() => void copy("sheet")}
            className="font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase hover:text-ink"
          >
            {copied === "sheet" ? "Copied" : "Copy sheet"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="font-display text-[0.65rem] tracking-[0.14em] text-muted uppercase hover:text-ink"
          >
            Print
          </button>
          <Link
            to="/"
            search={{ n: raw.trim() || undefined, name: undefined, tongue: tongue === "el" ? "el" : "la" }}
            className="font-display text-[0.65rem] tracking-[0.14em] text-primary uppercase"
          >
            Full reading
          </Link>
        </div>
      </div>
    </div>
  );
}
