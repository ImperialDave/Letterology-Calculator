import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, createSign } from "node:crypto";
import { isBrainAdminEmail, parseAdminEmails } from "./brain-admin";
import {
  BRAIN_ITEM_COUNT,
  ITEMS,
  encodeAnswers,
  plusLean,
  readBrain,
  type BrainChoice,
} from "./brain";
import {
  answersCsv,
  answersFromStored,
  serializeAnswers,
  sittingIdOk,
  sittingsCsv,
  summarizeSittings,
  validateSittingAnswers,
  type StoredAnswer,
} from "./brain-sittings";
import { assertFirebaseClaims, verifyFirebaseIdToken } from "../firebase/id-token.server";
import { FORBIDDEN_UI, VOICE } from "./voice";

function fill(choice: BrainChoice): BrainChoice[] {
  return Array.from({ length: BRAIN_ITEM_COUNT }, () => choice);
}

function lookingToward(letter: boolean): BrainChoice[] {
  return ITEMS.map((item) => {
    if (item.kind !== "looking") return 2;
    return letter ? 0 : 4;
  }) as BrainChoice[];
}

test("serialize answers by item id, not position", () => {
  const answers = fill(0).map((_, i) => (i % 5) as BrainChoice);
  const stored = serializeAnswers(answers);
  assert.equal(stored.length, ITEMS.length);
  assert.deepEqual(
    stored.map((row) => row.id),
    ITEMS.map((item) => item.id),
  );
  const shuffled: StoredAnswer[] = [...stored].reverse();
  assert.deepEqual(answersFromStored(shuffled), answers);
  assert.equal(encodeAnswers(answersFromStored(shuffled)!), encodeAnswers(answers));
});

test("validateSittingAnswers rejects short, long, and non-canonical marks", () => {
  assert.equal(validateSittingAnswers([0, 1]), null);
  assert.equal(validateSittingAnswers(fill(2).concat(2)), null);
  assert.equal(validateSittingAnswers(fill(2).map(() => 5)), null);
  assert.deepEqual(validateSittingAnswers(fill(3)), fill(3));
});

test("all-Letter looking answers still read A+ after serialize", () => {
  const answers = lookingToward(true);
  const stored = serializeAnswers(answers);
  const back = answersFromStored(stored);
  assert.ok(back);
  const reading = readBrain(back, "Ada");
  assert.ok(reading);
  assert.equal(reading.grade, "A+");
  assert.equal(reading.verdict, "letter");
});

test("all-number looking answers still read F after serialize", () => {
  const answers = lookingToward(false);
  const reading = readBrain(answersFromStored(serializeAnswers(answers))!, "Ada");
  assert.ok(reading);
  assert.equal(reading.grade, "F");
  assert.equal(reading.verdict, "number");
});

test("item heat uses canonical plus-on-zero, not the flipped display", () => {
  const answers = lookingToward(true);
  const summary = summarizeSittings([
    { guest: true, grade: "A+", verdict: "letter", answers: serializeAnswers(answers) },
  ]);
  assert.equal(summary.sittings, 1);
  assert.equal(summary.guests, 1);
  assert.equal(summary.named, 0);
  assert.equal(summary.verdicts.letter, 1);
  assert.equal(summary.grades["A+"], 1);
  const looking = summary.items.filter((row) => row.kind === "looking");
  assert.equal(looking.length, 10);
  for (const row of looking) {
    assert.equal(row.mean, plusLean(0));
    assert.equal(row.plusShare, 100);
  }
});

test("an empty roll does not pretend there are sittings", () => {
  const summary = summarizeSittings([]);
  assert.equal(summary.sittings, 0);
  assert.equal(summary.grades.A, 0);
  assert.equal(summary.items.length, ITEMS.length);
});

test("csv writes a header and one row per sitting or answer", () => {
  const answers = serializeAnswers(fill(2));
  const sittings = sittingsCsv([
    {
      id: "11111111-1111-4111-8111-111111111111",
      createdAt: "2026-09-10T12:00:00.000Z",
      name: "Ada",
      guest: false,
      token: encodeAnswers(fill(2)),
      lean: 50,
      grade: "C",
      verdict: "circuit",
      title: "Circuit-kept",
      pattern: "close",
    },
  ]);
  assert.match(sittings, /^id,created,name,guest,grade,verdict,lean,title,token\n/);
  assert.match(sittings, /Ada/);
  const long = answersCsv([{ id: "11111111-1111-4111-8111-111111111111", answers }]);
  assert.match(long, /^sitting,item,domain,aspect,kind,choice\n/);
  assert.equal(long.trim().split("\n").length, ITEMS.length + 1);
});

test("sitting ids accept a UUID and reject junk", () => {
  assert.equal(sittingIdOk(crypto.randomUUID()), true);
  assert.equal(sittingIdOk("nope"), false);
  assert.equal(sittingIdOk("c".repeat(50)), false);
});

test("admin allowlist is trimmed, lowercased, and empty when unset", () => {
  assert.equal(parseAdminEmails(undefined).size, 0);
  assert.equal(parseAdminEmails("").size, 0);
  assert.equal(parseAdminEmails("  ").size, 0);
  assert.deepEqual([...parseAdminEmails(" Ada@CC33.club, bob@cc33.club ")].sort(), [
    "ada@cc33.club",
    "bob@cc33.club",
  ]);
  assert.equal(isBrainAdminEmail("ADA@cc33.club", "ada@cc33.club"), true);
  assert.equal(isBrainAdminEmail("eve@cc33.club", "ada@cc33.club"), false);
  assert.equal(isBrainAdminEmail(null, "ada@cc33.club"), false);
  assert.equal(isBrainAdminEmail("ada@cc33.club", undefined), false);
});

test("roll copy stays in club English", () => {
  const body = [VOICE.rollTitle, VOICE.rollLede, VOICE.rollRefusal, VOICE.rollEmpty, VOICE.rollSignIn].join("\n");
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned);
  }
  assert.doesNotMatch(body, /left-brain|right-brain|hemisphere|dashboard|admin/i);
});

function signJwt(
  privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"],
  payload: Record<string, unknown>,
  kid = "kid-1",
): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signer = createSign("SHA256");
  signer.update(`${header}.${body}`);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64url");
  return `${header}.${body}.${signature}`;
}

test("Firebase claims reject the wrong audience and an expired token", () => {
  const now = 1_800_000_000;
  const base = {
    iss: "https://securetoken.google.com/cc33-24cc1",
    aud: "cc33-24cc1",
    exp: now + 60,
    sub: "uid-1",
    email: "ada@cc33.club",
    email_verified: true,
  };
  const ok = assertFirebaseClaims(base, "cc33-24cc1", now);
  assert.equal(ok.uid, "uid-1");
  assert.equal(ok.email, "ada@cc33.club");
  assert.throws(() => assertFirebaseClaims({ ...base, aud: "other" }, "cc33-24cc1", now));
  assert.throws(() => assertFirebaseClaims({ ...base, exp: now }, "cc33-24cc1", now));
});

test("Firebase ID tokens verify against a fixture key and fail a bad signature", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "https://securetoken.google.com/cc33-24cc1",
    aud: "cc33-24cc1",
    exp: now + 3600,
    sub: "uid-1",
    email: "ada@cc33.club",
    email_verified: true,
  };
  const token = signJwt(privateKey, payload);
  const claims = await verifyFirebaseIdToken(token, { certs: { "kid-1": pem }, nowSec: now });
  assert.equal(claims.uid, "uid-1");
  assert.equal(claims.email, "ada@cc33.club");

  const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const forged = signJwt(other.privateKey, payload);
  await assert.rejects(() => verifyFirebaseIdToken(forged, { certs: { "kid-1": pem }, nowSec: now }));
});
