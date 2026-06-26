import { Application, Router } from "oak";
import { IntelligenceAgent } from "./intelligence-agent.ts";
import { ConsequenceEngine } from "./consequence-engine.ts";
import { DataService } from "./data-service.ts";

const app = new Application();
const router = new Router();

// Project data files
const PROJECT_DATA_FILES: Record<string, string> = {
  "open-value": "data/synthetic-dataset.json",
  "gsi": "data/gsi-dataset.json"
};

// Initialize services with default project
let currentProject = "open-value";
let dataService = new DataService(PROJECT_DATA_FILES[currentProject]);
const consequenceEngine = new ConsequenceEngine();
let intelligenceAgent = new IntelligenceAgent(dataService, consequenceEngine);

// Helper to switch project
function switchProject(projectId: string) {
  if (PROJECT_DATA_FILES[projectId] && projectId !== currentProject) {
    currentProject = projectId;
    dataService = new DataService(PROJECT_DATA_FILES[projectId]);
    intelligenceAgent = new IntelligenceAgent(dataService, consequenceEngine);
    console.log(`📂 Switched to project: ${projectId}`);
  }
}

// Enable CORS for frontend
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// API Routes

// Switch project
router.post("/api/project/switch", async (ctx) => {
  const body = await ctx.request.body().value;
  const projectId = body.projectId;
  if (PROJECT_DATA_FILES[projectId]) {
    switchProject(projectId);
    ctx.response.body = { success: true, data: { currentProject: projectId } };
  } else {
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: "Unknown project" };
  }
});

// Get current project
router.get("/api/project/current", (ctx) => {
  ctx.response.body = { success: true, data: { currentProject } };
});

// Get all events with agent interpretation
router.get("/api/events", async (ctx) => {
  const projectId = ctx.request.url.searchParams.get("project");
  if (projectId) switchProject(projectId);
  const events = await intelligenceAgent.getInterpretedEvents();
  ctx.response.body = { success: true, data: events };
});

// Get events filtered by channel
router.get("/api/events/channel/:channel", async (ctx) => {
  const channel = ctx.params.channel;
  const events = await intelligenceAgent.getEventsByChannel(channel);
  ctx.response.body = { success: true, data: events };
});

// Get project overview
router.get("/api/overview", async (ctx) => {
  const overview = await intelligenceAgent.getProjectOverview();
  ctx.response.body = { success: true, data: overview };
});

// Get PM dashboard data
router.get("/api/dashboard/pm", async (ctx) => {
  const projectId = ctx.request.url.searchParams.get("project");
  if (projectId) switchProject(projectId);
  const dashboard = await intelligenceAgent.getPMDashboard();
  ctx.response.body = { success: true, data: dashboard };
});

// Get client portal data
router.get("/api/dashboard/client", async (ctx) => {
  const projectId = ctx.request.url.searchParams.get("project");
  if (projectId) switchProject(projectId);
  const clientView = await intelligenceAgent.getClientPortal();
  ctx.response.body = { success: true, data: clientView };
});

// Get squad view data
router.get("/api/dashboard/squad", async (ctx) => {
  const projectId = ctx.request.url.searchParams.get("project");
  if (projectId) switchProject(projectId);
  const squadView = await intelligenceAgent.getSquadView();
  ctx.response.body = { success: true, data: squadView };
});

// Simulate scope change and get consequences
router.post("/api/scenario/scope-change", async (ctx) => {
  const body = await ctx.request.body().value;
  const consequences = await consequenceEngine.calculateScopeChangeImpact(
    body.change,
    await dataService.getData()
  );
  ctx.response.body = { success: true, data: consequences };
});

// Get critical signals
router.get("/api/signals/critical", async (ctx) => {
  const signals = await intelligenceAgent.getCriticalSignals();
  ctx.response.body = { success: true, data: signals };
});

// Get budget analysis
router.get("/api/analysis/budget", async (ctx) => {
  const analysis = await intelligenceAgent.getBudgetAnalysis();
  ctx.response.body = { success: true, data: analysis };
});

// Get timeline analysis
router.get("/api/analysis/timeline", async (ctx) => {
  const analysis = await intelligenceAgent.getTimelineAnalysis();
  ctx.response.body = { success: true, data: analysis };
});

// Health check
router.get("/health", (ctx) => {
  ctx.response.body = { status: "healthy", timestamp: new Date().toISOString() };
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("🧠 Project Brain Intelligence Agent starting...");
console.log("📊 Data loaded from synthetic dataset");
console.log("🚀 Agent ready to serve requests");

await app.listen({ port: 8000 });
