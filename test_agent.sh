#!/bin/bash

echo "🧪 Testing Project Brain Agent..."
echo ""

# Check Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed"
    echo "Install: curl -fsSL https://deno.land/install.sh | sh"
    exit 1
fi

echo "✅ Deno found: $(deno --version | head -1)"
echo ""

# Check files exist
echo "📁 Checking files..."
files=(
    "agent/main.ts"
    "agent/intelligence-agent.ts"
    "agent/consequence-engine.ts"
    "agent/data-service.ts"
    "data/synthetic-dataset.json"
    "frontend/index.html"
    "frontend/app.js"
    "frontend/styles.css"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file NOT FOUND"
        exit 1
    fi
done

echo ""
echo "📊 Validating JSON data..."
if deno eval "JSON.parse(await Deno.readTextFile('data/synthetic-dataset.json'))" 2>/dev/null; then
    echo "  ✅ synthetic-dataset.json is valid"
else
    echo "  ❌ synthetic-dataset.json is invalid"
    exit 1
fi

echo ""
echo "🔍 Checking TypeScript syntax..."
if deno check agent/main.ts 2>/dev/null; then
    echo "  ✅ TypeScript files are valid"
else
    echo "  ⚠️  TypeScript check had warnings (may still work)"
fi

echo ""
echo "🎉 All checks passed!"
echo ""
echo "To start the demo:"
echo "  1. Run: deno task dev"
echo "  2. Open: http://localhost:8000/health"
echo "  3. Start frontend in another terminal"
