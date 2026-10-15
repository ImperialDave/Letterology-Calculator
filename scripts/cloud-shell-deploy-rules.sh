#!/usr/bin/env bash
# Paste is not enough: run this from the repo root in Google Cloud Shell,
# signed in as the owner of cc33-24cc1. It publishes firestore.rules only.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cc33-24cc1}"
if [[ "${PROJECT_ID}" != "cc33-24cc1" ]]; then
  echo "Refusing PROJECT_ID=${PROJECT_ID}. This script is for cc33-24cc1 only."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RULES_FILE="${ROOT}/firestore.rules"
if [[ ! -f "${RULES_FILE}" ]]; then
  echo "Missing ${RULES_FILE}"
  exit 1
fi
if ! grep -q 'function sourceStable' "${RULES_FILE}"; then
  echo "Refusing rules that lack sourceStable. Pull the latest main first."
  exit 1
fi

gcloud config set project "${PROJECT_ID}"
gcloud services enable firebaserules.googleapis.com --project="${PROJECT_ID}"
TOKEN="$(gcloud auth print-access-token)"

python3 - "${RULES_FILE}" > /tmp/cc33-ruleset.json << 'PY'
import base64, hashlib, json, pathlib, sys
content = pathlib.Path(sys.argv[1]).read_text()
fingerprint = base64.b64encode(hashlib.sha256(content.encode()).digest()).decode()
json.dump({
    "source": {
        "files": [{
            "name": "firestore.rules",
            "content": content,
            "fingerprint": fingerprint,
        }]
    }
}, sys.stdout)
PY

echo "==> Create ruleset"
RULESET_JSON="$(curl -sS -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets" \
  -d @/tmp/cc33-ruleset.json)"
RULESET_NAME="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["name"])' "${RULESET_JSON}")"
echo "ruleset ${RULESET_NAME}"

RELEASE="projects/${PROJECT_ID}/releases/cloud.firestore"
echo "==> Publish ${RELEASE}"
STATUS="$(curl -sS -o /tmp/cc33-release.json -w '%{http_code}' \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://firebaserules.googleapis.com/v1/${RELEASE}")"
if [[ "${STATUS}" == "404" ]]; then
  curl -sS -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases" \
    -d "{\"name\":\"${RELEASE}\",\"rulesetName\":\"${RULESET_NAME}\"}"
else
  curl -sS -X PATCH \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://firebaserules.googleapis.com/v1/${RELEASE}" \
    -d "{\"release\":{\"name\":\"${RELEASE}\",\"rulesetName\":\"${RULESET_NAME}\"},\"updateMask\":\"rulesetName\"}"
fi
echo
echo "Rules published for ${PROJECT_ID}."
rm -f /tmp/cc33-ruleset.json /tmp/cc33-release.json
