import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

type EmscriptenModule = {
  canvas: HTMLCanvasElement;
  locateFile: (path: string) => string;
  print: (text: string) => void;
  printErr: (text: string) => void;
  onRuntimeInitialized: () => void;
};

declare global {
  interface Window {
    Module?: EmscriptenModule;
    __letterace?: boolean;
  }
}

export const Route = createFileRoute("/letterace")({
  head: () => ({
    meta: [{ title: "Letterace" }, { name: "theme-color", content: "#1a1614" }],
  }),
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
      <p id="letterace-status" className="pointer-events-none absolute top-3 left-4 z-10 text-sm text-[#f3ead7]">
        Loading Letterace…
      </p>
      <canvas
        id="canvas"
        width={1280}
        height={720}
        tabIndex={0}
        className="h-auto max-h-full w-full max-w-[calc(100dvh*16/9)] bg-black outline-none"
      />
    </div>
  );
}
