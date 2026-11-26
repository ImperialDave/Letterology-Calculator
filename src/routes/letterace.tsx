import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, type MutableRefObject, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

const ALT = "Letterace — toy karts on a paper road inside a letterpress workshop";

type Call = {
  (name: string, returnType: null, argTypes: string[], args: number[]): void;
  (name: string, returnType: "number", argTypes: string[], args: number[]): number;
};

type EmscriptenModule = {
  canvas: HTMLCanvasElement;
  locateFile: (path: string) => string;
  print: (text: string) => void;
  printErr: (text: string) => void;
  onRuntimeInitialized: () => void;
  ccall?: Call;
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

const UI_CONTROLS = 6;

function callVoid(name: string, args: number[]) {
  const fn = window.Module?.ccall;
  if (!fn) return false;
  fn(name, null, args.map(() => "number"), args);
  return true;
}

function callNum(name: string): number | null {
  const fn = window.Module?.ccall;
  if (!fn) return null;
  return fn(name, "number", [], []);
}

function seatCount() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter((pad) => pad).length : 0;
  if (!coarse) return 4;
  return pads >= 2 ? Math.min(4, pads) : 1;
}

function LetteracePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef(0);
  const audioOn = useRef(false);
  const holdLive = useRef(false);
  const steerRef = useRef(0);
  const tiltRef = useRef(0);
  const tiltSeen = useRef(false);
  const stickDown = useRef(false);
  const actions = useRef({ accel: false, brake: false, drift: false });
  const padRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    const status = document.getElementById("letterace-status");
    if (!canvas || !shell) return;
    const say = (text: string) => {
      if (status) status.textContent = text;
    };

    const fit = () => {
      const rect = shell.getBoundingClientRect();
      let w = Math.max(160, Math.round(rect.width));
      let h = Math.max(160, Math.round(rect.height));
      const long = Math.max(w, h);
      if (long > 1280) {
        const scale = 1280 / long;
        w = Math.max(160, Math.round(w * scale));
        h = Math.max(160, Math.round(h * scale));
      }
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      callVoid("letterace_resize", [w, h]);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };

    const resume = () => {
      if (audioOn.current) return;
      if (!callVoid("letterace_resume", [])) return;
      audioOn.current = true;
    };

    const pushHold = () => {
      const ui = uiRef.current;
      const driving = (ui & (1 << 9)) !== 0;
      if (!driving) {
        if (holdLive.current) {
          callVoid("letterace_hold", [0, 0, 0, 0]);
          holdLive.current = false;
        }
        return;
      }
      const auto = (ui & (1 << 12)) !== 0;
      const brake = actions.current.brake;
      const accel = auto ? !brake : actions.current.accel;
      const steer = stickDown.current ? steerRef.current : tiltRef.current || steerRef.current;
      callVoid("letterace_hold", [steer, accel ? 1 : 0, brake ? 1 : 0, actions.current.drift ? 1 : 0]);
      holdLive.current = true;
    };

    let tiltTimer = 0;
    let tiltListening = false;
    let tiltPermit: Promise<boolean> | null = null;
    const tiltCtor = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    const onTilt = (event: DeviceOrientationEvent) => {
      tiltSeen.current = true;
      const orient = window as unknown as { orientation?: number };
      const angle = window.screen.orientation?.angle ?? orient.orientation ?? 0;
      const landscape = window.innerWidth > window.innerHeight;
      let deg = landscape ? (event.beta ?? 0) : (event.gamma ?? 0);
      if (landscape && (angle === 270 || angle === -90)) deg = -deg;
      const dead = 6;
      if (Math.abs(deg) < dead) tiltRef.current = 0;
      else {
        const sign = deg < 0 ? -1 : 1;
        const mag = Math.min(1, (Math.abs(deg) - dead) / 28);
        tiltRef.current = Math.round(sign * mag * 100);
      }
      pushHold();
    };
    const stopTilt = () => {
      window.removeEventListener("deviceorientation", onTilt);
      window.clearTimeout(tiltTimer);
      tiltListening = false;
      tiltRef.current = 0;
      tiltSeen.current = false;
    };
    const askTilt = () => {
      if (tiltPermit) return tiltPermit;
      if (typeof tiltCtor.requestPermission === "function") {
        tiltPermit = tiltCtor
          .requestPermission()
          .then((state) => state === "granted")
          .catch(() => false);
      } else tiltPermit = Promise.resolve(true);
      return tiltPermit;
    };
    const listenTilt = () => {
      if (tiltListening) return;
      tiltListening = true;
      window.addEventListener("deviceorientation", onTilt);
      tiltTimer = window.setTimeout(() => {
        const modeNow = (uiRef.current >> 10) & 3;
        if (!tiltSeen.current && modeNow === 2) callVoid("letterace_tune", [0]);
      }, 1500);
    };

    let tiltWanted = false;
    const paint = (ui: number) => {
      const driving = (ui & (1 << 9)) !== 0;
      const show = (ui >> 14) & 3;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const padOn = driving && (show === 1 || (show === 0 && !fine));
      const mode = (ui >> 10) & 3;
      const hand = (ui & (1 << 13)) !== 0;
      const auto = (ui & (1 << 12)) !== 0;
      if (padRef.current) {
        padRef.current.hidden = !padOn;
        padRef.current.dataset.hand = hand ? "left" : "right";
        padRef.current.dataset.steer = mode === 1 ? "buttons" : "stick";
        padRef.current.dataset.auto = auto ? "on" : "off";
        padRef.current.dataset.tilt = mode === 2 && tiltSeen.current ? "live" : "wait";
      }
      if (clubRef.current) clubRef.current.hidden = driving;
    };

    let frame = 0;
    const poll = () => {
      const ui = callNum("letterace_ui");
      if (ui !== null) {
        uiRef.current = ui;
        const mode = (ui >> 10) & 3;
        if (mode === 2 && !tiltWanted) {
          tiltWanted = true;
          void askTilt().then((ok) => {
            if (((uiRef.current >> 10) & 3) !== 2) return;
            if (!ok) callVoid("letterace_tune", [0]);
            else listenTilt();
          });
        }
        if (mode !== 2 && tiltWanted) {
          tiltWanted = false;
          stopTilt();
        }
        paint(ui);
        pushHold();
      }
      if (canvas.style.width !== "100%" || canvas.style.height !== "100%") {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }
      frame = window.requestAnimationFrame(poll);
    };

    const point = (event: PointerEvent, down: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const x = Math.round(((event.clientX - rect.left) * canvas.width) / rect.width);
      const y = Math.round(((event.clientY - rect.top) * canvas.height) / rect.height);
      callVoid("letterace_point", [x, y, down]);
    };

    const onPointerDown = (event: PointerEvent) => {
      resume();
      if (uiRef.current & (1 << 9)) return;
      if (event.target !== canvas) return;
      point(event, 1);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.target !== canvas) return;
      if (uiRef.current & (1 << 9)) return;
      point(event, 0);
      const screen = uiRef.current & 255;
      const mode = (uiRef.current >> 10) & 3;
      if (screen === UI_CONTROLS && mode === 1) void askTilt();
    };

    const onKey = (event: KeyboardEvent) => {
      resume();
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

    const seats = () => callVoid("letterace_seats", [seatCount()]);
    const observer = new ResizeObserver(() => fit());
    observer.observe(shell);
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("pointerup", onPointerUp, { capture: true });
    window.addEventListener("pointercancel", onPointerUp, { capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("gamepadconnected", seats);
    window.addEventListener("gamepaddisconnected", seats);

    if (!window.__letterace) {
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
          seats();
          fit();
          canvas.focus();
          frame = window.requestAnimationFrame(poll);
        },
      };
      const script = document.createElement("script");
      script.src = "/letterace/letterace.js";
      script.async = false;
      script.onerror = () => say("Letterace failed to load.");
      document.body.appendChild(script);
    } else {
      canvas.focus();
      frame = window.requestAnimationFrame(poll);
    }
    fit();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("pointerup", onPointerUp, { capture: true });
      window.removeEventListener("pointercancel", onPointerUp, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
      window.removeEventListener("gamepadconnected", seats);
      window.removeEventListener("gamepaddisconnected", seats);
      stopTilt();
    };
  }, []);

  return (
    <div
      id="letterace-shell"
      ref={shellRef}
      className="fixed inset-0 overflow-hidden bg-[#1a1614]"
      style={{ touchAction: "none", overscrollBehavior: "none" }}
    >
      <a
        ref={clubRef}
        href="/?club=1"
        className="absolute left-4 z-20 rounded-full bg-[#1a1614]/80 px-3 py-1.5 text-sm text-[#f3ead7]"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        Back to the club
      </a>
      <p id="letterace-status" className="pointer-events-none absolute top-14 left-1/2 z-10 -translate-x-1/2 text-sm text-[#f3ead7]">
        Loading Letterace…
      </p>
      <canvas ref={canvasRef} id="canvas" width={1280} height={720} tabIndex={0} className="absolute inset-0 h-full w-full bg-black outline-none" />
      <DrivingPad
        padRef={padRef}
        steerRef={steerRef}
        stickDown={stickDown}
        actions={actions}
        onHold={() => {
          const ui = uiRef.current;
          const driving = (ui & (1 << 9)) !== 0;
          if (!driving) return;
          const auto = (ui & (1 << 12)) !== 0;
          const brake = actions.current.brake;
          const accel = auto ? !brake : actions.current.accel;
          const steer = stickDown.current ? steerRef.current : tiltRef.current || steerRef.current;
          callVoid("letterace_hold", [steer, accel ? 1 : 0, brake ? 1 : 0, actions.current.drift ? 1 : 0]);
          holdLive.current = true;
        }}
      />
    </div>
  );
}

function DrivingPad({
  padRef,
  steerRef,
  stickDown,
  actions,
  onHold,
}: {
  padRef: RefObject<HTMLDivElement | null>;
  steerRef: MutableRefObject<number>;
  stickDown: MutableRefObject<boolean>;
  actions: MutableRefObject<{ accel: boolean; brake: boolean; drift: boolean }>;
  onHold: () => void;
}) {
  return (
    <div ref={padRef} hidden className="letterace-drive" data-hand="right" data-steer="stick" data-auto="on" data-tilt="wait">
      <style>{PAD_CSS}</style>
      <button type="button" className="pause" onPointerDown={(event) => press(event, () => callVoid("letterace_tap", [32]))}>
        Pause
      </button>
      <div className="steer">
        <Stick
          onChange={(value, down) => {
            steerRef.current = value;
            stickDown.current = down;
            onHold();
          }}
        />
        <div className="steer-buttons">
          <Round
            label="Left"
            onDown={() => {
              steerRef.current = -100;
              stickDown.current = true;
              onHold();
            }}
            onUp={() => {
              steerRef.current = 0;
              stickDown.current = false;
              onHold();
            }}
          />
          <Round
            label="Right"
            onDown={() => {
              steerRef.current = 100;
              stickDown.current = true;
              onHold();
            }}
            onUp={() => {
              steerRef.current = 0;
              stickDown.current = false;
              onHold();
            }}
          />
        </div>
      </div>
      <div className="actions">
        <Round
          label="Drift"
          big
          onDown={() => {
            actions.current.drift = true;
            onHold();
          }}
          onUp={() => {
            actions.current.drift = false;
            onHold();
          }}
        />
        <Round label="Item" onDown={() => callVoid("letterace_tap", [64])} />
        <Round
          label="Brake"
          onDown={() => {
            actions.current.brake = true;
            onHold();
          }}
          onUp={() => {
            actions.current.brake = false;
            onHold();
          }}
        />
        <Round
          label="Gas"
          gas
          onDown={() => {
            actions.current.accel = true;
            onHold();
          }}
          onUp={() => {
            actions.current.accel = false;
            onHold();
          }}
        />
      </div>
    </div>
  );
}

function press(event: ReactPointerEvent, run: () => void) {
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
  run();
}

function Round({
  label,
  big,
  gas,
  onDown,
  onUp,
}: {
  label: string;
  big?: boolean;
  gas?: boolean;
  onDown?: () => void;
  onUp?: () => void;
}) {
  return (
    <button
      type="button"
      className={big ? "round big" : gas ? "round gas" : "round"}
      onPointerDown={(event) => press(event, () => onDown?.())}
      onPointerUp={() => onUp?.()}
      onPointerCancel={() => onUp?.()}
    >
      {label}
    </button>
  );
}

function Stick({ onChange }: { onChange: (value: number, down: boolean) => void }) {
  const origin = useRef({ x: 0, y: 0 });
  const knob = useRef<HTMLSpanElement>(null);
  const max = 64;

  function place(dx: number, dy: number) {
    const dist = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, max / dist);
    const x = dx * scale;
    const y = dy * scale;
    if (knob.current) knob.current.style.transform = `translate(${x}px, ${y}px)`;
    const dead = 12;
    let steer = 0;
    if (Math.abs(x) > dead) {
      const sign = x < 0 ? -1 : 1;
      steer = Math.round((sign * Math.min(1, (Math.abs(x) - dead) / (max - dead))) * 100);
    }
    onChange(steer, true);
  }

  return (
    <div
      className="stick"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = { x: event.clientX, y: event.clientY };
        place(0, 0);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        place(event.clientX - origin.current.x, event.clientY - origin.current.y);
      }}
      onPointerUp={(event) => {
        if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
        onChange(0, false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
        onChange(0, false);
      }}
    >
      <span ref={knob} className="knob" />
    </div>
  );
}

const PAD_CSS = `
.letterace-drive { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.letterace-drive[hidden] { display: none; }
.letterace-drive button, .letterace-drive .stick { pointer-events: auto; touch-action: none; user-select: none; }
.letterace-drive .pause {
  position: absolute; left: 50%; transform: translateX(-50%);
  top: max(8px, env(safe-area-inset-top));
  min-width: 44px; height: 44px; padding: 0 14px;
  border: 0; border-radius: 999px; background: rgba(26,22,20,0.72); color: #f3ead7; font: 600 14px/44px sans-serif;
}
.letterace-drive .steer { position: absolute; left: max(16px, env(safe-area-inset-left)); bottom: max(16px, env(safe-area-inset-bottom)); }
.letterace-drive .actions {
  position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom));
  display: flex; flex-direction: column-reverse; align-items: center; gap: 10px;
}
.letterace-drive[data-hand="left"] .steer { left: auto; right: max(16px, env(safe-area-inset-right)); }
.letterace-drive[data-hand="left"] .actions { right: auto; left: max(16px, env(safe-area-inset-left)); }
.letterace-drive .stick {
  width: 148px; height: 148px; border-radius: 999px; background: rgba(243,234,215,0.28);
  display: grid; place-items: center;
}
.letterace-drive .knob {
  width: 72px; height: 72px; border-radius: 999px; background: #f3ead7; display: block;
}
.letterace-drive .round {
  width: 72px; height: 72px; border: 0; border-radius: 999px;
  background: #f3ead7; color: #1a1614; font: 700 13px/1 sans-serif;
}
.letterace-drive .round.big { width: 96px; height: 96px; font-size: 16px; }
.letterace-drive .steer-buttons { display: none; gap: 12px; }
.letterace-drive[data-steer="buttons"] .stick { display: none; }
.letterace-drive[data-steer="buttons"] .steer-buttons { display: flex; }
.letterace-drive[data-auto="on"] .gas { display: none; }
.letterace-drive[data-tilt="live"] .steer { display: none; }
`;
