import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/space-mix/privacy")({
  head: () =>
    pageCardMeta({
      title: "Space Mix privacy",
      description: "How the Space Mix Chrome extension handles audio and settings.",
      path: "/space-mix/privacy",
      imagePath: "/og.jpg",
    }),
  component: SpaceMixPrivacyPage,
});

function SpaceMixPrivacyPage() {
  return (
    <AppShell>
      <header>
        <p className="font-display text-xs tracking-[0.14em] text-primary uppercase">Space Mix</p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">Privacy policy</h1>
        <p className="mt-3 text-sm text-muted">Effective November 7, 2026</p>
      </header>

      <div className="mt-8 space-y-8 leading-relaxed text-ink/90">
        <p>
          Space Mix is a Chrome extension. It adds a panel on x.com and twitter.com so you can mix
          your microphone with a song or a shared browser tab and send that mix into an X Space you
          joined.
        </p>

        <section>
          <h2 className="font-display text-2xl text-ink">What stays on your device</h2>
          <p className="mt-3">
            Volume, loop, and mix-or-song choices are saved in Chrome storage on your device. The
            extension does not run a server and does not send those settings anywhere.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Audio</h2>
          <p className="mt-3">
            The mix is built in the page you already have open. Your voice, a song file, or audio
            from a tab you choose is handed to the X Space through the microphone path that page
            already uses. Space Mix does not upload audio to the developer.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Sites</h2>
          <p className="mt-3">
            The extension runs on x.com and twitter.com. It needs that access so the panel can
            appear on the Space and replace the microphone track while Send to Space is on. It does
            not store or sell your posts, messages, or browsing history.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">What this extension does not do</h2>
          <p className="mt-3">
            It does not sell data. It does not use your data for advertising. It does not track you
            across other sites. It does not download remote code.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Contact</h2>
          <p className="mt-3">
            Questions about this policy:{" "}
            <a className="text-primary underline" href="mailto:SpaceMixExt@proton.me">
              SpaceMixExt@proton.me
            </a>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
