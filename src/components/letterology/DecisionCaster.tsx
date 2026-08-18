import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decide, type DecisionReading } from "@/lib/letterology/luck";
import type { Horoscope } from "@/lib/letterology/types";
import { cn } from "@/lib/utils";

export function DecisionCaster({ horoscope }: { horoscope: Horoscope }) {
  const [act, setAct] = useState("");
  const [reading, setReading] = useState<DecisionReading | null>(null);
  const [error, setError] = useState("");

  function run() {
    const next = decide(horoscope, act);
    if (!next) {
      setReading(null);
      setError("Name the act in letters — a phrase we can read.");
      return;
    }
    setError("");
    setReading(next);
  }

  return (
    <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
      <h3 className="font-display text-2xl text-ink">What are you deciding?</h3>
      <p className="mt-1 max-w-xl text-sm text-muted">
        We read the act the same way we read the handle. Then two questions: is this your kind of
        move, and is that house willing today?
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={act}
          onChange={(event) => setAct(event.target.value)}
          placeholder="quit, ask them, ship the launch, stay"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              run();
            }
          }}
        />
        <Button type="button" variant="outline" className="h-12 shrink-0" onClick={run}>
          Time this
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-primary">{error}</p> : null}
      {reading ? (
        <div className="mt-5">
          <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">
            Act is {reading.actLetter} · {reading.actHouse} · fit {reading.score}
          </p>
          <p
            className={cn(
              "mt-2 font-display text-2xl",
              reading.timing === "now" || reading.timing === "today-ok" ? "text-primary" : "text-ink",
            )}
          >
            {reading.headline}
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink/90">{reading.body}</p>
          <p className="mt-3 max-w-2xl font-semibold text-ink">{reading.next}</p>
        </div>
      ) : null}
    </section>
  );
}
