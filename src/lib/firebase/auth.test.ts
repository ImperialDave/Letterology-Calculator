import assert from "node:assert/strict";
import test from "node:test";
import { AuthRedirectStarted, explainAuthError } from "./auth";

test("maps Firebase auth codes into a sentence a guest can use", () => {
  assert.equal(
    explainAuthError({ code: "auth/configuration-not-found" }),
    "Google sign-in is not turned on for this project yet.",
  );
  assert.equal(
    explainAuthError({ code: "auth/popup-closed-by-user" }),
    "The sign-in window closed before it finished.",
  );
  assert.equal(
    explainAuthError(new Error("Firebase: Error (auth/unauthorized-domain).")),
    "This site is not on the allowed list yet.",
  );
  assert.equal(explainAuthError(new AuthRedirectStarted()), "Opening Google in this window.");
});
