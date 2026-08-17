import { createFileRoute, Link } from "@tanstack/react-router";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { AppShell } from "@/components/SiteChrome";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { letterFromMark } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import { pageCardMeta } from "@/lib/letterology/share";
import { ALPHABET } from "@/lib/letterology/types";

type Search = { tongue?: "el" };

export const Route = createFileRoute("/letters_/$mark")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tongue: search.tongue === "el" ? "el" : undefined,
  }),
  loader: ({ params }) => {
    const greek = letterFromMark(params.mark);
    const latin = ALPHABET.includes(params.mark.toUpperCase()) ? params.mark.toUpperCase() : null;
    return { mark: params.mark, greek, latin };
  },
  head: ({ loaderData }) => {
    if (loaderData?.greek) {
      const book = portraitOf(loaderData.greek);
      return pageCardMeta({
        title: `${loaderData.greek} · ${book.book.spoken}`,
        description: book.glance,
        path: `/letters/${loaderData.mark}`,
        imagePath: `/og/stoicheia-hora-${loaderData.mark}.jpg`,
      });
    }
    return pageCardMeta({
      title: loaderData?.latin ? `Letter ${loaderData.latin}` : "Letters",
      description: "A letter of the twenty-six.",
      path: `/letters/${loaderData?.mark ?? ""}`,
      imagePath: "/og.jpg",
    });
  },
  component: LetterPage,
});

function LetterPage() {
  const { greek, latin, mark } = Route.useLoaderData();
  const { tongue } = Route.useSearch();
  const preferGreek = tongue === "el" || Boolean(greek && !latin);

  if (preferGreek && greek) {
    const portrait = portraitOf(greek);
    return (
      <AppShell current="letters">
        <p>
          <Link
            to="/letters"
            search={{ tongue: "el" }}
            className="font-display text-xs tracking-[0.14em] text-muted uppercase"
          >
            All hours
          </Link>
        </p>
        <h1 className="mt-4 font-display text-5xl text-ink">
          {portrait.book.letter} · {portrait.book.spoken}
        </h1>
        <div className="mt-8">
          <LetterBookView portrait={portrait} />
        </div>
      </AppShell>
    );
  }

  if (latin) {
    return (
      <AppShell current="letters">
        <p>
          <Link to="/letters" search={{ tongue: undefined }} className="font-display text-xs tracking-[0.14em] text-muted uppercase">
            All letters
          </Link>
        </p>
        <div className="mt-6">
          <LetterDetail letter={latin} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell current="letters">
      <h1 className="font-display text-4xl text-ink">That is not a letter we keep</h1>
      <p className="mt-3 text-muted">Tried {mark}.</p>
    </AppShell>
  );
}
