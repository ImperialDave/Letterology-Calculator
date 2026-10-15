#!/usr/bin/env bash
# Paste this whole file into Google Cloud Shell, signed in as the owner of cc33-24cc1.
# Turns on email + password for that project only. Does not touch Google, Apple, or domains.
# Refuse any other project id. The default below is the live club.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cc33-24cc1}"
if [[ "${PROJECT_ID}" != "cc33-24cc1" ]]; then
  echo "Refusing PROJECT_ID=${PROJECT_ID}. This script is for cc33-24cc1 only."
  exit 1
fi

gcloud config set project "${PROJECT_ID}"
gcloud services enable identitytoolkit.googleapis.com firebase.googleapis.com --project="${PROJECT_ID}"
TOKEN="$(gcloud auth print-access-token)"

echo "==> Current authorized domains (not changed)"
curl -sS \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config" \
  | python3 -c 'import json,sys; data=json.load(sys.stdin); print("\n".join(data.get("authorizedDomains") or data.get("config",{}).get("authorizedDomains") or ["(none listed)"]))'

echo
echo "==> Enable email + password. One account per email. Email link stays off."
curl -sS -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired,signIn.allowDuplicateEmails" \
  -d '{
    "signIn": {
      "email": { "enabled": true, "passwordRequired": true },
      "allowDuplicateEmails": false
    }
  }'
echo

echo "==> Password length 12, if Identity Platform allows it. A refusal is not a failure."
POLICY_CODE="$(curl -sS -o /tmp/cc33-password-policy.json -w '%{http_code}' -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=passwordPolicyConfig" \
  -d '{
    "passwordPolicyConfig": {
      "passwordPolicyEnforcementState": "ENFORCE",
      "forceUpgradeOnSignin": false,
      "passwordPolicyVersions": [{
        "customStrengthOptions": { "minPasswordLength": 12, "maxPasswordLength": 128 }
      }]
    }
  }')" || true
echo "policy HTTP ${POLICY_CODE}"
if [[ "${POLICY_CODE}" != "200" ]]; then
  echo "Password policy was not applied. The page still refuses fewer than 12 characters."
  echo "Do not upgrade billing just for this. Console, only if the page already exists:"
  echo "https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings"
  python3 -c 'print(open("/tmp/cc33-password-policy.json").read()[:500])' || true
fi

echo
echo "==> Prove the password provider (must NOT say OPERATION_NOT_ALLOWED)"
API_KEY="${FIREBASE_API_KEY:-AIzaSyB6zzh_s4biTwJj20zRoFBMvSEtL14NPc4}"
curl -sS -X POST \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${API_KEY}" \
  -d '{"providerId":"password","continueUri":"https://www.letterology.club/login"}'
echo
echo
echo "Google and Apple were not modified."
echo "Reset mail template, by hand: https://console.firebase.google.com/project/${PROJECT_ID}/authentication/emails"
echo "Sender name: CC33. Leave the Firebase action handler. Continue URL is set by the app."
echo "Rules, only after www.letterology.club is serving this commit:"
echo "npx firebase-tools deploy --only firestore:rules --project ${PROJECT_ID}"
