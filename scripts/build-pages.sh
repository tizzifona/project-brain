#!/bin/bash
# Build docs/ folder for GitHub Pages
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$ROOT/docs"

rm -rf "$DOCS"
mkdir -p "$DOCS/data"

cp "$ROOT/frontend/index.html" "$DOCS/"
cp "$ROOT/frontend/app.js" "$DOCS/"
cp "$ROOT/frontend/styles.css" "$DOCS/"
cp "$ROOT/frontend/static-data.js" "$DOCS/"

cp "$ROOT/data/synthetic-dataset.json" "$DOCS/data/open-value.json"
cp "$ROOT/data/gsi-dataset.json" "$DOCS/data/gsi.json"

# Remove webdaemon link (not needed on GitHub Pages)
sed -i '' '/rel="webdaemon"/d' "$DOCS/index.html" 2>/dev/null || \
  sed -i '/rel="webdaemon"/d' "$DOCS/index.html"

touch "$DOCS/.nojekyll"

echo "✅ Built docs/ for GitHub Pages"
echo "   Enable: Settings → Pages → Deploy from branch → main/dev → /docs"
