# Project Brain - Technical Architecture

## System Overview

Project Brain is a multi-agent intelligence system built on the Web Daemon platform. It demonstrates cross-channel signal synthesis for project management using a hub-and-spoke architecture.

## Architecture Layers

### 1. Frontend Layer (Client-Side)
**Location:** `frontend/`  
**Technology:** Vanilla JavaScript, HTML5, CSS3  
**Responsibilities:**
- Render three views (PM Dashboard, Client Portal, Squad View)
- Handle user interactions and navigation
- Make API calls to agent-side
- Display real-time data updates
- Run interactive scenarios

**Key Files:**
- `index.html` - Structure and layout
- `styles.css` - Modern dark theme with responsive design
- `app.js` - Business logic, API integration, rendering

**Communication:**
```
Browser → HTTP Request → Web Daemon Router → Agent Tab
                                                  ↓
Browser ← JSON Response ← Agent Processing ← Data Service
```

### 2. Agent Layer (User's Daemon)
**Location:** `agent/`  
**Technology:** TypeScript, Deno, Oak framework  
**Responsibilities:**
- Process HTTP requests from frontend
- Load and parse project data
- Apply intelligence logic to events
- Calculate consequences and impacts
- Generate recommendations
- Maintain user-isolated state

**Key Components:**

#### main.ts - HTTP Server
```typescript
Application (Oak)
├── CORS middleware
├── Router
│   ├── /api/events
│   ├── /api/dashboard/pm
│   ├── /api/dashboard/client
│   ├── /api/dashboard/squad
│   ├── /api/scenario/scope-change
│   └── /health
└── Port 8000
```

#### intelligence-agent.ts - Central Intelligence
Core agent that:
- Interprets events with context
- Assigns urgency levels
- Generates recommendations
- Synthesizes cross-channel signals
- Calculates health metrics
- Creates view-specific data structures

**Intelligence Flow:**
```
Raw Event → Interpretation Logic → InterpretedEvent
    ↓              ↓                      ↓
  Type         Urgency                 Recommendations
  Tags         Risk Level              Action Items
  Impact       Dependencies            Stakeholder Alerts
```

#### consequence-engine.ts - Impact Calculator
Sophisticated calculation engine for scope changes:

**Input:**
```typescript
{
  type: 'feature-addition',
  description: 'Add feature X',
  estimatedEffort: 13  // story points
}
```

**Processing:**
1. Calculate budget impact (dev + design + testing + PM)
2. Calculate timeline impact (effort ÷ velocity × sprint length)
3. Calculate sprint capacity impact
4. Assess risks (budget %, timeline %, cash flow)
5. Calculate ripple effects
6. Generate mitigation options

**Output:**
```typescript
{
  immediate: { budget, timeline, sprint },
  cascading: { budgetRipple, resourceRipple, stakeholderRipple, riskRipple },
  mitigation: { options[], recommendations[] },
  visualization: { beforeAfter, trajectory }
}
```

#### data-service.ts - Data Access
Simple data layer that:
- Loads synthetic JSON dataset
- Caches in memory
- Provides type-safe accessors
- Supports reload for updates

### 3. Data Layer
**Location:** `data/synthetic-dataset.json`  
**Format:** Structured JSON

**Schema:**
```json
{
  "project": {
    "id": "string",
    "name": "string",
    "startDate": "ISO8601",
    "originalBudget": number,
    "originalTimeline": "string",
    "client": "string",
    "squad": ["string"]
  },
  "events": [{
    "id": "string",
    "timestamp": "ISO8601",
    "channel": "slack|email|voice|notion|trello|figma",
    "type": "string",
    "severity": "low|medium|high|critical",
    "author": "string",
    "content": "string",
    "tags": ["string"],
    "impact": {
      "budget": number,
      "timeline": number,
      "scope": "string",
      "risk": "string",
      "dependencies": ["string"]
    }
  }],
  "budget": {
    "original": number,
    "approved_changes": number,
    "current_total": number,
    "spent_to_date": number,
    "remaining": number,
    "burn_rate_weekly": number
  },
  "timeline": {
    "original_weeks": number,
    "current_estimate": number,
    "weeks_elapsed": number,
    "weeks_remaining": number,
    "at_risk": boolean
  },
  "sprint": {
    "current_sprint": "string",
    "velocity": number,
    "committed_points": number,
    "completed_points": number,
    "blocked_points": number,
    "blockers": ["string"]
  }
}
```

## Data Flow

### 1. Initial Load
```
User opens frontend
    ↓
Frontend calls /api/dashboard/pm
    ↓
Agent loads data from JSON
    ↓
Intelligence Agent interprets all events
    ↓
Returns processed dashboard data
    ↓
Frontend renders views
```

### 2. View Switch
```
User clicks "Client Portal"
    ↓
Frontend calls /api/dashboard/client
    ↓
Agent filters and formats data for client view
    ↓
Removes internal signals, formats for decision-making
    ↓
Frontend renders client-appropriate view
```

### 3. Scenario Run
```
User clicks "Run Scope Change Scenario"
    ↓
Frontend POSTs to /api/scenario/scope-change
    ↓
Consequence Engine calculates:
  - Budget breakdown
  - Timeline extension
  - Sprint impact
  - Risk assessment
  - Ripple effects
  - Mitigation options
    ↓
Returns comprehensive impact analysis
    ↓
Frontend renders results with visualization
```

## Intelligence Logic

### Event Interpretation Algorithm

```typescript
function interpretEvent(event: Event): InterpretedEvent {
  // 1. Determine event significance
  const urgency = calculateUrgency(event.type, event.severity, event.impact);
  
  // 2. Generate human-readable interpretation
  const interpretation = generateInterpretation(event);
  
  // 3. Create actionable recommendations
  const recommendations = generateRecommendations(event, urgency);
  
  return { ...event, interpretation, recommendations, urgency };
}
```

**Urgency Matrix:**
```
Critical: scope-change, blocker, decision-pending with high impact
High: decision without confirmation, high severity events
Medium: confirmed decisions, medium severity with dependencies
Low: progress updates, routine communications
```

### Health Calculation

**Budget Health:**
```typescript
percentUsed = (spent / total) * 100
if (percentUsed > 85) return "Critical"
if (percentUsed > 70) return "Warning"
return "Healthy"
```

**Timeline Health:**
```typescript
if (at_risk) return "At Risk"
percentComplete = (elapsed / estimate) * 100
if (percentComplete > 70) return "On Track"
return "Healthy"
```

**Sprint Health:**
```typescript
completionRate = (completed / committed) * 100
if (blockedPoints > 0) return "Blocked"
if (completionRate < 50) return "Behind"
if (completionRate > 80) return "On Track"
return "Normal"
```

### Consequence Calculation

**Budget Impact Formula:**
```typescript
pointCost = $1,200 (average hourly rate × hours per point)
developmentCost = effort × pointCost
designCost = developmentCost × 0.20
testingCost = developmentCost × 0.15
pmCost = developmentCost × 0.10
total = sum(all costs)
```

**Timeline Impact Formula:**
```typescript
velocity = sprint.velocity (points per sprint)
sprintsNeeded = ceil(effort / velocity)
weeksNeeded = sprintsNeeded × 2 (2-week sprints)
```

**Risk Assessment:**
```typescript
if (budgetIncrease > 20%) → High Risk
if (budgetIncrease > 10%) → Medium Risk
if (timelineExtension > 2 weeks) → High Risk
if (projectedBurn > availableBudget) → Critical Risk
```

## View-Specific Logic

### PM Dashboard
**Data Synthesis:**
- All events, chronologically sorted
- Critical signals extracted (urgency >= high)
- Channel breakdown calculated
- AI recommendations based on project state
- Health metrics for all dimensions

**Filtering:**
- By channel (client-side)
- By urgency (implicit in critical signals)
- By date range (future feature)

### Client Portal
**Data Transformation:**
- Remove internal signals (Slack, Trello details)
- Format financial data with clear labels
- Present only confirmed decisions
- Show pending decisions requiring input
- Risk assessment in client-friendly language

**Key Differentiator:**
- Decision preview before confirmation
- Clear impact visualization
- Comparison of mitigation options

### Squad View
**Context Aggregation:**
- Sprint metrics front and center
- Blockers with urgency
- Upcoming work from backlog
- Important updates from channels squad isn't in
- No financial details (not squad's concern)

## Performance Considerations

### Optimization Strategies:
1. **In-memory caching** - Data loaded once, cached
2. **Lazy loading** - Views load data only when switched to
3. **Efficient filtering** - Client-side filtering after initial load
4. **Minimal recalculation** - Static dataset doesn't require polling
5. **Progressive rendering** - UI renders as data arrives

### Scalability Notes:
For production (live data):
- Implement pagination (100 events per page)
- Add real-time updates (WebSocket or SSE)
- Cache expensive calculations (consequence scenarios)
- Debounce API calls
- Use virtual scrolling for large lists

## Security Model

### Web Daemon Isolation:
- Each user gets isolated Deno process
- No shared state between users
- Data scoped to user's daemon
- Sandboxed file system access
- Network access controlled by Web Daemon

### Current Implementation:
- CORS headers for frontend access
- No authentication (demo only)
- Public data (synthetic dataset)

### Production Requirements:
- User authentication
- Token-based API access
- Input validation and sanitization
- Rate limiting
- Audit logging

## Extension Points

### 1. Add New Channel Agent:
```typescript
// In intelligence-agent.ts
async getEventsByChannel(channel: string): Promise<InterpretedEvent[]> {
  // Filter events by channel
  // Apply channel-specific interpretation rules
}
```

### 2. Add New View:
```typescript
// In agent/main.ts
router.get("/api/dashboard/executive", async (ctx) => {
  const execView = await intelligenceAgent.getExecutiveView();
  ctx.response.body = { success: true, data: execView };
});

// In frontend/app.js
async function loadExecutiveView() {
  const data = await fetchAPI('/api/dashboard/executive');
  renderExecutiveView(data);
}
```

### 3. Add New Scenario Type:
```typescript
// In consequence-engine.ts
calculateTimelineSlippage(delay: number, projectData: any) {
  // Calculate impact of timeline delay
  // Similar to scope change, but different factors
}

// In agent/main.ts
router.post("/api/scenario/timeline-slip", async (ctx) => {
  const body = await ctx.request.body().value;
  const consequences = await consequenceEngine.calculateTimelineSlippage(
    body.delay,
    await dataService.getData()
  );
  ctx.response.body = { success: true, data: consequences };
});
```

### 4. Integrate Web Daemon AI:
```typescript
import { memory } from "webdaemon";

// Store events in semantic memory
await memory.store({
  content: event.content,
  metadata: { channel: event.channel, timestamp: event.timestamp }
});

// Query for similar past events
const similar = await memory.query("budget overrun", { limit: 10 });
```

## Testing Strategy

### Unit Tests (Future):
- Consequence calculations
- Health metric calculations
- Event interpretation logic
- Data transformations

### Integration Tests (Future):
- API endpoint responses
- Data service loading
- View data generation

### E2E Tests (Future):
- User flows through all views
- Scenario execution
- Filter and navigation

## Deployment Checklist

- [ ] All files committed to repo
- [ ] Frontend hosted on public URL
- [ ] `webdaemon.yml` paths verified
- [ ] Agent code runs locally without errors
- [ ] All API endpoints tested
- [ ] Cross-browser testing completed
- [ ] Mobile responsive verified
- [ ] Demo script rehearsed
- [ ] Fallback materials prepared

## Future Architecture Enhancements

### Phase 2: Live Integrations
```
Channel APIs (Slack, Email, etc.)
    ↓
Channel Agents (dedicated TypeScript modules)
    ↓
Central Intelligence Hub (current intelligence-agent.ts)
    ↓
Three Views (current frontend)
```

### Phase 3: Predictive AI
```
Historical Events → ML Model → Risk Predictions
Project Patterns → Training → Budget Forecasts
Timeline Data → Analysis → Delivery Estimates
```

### Phase 4: Multi-Project
```
User Daemon
    ├── Project Brain Instance 1 (Project A)
    ├── Project Brain Instance 2 (Project B)
    └── Project Brain Instance 3 (Project C)
            ↓
    Portfolio Intelligence Agent (aggregates across projects)
```

---

**Architecture Status:** ✅ Complete for Demo  
**Production Ready:** 🔄 Requires Phase 2 & 3 work  
**Scalable:** ✅ Web Daemon handles multi-tenant isolation  
**Maintainable:** ✅ Clean separation of concerns