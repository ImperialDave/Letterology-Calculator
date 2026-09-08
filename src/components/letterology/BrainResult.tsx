import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink } from "lucide-react";
import { BrainCertificate } from "@/components/letterology/BrainCertificate";
import { Button } from "@/components/ui/button";
import {
  BRAIN_GRADES,
  GRADE_LEGEND,
  brainCardFile,
  brainPath,
  tweetBrain,
  type BrainGrade,
  type BrainReading,
} from "@/lib/letterology/brain";
import { copyToClipboard, openXIntent } from "@/lib/letterology/clipboard";
import { composeXPost, publicSiteOrigin } from "@/lib/letterology/share";
import { cn } from "@/lib/utils";

export function BrainResult({ reading, tongue }: { reading: BrainReading; tongue: "la" | "el" }) {
  const [copied, setCopied] = useState<"x" | "link" | null>(null);
  const origin = publicSiteOrigin();
  const path = brainPath(reading.token, reading.guest ? undefined : reading.name);
  const url = `${origin}${path}`;
  const imagePath = `/og/${brainCardFile(reading.token)}`;
  const post = composeXPost(tweetBrain(reading), url);

  async function mark(kind: "x" | "link") {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · How you look</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">{reading.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl font-display text-lg text-primary">{reading.pattern}</p>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ink/90">{reading.headline}</p>
        <p className="mt-6 font-display text-sm tracking-[0.14em] text-muted uppercase">Grade</p>
        <p className="mt-1 font-display text-6xl text-primary">{reading.grade}</p>
        <GradeScale grade={reading.grade} />
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/90">{reading.gradeCaption}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{GRADE_LEGEND}</p>
      </header>

      <section className="space-y-6">
        <h2 className="font-display text-2xl text-ink">Five seats</h2>
        <p className="max-w-2xl leading-relaxed text-muted">
          These are how you actually work. They are not the Letter-brain grade. Strong and quiet can
          live in the same person.
        </p>
        {reading.domains.map((row) => (
          <article key={row.id} className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{row.job}</p>
                <h3 className="mt-1 font-display text-2xl text-ink">{row.name}</h3>
                <p className="text-sm text-muted">
                  {row.aspects[0].name} {row.aspects[0].markName.toLowerCase()} · {row.aspects[1].name}{" "}
                  {row.aspects[1].markName.toLowerCase()}
                </p>
              </div>
              <p className="font-display text-3xl text-primary">{row.markName}</p>
            </div>
            <p className="mt-4 leading-relaxed text-ink/90">{row.gold}</p>
            <p className="mt-3 leading-relaxed text-ink/80">{row.shadow}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <h2 className="font-display text-2xl text-ink">Ten aspects</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Each seat has two aspects. This is the finer map: each aspect reported on its own, instead
          of one total standing in for a person.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {reading.aspects.map((row) => (
            <li key={row.id} className="border-t border-ink/10 pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg text-ink">{row.name}</p>
                <p className="font-display text-sm tracking-[0.12em] text-primary uppercase">{row.markName}</p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{row.job}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
        <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Before noon</p>
        <p className="mt-3 leading-relaxed text-ink/90">{reading.invitation}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Iain McGilchrist called these two ways of seeing the Master and the Emissary. The Master
          looks at the whole living thing. The Emissary looks at separate facts and measurements. The
          second was hired to help the first, not to replace it.
        </p>
      </section>

      <div className="print:block">
        <BrainCertificate reading={reading} />
      </div>

      <section className="rounded-xl bg-primary p-5 text-primary-fg shadow-[var(--shadow-border)] sm:p-7 print:hidden">
        <p className="font-display text-xs tracking-[0.22em] uppercase opacity-80">Share the certificate</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-fg/85">
          Copy a post for X, copy the link, download the card, or print the certificate. The picture
          is the type name on our paper.
        </p>
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
            className={cn("bg-primary-fg/15 text-primary-fg hover:bg-primary-fg/25")}
            onClick={async () => {
              if (await copyToClipboard(url)) await mark("link");
            }}
          >
            {copied === "link" ? "Link copied" : "Copy link"}
          </Button>
          <button
            type="button"
            onClick={() => openXIntent(post.href)}
            className="inline-flex h-11 items-center gap-1.5 px-3 font-display text-xs tracking-[0.14em] uppercase"
          >
            <ExternalLink className="size-3.5" />
            Post on X
          </button>
          <a
            href={imagePath}
            download={`cc33-${reading.token}.jpg`}
            className="inline-flex h-11 items-center px-3 font-display text-xs tracking-[0.14em] uppercase"
          >
            Download the card
          </a>
          <Button
            variant="outline"
            className="bg-primary-fg/15 text-primary-fg hover:bg-primary-fg/25"
            onClick={() => window.print()}
          >
            Print the certificate
          </Button>
        </div>
        <img
          src={imagePath}
          alt=""
          width={320}
          height={168}
          className="mt-5 hidden w-full max-w-sm rounded-md outline outline-1 -outline-offset-1 outline-primary-fg/20 sm:block"
        />
      </section>

      <p className="flex flex-wrap gap-4 print:hidden">
        <Link
          to="/brain"
          search={{ a: undefined, n: undefined, tongue }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          Take it again
        </Link>
        <Link
          to="/brief"
          search={{ tongue, s: undefined }}
          className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          The Brief
        </Link>
      </p>
    </div>
  );
}

function GradeScale({ grade }: { grade: BrainGrade }) {
  return (
    <p className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-x-2.5 gap-y-1">
      {BRAIN_GRADES.map((mark) => (
        <span
          key={mark}
          className={cn(
            "font-display tracking-wide",
            mark === grade ? "text-lg text-primary" : "text-sm text-muted/45",
          )}
        >
          {mark}
        </span>
      ))}
    </p>
  );
}
