import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cardImageUrl,
  portraitTitle,
  portraitUrl,
  publicSiteOrigin,
  tweetText,
  xIntentUrl,
} from "@/lib/letterology/share";
import type { Horoscope } from "@/lib/letterology/types";

export function ShareBar({ horoscope }: { horoscope: Horoscope }) {
  const [copied, setCopied] = useState<"link" | "share" | "post" | null>(null);
  const origin = publicSiteOrigin();
  const url = portraitUrl(horoscope.displayName, origin);
  const image = cardImageUrl(horoscope.displayName, origin);
  const title = portraitTitle(horoscope);
  const text = tweetText(horoscope);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("link");
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, text: text.split("\n")[0], url });
      setCopied("share");
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // user cancelled
    }
  }

  function postToX() {
    window.open(xIntentUrl(horoscope, origin), "_blank", "noopener,noreferrer");
    setCopied("post");
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <aside className="overflow-hidden rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-7">
        <img
          src={image}
          alt={title}
          width={480}
          height={252}
          className="w-full max-w-sm rounded-lg outline outline-1 -outline-offset-1 outline-primary-fg/20"
        />
        <div className="max-w-xl">
          <p className="font-display text-xs tracking-[0.22em] uppercase opacity-80">Share the portrait</p>
          <h3 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">Make it travel.</h3>
          <p className="mt-2 text-sm leading-relaxed text-primary-fg/85">
            {text.split("\n")[0]}. This is the card X will show.
          </p>
          <p className="mt-3 break-all font-display text-xs tracking-wide text-primary-fg/70">{url}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="bg-primary-fg text-primary hover:bg-primary-fg/90"
              onClick={copyLink}
            >
              {copied === "link" ? <Check /> : <Copy />}
              {copied === "link" ? "Portrait link copied" : "Copy link"}
            </Button>
            <Button
              className="bg-[#1c1712] text-primary-fg hover:bg-[#1c1712]/90"
              onClick={nativeShare}
            >
              <Share2 />
              {copied === "share" ? "Shared" : "Share"}
            </Button>
            <Button
              className="bg-[#1c1712] text-primary-fg hover:bg-[#1c1712]/90"
              onClick={postToX}
            >
              {copied === "post" ? "Opening X" : "Post on X"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
