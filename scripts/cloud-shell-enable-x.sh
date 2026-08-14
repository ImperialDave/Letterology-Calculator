#!/usr/bin/env bash
# After you have an X developer app (API key + secret), run this in Cloud Shell.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cc33-letterology}"
: "${X_API_KEY:?set X_API_KEY}"
: "${X_API_SECRET:?set X_API_SECRET}"

TOKEN="$(gcloud auth print-access-token)"
CALLBACK="https://${PROJECT_ID}.firebaseapp.com/__/auth/handler"

echo "Put this callback on the X app:"
echo "  ${CALLBACK}"

CODE="$(curl -sS -o /tmp/cc33-x-idp.json -w '%{http_code}' -X POST \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=twitter.com" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"enabled\": true, \"clientId\": \"${X_API_KEY}\", \"clientSecret\": \"${X_API_SECRET}\"}")"

if [[ "${CODE}" == "409" || "${CODE}" == "400" ]]; then
  curl -sS -X PATCH \
    "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/twitter.com?updateMask=enabled,clientId,clientSecret" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"enabled\": true, \"clientId\": \"${X_API_KEY}\", \"clientSecret\": \"${X_API_SECRET}\"}" \
    >/tmp/cc33-x-idp.json
fi

echo "Twitter/X provider response:"
cat /tmp/cc33-x-idp.json
echo
