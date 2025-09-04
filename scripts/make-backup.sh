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

# Verify that critical content is included (most important: src/data/**)
REQUIRED=(
  "src/data/"
  "src/data/articles/"
  "src/data/recipes/"
  "src/data/image-metadata/"
)

for path in "${REQUIRED[@]}"; do
  if ! unzip -l "$ZIP_NAME" | awk '{print $4}' | grep -q "$path"; then
    echo "ERROR: Backup is missing required path: $path" >&2
    exit 2
  fi
done

echo "Verified: src/data and subfolders present in backup"
