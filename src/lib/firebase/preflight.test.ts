import assert from "node:assert/strict";
import test from "node:test";
import { interpretAuthPreflight } from "./preflight";

test("preflight names a missing Google provider and a missing domain", () => {
  const both = interpretAuthPreflight({
    config: { authorizedDomains: ["cc33-24cc1.firebaseapp.com"] },
    googleError: "OPERATION_NOT_ALLOWED : The identity provider configuration is not found.",
    origin: "https://www.letterology.club/login",
  });
  assert.equal(both.ok, false);
  assert.equal(both.reason, "google-off");
  assert.match(both.message ?? "", /Google is not enabled/);
  assert.match(both.message ?? "", /letterology\.club is not on the allowed list/);

  const domain = interpretAuthPreflight({
    config: { authorizedDomains: ["cc33-24cc1.firebaseapp.com"] },
    origin: "https://www.letterology.club",
  });
  assert.equal(domain.reason, "domain-off");

  const ready = interpretAuthPreflight({
    config: { authorizedDomains: ["www.letterology.club"] },
    origin: "https://www.letterology.club/login",
  });
  assert.equal(ready.ok, true);
});
