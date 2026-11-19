import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { GuessGame } from "@/components/guess-game";
import { OnlineMatch } from "@/components/online-match";
import { THEMES } from "@/lib/gtc/themes";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const ALT = "Guess the Character — two people at a table with silhouette cards";

export const Route = createFileRoute("/guess")({
  head: () => {
    const card = pageCardMeta({
      title: "Guess the Character",
      description: VOICE.guessLede,
      path: "/guess",
      imagePath: "/guess.jpg",
    });
    return {
      ...card,
      meta: [
        ...card.meta.map((item) => {
          if (item.property === "og:type") return { property: "og:type", content: "x:game" };
          if (item.name === "twitter:image:alt" || item.property === "og:image:alt") {
            return { ...item, content: ALT };
          }
          return item;
        }),
        { name: "theme-color", content: "#0e0e0c" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap",
        },
      ],
    };
  },
  component: PlayGuess,
});

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

function cleanCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
    .slice(0, 8);
}

function PlayGuess() {
  return (
    <div className="gtc">
      <GuessGate />
    </div>
  );
}

function GuessGate() {
  const [screen, setScreen] = useState<"gate" | "local" | "room">("gate");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("gtc-name");
    if (saved) setName(saved);
    const room = new URLSearchParams(window.location.search).get("room");
    if (room && /^[A-Za-z0-9_-]{1,64}$/.test(room)) {
      const next = cleanCode(room);
      if (next.length >= 4) {
        setInvited(next);
        setDraftCode(next);
      }
    }
  }, []);

  function remember(value: string): string {
    const trimmed = value.trim().slice(0, 18) || "Player";
    setName(trimmed);
    localStorage.setItem("gtc-name", trimmed);
    return trimmed;
  }

  function leaveRoom() {
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    const next = url.searchParams.toString();
    window.history.replaceState(null, "", next ? `${url.pathname}?${next}` : url.pathname);
    setScreen("gate");
  }

  if (screen === "local") return <GuessGame onLeave={() => setScreen("gate")} />;
  if (screen === "room") {
    return (
      <OnlineMatch key={`${code}:${name}:${isHost ? "h" : "g"}`} room={code} name={name} isHost={isHost} onLeave={leaveRoom} />
    );
  }

  const joinCode = cleanCode(draftCode);

  return (
    <main className="safe-x safe-y mx-auto flex min-h-dvh w-full max-w-xl flex-col py-8" data-screen="gate">
      <Link to="/" className="inline-flex h-11 items-center self-start text-xs tracking-[0.16em] text-faint uppercase">
        Club
      </Link>
      <p className="text-xs font-semibold tracking-widest text-faint uppercase">Two players</p>
      <h1 className="display mt-3 text-5xl">
        Guess the
        <br />
        Character
      </h1>
      <p className="mt-4 max-w-md text-base text-muted">
        A theme wide enough to be useless. You each hide a character for the other person, then guess the one
        they hid for you. {THEMES.length} themes. No accounts.
      </p>

      {invited ? (
        <p className="mt-6 rounded-lg border border-border bg-card px-3 py-3 text-sm">
          You were invited to room <span className="font-medium tracking-widest">{invited}</span>.
        </p>
      ) : null}

      <label className="mt-8 block text-sm text-muted" htmlFor="your-name">
        Your name
      </label>
      <input
        id="your-name"
        value={name}
        maxLength={18}
        autoComplete="nickname"
        placeholder="Player"
        onChange={(event) => setName(event.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-subtle px-3 py-3 text-base text-foreground placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />

      <div className="mt-6 flex flex-col gap-2">
        <button
          id="create-room"
          type="button"
          className="press min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          onClick={() => {
            const who = remember(name);
            setCode(makeCode());
            setName(who);
            setIsHost(true);
            setScreen("room");
          }}
        >
          Create a room
        </button>
        <p className="text-sm text-faint">One phone makes the room. The other joins with the code.</p>
      </div>

      <form
        className="mt-8 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (joinCode.length < 4) return;
          const who = remember(name);
          setCode(joinCode);
          setName(who);
          setIsHost(false);
          setScreen("room");
        }}
      >
        <label className="text-sm text-muted" htmlFor="room-code-input">
          Room code
        </label>
        <input
          id="room-code-input"
          value={draftCode}
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="ABCDE"
          onChange={(event) => setDraftCode(cleanCode(event.target.value))}
          className="display w-full rounded-sm border border-border bg-subtle px-3 py-3 text-2xl tracking-[0.18em] text-foreground placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <button
          id="join-room"
          type="submit"
          disabled={joinCode.length < 4}
          className="press min-h-11 w-full rounded-lg border border-border bg-card px-4 text-sm font-medium disabled:opacity-40"
        >
          {invited && joinCode === invited ? `Join ${invited}` : "Join"}
        </button>
      </form>

      <button
        id="same-phone"
        type="button"
        className="press mt-8 min-h-11 w-full rounded-lg px-4 text-sm font-medium text-muted"
        onClick={() => setScreen("local")}
      >
        Same phone
      </button>
      <p className="mt-2 text-sm text-faint">Pass one phone back and forth if you’re sitting together.</p>
    </main>
  );
}
