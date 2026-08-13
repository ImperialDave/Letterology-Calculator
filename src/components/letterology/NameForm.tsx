import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EXAMPLES = ["@lovelace", "@baldwin", "@zora", "@octavia"];

export function NameForm({
  initial = "",
  onSubmit,
  compact = false,
}: {
  initial?: string;
  onSubmit: (name: string) => void;
  compact?: boolean;
}) {
  const [value, setValue] = useState(initial);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = value.trim();
    if (!next) return;
    onSubmit(next);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Label htmlFor="username">Your username</Label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          id="username"
          name="username"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="@lovelace"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="username-hint"
        />
        <Button type="submit" className="h-12 shrink-0 px-6">
          Read the letters
        </Button>
      </div>
      <p id="username-hint" className="mt-2 text-sm text-muted">
        The handle you live under — your username. @ is optional. Accents fold away; only A–Z are
        read.
      </p>
      {!compact ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {EXAMPLES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setValue(name);
                onSubmit(name);
              }}
              className="h-9 rounded-full bg-raised px-3.5 font-display text-xs tracking-wide text-ink shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]"
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
