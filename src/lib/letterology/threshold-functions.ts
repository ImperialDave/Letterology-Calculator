import { createServerFn } from "@tanstack/react-start";
import { brainAdminMiddleware, optionalFirebaseMiddleware } from "@/lib/firebase/brain-admin-middleware";
import { gradeMembership, sittingIdOk, thresholdAnswersCsv, thresholdCsv, validateThresholdPayload } from "./threshold";

export const submitThresholdSitting = createServerFn({ method: "POST" })
  .middleware([optionalFirebaseMiddleware])
  .validator((input: unknown) => {
    const payload = validateThresholdPayload(input);
    if (!payload) throw new Error("Threshold is incomplete.");
    return payload;
  })
  .handler(async ({ data, context }) => {
    const { insertThresholdSitting } = await import("./threshold.server");
    return insertThresholdSitting({ ...data, userId: context.userId ?? null });
  });

export const loadThresholdRoll = createServerFn({ method: "POST" })
  .middleware([brainAdminMiddleware])
  .handler(async () => {
    const { listThresholdSittings } = await import("./threshold.server");
    const records = await listThresholdSittings();
    return {
      sittings: records.map((row) => {
        const grade = gradeMembership(row);
        return {
          id: row.id,
          createdAt: row.createdAt,
          handle: row.handle,
          house: row.house,
          hours: row.hours,
          axes: row.axes,
          mark: grade.mark,
          markName: grade.markName,
        };
      }),
    };
  });

export const loadThresholdSitting = createServerFn({ method: "POST" })
  .middleware([brainAdminMiddleware])
  .validator((id: string) => {
    if (typeof id !== "string" || !sittingIdOk(id)) throw new Error("Sitting is broken.");
    return id;
  })
  .handler(async ({ data: id }) => {
    const { getThresholdSitting } = await import("./threshold.server");
    return getThresholdSitting(id);
  });

export const downloadThresholdCsv = createServerFn({ method: "POST" })
  .middleware([brainAdminMiddleware])
  .handler(async () => {
    const { listThresholdSittings } = await import("./threshold.server");
    return { csv: thresholdCsv(await listThresholdSittings()), filename: "threshold-roll.csv" };
  });

export const downloadThresholdAnswersCsv = createServerFn({ method: "POST" })
  .middleware([brainAdminMiddleware])
  .handler(async () => {
    const { listThresholdSittings } = await import("./threshold.server");
    return { csv: thresholdAnswersCsv(await listThresholdSittings()), filename: "threshold-answers.csv" };
  });
