import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard, openXIntent } from "@/lib/letterology/clipboard";
import { composeXPost, publicSiteOrigin } from "@/lib/letterology/share";

export function PageShare({
  path,
  caption,
  imagePath,
}: {
  path: string;
  caption: string;
  imagePath: string;
}) {
  const [copied, setCopied] = useState<"x" | "link" | null>(null);
  const origin = publicSiteOrigin();
  const url = `${origin}${path}`;
  const post = composeXPost(caption, url);

  async function copyForX() {
    if (await copyToClipboard(post.text)) {
      setCopied("x");
      window.setTimeout(() => setCopied(null), 1600);
    }
  }

  async function copyLink() {
    if (await copyToClipboard(url)) {
      setCopied("link");
      window.setTimeout(() => setCopied(null), 1600);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyForX}>
          {copied === "x" ? <Check /> : <Copy />}
          {copied === "x" ? "Copied for X" : "Copy for X"}
        </Button>
        <Button variant="ghost" size="sm" onClick={copyLink}>
          {copied === "link" ? "Link copied" : "Copy link"}
        </Button>
        <button
          type="button"
          onClick={() => openXIntent(post.href)}
          className="inline-flex h-9 items-center gap-1.5 px-3 font-display text-xs tracking-[0.14em] text-primary uppercase"
        >
          <ExternalLink className="size-3.5" />
          Post on X
        </button>
      </div>
      <img
        src={`${origin}${imagePath}`}
        alt=""
        width={160}
        height={84}
        className="hidden rounded-md outline outline-1 -outline-offset-1 outline-ink/10 sm:block"
      />
    </div>
  );
}
