import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArchetypeCard } from "@/components/letterology/ArchetypeCard";
import { BondForm } from "@/components/letterology/BondForm";
import { DayCard } from "@/components/letterology/DayCard";
import { ShareBar } from "@/components/letterology/ShareBar";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { useHouse, useHouseHoroscope } from "@/lib/firebase/house-provider";
import { leaveHouse } from "@/lib/firebase/profile";
import { signOutHouse } from "@/lib/firebase/auth";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pageCardMeta } from "@/lib/letterology/share";

export const Route = createFileRoute("/house")({
  head: () =>
    pageCardMeta({
      title: "Your house",
      description: "Your username. Today, the Letter Path, and the comparisons you keep.",
      path: "/house",
      imagePath: "/og.jpg",
    }),
  component: HousePage,
});

function HousePage() {
  const { user, isPending } = useCurrentUserState();
  const house = useHouse();
  const horoscope = useHouseHoroscope();
  const navigate = useNavigate();

  if (!isPending && !user) return <Navigate to="/login" />;
  if (!isPending && user?.needsClaim) return <Navigate to="/claim" />;

  async function abandon() {
    if (!house.profile) return;
    if (!window.confirm("Release this handle and leave the house?")) return;
    await leaveHouse(house.profile);
    await signOutHouse();
    await house.signOut();
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader current="read" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!horoscope || !house.profile ? (
          <p className="text-muted">Opening the house…</p>
        ) : (
          <div className="space-y-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-display text-xs tracking-[0.22em] text-muted uppercase">CC33 · Your house</p>
                <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
                  {house.profile.displayHandle}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  We read the username you chose. Share the public portrait, or read today here.
                </p>
              </div>
              <Link
                to="/p/$slug"
                params={{ slug: house.profile.handle }}
                search={{ date: undefined }}
                className="inline-flex h-11 items-center font-display text-xs tracking-[0.14em] text-primary uppercase"
              >
                Open the public portrait
              </Link>
            </header>

            <DayCard horoscope={horoscope} />
            <ShareBar horoscope={horoscope} />
            <ArchetypeCard archetype={horoscope.archetype} featured />

            <section className="rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7">
              <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">Compare me</p>
              <h2 className="mt-2 font-display text-2xl text-ink">How two usernames fit</h2>
              <div className="mt-5">
                <BondForm
                  initialA={house.profile.displayHandle}
                  onSubmit={(a, b) => {
                    void navigate({ to: "/bond", search: { a, b } });
                  }}
                />
              </div>
            </section>

            {house.profile.recentBonds.length > 0 ? (
              <section>
                <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Saved bonds</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {house.profile.recentBonds.map((pair) => (
                    <li key={`${pair.a}-${pair.b}`}>
                      <Link
                        to="/bond"
                        search={{ a: pair.a, b: pair.b }}
                        className="inline-flex h-9 items-center rounded-full bg-raised px-3.5 font-display text-xs text-ink shadow-[var(--shadow-border)]"
                      >
                        {pair.a} · {pair.b}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {house.profile.recents.length > 0 ? (
              <section>
                <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">Recent readings</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {house.profile.recents.map((item) => (
                    <Link
                      key={item}
                      to="/p/$slug"
                      params={{ slug: item.replace(/^@+/, "").toLowerCase() }}
                      search={{ date: undefined }}
                      className="inline-flex h-9 items-center rounded-full bg-raised px-3.5 font-display text-xs text-ink shadow-[var(--shadow-border)]"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="border-t border-ink/10 pt-6">
              <Button variant="ghost" onClick={() => void abandon()}>
                Leave the house
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
