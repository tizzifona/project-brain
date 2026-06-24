# Project Brain 🧠

AI-powered project intelligence hub that synthesizes commercial signals across multiple communication channels into one intelligent view.

## Overview

Project Brain applies a hub-and-spoke network of AI agents to project management, solving the critical problem of **cross-channel synthesis** that existing tools (Notion AI, Fireflies, Zapier) cannot address.

### The Problem

Modern projects run across 6+ communication channels simultaneously:
- 📞 Video calls (decisions, discussions)
- 💬 Slack (team updates, quick decisions)
- 📧 Email (formal communications, scope changes)
- 📝 Notion (documentation, requirements)
- 📋 Trello (tasks, sprints)
- 🎨 Figma (design feedback, UI decisions)

**The gap:** No existing tool reads across all channels at once to synthesize the full picture.

### The Solution

Project Brain uses a central **Project Intelligence Agent** that receives feeds from channel-specific agents and delivers three differentiated views:

1. **PM Dashboard** - Full cross-channel picture with AI interpretation of each signal
2. **Client Portal** - Progress, budget, and consequence of decisions before confirmation
3. **Squad View** - Sprint health, blockers, and context from channels they're not part of

![Project Brain Architecture](assets/Screenshot_2026-06-24_at_22.19.00-db2fbd35-484f-4b42-87e1-ad2fbe557c7e.png)

## Technology Stack

Built with **Web Daemon** platform:
- **Agent-side:** TypeScript/Deno (runs in user's daemon)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Data:** Synthetic JSON dataset (for demo)
- **Architecture:** Multi-agent hub-and-spoke

## Project Structure

```
project-brain/
├── webdaemon.yml              # Web Daemon configuration
├── importmap.json             # Deno import map
├── deno.json                  # Deno tasks configuration
├── data/
│   └── synthetic-dataset.json # Demo project data (Open Value)
├── agent/                     # Agent-side TypeScript code
│   ├── main.ts               # API server entry point
│   ├── intelligence-agent.ts # Central intelligence logic
│   ├── consequence-engine.ts # Impact calculation engine
│   └── data-service.ts       # Data access layer
├── frontend/                  # Client-side web app
│   ├── index.html            # Main HTML
│   ├── styles.css            # Styling
│   └── app.js                # Frontend logic
└── README.md
```

## Features

### 1. PM Dashboard
- **Cross-channel signal feed** - All events from all channels, chronologically
- **AI interpretation** - Intelligent analysis of each signal's meaning
- **Critical signals** - Automatic highlighting of urgent items
- **Channel breakdown** - Activity statistics per channel
- **Smart recommendations** - AI-generated action items

### 2. Client Portal
- **Progress tracking** - Visual completion percentage
- **Budget overview** - Spent vs. remaining with projections
- **Timeline analysis** - Original vs. current estimates
- **Decision preview** - See impact before confirming scope changes
- **Risk assessment** - Client-facing risk summary

### 3. Squad View
- **Sprint health** - Velocity, completion, blockers
- **Context updates** - Important signals from channels squad isn't in
- **Upcoming work** - Backlog visibility
- **Blocker tracking** - Active impediments

### 4. Consequence Engine (Demo Feature)
Run scope change scenarios to see:
- Budget impact breakdown
- Timeline extension calculation
- Sprint capacity analysis
- Risk assessment
- Mitigation options comparison
- Stakeholder impact analysis

## Installation & Setup

### Prerequisites
- [Deno](https://deno.land/) installed (v1.37+)
- Web Daemon platform access
- Modern web browser

### Quick Start

1. **Clone the repository:**
```bash
cd /path/to/project-brain
```

2. **Run the agent-side server:**
```bash
deno task dev
```

The server will start on `http://localhost:8000`

3. **Open the frontend:**
```bash
# Serve the frontend directory with any static server
# For example, using Python:
cd frontend
python3 -m http.server 8080

# Or using Node.js:
npx serve
```

4. **Access the app:**
Open `http://localhost:8080` in your browser

### Web Daemon Deployment

To deploy on Web Daemon:

1. Host the project files on a public URL (GitHub Pages, Vercel, etc.)
2. The `webdaemon.yml` will automatically configure the agent-side code
3. Install in your Web Daemon shell
4. The agent-side TypeScript runs in your daemon instance

## Demo Script

**Scenario:** Show what happened on the Open Value project last week

1. **Open PM Dashboard** - See the full cross-channel activity feed
2. **Filter by channel** - Show how Slack, Email, and Calls are synthesized
3. **Review critical signals** - Highlight the scope change detection
4. **Switch to Client Portal** - Show current budget and timeline status
5. **Run scope change scenario** - Click "Run Scope Change Scenario"
6. **Review impact** - See how adding "exchange rate history chart" ripples through:
   - Budget: +$15,600
   - Timeline: +2 weeks
   - Sprint: +13 story points
7. **Compare mitigation options** - Full implementation vs. MVP vs. Defer
8. **Show Squad View** - Demonstrate context visibility for developers

## Synthetic Dataset

The demo uses a realistic dataset based on the Open Value project:
- 12 events across 6 channels
- Multiple decision types (scope changes, blockers, progress)
- Budget tracking ($93K total, $62K spent)
- Timeline data (18 weeks estimated, 10 elapsed)
- Sprint metrics (Sprint 6, velocity 12, 3 blocked points)

### Key Demo Events:
1. Multi-currency feature request (voice call)
2. Designer creates mockups (Figma) assuming approval
3. Client confirms via email (+$15K, +3.5 weeks)
4. Legal blocker identified (+$3K, +1.5 weeks)
5. Phased delivery negotiation (-$7K, -1 week)
6. Final scope locked: USD only in phase 1

## API Endpoints

The agent-side server exposes these endpoints:

```
GET  /api/events                  # All events with AI interpretation
GET  /api/events/channel/:channel # Events filtered by channel
GET  /api/overview                # Project overview
GET  /api/dashboard/pm            # PM dashboard data
GET  /api/dashboard/client        # Client portal data
GET  /api/dashboard/squad         # Squad view data
GET  /api/signals/critical        # Critical signals only
GET  /api/analysis/budget         # Budget analysis
GET  /api/analysis/timeline       # Timeline analysis
POST /api/scenario/scope-change   # Run scope change scenario
GET  /health                      # Health check
```

## Configuration

### Web Daemon YAML

```yaml
name: Project Brain
tab:
  intelligence:
    src: agent/main.ts
    importmap: importmap.json
    ttl: 300
    config:
      dataPath: data/synthetic-dataset.json
      updateInterval: 5000
```

### Import Map

Uses Deno's Oak framework for HTTP server:
- `oak@v12.6.1` - Web framework
- `std@0.208.0` - Standard library

## Next Steps (Post-Demo)

### Phase 1: Live Integrations
- Slack API integration
- Email (Gmail/Outlook) integration
- Notion API integration
- Trello API integration
- Figma webhooks
- Transcription service for calls

### Phase 2: Advanced AI
- Semantic memory (Web Daemon feature)
- Generative chat interface
- Predictive risk modeling
- Budget forecasting with ML

### Phase 3: Production Features
- Multi-project support
- User authentication
- Team permissions
- Notification system
- Export reports
- Historical analytics

## Contributing

This is a pilot project for Blue Hope internal use and client demonstrations.

## Architecture Benefits

### Why Web Daemon?

1. **Agent-side isolation** - Each user gets their own intelligence agent
2. **Data privacy** - Project data stays in user's daemon
3. **TypeScript/Deno** - Modern, secure, fast runtime
4. **No backend deployment** - Agent code runs client-side in daemon
5. **Semantic memory** - Built-in AI capabilities
6. **Easy distribution** - Just host HTML/CSS/JS files

### Intelligence Agent Design

The central agent:
- Receives events from all channels
- Applies interpretation logic per event type
- Calculates urgency levels (low/medium/high/critical)
- Generates context-aware recommendations
- Tracks cross-channel dependencies
- Identifies decision gaps and risks

### Consequence Engine

Sophisticated impact calculator:
- Budget breakdown (dev, design, testing, PM)
- Timeline estimation based on velocity
- Sprint capacity analysis
- Risk assessment with probability/impact
- Ripple effect calculation (budget runway, resource conflicts)
- Mitigation option generation

## License

Proprietary - Blue Hope 2024

## Contact

For questions about this pilot project, contact Blue Hope team.

---

**Built with ❤️ by Blue Hope | Powered by Web Daemon**
