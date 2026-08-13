import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard, openXIntent } from "@/lib/letterology/clipboard";
import {
  cardImageUrl,
  composeXPost,
  portraitTitle,
  portraitUrl,
  publicSiteOrigin,
  tweetText,
} from "@/lib/letterology/share";
import type { Horoscope } from "@/lib/letterology/types";

export function ShareBar({ horoscope }: { horoscope: Horoscope }) {
  const origin = publicSiteOrigin();
  const url = portraitUrl(horoscope.displayName, origin);
  const image = cardImageUrl(horoscope.displayName, origin);
  const title = portraitTitle(horoscope);
  const post = composeXPost(tweetText(horoscope), url);
  const [copied, setCopied] = useState<"x" | "link" | "share" | "post" | null>(null);

  async function mark(kind: "x" | "link" | "share" | "post") {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function copyForX() {
    if (await copyToClipboard(post.text)) await mark("x");
  }

  async function copyLink() {
    if (await copyToClipboard(url)) await mark("link");
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") {
      await copyForX();
      return;
    }
    try {
      await navigator.share({ title, text: post.caption, url });
      await mark("share");
    } catch {
      // user cancelled
    }
  }

  function postToX() {
    openXIntent(post.href);
    void mark("post");
  }

  return (
    <aside className="overflow-hidden rounded-xl bg-primary text-primary-fg shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-stretch sm:p-7">
        <img
          src={image}
          alt={title}
          width={480}
          height={252}
          className="w-full max-w-sm rounded-lg outline outline-1 -outline-offset-1 outline-primary-fg/20"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.22em] uppercase opacity-80">Share the portrait</p>
            <h3 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">Make it travel.</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-fg/85">
              Copy this post, or open X. The card is the picture — the words sit above it.
            </p>
          </div>
          <figure className="mt-4 rounded-lg bg-primary-fg/10 px-4 py-3 outline outline-1 -outline-offset-1 outline-primary-fg/15">
            <figcaption className="font-display text-[0.65rem] tracking-[0.18em] text-primary-fg/65 uppercase">
              What X will receive
            </figcaption>
            <p className="mt-2 whitespace-pre-wrap font-display text-sm leading-relaxed text-primary-fg">
              {post.caption}
            </p>
            <p className="mt-3 break-all font-display text-xs tracking-wide text-primary-fg/70">{url}</p>
          </figure>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="bg-primary-fg text-primary hover:bg-primary-fg/90"
              onClick={copyForX}
            >
              {copied === "x" ? <Check /> : <Copy />}
              {copied === "x" ? "Copied for X" : "Copy for X"}
            </Button>
            <Button
              variant="outline"
              className="bg-primary-fg/15 text-primary-fg hover:bg-primary-fg/25"
              onClick={copyLink}
            >
              {copied === "link" ? "Link copied" : "Copy link"}
            </Button>
            <Button className="bg-[#1c1712] text-primary-fg hover:bg-[#1c1712]/90" onClick={nativeShare}>
              <Share2 />
              {copied === "share" ? "Shared" : "Share"}
            </Button>
            <Button className="bg-[#1c1712] text-primary-fg hover:bg-[#1c1712]/90" onClick={postToX}>
              <ExternalLink />
              {copied === "post" ? "Opening X" : "Post on X"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
