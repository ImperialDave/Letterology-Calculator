import { Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const LINKS = [
  { to: "/stoicheia", label: "Name" },
  { to: "/stoicheia/hymn", label: "Hymn" },
  { to: "/stoicheia/horae", label: "Horae" },
  { to: "/stoicheia/isopsephy", label: "Isopsephy" },
  { to: "/stoicheia/xenia", label: "Xenia" },
  { to: "/stoicheia/calendar", label: "Calendar" },
  { to: "/stoicheia/doctrine", label: "Doctrine" },
] as const;

export function StoicheiaFrame({
  current,
  children,
}: {
  current: (typeof LINKS)[number]["label"];
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <SiteHeader current="stoicheia" />
      <div className="border-b border-ink/10">
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-1 px-4 py-2 sm:px-6">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex h-9 items-center px-2 font-display text-xs tracking-[0.14em] uppercase",
                current === item.label ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
