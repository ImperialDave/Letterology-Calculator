import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const ALT = "Letterace — toy karts on a paper road inside a letterpress workshop";

type EmscriptenModule = {
  canvas: HTMLCanvasElement;
  locateFile: (path: string) => string;
  print: (text: string) => void;
  printErr: (text: string) => void;
  onRuntimeInitialized: () => void;
  ccall?: (name: string, returnType: null, argTypes: string[], args: number[]) => void;
};

declare global {
  interface Window {
    Module?: EmscriptenModule;
    __letterace?: boolean;
  }
}

const letteraceCard = () => {
  const card = pageCardMeta({
    title: "Letterace",
    description: VOICE.letteraceLede,
    path: "/letterace",
    imagePath: "/letterace.jpg",
  });
  return {
    ...card,
    meta: card.meta.map((item) => {
      if (item.property === "og:type") return { property: "og:type", content: "x:game" };
      if (item.name === "twitter:image:alt" || item.property === "og:image:alt") {
        return { ...item, content: ALT };
      }
      return item;
    }),
  };
};

export const Route = createFileRoute("/letterace")({
  head: () => {
    const card = letteraceCard();
    return {
      ...card,
      meta: [
        ...card.meta,
        { name: "theme-color", content: "#1a1614" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "Letterace" },
      ],
    };
  },
  component: LetteracePage,
});

function LetteracePage() {
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    const status = document.getElementById("letterace-status");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const say = (text: string) => {
      if (status) status.textContent = text;
    };
    if (window.__letterace) {
      canvas.focus();
      return;
    }
    window.__letterace = true;
    window.Module = {
      canvas,
      locateFile: (path) => `/letterace/${path}`,
      print: (text) => {
        console.log(text);
      },
      printErr: (text) => {
        console.error(text);
        say(text);
      },
      onRuntimeInitialized: () => {
        if (status) status.hidden = true;
        canvas.focus();
      },
    };
    const script = document.createElement("script");
    script.src = "/letterace/letterace.js";
    script.async = false;
    script.onerror = () => say("Letterace failed to load.");
    document.body.appendChild(script);
    const block = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === " "
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", block, { capture: true });
    canvas.focus();
    return () => {
      window.removeEventListener("keydown", block, { capture: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1a1614]">
      <a
        href="/?club=1"
        className="absolute top-3 left-4 z-20 rounded-full bg-[#1a1614]/80 px-3 py-1.5 text-sm text-[#f3ead7]"
      >
        Back to the club
      </a>
      <p id="letterace-status" className="pointer-events-none absolute top-14 left-1/2 z-10 -translate-x-1/2 text-sm text-[#f3ead7]">
        Loading Letterace…
      </p>
      <canvas
        id="canvas"
        width={1280}
        height={720}
        tabIndex={0}
        className="h-auto max-h-full w-full max-w-[calc(100dvh*16/9)] bg-black outline-none"
      />
      <Pad />
    </div>
  );
}

const TAP_UP = 1;
const TAP_DOWN = 2;
const TAP_LEFT = 4;
const TAP_RIGHT = 8;
const TAP_ENTER = 16;
const TAP_ESC = 32;
const TAP_ITEM = 64;
const TAP_BACK = 128;

function Pad() {
  const held = useRef({ left: false, right: false, accel: false, brake: false, drift: false });

  function call(name: string, args: number[]) {
    const fn = window.Module?.ccall;
    if (!fn) return;
    fn(name, null, args.map(() => "number"), args);
    const canvas = document.getElementById("canvas");
    if (canvas instanceof HTMLCanvasElement) canvas.focus();
  }

  function sync() {
    const h = held.current;
    const steer = (h.right ? 1 : 0) - (h.left ? 1 : 0);
    call("letterace_hold", [steer, h.accel ? 1 : 0, h.brake ? 1 : 0, h.drift ? 1 : 0]);
  }

  function tap(bit: number) {
    call("letterace_tap", [bit]);
  }

  function hold(key: keyof typeof held.current, down: boolean) {
    held.current[key] = down;
    sync();
  }

  return (
    <>
      <style>{`@media (hover: hover) and (pointer: fine) { .letterace-pad { display: none; } }`}</style>
      <div className="letterace-pad absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 bg-[#1a1614]/55 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap justify-center gap-2">
          <PadButton label="Up" onPress={() => tap(TAP_UP)} />
          <PadButton label="Down" onPress={() => tap(TAP_DOWN)} />
          <PadButton label="Left" onPress={() => tap(TAP_LEFT)} onHold={(down) => hold("left", down)} />
          <PadButton label="Right" onPress={() => tap(TAP_RIGHT)} onHold={(down) => hold("right", down)} />
          <PadButton label="Go" onPress={() => tap(TAP_ENTER)} />
          <PadButton label="Back" onPress={() => tap(TAP_BACK)} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <PadButton label="Gas" onHold={(down) => hold("accel", down)} />
          <PadButton label="Brake" onHold={(down) => hold("brake", down)} />
          <PadButton label="Drift" onHold={(down) => hold("drift", down)} />
          <PadButton label="Item" onPress={() => tap(TAP_ITEM)} />
          <PadButton label="Pause" onPress={() => tap(TAP_ESC)} />
        </div>
      </div>
    </>
  );
}

function PadButton({
  label,
  onPress,
  onHold,
}: {
  label: string;
  onPress?: () => void;
  onHold?: (down: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="h-11 min-w-14 rounded-full bg-[#f3ead7] px-3 text-sm text-[#1a1614]"
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress?.();
        onHold?.(true);
      }}
      onPointerUp={() => onHold?.(false)}
      onPointerCancel={() => onHold?.(false)}
    >
      {label}
    </button>
  );
}
