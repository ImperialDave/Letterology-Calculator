import { randomInt } from "node:crypto";
import type { Sql } from "@/lib/db";
import { maxGuesses } from "./engine";
import {
  cleanLabel,
  makeCode,
  marksFor,
  pickDistinct,
  rankTable,
  type FinishedRound,
  type PlayStatus,
  type RoundCell,
  type TableStatus,
  type TableSummary,
  type TableView,
} from "./tournament-score";

type Lexicon = { answers: string[]; guess: Set<string> };

const globalLex = globalThis as typeof globalThis & { __logostaxLex?: Map<number, Lexicon> };

function fail(message: string): never {
  throw new Error(message);
}

function asGuesses(value: unknown): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? safeParse(value) : [];
  return list.filter((word): word is string => typeof word === "string");
}

function safeParse(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function asStatus(value: unknown): PlayStatus {
  if (value === "won" || value === "lost") return value;
  return "playing";
}

function asTableStatus(value: unknown): TableStatus {
  if (value === "live" || value === "done") return value;
  return "lobby";
}

async function lexicon(length: number): Promise<Lexicon> {
  globalLex.__logostaxLex ??= new Map();
  const hit = globalLex.__logostaxLex.get(length);
  if (hit) return hit;
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const candidates = [
    join(process.cwd(), "public", "logostax", "lexicon", `${length}.json`),
    join(process.cwd(), ".output", "public", "logostax", "lexicon", `${length}.json`),
    join(process.cwd(), ".vercel", "output", "static", "logostax", "lexicon", `${length}.json`),
  ];
  let text = "";
  for (const path of candidates) {
    try {
      text = await readFile(path, "utf8");
      break;
    } catch {
      text = "";
    }
  }
  if (!text) {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const res = await fetch(new URL(`/logostax/lexicon/${length}.json`, new URL(req.url).origin));
    if (!res.ok) fail("The word list didn't load.");
    text = await res.text();
  }
  const data = JSON.parse(text) as { answers?: unknown; guesses?: unknown };
  if (!Array.isArray(data.answers) || typeof data.guesses !== "string") fail("The word list was unreadable.");
  const answers = data.answers.filter((word): word is string => typeof word === "string" && word.length === length);
  if (answers.length === 0) fail("The word list was empty.");
  const guess = new Set<string>();
  for (const word of data.guesses.split("\n")) {
    if (word.length === length) guess.add(word);
  }
  for (const word of answers) guess.add(word);
  const lex = { answers, guess };
  globalLex.__logostaxLex.set(length, lex);
  return lex;
}



type PlayerRow = { user_id: string; display_name: string; joined_at: string };
type PlayRow = {
  user_id: string;
  round_index: number;
  guesses: unknown;
  status: string;
  elapsed_ms: number;
};
type RoundRow = { round_index: number; answer: string };
type TableRow = {
  id: string;
  host_id: string;
  title: string;
  seats: number;
  rounds: number;
  length: number;
  status: string;
};

async function loadTable(sql: Sql, code: string): Promise<TableRow | null> {
  const rows = await sql<TableRow>`
    select id, host_id, title, seats, rounds, length, status
    from tournaments
    where id = ${code}
  `;
  return rows[0] ?? null;
}

async function settle(sql: Sql, code: string): Promise<void> {
  await sql`
    update tournaments t
    set status = 'done'
    where t.id = ${code}
      and t.status = 'live'
      and exists (select 1 from tournament_plays p where p.tournament_id = t.id)
      and not exists (
        select 1 from tournament_plays p
        where p.tournament_id = t.id and p.status = 'playing'
      )
  `;
}

export async function buildView(
  sql: Sql,
  userId: string,
  code: string,
  justRound: number | null,
): Promise<TableView> {
  await settle(sql, code);
  const table = await loadTable(sql, code);
  if (!table) fail("No table with that code.");
  const players = await sql<PlayerRow>`
    select user_id, display_name, joined_at
    from tournament_players
    where tournament_id = ${code}
    order by joined_at asc, user_id asc
  `;
  if (!players.some((player) => player.user_id === userId)) fail("You're not at this table.");
  const plays = await sql<PlayRow>`
    select
      user_id,
      round_index,
      guesses,
      status,
      case
        when status <> 'playing' then elapsed_ms
        when started_at is null then 0
        else least(3600000, greatest(0, floor(extract(epoch from (now() - started_at)) * 1000)::int))
      end as elapsed_ms
    from tournament_plays
    where tournament_id = ${code}
  `;
  const rounds = await sql<RoundRow>`
    select round_index, answer
    from tournament_rounds
    where tournament_id = ${code}
    order by round_index asc
  `;
  const answers = new Map(rounds.map((round) => [Number(round.round_index), round.answer]));
  const byUser = new Map<string, Map<number, PlayRow>>();
  for (const play of plays) {
    const bucket = byUser.get(play.user_id) ?? new Map();
    bucket.set(Number(play.round_index), play);
    byUser.set(play.user_id, bucket);
  }
  const mine = byUser.get(userId) ?? new Map();
  const words: (string | null)[] = Array.from({ length: Number(table.rounds) }, (_, index) => {
    const play = mine.get(index);
    if (!play || play.status === "playing") return null;
    return answers.get(index) ?? null;
  });
  const cellsFor = (id: string): RoundCell[] =>
    Array.from({ length: Number(table.rounds) }, (_, index) => {
      const play = byUser.get(id)?.get(index);
      if (!play) return { status: "playing", guesses: 0, elapsedMs: 0 };
      return {
        status: asStatus(play.status),
        guesses: asGuesses(play.guesses).length,
        elapsedMs: Number(play.elapsed_ms) || 0,
      };
    });
  const roster = players.map((player) => ({
    userId: player.user_id,
    name: player.display_name,
    you: player.user_id === userId,
    host: player.user_id === table.host_id,
  }));
  const standings =
    table.status === "lobby"
      ? []
      : rankTable(
          roster.map((player) => ({ ...player, rounds: cellsFor(player.userId) })),
          Number(table.length),
        );
  const playingIndex = cellsFor(userId).findIndex((cell) => cell.status === "playing");
  const boardIndex = playingIndex >= 0 ? playingIndex : null;
  const boardPlay = boardIndex == null ? null : mine.get(boardIndex);
  const boardGuesses = boardPlay ? asGuesses(boardPlay.guesses) : [];
  const boardAnswer = boardIndex == null ? null : answers.get(boardIndex) ?? null;
  let justFinished: FinishedRound | null = null;
  if (justRound != null) {
    const play = mine.get(justRound);
    const answer = answers.get(justRound);
    if (play && answer && play.status !== "playing") {
      justFinished = {
        roundIndex: justRound,
        answer,
        status: asStatus(play.status) === "won" ? "won" : "lost",
        guesses: marksFor(asGuesses(play.guesses), answer),
      };
    }
  }
  return {
    code: table.id,
    title: table.title,
    seats: Number(table.seats),
    rounds: Number(table.rounds),
    length: Number(table.length),
    status: asTableStatus(table.status),
    youAreHost: table.host_id === userId,
    players: roster,
    board:
      boardIndex == null || !boardPlay
        ? null
        : {
            roundIndex: boardIndex,
            guesses: boardAnswer ? marksFor(boardGuesses, boardAnswer) : boardGuesses.map((word) => ({ word, marks: [] })),
            status: "playing",
            answer: null,
            elapsedMs: Number(boardPlay.elapsed_ms) || 0,
          },
    words,
    standings,
    justFinished,
  };
}

export async function createTable(
  sql: Sql,
  userId: string,
  input: { title: string; seats: number; rounds: number; length: number; player: string },
): Promise<TableView> {
  const name = cleanLabel(input.player, "Player", 24);
  let code = "";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    code = makeCode((span) => randomInt(span));
    const inserted = await sql<{ id: string }>`
      insert into tournaments (id, host_id, title, seats, rounds, length, status)
      values (${code}, ${userId}, ${input.title}, ${input.seats}, ${input.rounds}, ${input.length}, 'lobby')
      on conflict (id) do nothing
      returning id
    `;
    if (inserted.length > 0) break;
    code = "";
  }
  if (!code) fail("Couldn't open a table. Try again.");
  await sql`
    insert into tournament_players (tournament_id, user_id, display_name)
    values (${code}, ${userId}, ${name})
  `;
  return buildView(sql, userId, code, null);
}

export async function joinTable(sql: Sql, userId: string, code: string, player: string): Promise<TableView> {
  const name = cleanLabel(player, "Player", 24);
  const existing = await loadTable(sql, code);
  if (!existing) fail("No table with that code.");
  const already = await sql<{ user_id: string }>`
    select user_id from tournament_players where tournament_id = ${code} and user_id = ${userId}
  `;
  if (already.length > 0) {
    await sql`
      update tournament_players
      set display_name = ${name}
      where tournament_id = ${code} and user_id = ${userId}
    `;
    return buildView(sql, userId, code, null);
  }
  if (existing.status === "live") fail("That table already started.");
  if (existing.status === "done") fail("That table is over.");
  const joined = await sql<{ user_id: string }>`
    with locked as (
      select id, seats
      from tournaments
      where id = ${code} and status = 'lobby'
      for update
    ),
    filled as (
      select count(*)::int as n
      from tournament_players
      where tournament_id = ${code}
    )
    insert into tournament_players (tournament_id, user_id, display_name)
    select locked.id, ${userId}, ${name}
    from locked, filled
    where filled.n < locked.seats
    on conflict (tournament_id, user_id) do nothing
    returning user_id
  `;
  if (joined.length === 0) {
    const again = await loadTable(sql, code);
    if (again?.status !== "lobby") fail("That table already started.");
    fail("That table is full.");
  }
  return buildView(sql, userId, code, null);
}

export async function startTable(sql: Sql, userId: string, code: string): Promise<TableView> {
  const table = await loadTable(sql, code);
  if (!table) fail("No table with that code.");
  if (table.host_id !== userId) fail("Only the host can start.");
  if (table.status === "live" || table.status === "done") return buildView(sql, userId, code, null);
  const countRows = await sql<{ n: number }>`
    select count(*)::int as n from tournament_players where tournament_id = ${code}
  `;
  const filled = Number(countRows[0]?.n ?? 0);
  if (filled < 2) fail("Need at least two players.");
  const lex = await lexicon(Number(table.length));
  const words = pickDistinct(lex.answers, Number(table.rounds), (span) => randomInt(span));
  if (words.length !== Number(table.rounds)) fail("Not enough words for that table.");
  const payload = JSON.stringify(words.map((answer, roundIndex) => ({ round_index: roundIndex, answer })));
  const started = await sql<{ id: string }>`
    with locked as (
      select id, seats
      from tournaments
      where id = ${code} and host_id = ${userId} and status = 'lobby'
      for update
    ),
    filled as (
      select count(*)::int as n
      from tournament_players
      where tournament_id = (select id from locked)
    ),
    ready as (
      select locked.id
      from locked, filled
      where filled.n >= 2 and filled.n <= locked.seats
    ),
    ins as (
      insert into tournament_rounds (tournament_id, round_index, answer)
      select ready.id, x.round_index, x.answer
      from ready
      join jsonb_to_recordset(${payload}::jsonb) as x(round_index int, answer text) on true
      returning tournament_id, round_index
    ),
    marked as (
      update tournaments t
      set status = 'live', started_at = now()
      where t.id = (select id from ready)
        and (select count(*) from ins) > 0
      returning t.id
    )
    insert into tournament_plays (tournament_id, user_id, round_index)
    select marked.id, p.user_id, ins.round_index
    from marked
    join tournament_players p on p.tournament_id = marked.id
    join ins on ins.tournament_id = marked.id
    on conflict (tournament_id, user_id, round_index) do nothing
    returning tournament_id as id
  `;
  if (started.length === 0) {
    const again = await loadTable(sql, code);
    if (again?.status === "live" || again?.status === "done") return buildView(sql, userId, code, null);
    fail("Couldn't start the table.");
  }
  return buildView(sql, userId, code, null);
}

export async function leaveTable(sql: Sql, userId: string, code: string): Promise<{ closed: boolean }> {
  const table = await loadTable(sql, code);
  if (!table) return { closed: true };
  if (table.status !== "lobby") fail("The words are already out. Forfeit if you want to leave.");
  if (table.host_id === userId) {
    await sql`delete from tournaments where id = ${code} and host_id = ${userId} and status = 'lobby'`;
    return { closed: true };
  }
  await sql`
    delete from tournament_players
    where tournament_id = ${code} and user_id = ${userId}
  `;
  return { closed: true };
}

export async function forfeitTable(sql: Sql, userId: string, code: string): Promise<TableView> {
  const table = await loadTable(sql, code);
  if (!table) fail("No table with that code.");
  if (table.status !== "live") fail("This table isn't in progress.");
  await sql`
    update tournament_plays
    set
      status = 'lost',
      finished_at = now(),
      elapsed_ms = case
        when started_at is null then 0
        else least(3600000, greatest(0, floor(extract(epoch from (now() - started_at)) * 1000)::int))
      end
    where tournament_id = ${code} and user_id = ${userId} and status = 'playing'
  `;
  return buildView(sql, userId, code, null);
}

export async function submitGuess(
  sql: Sql,
  userId: string,
  input: { code: string; round: number; guess: string },
): Promise<TableView> {
  const table = await loadTable(sql, input.code);
  if (!table) fail("No table with that code.");
  if (table.status === "done") fail("That table is over.");
  if (table.status !== "live") fail("That table hasn't started.");
  if (input.guess.length !== Number(table.length)) fail(`Need ${table.length} letters`);
  const plays = await sql<{ round_index: number; guesses: unknown; status: string }>`
    select round_index, guesses, status
    from tournament_plays
    where tournament_id = ${input.code} and user_id = ${userId}
    order by round_index asc
  `;
  if (plays.length === 0) fail("You're not at this table.");
  const current = plays.find((play) => play.status === "playing");
  if (!current) fail("You've already finished this table.");
  if (Number(current.round_index) !== input.round) fail("Play the words in order.");
  const prior = asGuesses(current.guesses);
  if (prior.includes(input.guess)) fail("Already tried");
  const lex = await lexicon(Number(table.length));
  if (!lex.guess.has(input.guess)) fail("Not in the word list");
  const cap = maxGuesses(Number(table.length));
  const updated = await sql<{ status: string }>`
    update tournament_plays p
    set
      guesses = p.guesses || to_jsonb(${input.guess}::text),
      started_at = coalesce(p.started_at, now()),
      status = case
        when ${input.guess} = r.answer then 'won'
        when jsonb_array_length(p.guesses) + 1 >= ${cap} then 'lost'
        else 'playing'
      end,
      finished_at = case
        when ${input.guess} = r.answer or jsonb_array_length(p.guesses) + 1 >= ${cap} then now()
        else null
      end,
      elapsed_ms = case
        when ${input.guess} = r.answer or jsonb_array_length(p.guesses) + 1 >= ${cap}
          then least(
            3600000,
            greatest(0, floor(extract(epoch from (now() - coalesce(p.started_at, now()))) * 1000)::int)
          )
        else p.elapsed_ms
      end
    from tournament_rounds r
    where p.tournament_id = ${input.code}
      and p.user_id = ${userId}
      and p.round_index = ${input.round}
      and r.tournament_id = p.tournament_id
      and r.round_index = p.round_index
      and p.status = 'playing'
      and not (p.guesses @> to_jsonb(${input.guess}::text))
    returning p.status
  `;
  if (updated.length === 0) fail("That guess didn't land. Try again.");
  const finished = updated[0]?.status === "won" || updated[0]?.status === "lost";
  return buildView(sql, userId, input.code, finished ? input.round : null);
}

export async function readTable(sql: Sql, userId: string, code: string): Promise<TableView> {
  return buildView(sql, userId, code, null);
}

export async function listTables(sql: Sql, userId: string): Promise<TableSummary[]> {
  const rows = await sql<{
    id: string;
    title: string;
    status: string;
    seats: number;
    rounds: number;
    length: number;
    filled: number;
  }>`
    select
      t.id,
      t.title,
      t.status,
      t.seats,
      t.rounds,
      t.length,
      (select count(*)::int from tournament_players p where p.tournament_id = t.id) as filled
    from tournaments t
    join tournament_players me on me.tournament_id = t.id and me.user_id = ${userId}
    where t.status in ('lobby', 'live')
    order by t.created_at desc
    limit 8
  `;
  return rows.map((row) => ({
    code: row.id,
    title: row.title,
    status: row.status === "live" ? "live" : "lobby",
    seats: Number(row.seats),
    filled: Number(row.filled),
    rounds: Number(row.rounds),
    length: Number(row.length),
  }));
}
