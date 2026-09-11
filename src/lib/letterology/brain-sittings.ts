import {
  ASPECT_NAME,
  BRAIN_GRADES,
  BRAIN_ITEM_COUNT,
  ITEMS,
  plusLean,
  readBrain,
  type BrainAspectId,
  type BrainChoice,
  type BrainDomainId,
  type BrainGrade,
  type BrainItemKind,
  type BrainReading,
  type BrainVerdict,
} from "./brain";

export const BRAIN_INVENTORY = "fifty-v1";

export type StoredAnswer = {
  id: string;
  kind: BrainItemKind;
  domain: BrainDomainId;
  aspect: BrainAspectId;
  choice: BrainChoice;
};

export type BrainSittingRow = {
  id: string;
  createdAt: string;
  name: string;
  guest: boolean;
  token: string;
  lean: number;
  grade: BrainGrade;
  verdict: BrainVerdict;
  title: string;
  pattern: string;
};

export type BrainSittingRecord = BrainSittingRow & {
  seed: number;
  inventory: string;
  answers: StoredAnswer[];
};

export type BrainRollSummary = {
  sittings: number;
  named: number;
  guests: number;
  verdicts: Record<BrainVerdict, number>;
  grades: Record<BrainGrade, number>;
  aspects: Array<{ id: BrainAspectId; name: string; mean: number }>;
  items: Array<{
    id: string;
    prompt: string;
    domain: BrainDomainId;
    aspect: BrainAspectId;
    kind: BrainItemKind;
    mean: number;
    plusShare: number;
  }>;
};

const CHOICES = new Set([0, 1, 2, 3, 4]);

export function isBrainChoice(value: unknown): value is BrainChoice {
  return typeof value === "number" && CHOICES.has(value);
}

export function serializeAnswers(answers: BrainChoice[]): StoredAnswer[] {
  if (answers.length !== ITEMS.length) {
    throw new Error("Sitting is the wrong length.");
  }
  return ITEMS.map((item, index) => {
    const choice = answers[index];
    if (!isBrainChoice(choice)) throw new Error("Sitting has a broken mark.");
    return {
      id: item.id,
      kind: item.kind,
      domain: item.domain,
      aspect: item.aspect,
      choice,
    };
  });
}

export function answersFromStored(stored: StoredAnswer[]): BrainChoice[] | null {
  if (!Array.isArray(stored) || stored.length !== ITEMS.length) return null;
  const byId = new Map<string, BrainChoice>();
  for (const row of stored) {
    if (!row || typeof row.id !== "string" || !isBrainChoice(row.choice)) return null;
    byId.set(row.id, row.choice);
  }
  if (byId.size !== ITEMS.length) return null;
  const answers: BrainChoice[] = [];
  for (const item of ITEMS) {
    const choice = byId.get(item.id);
    if (choice == null) return null;
    answers.push(choice);
  }
  return answers;
}

export function validateSittingAnswers(answers: unknown): BrainChoice[] | null {
  if (!Array.isArray(answers) || answers.length !== BRAIN_ITEM_COUNT) return null;
  const out: BrainChoice[] = [];
  for (const value of answers) {
    if (!isBrainChoice(value)) return null;
    out.push(value);
  }
  return out;
}

export function sittingIdOk(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function readingFromStored(record: Pick<BrainSittingRecord, "answers" | "name" | "guest">): BrainReading | null {
  const answers = answersFromStored(record.answers);
  if (!answers) return null;
  return readBrain(answers, record.guest ? undefined : record.name);
}

function emptySummary(): BrainRollSummary {
  const grades = Object.fromEntries(BRAIN_GRADES.map((grade) => [grade, 0])) as Record<BrainGrade, number>;
  return {
    sittings: 0,
    named: 0,
    guests: 0,
    verdicts: { letter: 0, circuit: 0, number: 0 },
    grades,
    aspects: (Object.keys(ASPECT_NAME) as BrainAspectId[]).map((id) => ({
      id,
      name: ASPECT_NAME[id],
      mean: 50,
    })),
    items: ITEMS.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      domain: item.domain,
      aspect: item.aspect,
      kind: item.kind,
      mean: 50,
      plusShare: 0,
    })),
  };
}

export function summarizeSittings(
  rows: Array<{ guest: boolean; grade: string; verdict: string; answers: StoredAnswer[] }>,
): BrainRollSummary {
  const summary = emptySummary();
  if (rows.length === 0) return summary;
  summary.sittings = rows.length;
  const aspectSums: Partial<Record<BrainAspectId, { sum: number; n: number }>> = {};
  const itemSums = new Map<string, { sum: number; plus: number; n: number }>();

  for (const row of rows) {
    if (row.guest) summary.guests += 1;
    else summary.named += 1;
    if (row.verdict === "letter" || row.verdict === "circuit" || row.verdict === "number") {
      summary.verdicts[row.verdict] += 1;
    }
    if (row.grade in summary.grades) {
      summary.grades[row.grade as BrainGrade] += 1;
    }
    const answers = answersFromStored(row.answers);
    if (!answers) continue;
    ITEMS.forEach((item, index) => {
      const choice = answers[index]!;
      const lean = plusLean(choice);
      if (item.kind === "trait") {
        const bucket = aspectSums[item.aspect] ?? { sum: 0, n: 0 };
        bucket.sum += lean;
        bucket.n += 1;
        aspectSums[item.aspect] = bucket;
      }
      const itemBucket = itemSums.get(item.id) ?? { sum: 0, plus: 0, n: 0 };
      itemBucket.sum += lean;
      itemBucket.n += 1;
      if (choice <= 1) itemBucket.plus += 1;
      itemSums.set(item.id, itemBucket);
    });
  }

  summary.aspects = summary.aspects.map((row) => {
    const bucket = aspectSums[row.id];
    return { ...row, mean: bucket && bucket.n ? Math.round(bucket.sum / bucket.n) : 50 };
  });
  summary.items = summary.items.map((row) => {
    const bucket = itemSums.get(row.id);
    if (!bucket || bucket.n === 0) return row;
    return {
      ...row,
      mean: Math.round(bucket.sum / bucket.n),
      plusShare: Math.round((bucket.plus / bucket.n) * 100),
    };
  });
  return summary;
}

function csvField(value: string | number | boolean): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function sittingsCsv(rows: BrainSittingRow[]): string {
  const header = ["id", "created", "name", "guest", "grade", "verdict", "lean", "title", "token"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvField(row.id),
        csvField(row.createdAt),
        csvField(row.name),
        csvField(row.guest),
        csvField(row.grade),
        csvField(row.verdict),
        csvField(row.lean),
        csvField(row.title),
        csvField(row.token),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function answersCsv(rows: Array<{ id: string; answers: StoredAnswer[] }>): string {
  const header = ["sitting", "item", "domain", "aspect", "kind", "choice"];
  const lines = [header.join(",")];
  for (const row of rows) {
    for (const answer of row.answers) {
      lines.push(
        [
          csvField(row.id),
          csvField(answer.id),
          csvField(answer.domain),
          csvField(answer.aspect),
          csvField(answer.kind),
          csvField(answer.choice),
        ].join(","),
      );
    }
  }
  return `${lines.join("\n")}\n`;
}
