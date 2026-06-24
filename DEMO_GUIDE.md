# Project Brain - Quick Start Guide

## For Demo on Tuesday

### Prerequisites Check
```bash
# Check Deno is installed
deno --version

# If not installed, install Deno:
# macOS/Linux:
curl -fsSL https://deno.land/install.sh | sh

# Windows:
irm https://deno.land/install.ps1 | iex
```

### Start the Demo

**Option 1: Local Development (Fastest)**

1. Open Terminal and navigate to project:
```bash
cd "/Users/nomi/projects/Blue Hope/project-brain"
```

2. Start the agent server:
```bash
deno task dev
```

You should see:
```
🧠 Project Brain Intelligence Agent starting...
📊 Data loaded from synthetic dataset
🚀 Agent ready to serve requests
```

3. In a new terminal, start the frontend:
```bash
cd frontend
python3 -m http.server 8080
```

4. Open browser to: `http://localhost:8080`

**Option 2: Web Daemon Deployment**

1. Host project on GitHub Pages or similar
2. Update `webdaemon.yml` paths if needed
3. Install in Web Daemon shell
4. Access via Web Daemon URL

### Demo Flow (5 minutes)

**Act 1: The Problem (30 seconds)**
- Show the diagram
- Explain: "Project runs across 6 channels, decisions in one don't reach others"

**Act 2: PM Dashboard (1.5 minutes)**
- Open PM Dashboard
- Point to: "Every channel in one feed"
- Filter by Slack, then Email, then Voice
- Show AI interpretation on a critical signal
- Point to critical signals panel: "Scope change automatically detected"

**Act 3: Client Portal (1.5 minutes)**
- Switch to Client Portal
- Show progress (62% complete)
- Show budget variance (+$8K)
- Point out: "This is what client sees - clean, decision-focused"

**Act 4: The Magic - Consequence Engine (1.5 minutes)**
- Click "Run Scope Change Scenario"
- Wait for calculation (2 seconds)
- Walk through:
  - "Client asked for exchange rate history chart in Figma"
  - "Before they confirm, let's show the impact"
  - Budget: +$15,600 (breakdown shows dev/design/testing/PM)
  - Timeline: +2 weeks
  - Sprint: 13 story points across 2 sprints
- Scroll to mitigation options
- Point to MVP option (recommended): "We suggest phased delivery"
- Show the comparison: Full ($15.6K) vs MVP ($9.4K) vs Defer ($0)

**Closing (30 seconds)**
- "This is the differentiator no tool offers today"
- "Notion AI works in Notion. Fireflies works in calls. This works across everything"
- "And it runs on Web Daemon - each user gets their own AI agent"

### Troubleshooting

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
deno run --allow-net --allow-read agent/main.ts --port 8001
```

**Frontend not loading:**
- Check browser console for errors
- Verify agent is running on port 8000
- Try different browser (Chrome/Firefox recommended)

**API errors:**
- Check `data/synthetic-dataset.json` exists
- Verify file permissions
- Check Deno has read permissions

### Key Demo Points to Emphasize

1. **Cross-channel synthesis** - This is the unique value prop
2. **AI interpretation** - Not just aggregation, but intelligence
3. **Decision preview** - Show consequences BEFORE confirming
4. **Client-ready view** - Portal is polished, not internal noise
5. **Web Daemon advantage** - Runs in user's daemon, isolated and secure

### If Demo Breaks

Fallback plan:
1. Use screenshot walkthrough of the UI
2. Explain the consequence calculation manually
3. Show the synthetic dataset JSON to demonstrate data structure
4. Focus on the concept and architecture (diagram)

### After Demo: Next Questions

Be ready for:
- "How do you integrate with Slack/Email/etc?" → Phase 2 work, APIs available
- "Does this work for multiple projects?" → Not yet, Phase 3 feature
- "How much does Web Daemon cost?" → Refer to webdaemon.online
- "Can we customize the AI interpretation?" → Yes, rules engine planned
- "What about security?" → Data stays in user's daemon, not cloud

## Files to Have Open

1. Browser: `http://localhost:8080` (main demo)
2. Code editor: `agent/consequence-engine.ts` (to show calculation logic)
3. Code editor: `data/synthetic-dataset.json` (to show data structure)
4. Browser: Architecture diagram PNG

## Backup Materials

- Screenshots of each view (take now, before demo)
- PDF export of README with architecture diagram
- Recording of the demo (practice run)

---

Good luck with the demo! 🚀