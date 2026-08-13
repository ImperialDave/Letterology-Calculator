import { FormEvent, useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadRecent, loadRecentBonds, type RecentBond } from "@/lib/letterology/recent";

const EXAMPLES: RecentBond[] = [
  { a: "@lovelace", b: "@octavia" },
  { a: "@ada", b: "@diana" },
  { a: "@baldwin", b: "@zora" },
];

export function BondForm({
  initialA = "",
  initialB = "",
  onSubmit,
  compact = false,
}: {
  initialA?: string;
  initialB?: string;
  onSubmit: (a: string, b: string) => void;
  compact?: boolean;
}) {
  const [left, setLeft] = useState(initialA);
  const [right, setRight] = useState(initialB);
  const [recent, setRecent] = useState<string[]>([]);
  const [pairs, setPairs] = useState<RecentBond[]>([]);

  useEffect(() => {
    setLeft(initialA);
    setRight(initialB);
  }, [initialA, initialB]);

  useEffect(() => {
    setRecent(loadRecent());
    setPairs(loadRecentBonds());
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const a = left.trim();
    const b = right.trim();
    if (!a || !b) return;
    onSubmit(a, b);
  }

  function swap() {
    setLeft(right);
    setRight(left);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <Label htmlFor="bond-a">First username</Label>
          <Input
            id="bond-a"
            name="a"
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            placeholder="@lovelace"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="mt-2"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap usernames"
          className="mx-auto"
        >
          <ArrowLeftRight />
        </Button>
        <div>
          <Label htmlFor="bond-b">Second username</Label>
          <Input
            id="bond-b"
            name="b"
            value={right}
            onChange={(event) => setRight(event.target.value)}
            placeholder="@octavia"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="mt-2"
          />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Two handles. @ is optional. Accents fold away; only A–Z are read.
      </p>
      <div className="mt-4">
        <Button type="submit" className="h-12 px-6">
          Read the bond
        </Button>
      </div>
      {!compact ? (
        <div className="mt-6 space-y-4">
          <ChipRow
            label="Try a pair"
            items={EXAMPLES.map((item) => ({
              key: `${item.a}-${item.b}`,
              label: `${item.a} · ${item.b}`,
              onClick: () => {
                setLeft(item.a);
                setRight(item.b);
                onSubmit(item.a, item.b);
              },
            }))}
          />
          {recent.length > 0 ? (
            <ChipRow
              label="Fill from a recent reading"
              items={recent.map((name) => ({
                key: name,
                label: name,
                onClick: () => {
                  if (!left) setLeft(name);
                  else setRight(name);
                },
              }))}
            />
          ) : null}
          {pairs.length > 0 ? (
            <ChipRow
              label="Recent bonds"
              items={pairs.map((item) => ({
                key: `${item.a}-${item.b}`,
                label: `${item.a} · ${item.b}`,
                onClick: () => {
                  setLeft(item.a);
                  setRight(item.b);
                  onSubmit(item.a, item.b);
                },
              }))}
            />
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function ChipRow({
  label,
  items,
}: {
  label: string;
  items: { key: string; label: string; onClick: () => void }[];
}) {
  return (
    <div>
      <p className="font-display text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="h-9 rounded-full bg-raised px-3.5 font-display text-xs tracking-wide text-ink shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
