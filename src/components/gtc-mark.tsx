import type { ReactNode } from "react";

/** Two cards and a censor bar. The hidden name is the game. */
export function GtcMark({ className = "gtc-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 78" aria-hidden="true">
      <rect x="16" y="2" width="44" height="60" rx="5" fill="var(--gtc-marigold)" />
      <rect x="4" y="14" width="44" height="60" rx="5" fill="var(--gtc-paper)" stroke="var(--gtc-ink)" strokeWidth="2" />
      <rect x="6" y="36" width="40" height="11" fill="var(--gtc-signal-bright)" />
    </svg>
  );
}

export function GtcWordmark({ heading = false, compact = false }: { heading?: boolean; compact?: boolean }) {
  if (compact) {
    return (
      <div className="gtc-brand gtc-brand-bar">
        <GtcMark className="gtc-mark gtc-mark-sm" />
        {heading ? <h1 className="gtc-word">Guess</h1> : <p className="gtc-word">Guess</p>}
      </div>
    );
  }
  const word = <span className="gtc-word">Guess</span>;
  const sub = <span className="gtc-sub">the character</span>;
  return (
    <div className="gtc-brand">
      <GtcMark />
      {heading ? (
        <h1 className="gtc-brand-title">
          {word}
          {sub}
        </h1>
      ) : (
        <p className="gtc-brand-title">
          {word}
          {sub}
        </p>
      )}
    </div>
  );
}

export function GtcCode({ code }: { code: string }) {
  return (
    <p id="room-code" className="gtc-code" translate="no">
      {Array.from(code).map((glyph, index) => (
        <span key={`${glyph}${index}`} className="gtc-code-tile">
          {glyph}
        </span>
      ))}
    </p>
  );
}

export function GtcChip({ children }: { children: ReactNode }) {
  return <p className="gtc-chip">{children}</p>;
}

export function GtcTicket({ line }: { line: string }) {
  return (
    <div className="gtc-ticket">
      <p className="gtc-ticket-kicker">Both of your characters</p>
      <p className="gtc-ticket-line">{line.trim() || "…"}</p>
    </div>
  );
}

export function GtcPortrait({
  name,
  note,
  kicker,
  seat,
  children,
}: {
  name?: string;
  note?: string | null;
  kicker?: string;
  seat?: "me" | "them";
  children?: ReactNode;
}) {
  const seatClass = seat === "me" ? " gtc-portrait-me" : seat === "them" ? " gtc-portrait-them" : "";
  return (
    <article className={`gtc-portrait${seatClass}`}>
      <div className="gtc-portrait-bar" aria-hidden="true" />
      <div className="gtc-portrait-body">
        {kicker ? <p className="gtc-portrait-kicker">{kicker}</p> : null}
        {children ?? <p className="gtc-portrait-name">{name}</p>}
        {note ? <p className="gtc-portrait-note">{note}</p> : null}
      </div>
    </article>
  );
}

export function gtcAnswerClass(answer: string): string {
  switch (answer) {
    case "yes":
      return "gtc-answer gtc-answer-yes";
    case "no":
      return "gtc-answer gtc-answer-no";
    case "sort":
      return "gtc-answer gtc-answer-sort";
    case "right":
      return "gtc-answer gtc-answer-right";
    case "wrong":
      return "gtc-answer gtc-answer-wrong";
    default:
      return "gtc-answer";
  }
}
