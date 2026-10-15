import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("firestore rules keep slug updates closed and tie a user to a slug they own", () => {
  const rules = readFileSync(join(root, "firestore.rules"), "utf8");
  assert.match(rules, /allow update: if false/);
  assert.match(rules, /handles/);
  assert.match(rules, /ownsHandle/);
  assert.match(rules, /createdAt == resource\.data\.createdAt/);
  assert.doesNotMatch(rules, /allow update: if true/);
});

test("the password script stays on cc33-24cc1 and does not retouch Google or Apple", () => {
  const script = readFileSync(join(root, "scripts/cloud-shell-enable-password.sh"), "utf8");
  assert.match(script, /PROJECT_ID:-cc33-24cc1/);
  assert.match(script, /cc33-24cc1/);
  assert.doesNotMatch(script, /cc33-letterology/);
  assert.match(script, /signIn\.email\.enabled/);
  assert.match(script, /passwordRequired/);
  assert.match(script, /allowDuplicateEmails/);
  const withoutConsole = script.replaceAll("https://console.firebase.google.com", "");
  assert.doesNotMatch(withoutConsole, /google\.com|apple\.com/);
  assert.doesNotMatch(script, /authorizedDomains\s*=/);
});
