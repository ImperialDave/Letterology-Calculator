import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portraitPath, tweetText, xIntentUrl } from "@/lib/letterology/share";
import type { Horoscope } from "@/lib/letterology/types";

export function ShareBar({ horoscope }: { horoscope: Horoscope }) {
  const [copied, setCopied] = useState<"link" | "post" | null>(null);
  const path = portraitPath(horoscope.displayName);

  async function copyLink() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("link");
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  function postToX() {
    window.open(xIntentUrl(horoscope, window.location.origin), "_blank", "noopener,noreferrer");
    setCopied("post");
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <aside className="overflow-hidden rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div className="max-w-xl">
          <p className="font-display text-xs tracking-[0.22em] uppercase opacity-80">Share the portrait</p>
          <h3 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">
            Make it travel.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-primary-fg/85">
            {tweetText(horoscope).split("\n")[0]}. X gets a full card — name, house, and the three letters.
          </p>
          <p className="mt-3 break-all font-display text-xs tracking-wide text-primary-fg/70">{path}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="bg-primary-fg text-primary hover:bg-primary-fg/90"
            onClick={copyLink}
          >
            {copied === "link" ? <Check /> : <Copy />}
            {copied === "link" ? "Link copied" : "Copy link"}
          </Button>
          <Button
            className="bg-[#1c1712] text-primary-fg hover:bg-[#1c1712]/90"
            onClick={postToX}
          >
            <Share2 />
            {copied === "post" ? "Opening X" : "Post on X"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
