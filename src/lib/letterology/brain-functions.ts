import { createServerFn } from "@tanstack/react-start";
import { brainAdminMiddleware, optionalFirebaseMiddleware } from "@/lib/firebase/brain-admin-middleware";
import { isBrainAdminEmail } from "./brain-admin";
import { answersCsv, sittingsCsv, sittingIdOk, summarizeSittings, validateSittingAnswers } from "./brain-sittings";

export const probeBrainAdmin = createServerFn({ method: "GET" })
  .middleware([optionalFirebaseMiddleware])
  .handler(async ({ context }) => {
    const token = context.idToken;
    if (!token) return { admin: false };
    try {
      const { verifyFirebaseIdToken } = await import("@/lib/firebase/id-token.server");
      const claims = await verifyFirebaseIdToken(token);
      if (!claims.email || !claims.emailVerified) return { admin: false };
      return { admin: isBrainAdminEmail(claims.email) };
    } catch {
      return { admin: false };
    }
  });

export const submitBrainSitting = createServerFn({ method: "POST" })
  .middleware([optionalFirebaseMiddleware])
  .validator((input: { id: string; answers: number[]; name?: string; seed: number }) => {
    if (!input || typeof input !== "object") throw new Error("Sitting is broken.");
    if (typeof input.id !== "string" || !sittingIdOk(input.id)) throw new Error("Sitting is broken.");
    const answers = validateSittingAnswers(input.answers);
    if (!answers) throw new Error("Sitting is broken.");
    if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 0xffffffff) {
      throw new Error("Sitting is broken.");
    }
    const name = typeof input.name === "string" ? input.name : undefined;
    return { id: input.id, answers, name, seed: input.seed };
  })
  .handler(async ({ data, context }) => {
    const { insertBrainSitting } = await import("./brain-sittings.server");
    return insertBrainSitting({
      id: data.id,
      answers: data.answers,
      name: data.name,
      seed: data.seed,
      userId: context.userId ?? null,
    });
  });

export const loadBrainRoll = createServerFn({ method: "GET" })
  .middleware([brainAdminMiddleware])
  .handler(async () => {
    const { listBrainSittingRecords } = await import("./brain-sittings.server");
    const records = await listBrainSittingRecords();
    return {
      summary: summarizeSittings(records),
      sittings: records.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        name: row.name,
        guest: row.guest,
        token: row.token,
        lean: row.lean,
        grade: row.grade,
        verdict: row.verdict,
        title: row.title,
        pattern: row.pattern,
      })),
    };
  });

export const loadBrainSitting = createServerFn({ method: "GET" })
  .middleware([brainAdminMiddleware])
  .validator((id: string) => {
    if (typeof id !== "string" || !sittingIdOk(id)) throw new Error("Sitting is broken.");
    return id;
  })
  .handler(async ({ data: id }) => {
    const { getBrainSitting } = await import("./brain-sittings.server");
    const { readingFromStored } = await import("./brain-sittings");
    const record = await getBrainSitting(id);
    if (!record) return null;
    return { record, reading: readingFromStored(record) };
  });

export const downloadBrainSittingsCsv = createServerFn({ method: "GET" })
  .middleware([brainAdminMiddleware])
  .handler(async () => {
    const { listBrainSittings } = await import("./brain-sittings.server");
    return { csv: sittingsCsv(await listBrainSittings()), filename: "portrait-roll.csv" };
  });

export const downloadBrainAnswersCsv = createServerFn({ method: "GET" })
  .middleware([brainAdminMiddleware])
  .handler(async () => {
    const { listBrainSittingRecords } = await import("./brain-sittings.server");
    const records = await listBrainSittingRecords();
    return {
      csv: answersCsv(records.map((row) => ({ id: row.id, answers: row.answers }))),
      filename: "portrait-answers.csv",
    };
  });
