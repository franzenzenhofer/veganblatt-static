#!/usr/bin/env bash
set -euo pipefail

# Purge Cloudflare cache (entire zone) if credentials are available
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" || -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
  echo "Skipping cache purge (no CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID)."
  exit 0
fi

echo "Purging Cloudflare cache for zone: ${CLOUDFLARE_ZONE_ID}"
HTTP_CODE=$(curl -s -o /tmp/cf_purge_resp.json -w "%{http_code}" \
  -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Cloudflare purge request failed (HTTP ${HTTP_CODE}). Response:"
  cat /tmp/cf_purge_resp.json
  exit 1
fi

echo "Cloudflare cache purge requested successfully."
