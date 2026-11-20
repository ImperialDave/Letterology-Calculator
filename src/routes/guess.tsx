import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { GuessGame } from "@/components/guess-game";
import { GtcChip, GtcWordmark } from "@/components/gtc-mark";
import { OnlineMatch } from "@/components/online-match";
import { initialOnline, type OnlineState } from "@/lib/gtc/online";
import { clearSeat, loadSeat, newPeerId, saveSeat } from "@/lib/gtc/seat";
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
        { name: "theme-color", content: "#0b3f36" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Figtree:wght@400;600;700&display=swap",
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

function writeRoom(roomCode: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomCode);
  window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
}

function GuessGate() {
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState<"gate" | "local" | "room">("gate");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);
  const [peerId, setPeerId] = useState("");
  const [restored, setRestored] = useState(false);
  const [initialState, setInitialState] = useState<OnlineState | undefined>(undefined);
  const [mailCursor, setMailCursor] = useState<number | null>(0);

  useEffect(() => {
    const saved = localStorage.getItem("gtc-name");
    if (saved) setName(saved);
    const room = new URLSearchParams(window.location.search).get("room");
    const next = room && /^[A-Za-z0-9_-]{1,64}$/.test(room) ? cleanCode(room) : "";
    if (next.length >= 4) {
      setInvited(next);
      setDraftCode(next);
    }
    const seat = next.length >= 4 ? loadSeat(next) : loadSeat();
    if (seat) {
      if (next !== seat.room) writeRoom(seat.room);
      setCode(seat.room);
      setName(seat.name);
      setIsHost(seat.role === "host");
      setPeerId(seat.peerId);
      setInitialState(seat.state);
      setMailCursor(seat.mailCursor);
      setRestored(true);
      setScreen("room");
    }
    setBooted(true);
  }, []);

  function remember(value: string): string {
    const trimmed = value.trim().slice(0, 18) || "Player";
    setName(trimmed);
    localStorage.setItem("gtc-name", trimmed);
    return trimmed;
  }

  function enter(role: "host" | "guest", roomCode: string, who: string) {
    const id = newPeerId();
    const state = initialOnline();
    saveSeat({ room: roomCode, name: who, role, peerId: id, state });
    writeRoom(roomCode);
    setPeerId(id);
    setCode(roomCode);
    setName(who);
    setIsHost(role === "host");
    setInitialState(undefined);
    setMailCursor(0);
    setRestored(false);
    setScreen("room");
  }

  function leaveRoom() {
    clearSeat();
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    const next = url.searchParams.toString();
    window.history.replaceState(null, "", next ? `${url.pathname}?${next}` : url.pathname);
    setRestored(false);
    setInitialState(undefined);
    setScreen("gate");
  }

  if (!booted) {
    return (
      <main className="gtc-boot" data-screen="boot">
        <GtcWordmark />
      </main>
    );
  }
  if (screen === "local") return <GuessGame onLeave={() => setScreen("gate")} />;
  if (screen === "room" && peerId) {
    return (
      <OnlineMatch
        key={`${code}:${name}:${isHost ? "h" : "g"}:${peerId}`}
        room={code}
        name={name}
        isHost={isHost}
        peerId={peerId}
        restored={restored}
        initialState={restored ? initialState : undefined}
        mailCursor={mailCursor}
        onLeave={leaveRoom}
      />
    );
  }

  const joinCode = cleanCode(draftCode);

  return (
    <main className="safe-x safe-y mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 py-6" data-screen="gate">
      <Link to="/" className="gtc-club self-start">
        Club
      </Link>
      <GtcWordmark heading />
      <GtcChip>Two players</GtcChip>
      <p className="gtc-lede">
        A theme wide enough to be useless. You each hide a character for the other person, then guess the one
        they hid for you. {THEMES.length} themes. No accounts.
      </p>

      {invited ? (
        <p className="gtc-sheet text-sm">
          You were invited to room <span className="font-bold tracking-widest">{invited}</span>.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="gtc-label" htmlFor="your-name">
          Your name
        </label>
        <input
          id="your-name"
          value={name}
          maxLength={18}
          autoComplete="nickname"
          placeholder="Player"
          onChange={(event) => setName(event.target.value)}
          className="gtc-field"
        />
      </div>

      {invited ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (joinCode.length < 4) return;
            enter("guest", joinCode, remember(name));
          }}
        >
          <label className="gtc-label" htmlFor="room-code-input">
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
            className="gtc-field gtc-field-code"
          />
          <button id="join-room" type="submit" disabled={joinCode.length < 4} className="gtc-btn gtc-btn-primary press w-full">
            {joinCode === invited ? `Join ${invited}` : "Join"}
          </button>
        </form>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          id="create-room"
          type="button"
          className={invited ? "gtc-btn gtc-btn-quiet press w-full" : "gtc-btn gtc-btn-primary press w-full"}
          onClick={() => {
            enter("host", makeCode(), remember(name));
          }}
        >
          Create a room
        </button>
        <p className="text-sm text-faint">One phone makes the room. The other joins with the code.</p>
      </div>

      {invited ? null : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (joinCode.length < 4) return;
            enter("guest", joinCode, remember(name));
          }}
        >
          <label className="gtc-label" htmlFor="room-code-input">
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
            className="gtc-field gtc-field-code"
          />
          <button id="join-room" type="submit" disabled={joinCode.length < 4} className="gtc-btn gtc-btn-secondary press w-full">
            Join
          </button>
        </form>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button id="same-phone" type="button" className="gtc-btn gtc-btn-quiet press w-full" onClick={() => setScreen("local")}>
          Same phone
        </button>
        <p className="text-sm text-faint">Pass one phone back and forth if you’re sitting together.</p>
      </div>
    </main>
  );
}
