#!/usr/bin/env bash
# Run from the repo root in Google Cloud Shell, signed in as the owner of
# cc33-24cc1. Ensures the native Firestore database, then publishes firestore.rules.
# Leaves sign-in domains and providers alone. Does not create a project.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cc33-24cc1}"
if [[ "${PROJECT_ID}" != "cc33-24cc1" ]]; then
  echo "Refusing PROJECT_ID=${PROJECT_ID}. This script is for cc33-24cc1 only."
  exit 1
fi

REGION="${REGION:-us-central1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

gcloud config set project "${PROJECT_ID}" --quiet

echo "==> Enabling Firestore"
gcloud services enable \
  firestore.googleapis.com \
  firebaserules.googleapis.com \
  --project="${PROJECT_ID}"

echo "==> Database (default)"
DESCRIBE_ERR="$(mktemp)"
if gcloud firestore databases describe \
  --database='(default)' \
  --project="${PROJECT_ID}" \
  --format=json > /tmp/cc33-firestore-db.json 2>"${DESCRIBE_ERR}"; then
  :
else
  if grep -Eq 'NOT_FOUND|does not exist|not found' "${DESCRIBE_ERR}"; then
    echo "Creating native (default) database in ${REGION}"
    gcloud firestore databases create \
      --database='(default)' \
      --location="${REGION}" \
      --type=firestore-native \
      --project="${PROJECT_ID}"
    gcloud firestore databases describe \
      --database='(default)' \
      --project="${PROJECT_ID}" \
      --format=json > /tmp/cc33-firestore-db.json
  else
    echo "Could not read the Firestore database."
    cat "${DESCRIBE_ERR}"
    rm -f "${DESCRIBE_ERR}"
    exit 1
  fi
fi
rm -f "${DESCRIBE_ERR}"

python3 - << 'PY'
import json
data = json.load(open("/tmp/cc33-firestore-db.json"))
kind = str(data.get("type", ""))
location = data.get("locationId") or data.get("location") or ""
print(f"type {kind}")
print(f"location {location}")
if kind not in ("FIRESTORE_NATIVE", "firestore-native"):
    raise SystemExit(
        "The (default) database is not Firestore native. Stop. Leave this database as it is."
    )
PY

echo "==> Publish rules"
bash "${ROOT}/scripts/cloud-shell-deploy-rules.sh"
rm -f /tmp/cc33-firestore-db.json
