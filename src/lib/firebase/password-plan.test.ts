import assert from "node:assert/strict";
import test from "node:test";
import { checkPassword, passwordMode } from "./password-plan";

test("password mode follows the sign-in we actually have", () => {
  assert.equal(
    passwordMode({ email: "a@b.c", hasPassword: false, providerEnabled: false }),
    "provider-off",
  );
  assert.equal(
    passwordMode({ email: null, hasPassword: false, providerEnabled: true }),
    "no-email",
  );
  assert.equal(
    passwordMode({ email: "a@b.c", hasPassword: false, providerEnabled: true }),
    "set",
  );
  assert.equal(
    passwordMode({ email: "a@b.c", hasPassword: true, providerEnabled: true }),
    "change",
  );
});

test("a password must be long, repeated, and not the email", () => {
  const email = "ada@example.com";
  assert.equal(checkPassword({ password: "short", confirm: "short", email }), "short");
  assert.equal(
    checkPassword({ password: "long-enough-pass", confirm: "other-enough-xx", email }),
    "mismatch",
  );
  assert.equal(
    checkPassword({ password: "Ada@Example.com", confirm: "Ada@Example.com", email }),
    "same-as-email",
  );
  assert.equal(
    checkPassword({ password: "long-enough-pass", confirm: "long-enough-pass", email, current: "" }),
    "missing-current",
  );
  assert.equal(
    checkPassword({ password: "long-enough-pass", confirm: "long-enough-pass", email }),
    null,
  );
});
