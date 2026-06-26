// Configuration — localhost uses agent directly; Web Daemon uses tab route
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : window.location.origin + '/tab/intelligence';

// State
let currentProject = null;
let currentView = 'pm';
let currentFilter = 'all';
let allSignals = [];

// Project data
const PROJECTS = {
    'open-value': {
        name: 'Open Value Foundation',
        description: 'Website maintenance and multilingual support'
    },
    'gsi': {
        name: 'Global Social Impact',
        description: 'Website pages and compliance updates'
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setProjectShellVisible(false);
    setupProjectSelection();
    setupNavigation();
    setupFilters();
    setupScenario();
});

function setProjectShellVisible(visible) {
    document.getElementById('main-nav').hidden = !visible;
    document.getElementById('project-context').hidden = !visible;
}

// Project selection
function setupProjectSelection() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.project;
            selectProject(projectId);
        });
    });

    const backBtn = document.getElementById('back-to-projects');
    if (backBtn) {
        backBtn.addEventListener('click', goBackToProjects);
    }

    const brandLink = document.getElementById('brand-link');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            goBackToProjects();
        });
    }
}

function selectProject(projectId) {
    currentProject = projectId;
    const project = PROJECTS[projectId];

    // Update UI
    document.getElementById('projects-view').classList.remove('active');
    setProjectShellVisible(true);
    document.getElementById('current-project-name').textContent = project.name;

    // Load PM dashboard by default
    switchView('pm');
}

function goBackToProjects() {
    currentProject = null;

    // Hide all dashboard views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Show projects view
    document.getElementById('projects-view').classList.add('active');
    setProjectShellVisible(false);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    currentView = view;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Hide all views including projects
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // Load view data
    loadViewData(view);
}

// Filters
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderSignalFeed(allSignals);
        });
    });
}

// Scenario
function setupScenario() {
    const runBtn = document.getElementById('run-scenario');
    if (runBtn) {
        runBtn.addEventListener('click', runScopeChangeScenario);
    }
}

// API Calls
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

async function postAPI(endpoint, body) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        return null;
    }
}

// Data Loading
async function loadInitialData() {
    if (currentProject) {
        loadViewData('pm');
    }
}

async function loadViewData(view) {
    switch(view) {
        case 'pm':
            await loadPMDashboard();
            break;
        case 'client':
            await loadClientPortal();
            break;
        case 'squad':
            await loadSquadView();
            break;
    }
}

// PM Dashboard
async function loadPMDashboard() {
    const projectParam = currentProject ? `?project=${currentProject}` : '';
    const [dashboard, signals] = await Promise.all([
        fetchAPI(`/api/dashboard/pm${projectParam}`),
        fetchAPI(`/api/events${projectParam}`)
    ]);
    
    if (dashboard) {
        renderPMOverview(dashboard.overview);
        renderCriticalSignals(dashboard.criticalSignals);
        renderChannelBreakdown(dashboard.channelBreakdown);
        renderRecommendations(dashboard.recommendations);
    }
    
    if (signals) {
        allSignals = signals;
        renderSignalFeed(signals);
    }
}

function renderPMOverview(overview) {
    const container = document.getElementById('pm-overview');
    container.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Project</span>
            <span class="stat-value">${overview.project}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Status</span>
            <span class="stat-value ${overview.status === 'At Risk' ? 'negative' : 'positive'}">
                ${overview.status}
            </span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Budget Health</span>
            <span class="health-badge ${getHealthClass(overview.budgetHealth)}">
                ${overview.budgetHealth}
            </span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Timeline Health</span>
            <span class="health-badge ${getHealthClass(overview.timelineHealth)}">
                ${overview.timelineHealth}
            </span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Sprint Health</span>
            <span class="health-badge ${getHealthClass(overview.sprintHealth)}">
                ${overview.sprintHealth}
            </span>
        </div>
    `;
}

function renderCriticalSignals(signals) {
    const container = document.getElementById('critical-signals');
    if (!signals || signals.length === 0) {
        container.innerHTML = '<p class="empty-state">No critical signals</p>';
        return;
    }
    
    container.innerHTML = signals.slice(0, 5).map(signal => `
        <div class="signal-item urgency-${signal.urgency}">
            <div class="signal-header">
                <div class="signal-meta">
                    <span class="channel-badge">${signal.channel}</span>
                    <span class="signal-time">${formatDate(signal.timestamp)}</span>
                </div>
                <span class="urgency-badge ${signal.urgency}">${signal.urgency}</span>
            </div>
            <div class="signal-interpretation">${signal.interpretation}</div>
        </div>
    `).join('');
}

function renderChannelBreakdown(breakdown) {
    const container = document.getElementById('channel-breakdown');
    const channels = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    
    container.innerHTML = channels.map(([channel, count]) => `
        <div class="stat-row">
            <span class="stat-label">${capitalizeFirst(channel)}</span>
            <span class="stat-value">${count} events</span>
        </div>
    `).join('');
}

function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = '<p class="empty-state">No recommendations</p>';
        return;
    }
    
    container.innerHTML = '<ul class="rec-list">' +
        recommendations.map(rec => `<li>${rec}</li>`).join('') +
        '</ul>';
}

function renderSignalFeed(signals) {
    const container = document.getElementById('signal-feed');
    
    let filtered = signals;
    if (currentFilter !== 'all') {
        filtered = signals.filter(s => s.channel === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state" style="text-align:center;padding:2rem;">No signals found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(signal => `
        <div class="signal-item urgency-${signal.urgency}">
            <div class="signal-header">
                <div class="signal-meta">
                    <span class="channel-badge">${signal.channel}</span>
                    <span class="signal-time">${formatDate(signal.timestamp)}</span>
                    <span class="signal-author">${signal.author}</span>
                </div>
                <span class="urgency-badge ${signal.urgency}">${signal.urgency}</span>
            </div>
            <div class="signal-content">${signal.content}</div>
            <div class="signal-interpretation">
                <strong>AI interpretation:</strong> ${signal.interpretation}
            </div>
            ${signal.recommendations && signal.recommendations.length > 0 ? `
                <div class="signal-recommendations">
                    <strong>Recommendations</strong>
                    <ul>
                        ${signal.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Client Portal
async function loadClientPortal() {
    const projectParam = currentProject ? `?project=${currentProject}` : '';
    const clientData = await fetchAPI(`/api/dashboard/client${projectParam}`);
    
    if (clientData) {
        renderClientProgress(clientData.progress);
        renderClientBudget(clientData.budget);
        renderClientTimeline(clientData.timeline);
        renderClientDecisions(clientData.recentDecisions);
        renderPendingDecisions(clientData.pendingDecisions);
        renderClientRisks(clientData.risks);
    }
}

function renderClientProgress(progress) {
    const container = document.getElementById('client-progress');
    container.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Overall Completion</span>
            <span class="stat-value">${progress.overallCompletion}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.overallCompletion}%"></div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Current Phase</span>
            <span class="stat-value">${progress.currentPhase}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Milestones</span>
            <span class="stat-value">${progress.milestonesCompleted} of ${progress.milestonesTotal}</span>
        </div>
    `;
}

function renderClientBudget(budget) {
    const container = document.getElementById('client-budget');
    const percentUsed = (budget.spent / budget.current) * 100;
    const variance = budget.variance;
    
    container.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Original Budget</span>
            <span class="stat-value">$${budget.original.toLocaleString()}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Current Budget</span>
            <span class="stat-value">$${budget.current.toLocaleString()}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Budget Variance</span>
            <span class="stat-value ${variance > 0 ? 'negative' : 'positive'}">
                ${variance > 0 ? '+' : ''}$${variance.toLocaleString()}
            </span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentUsed}%"></div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Spent to Date</span>
            <span class="stat-value">$${budget.spent.toLocaleString()}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Remaining</span>
            <span class="stat-value">$${budget.remaining.toLocaleString()}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Projected Total</span>
            <span class="stat-value ${budget.projectedTotal > budget.current ? 'warning' : ''}">
                $${budget.projectedTotal.toLocaleString()}
            </span>
        </div>
    `;
}

function renderClientTimeline(timeline) {
    const container = document.getElementById('client-timeline');
    const percentComplete = (timeline.elapsed / timeline.currentEstimate) * 100;
    
    container.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Original Timeline</span>
            <span class="stat-value">${timeline.originalWeeks} weeks</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Current Estimate</span>
            <span class="stat-value ${timeline.projectedDelay > 0 ? 'warning' : ''}">${timeline.currentEstimate} weeks</span>
        </div>
        ${timeline.projectedDelay > 0 ? `
            <div class="stat-row">
                <span class="stat-label">Projected Delay</span>
                <span class="stat-value negative">+${timeline.projectedDelay} weeks</span>
            </div>
        ` : ''}
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentComplete}%"></div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Time Elapsed</span>
            <span class="stat-value">${timeline.elapsed} weeks</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Time Remaining</span>
            <span class="stat-value">${timeline.remaining} weeks</span>
        </div>
    `;
}

function renderClientDecisions(decisions) {
    const container = document.getElementById('client-decisions');
    if (!decisions || decisions.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent decisions</p>';
        return;
    }
    
    container.innerHTML = decisions.slice(0, 5).map(decision => `
        <div class="decision-item">
            <div class="item-meta">${formatDate(decision.date)}</div>
            <div>${decision.decision}</div>
            <div class="item-highlight"><strong>Impact:</strong> ${decision.impact}</div>
        </div>
    `).join('');
}

function renderPendingDecisions(pending) {
    const container = document.getElementById('pending-decisions');
    if (!pending || pending.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending decisions</p>';
        return;
    }
    
    container.innerHTML = pending.map(item => `
        <div class="pending-item">
            <div>${item.description}</div>
            <div class="item-meta">Via ${item.channel} · ${formatDate(item.date)}</div>
            <div class="item-warning"><strong>Estimated impact:</strong> ${item.estimatedImpact}</div>
        </div>
    `).join('');
}

function renderClientRisks(risks) {
    const container = document.getElementById('client-risks');
    if (!risks || risks.length === 0) {
        container.innerHTML = '<p class="empty-state">No active risks</p>';
        return;
    }
    
    container.innerHTML = risks.map(risk => `
        <div class="risk-item">
            <div class="item-warning">${risk.type} risk</div>
            <div>${risk.description}</div>
            <div class="item-meta"><strong>Impact:</strong> ${risk.impact}</div>
            <div class="item-highlight"><strong>Mitigation:</strong> ${risk.mitigation}</div>
        </div>
    `).join('');
}

// Scope Change Scenario
async function runScopeChangeScenario() {
    const resultsContainer = document.getElementById('scenario-results');
    resultsContainer.hidden = false;
    resultsContainer.innerHTML = '<p class="empty-state" style="text-align:center;">Calculating impact…</p>';
    
    const scopeChange = {
        type: 'feature-addition',
        description: 'Add historical exchange rate trends chart to currency selector',
        estimatedEffort: 13
    };
    
    const consequences = await postAPI('/api/scenario/scope-change', { change: scopeChange });
    
    if (consequences) {
        renderScenarioResults(consequences);
    } else {
        resultsContainer.innerHTML = '<p class="empty-state" style="color:var(--bh-danger);">Error calculating scenario</p>';
    }
}

function renderScenarioResults(consequences) {
    const container = document.getElementById('scenario-results');
    container.hidden = false;
    const { immediate, cascading, mitigation } = consequences;
    
    container.innerHTML = `
        <div class="scenario-section">
            <h4>Immediate impact</h4>
            <div class="comparison-grid">
                <div class="comparison-box">
                    <h5>Budget</h5>
                    <div class="stat-row">
                        <span class="stat-label">Increase</span>
                        <span class="stat-value negative">+$${immediate.budget.increase.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">New total</span>
                        <span class="stat-value">$${immediate.budget.newTotal.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">% increase</span>
                        <span class="stat-value">${immediate.budget.percentageIncrease.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="comparison-box">
                    <h5>Timeline</h5>
                    <div class="stat-row">
                        <span class="stat-label">Weeks added</span>
                        <span class="stat-value negative">+${immediate.timeline.weeksAdded}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">New estimate</span>
                        <span class="stat-value">${immediate.timeline.newEstimate} weeks</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Completion</span>
                        <span class="stat-value">${immediate.timeline.newCompletionDate}</span>
                    </div>
                </div>
            </div>
            <p class="item-meta" style="margin-top:1rem;">
                <strong>Sprint impact:</strong> ${immediate.sprint.pointsAdded} story points across ${immediate.sprint.sprintsRequired} sprint(s)
            </p>
        </div>

        ${cascading.riskRipple.length > 0 ? `
            <div class="scenario-section">
                <h4>Risk assessment</h4>
                ${cascading.riskRipple.map(risk => `
                    <div class="risk-item">
                        <div class="item-danger">${risk.type} — ${risk.level} risk</div>
                        <div>${risk.description}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="scenario-section">
            <h4>Mitigation options</h4>
            ${mitigation.options.map(option => `
                <div class="comparison-box ${option.recommendation ? 'recommended' : ''}" style="margin-bottom:1rem;">
                    <div class="option-header">
                        <h5>${option.name}</h5>
                        ${option.recommendation ? '<span class="health-badge healthy">Recommended</span>' : ''}
                    </div>
                    <p class="item-meta">${option.description}</p>
                    <div class="stat-row">
                        <span class="stat-label">Budget impact</span>
                        <span class="stat-value">${option.budgetImpact > 0 ? '+' : ''}$${option.budgetImpact.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Timeline impact</span>
                        <span class="stat-value">${option.timelineImpact > 0 ? '+' : ''}${option.timelineImpact} weeks</span>
                    </div>
                    <div class="item-highlight"><strong>Pros:</strong> ${option.pros.join(' · ')}</div>
                    <div class="item-warning" style="margin-top:0.35rem;"><strong>Cons:</strong> ${option.cons.join(' · ')}</div>
                </div>
            `).join('')}
        </div>

        <div class="scenario-section">
            <h4>Recommendations</h4>
            <ul class="rec-list">
                ${mitigation.recommendations.map(rec => `<li>${rec.replace(/^[⚠️💰📅📋🗣️]\s*/, '')}</li>`).join('')}
            </ul>
        </div>
    `;
}

// Squad View
async function loadSquadView() {
    const projectParam = currentProject ? `?project=${currentProject}` : '';
    const squadData = await fetchAPI(`/api/dashboard/squad${projectParam}`);
    
    if (squadData) {
        renderSquadSprint(squadData.sprint);
        renderSquadBlockers(squadData.blockers);
        renderSquadContext(squadData.contextFromOtherChannels);
        renderSquadUpcoming(squadData.upcomingWork);
    }
}

function renderSquadSprint(sprint) {
    const container = document.getElementById('squad-sprint');
    const completion = (sprint.completed / sprint.committed) * 100;
    
    container.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Sprint</span>
            <span class="stat-value">${sprint.name}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Health</span>
            <span class="health-badge ${getHealthClass(sprint.health)}">${sprint.health}</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${completion}%"></div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Velocity</span>
            <span class="stat-value">${sprint.velocity} pts/sprint</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Remaining</span>
            <span class="stat-value">${sprint.remaining} points</span>
        </div>
    `;
}

function renderSquadBlockers(blockers) {
    const container = document.getElementById('squad-blockers');
    if (!blockers || blockers.length === 0) {
        container.innerHTML = '<p class="empty-state">No active blockers</p>';
        return;
    }
    
    container.innerHTML = blockers.map(blocker => `
        <div class="blocker-item">
            <div class="item-danger">${blocker.severity} priority</div>
            <div>${blocker.description}</div>
            <div class="item-meta">Owner: ${blocker.owner}</div>
        </div>
    `).join('');
}

function renderSquadContext(contexts) {
    const container = document.getElementById('squad-context');
    if (!contexts || contexts.length === 0) {
        container.innerHTML = '<p class="empty-state">No updates from other channels</p>';
        return;
    }
    
    container.innerHTML = contexts.map(ctx => `
        <div class="decision-item">
            <div class="signal-header">
                <span class="channel-badge">${ctx.channel}</span>
                <span class="signal-time">${formatDate(ctx.date)}</span>
            </div>
            <div>${ctx.summary}</div>
            ${ctx.actionRequired ? '<div class="item-warning">Action required</div>' : ''}
        </div>
    `).join('');
}

function renderSquadUpcoming(upcoming) {
    const container = document.getElementById('squad-upcoming');
    if (!upcoming || upcoming.length === 0) {
        container.innerHTML = '<p class="empty-state">No upcoming work</p>';
        return;
    }
    
    container.innerHTML = upcoming.map(work => `
        <div class="stat-row">
            <span class="stat-label">${work.title}</span>
            <span class="stat-value">${work.estimatedEffort}</span>
        </div>
        <div class="item-meta">Source: ${work.source}</div>
    `).join('');
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getHealthClass(health) {
    const h = health.toLowerCase();
    if (h.includes('healthy') || h.includes('on track') || h.includes('normal')) return 'healthy';
    if (h.includes('warning') || h.includes('behind') || h.includes('at risk')) return 'warning';
    if (h.includes('critical') || h.includes('blocked')) return 'critical';
    return 'healthy';
}
