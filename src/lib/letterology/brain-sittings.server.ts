import { getSql } from "@/lib/db";
import {
  BRAIN_GRADES,
  encodeAnswers,
  readBrain,
  type BrainGrade,
  type BrainChoice,
  type BrainVerdict,
} from "./brain";
import {
  BRAIN_INVENTORY,
  answersFromStored,
  serializeAnswers,
  sittingIdOk,
  type BrainSittingRecord,
  type BrainSittingRow,
  type StoredAnswer,
} from "./brain-sittings";

type SittingRow = {
  id: string;
  created_at: Date | string;
  name: string;
  guest: boolean;
  user_id: string | null;
  token: string;
  seed: number;
  lean: number;
  grade: string;
  verdict: string;
  title: string;
  pattern: string;
  answers: StoredAnswer[] | string;
  inventory: string;
};

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function parseAnswers(raw: StoredAnswer[] | string): StoredAnswer[] {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredAnswer[]) : [];
  } catch {
    return [];
  }
}

function asGrade(value: string): BrainGrade {
  return (BRAIN_GRADES as readonly string[]).includes(value) ? (value as BrainGrade) : "C";
}

function asVerdict(value: string): BrainVerdict {
  if (value === "letter" || value === "circuit" || value === "number") return value;
  return "circuit";
}

function toRow(row: SittingRow): BrainSittingRow {
  return {
    id: row.id,
    createdAt: asIso(row.created_at),
    name: row.name,
    guest: Boolean(row.guest),
    token: row.token,
    lean: Number(row.lean),
    grade: asGrade(row.grade),
    verdict: asVerdict(row.verdict),
    title: row.title,
    pattern: row.pattern,
  };
}

function toRecord(row: SittingRow): BrainSittingRecord {
  return {
    ...toRow(row),
    seed: Number(row.seed),
    inventory: row.inventory,
    answers: parseAnswers(row.answers),
  };
}

export async function insertBrainSitting(input: {
  id: string;
  answers: BrainChoice[];
  name?: string;
  seed: number;
  userId: string | null;
}): Promise<{ id: string }> {
  if (!sittingIdOk(input.id)) throw new Error("Sitting id is broken.");
  if (!Number.isInteger(input.seed) || input.seed < 0) throw new Error("Seed is broken.");
  const reading = readBrain(input.answers, input.name);
  if (!reading) throw new Error("Sitting could not be read.");
  const stored = serializeAnswers(input.answers);
  const sql = await getSql();
  await sql`
    insert into brain_sittings (
      id, name, guest, user_id, token, seed, lean, grade, verdict, title, pattern, answers, inventory
    ) values (
      ${input.id},
      ${reading.name},
      ${reading.guest},
      ${input.userId},
      ${reading.token},
      ${input.seed},
      ${reading.lean},
      ${reading.grade},
      ${reading.verdict},
      ${reading.title},
      ${reading.pattern},
      ${JSON.stringify(stored)}::jsonb,
      ${BRAIN_INVENTORY}
    )
    on conflict (id) do nothing
  `;
  return { id: input.id };
}

export async function listBrainSittings(): Promise<BrainSittingRow[]> {
  const sql = await getSql();
  const rows = await sql<SittingRow>`
    select id, created_at, name, guest, user_id, token, seed, lean, grade, verdict, title, pattern, answers, inventory
    from brain_sittings
    order by created_at desc
  `;
  return rows.map(toRow);
}

export async function listBrainSittingRecords(): Promise<BrainSittingRecord[]> {
  const sql = await getSql();
  const rows = await sql<SittingRow>`
    select id, created_at, name, guest, user_id, token, seed, lean, grade, verdict, title, pattern, answers, inventory
    from brain_sittings
    order by created_at desc
  `;
  return rows.map(toRecord);
}

export async function getBrainSitting(id: string): Promise<BrainSittingRecord | null> {
  if (!sittingIdOk(id)) return null;
  const sql = await getSql();
  const rows = await sql<SittingRow>`
    select id, created_at, name, guest, user_id, token, seed, lean, grade, verdict, title, pattern, answers, inventory
    from brain_sittings
    where id = ${id}
    limit 1
  `;
  const row = rows[0];
  return row ? toRecord(row) : null;
}

export function tokenOf(answers: StoredAnswer[]): string | null {
  const canonical = answersFromStored(answers);
  return canonical ? encodeAnswers(canonical) : null;
}
