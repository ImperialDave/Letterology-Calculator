import { createServerFn } from "@tanstack/react-start";
import { levelProblems, parseLevel } from "./level";

export const saveSteppeLevel = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const level = parseLevel(input);
    if (!level) {
      const problems = input && typeof input === "object" ? levelProblems(input as never) : [];
      throw new Error(problems.length ? problems.join(", ") : "The level is incomplete.");
    }
    return level;
  })
  .handler(async ({ data }) => {
    if (process.env.NODE_ENV === "production") {
      return { ok: false as const, error: "Saving the steppe is only available while developing." };
    }
    const { writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const file = path.join(process.cwd(), "src/wild/levels/steppe.json");
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
    return { ok: true as const };
  });
