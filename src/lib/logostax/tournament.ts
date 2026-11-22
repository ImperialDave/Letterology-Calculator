import { createServerFn } from "@tanstack/react-start";
import { logostaxAuth } from "./auth";
import { parseCode, parseCreate, parseGuess, parseJoin } from "./tournament-score";

async function sql() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export const createTournament = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCreate(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { createTable } = await import("./tournament.server");
    return createTable(await sql(), context.userId, data);
  });

export const joinTournament = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseJoin(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { joinTable } = await import("./tournament.server");
    return joinTable(await sql(), context.userId, data.code, data.player);
  });

export const startTournament = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCode(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { startTable } = await import("./tournament.server");
    return startTable(await sql(), context.userId, data);
  });

export const leaveTournament = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCode(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { leaveTable } = await import("./tournament.server");
    return leaveTable(await sql(), context.userId, data);
  });

export const forfeitTournament = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCode(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { forfeitTable } = await import("./tournament.server");
    return forfeitTable(await sql(), context.userId, data);
  });

export const submitTournamentGuess = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseGuess(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { submitGuess } = await import("./tournament.server");
    return submitGuess(await sql(), context.userId, data);
  });

export const readTournament = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCode(input))
  .middleware([logostaxAuth])
  .handler(async ({ context, data }) => {
    const { readTable } = await import("./tournament.server");
    return readTable(await sql(), context.userId, data);
  });

export const listMyTournaments = createServerFn({ method: "GET" })
  .middleware([logostaxAuth])
  .handler(async ({ context }) => {
    const { listTables } = await import("./tournament.server");
    return listTables(await sql(), context.userId);
  });
