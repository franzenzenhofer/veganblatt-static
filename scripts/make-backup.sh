#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-}
if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

ZIP_NAME="$BACKUP_DIR/build-${VERSION}.zip"
echo "Creating lightweight backup: $ZIP_NAME"

# Include source, templates, css, and critical public outputs (sitemaps, robots)
zip -qr "$ZIP_NAME" \
  src \
  public/sitemap*.xml \
  public/robots.txt \
  public/_headers \
  version.json \
  package.json \
  tsconfig.json \
  eslint.config.js \
  wrangler.toml || true

echo "Backup created: $ZIP_NAME"
