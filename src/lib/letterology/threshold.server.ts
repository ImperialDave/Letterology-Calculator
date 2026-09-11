import { getSql } from "@/lib/db";
import {
  THRESHOLD_INVENTORY,
  scoreThresholdAxes,
  sittingIdOk,
  type ThresholdAxes,
  type ThresholdPayload,
  type ThresholdRecord,
} from "./threshold";

type Row = {
  id: string;
  created_at: Date | string;
  handle: string;
  house: string;
  hours: string;
  user_id: string | null;
  written: Record<string, string> | string;
  scales: Record<string, number> | string;
  scenes: Record<string, string> | string;
  axes: ThresholdAxes | string;
  inventory: string;
};

function asIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function asObject<T>(raw: T | string): T {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function toRecord(row: Row): ThresholdRecord {
  return {
    id: row.id,
    createdAt: asIso(row.created_at),
    handle: row.handle,
    house: row.house,
    hours: row.hours,
    userId: row.user_id,
    written: asObject(row.written),
    scales: asObject(row.scales),
    scenes: asObject(row.scenes),
    axes: asObject(row.axes),
    inventory: row.inventory,
  };
}

export async function insertThresholdSitting(input: ThresholdPayload & { userId: string | null }): Promise<{ id: string }> {
  const axes = scoreThresholdAxes(input.scales);
  const sql = await getSql();
  await sql`
    insert into threshold_sittings (
      id, handle, house, hours, user_id, written, scales, scenes, axes, inventory
    ) values (
      ${input.id},
      ${input.handle},
      ${input.house},
      ${input.hours},
      ${input.userId},
      ${JSON.stringify(input.written)}::jsonb,
      ${JSON.stringify(input.scales)}::jsonb,
      ${JSON.stringify(input.scenes)}::jsonb,
      ${JSON.stringify(axes)}::jsonb,
      ${THRESHOLD_INVENTORY}
    )
    on conflict (id) do nothing
  `;
  return { id: input.id };
}

export async function listThresholdSittings(): Promise<ThresholdRecord[]> {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, created_at, handle, house, hours, user_id, written, scales, scenes, axes, inventory
    from threshold_sittings
    order by created_at desc
  `;
  return rows.map(toRecord);
}

export async function getThresholdSitting(id: string): Promise<ThresholdRecord | null> {
  if (!sittingIdOk(id)) return null;
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, created_at, handle, house, hours, user_id, written, scales, scenes, axes, inventory
    from threshold_sittings
    where id = ${id}
    limit 1
  `;
  const row = rows[0];
  return row ? toRecord(row) : null;
}
