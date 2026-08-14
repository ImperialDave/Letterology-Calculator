#!/usr/bin/env bash
# Paste into Google Cloud Shell. Cloud Shell is already signed into Google.
# Crostini cannot do this part.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cc33-letterology}"
DISPLAY_NAME="${DISPLAY_NAME:-CC33 Letterology}"
REGION="${REGION:-us-central1}"
APP_NICKNAME="${APP_NICKNAME:-letterology-web}"

if ! command -v firebase >/dev/null 2>&1; then
  echo "==> Installing Firebase CLI"
  npm install -g firebase-tools
fi

ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
echo "==> Cloud Shell account: ${ACCOUNT}"

if [[ -z "${BILLING:-}" ]]; then
  BILLING="$(gcloud billing accounts list --format='value(name)' --filter='open=true' | head -1 || true)"
fi
if [[ -z "${BILLING}" ]]; then
  echo "No open billing account visible."
  echo "Run: gcloud billing accounts list"
  echo "Then: BILLING=XXXXXX-XXXXXX-XXXXXX bash $0"
  exit 1
fi

if ! gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "==> Creating ${PROJECT_ID}"
  gcloud projects create "${PROJECT_ID}" --name="${DISPLAY_NAME}"
fi
gcloud config set project "${PROJECT_ID}"
gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING}"

echo "==> Adding Firebase resources"
firebase projects:addfirebase "${PROJECT_ID}" --non-interactive || true
firebase use "${PROJECT_ID}" --non-interactive || true

echo "==> Enabling APIs"
gcloud services enable \
  firebase.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com \
  --project="${PROJECT_ID}"

echo "==> Firestore"
if ! gcloud firestore databases describe --database='(default)' --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud firestore databases create \
    --location="${REGION}" \
    --type=firestore-native \
    --project="${PROJECT_ID}"
fi

echo "==> Web app"
if ! firebase apps:list WEB --project="${PROJECT_ID}" --non-interactive 2>/dev/null | grep -q "${APP_NICKNAME}"; then
  firebase apps:create WEB "${APP_NICKNAME}" --project="${PROJECT_ID}" --non-interactive
fi

SDK="$(firebase apps:sdkconfig WEB --project="${PROJECT_ID}" --non-interactive)"
echo "${SDK}" > /tmp/cc33-sdk.txt

python3 - <<'PY'
import json, re
text = open("/tmp/cc33-sdk.txt").read()
cfg = {}
try:
    data = json.loads(text)
    cfg = data.get("result", data.get("sdkConfig", data))
    if isinstance(cfg, dict) and "sdkConfig" in cfg:
        cfg = cfg["sdkConfig"]
except Exception:
    match = re.search(r"\{[^{}]*apiKey[^{}]*\}", text, re.S)
    if match:
        cfg = json.loads(match.group(0))
keys = [
    ("VITE_FIREBASE_API_KEY", "apiKey"),
    ("VITE_FIREBASE_AUTH_DOMAIN", "authDomain"),
    ("VITE_FIREBASE_PROJECT_ID", "projectId"),
    ("VITE_FIREBASE_APP_ID", "appId"),
    ("VITE_FIREBASE_STORAGE_BUCKET", "storageBucket"),
    ("VITE_FIREBASE_MESSAGING_SENDER_ID", "messagingSenderId"),
]
lines = [f"{env}={cfg.get(key, '')}" for env, key in keys]
open("/tmp/cc33-firebase.env", "w").write("\n".join(lines) + "\n")
print("\n".join(lines))
PY

TOKEN="$(gcloud auth print-access-token)"
curl -sS -X PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"authorizedDomains\": [
      \"localhost\",
      \"${PROJECT_ID}.firebaseapp.com\",
      \"${PROJECT_ID}.web.app\",
      \"www.letterology.club\",
      \"letterology.club\"
    ]
  }" >/tmp/cc33-idtoolkit.json || true

curl -sS -X POST \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=google.com" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' >/tmp/cc33-google-idp.json || true

echo
echo "=============================================="
echo "Paste this block back to Grok in Crostini:"
echo "=============================================="
cat /tmp/cc33-firebase.env
echo "=============================================="
echo
echo "X still needs an app at developer.x.com. Cloud Shell cannot make that."
echo "Then: X_API_KEY=... X_API_SECRET=... PROJECT_ID=${PROJECT_ID} bash scripts/cloud-shell-enable-x.sh"
echo "Rules: firebase deploy --only firestore:rules --project ${PROJECT_ID}"
