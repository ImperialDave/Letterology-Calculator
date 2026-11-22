import { createServerFn } from "@tanstack/react-start";
import { logostaxAuth } from "./auth";
import { isLength, maxGuesses, type Kind } from "./engine";
import { summarizeField, puzzleSlice, type FieldReport, type FieldRow, type PuzzleSlice } from "./field";
import type { HistoryEntry } from "./history";

export type SolvePayload = {
  puzzleId: string;
  answer: string;
  length: number;
  kind: Kind;
  puzzleDate: string;
  status: "won" | "lost";
  guesses: number;
  elapsedMs: number;
  hard: boolean;
};

function bad(message: string): never {
  throw new Error(message);
}

export function parseSolve(input: unknown): SolvePayload {
  if (!input || typeof input !== "object") bad("Bad result");
  const raw = input as Partial<SolvePayload>;
  const length = raw.length;
  if (typeof length !== "number" || !isLength(length)) bad("Bad length");
  const answer = typeof raw.answer === "string" ? raw.answer.toLowerCase() : "";
  if (!/^[a-z]+$/.test(answer) || answer.length !== length) bad("Bad word");
  const guesses = raw.guesses;
  if (typeof guesses !== "number" || !Number.isInteger(guesses) || guesses < 1 || guesses > maxGuesses(length)) {
    bad("Bad guesses");
  }
  const elapsedMs = raw.elapsedMs;
  if (typeof elapsedMs !== "number" || !Number.isInteger(elapsedMs) || elapsedMs < 0 || elapsedMs > 60 * 60 * 1000) {
    bad("Bad time");
  }
  if (raw.status !== "won" && raw.status !== "lost") bad("Bad status");
  if (raw.kind !== "table" && raw.kind !== "deal") bad("Bad kind");
  const puzzleId = typeof raw.puzzleId === "string" ? raw.puzzleId : "";
  if (!puzzleId || puzzleId.length > 80) bad("Bad puzzle");
  const puzzleDate = typeof raw.puzzleDate === "string" ? raw.puzzleDate : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(puzzleDate)) bad("Bad date");
  if (raw.kind === "table" && puzzleId !== `daily:${length}:${puzzleDate}`) bad("Bad table");
  return {
    puzzleId,
    answer,
    length,
    kind: raw.kind,
    puzzleDate,
    status: raw.status,
    guesses,
    elapsedMs,
    hard: raw.hard === true,
  };
}

export function payloadFromEntry(entry: HistoryEntry): SolvePayload {
  return {
    puzzleId: entry.puzzleId,
    answer: entry.answer,
    length: entry.length,
    kind: entry.kind,
    puzzleDate: entry.date,
    status: entry.status,
    guesses: entry.guesses,
    elapsedMs: entry.elapsedMs,
    hard: entry.hard,
  };
}

async function insertSolve(userId: string, solve: SolvePayload) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const id = `${userId}:${solve.puzzleId}`;
  await sql`
    insert into solves (
      id, user_id, puzzle_id, answer, length, kind, puzzle_date, status, guesses, elapsed_ms, hard
    ) values (
      ${id},
      ${userId},
      ${solve.puzzleId},
      ${solve.answer},
      ${solve.length},
      ${solve.kind},
      ${solve.puzzleDate},
      ${solve.status},
      ${solve.guesses},
      ${solve.elapsedMs},
      ${solve.hard}
    )
    on conflict (user_id, puzzle_id) do nothing
  `;
}

export const recordSolve = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseSolve(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    await insertSolve(context.userId, data);
    return { ok: true as const };
  });

export const syncSolves = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!Array.isArray(input) || input.length > 40) bad("Bad history");
    return input.map((item) => parseSolve(item));
  })
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    for (const solve of data) await insertSolve(context.userId, solve);
    return { ok: true as const, count: data.length };
  });

export const myHistory = createServerFn({ method: "GET" })
  .middleware([logostaxAuth])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      puzzle_id: string;
      answer: string;
      length: number;
      kind: string;
      puzzle_date: string;
      status: string;
      guesses: number;
      elapsed_ms: number;
      hard: boolean;
      played_at: string;
    }>`
      select
        puzzle_id,
        answer,
        length,
        kind,
        puzzle_date,
        status,
        guesses,
        elapsed_ms,
        hard,
        to_char(played_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as played_at
      from solves
      where user_id = ${context.userId}
      order by played_at desc
      limit 80
    `;
    return rows.map((row) => ({
      puzzleId: row.puzzle_id,
      answer: row.answer,
      length: Number(row.length),
      kind: row.kind === "deal" ? "deal" : "table",
      date: String(row.puzzle_date).slice(0, 10),
      status: row.status === "lost" ? "lost" : "won",
      guesses: Number(row.guesses),
      elapsedMs: Number(row.elapsed_ms),
      hard: row.hard === true,
      at: Number.isNaN(Date.parse(row.played_at)) ? 0 : Date.parse(row.played_at),
      synced: true,
    })) satisfies HistoryEntry[];
  });

export type FieldView = FieldReport & { puzzle: PuzzleSlice };

async function groupedWins(where: "answer" | "puzzle", value: string): Promise<FieldRow[]> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const grouped =
    where === "answer"
      ? await sql<{ best_ms: number | null; best_guesses: number | null }>`
          select
            min(elapsed_ms) filter (where status = 'won') as best_ms,
            min(guesses) filter (where status = 'won') as best_guesses
          from solves
          where answer = ${value}
          group by user_id
        `
      : await sql<{ best_ms: number | null; best_guesses: number | null }>`
          select
            min(elapsed_ms) filter (where status = 'won') as best_ms,
            min(guesses) filter (where status = 'won') as best_guesses
          from solves
          where puzzle_id = ${value}
          group by user_id
        `;
  return grouped.map((row) => ({
    bestMs: row.best_ms == null ? null : Number(row.best_ms),
    bestGuesses: row.best_guesses == null ? null : Number(row.best_guesses),
  }));
}

export const fieldForWord = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") bad("Bad field");
    const raw = input as Partial<{
      answer: string;
      puzzleId: string;
      elapsedMs: number;
      guesses: number;
      won: boolean;
    }>;
    const answer = typeof raw.answer === "string" ? raw.answer.toLowerCase() : "";
    if (!/^[a-z]{3,8}$/.test(answer)) bad("Bad word");
    const puzzleId = typeof raw.puzzleId === "string" ? raw.puzzleId : "";
    if (!puzzleId || puzzleId.length > 80) bad("Bad puzzle");
    const elapsedMs = raw.elapsedMs;
    const guesses = raw.guesses;
    if (typeof elapsedMs !== "number" || typeof guesses !== "number") bad("Bad field");
    return {
      answer,
      puzzleId,
      elapsedMs: Math.max(0, Math.round(elapsedMs)),
      guesses: Math.max(1, Math.round(guesses)),
      won: raw.won === true,
    };
  })
  .middleware([logostaxAuth])
  .handler(async ({ context, data }): Promise<FieldView> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [byWord, byPuzzle, mine] = await Promise.all([
      groupedWins("answer", data.answer),
      groupedWins("puzzle", data.puzzleId),
      sql<{ word_ms: number | null; puzzle_ms: number | null }>`
        select
          min(elapsed_ms) filter (where status = 'won' and answer = ${data.answer}) as word_ms,
          min(elapsed_ms) filter (where status = 'won' and puzzle_id = ${data.puzzleId}) as puzzle_ms
        from solves
        where user_id = ${context.userId}
          and (answer = ${data.answer} or puzzle_id = ${data.puzzleId})
      `,
    ]);
    const wordRows = byWord.slice();
    const puzzleRows = byPuzzle.slice();
    const you = { elapsedMs: data.elapsedMs, guesses: data.guesses, won: data.won };
    if (data.won && mine[0]?.word_ms == null) wordRows.push({ bestMs: data.elapsedMs, bestGuesses: data.guesses });
    if (data.won && mine[0]?.puzzle_ms == null) puzzleRows.push({ bestMs: data.elapsedMs, bestGuesses: data.guesses });
    return { ...summarizeField(wordRows, you), puzzle: puzzleSlice(summarizeField(puzzleRows, you)) };
  });
