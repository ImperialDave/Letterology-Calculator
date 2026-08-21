import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AskView } from "@/components/letterology/AskView";
import { AppShell } from "@/components/SiteChrome";
import { ask, tweetAsk } from "@/lib/letterology/ask";
import { pageCardMeta } from "@/lib/letterology/share";
import { noteHandle, noteQuestion } from "@/lib/letterology/tongue";
import { useTongue } from "@/components/letterology/TongueProvider";
import { VOICE } from "@/lib/letterology/voice";

type Search = { n?: string; q?: string; tongue?: "la" | "el" };

export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    n: typeof search.n === "string" ? search.n : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    tongue: search.tongue === "el" ? "el" : search.tongue === "la" ? "la" : undefined,
  }),
  loader: ({ location }) => {
    const params = new URL(location.href, "https://www.letterology.club").searchParams;
    return {
      n: params.get("n") ?? undefined,
      q: params.get("q") ?? undefined,
    };
  },
  head: ({ loaderData }) => {
    const handle = loaderData?.n ?? "";
    const question = loaderData?.q ?? "";
    if (handle && question) {
      const reading = ask(handle, question);
      return pageCardMeta({
        title: reading ? `${reading.handle} · ${reading.verdict}` : VOICE.askTitle,
        description: reading ? tweetAsk(reading) : VOICE.askLede,
        path: `/ask?n=${encodeURIComponent(handle)}&q=${encodeURIComponent(question)}`,
        imagePath: "/og.jpg",
      });
    }
    return pageCardMeta({
      title: VOICE.askTitle,
      description: VOICE.askLede,
      path: "/ask",
      imagePath: "/og.jpg",
    });
  },
  component: AskPage,
});

function AskPage() {
  const loaded = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/ask" });
  const tongue = useTongue(search.tongue);
  const handle = loaded.n ?? search.n ?? "";
  const question = loaded.q ?? search.q ?? "";

  return (
    <AppShell current="ask">
      {tongue === "el" ? (
        <p className="mb-6 text-sm text-muted">
          Ask uses the Latin Path and today’s court. Flip to Latin for the matching atmosphere — or stay; the
          letters do not change.
        </p>
      ) : null}
      <AskView
        initialHandle={handle}
        initialQuestion={question}
        onRun={(n, q) => {
          noteHandle(n);
          noteQuestion(q);
          void navigate({ search: { n, q, tongue: tongue === "el" ? "el" : "la" } });
        }}
      />
    </AppShell>
  );
}
