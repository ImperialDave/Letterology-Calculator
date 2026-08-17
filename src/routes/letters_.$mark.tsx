import { createFileRoute, Link } from "@tanstack/react-router";
import { LetterDetail } from "@/components/letterology/LetterDetail";
import { TongueStage } from "@/components/letterology/TongueStage";
import { AppShell } from "@/components/SiteChrome";
import { LetterBookView } from "@/components/stoicheia/LetterBook";
import { letterFromMark } from "@/lib/stoicheia/letters";
import { portraitOf } from "@/lib/stoicheia/portrait";
import { pageCardMeta } from "@/lib/letterology/share";
import { parseTongue } from "@/lib/letterology/tongue";
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
  const tongue = parseTongue(Route.useSearch().tongue);
  const book = greek ? portraitOf(greek) : null;

  return (
    <AppShell current="letters">
      <p>
        <Link
          to="/letters"
          search={{ tongue: tongue === "el" ? "el" : undefined }}
          className="font-display text-xs tracking-[0.14em] text-muted uppercase"
        >
          {tongue === "el" ? "All hours" : "All letters"}
        </Link>
      </p>
      {latin || book ? (
        <div className="mt-6">
          <TongueStage
            tongue={latin && book ? tongue : book ? "el" : "la"}
            latin={
              latin ? (
                <LetterDetail letter={latin} />
              ) : (
                <p className="text-sm text-muted">
                  {mark} is not a Latin seat. Stay with the Greek mark, or open the wheel.
                </p>
              )
            }
            greek={
              book ? (
                <div>
                  <h1 className="font-display text-5xl text-ink">
                    {book.book.letter} · {book.book.spoken}
                  </h1>
                  <div className="mt-8">
                    <LetterBookView portrait={book} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">{mark} is not one of the twenty-four.</p>
              )
            }
          />
        </div>
      ) : (
        <h1 className="mt-6 font-display text-4xl text-ink">That is not a letter we keep</h1>
      )}
    </AppShell>
  );
}
