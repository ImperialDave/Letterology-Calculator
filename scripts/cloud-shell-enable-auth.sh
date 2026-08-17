#!/usr/bin/env bash
# Paste this whole file into Google Cloud Shell. Same style as the indexes.
# Turns Firebase Authentication on for cc33-24cc1 and enables Google.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cc33-24cc1}"

gcloud config set project "${PROJECT_ID}"
gcloud services enable identitytoolkit.googleapis.com firebase.googleapis.com --project="${PROJECT_ID}"
TOKEN="$(gcloud auth print-access-token)"

echo "==> Initialize Authentication"
curl -sS -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/identityPlatform:initializeAuth" \
  -d '{}' || true

echo
echo "==> Authorized domains"
curl -sS -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains" \
  -d "{
    \"authorizedDomains\": [
      \"localhost\",
      \"${PROJECT_ID}.firebaseapp.com\",
      \"${PROJECT_ID}.web.app\",
      \"www.letterology.club\",
      \"letterology-calculator-production.up.railway.app\"
    ]
  }"

echo
echo "==> Enable Google"
curl -sS -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=google.com" \
  -d '{"enabled": true}' \
  || curl -sS -X PATCH \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com?updateMask=enabled" \
    -d '{"enabled": true}'

echo
echo "==> Prove it (must NOT say CONFIGURATION_NOT_FOUND)"
curl -sS \
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyB6zzh_s4biTwJj20zRoFBMvSEtL14NPc4"
echo
echo
echo "If Google is still off, one click:"
echo "https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
echo "Google → Enable → save."
