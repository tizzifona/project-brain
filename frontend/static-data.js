// Client-side data layer for GitHub Pages (no backend)
const STATIC_PROJECT_FILES = {
    'open-value': 'data/open-value.json',
    'gsi': 'data/gsi.json'
};

const staticCache = {};

export function isStaticMode() {
    return window.location.hostname.endsWith('github.io')
        || new URLSearchParams(window.location.search).has('static');
}

export async function loadStaticProject(projectId) {
    if (!STATIC_PROJECT_FILES[projectId]) return null;
    if (!staticCache[projectId]) {
        const res = await fetch(STATIC_PROJECT_FILES[projectId]);
        staticCache[projectId] = await res.json();
    }
    return staticCache[projectId];
}

export async function staticFetchAPI(endpoint, projectId) {
    const data = await loadStaticProject(projectId);
    if (!data) return null;

    if (endpoint.startsWith('/api/dashboard/pm')) {
        return buildPMDashboard(data);
    }
    if (endpoint.startsWith('/api/dashboard/client')) {
        return buildClientPortal(data);
    }
    if (endpoint.startsWith('/api/dashboard/squad')) {
        return buildSquadView(data);
    }
    if (endpoint.startsWith('/api/events')) {
        return data.events.map(interpretEvent);
    }
    return null;
}

export async function staticPostAPI(endpoint, body, projectId) {
    if (!endpoint.startsWith('/api/scenario/scope-change')) return null;
    const data = await loadStaticProject(projectId);
    if (!data) return null;
    return calculateScopeChangeImpact(body.change, data);
}

function interpretEvent(event) {
    let interpretation = '';
    const recommendations = [];
    let urgency = 'low';

    if (event.type === 'scope-change') {
        interpretation = `Scope change detected: ${event.impact.scope}. Budget impact: $${event.impact.budget.toLocaleString()}, Timeline impact: ${event.impact.timeline} weeks.`;
        urgency = 'critical';
        if (event.tags.includes('confirmed')) {
            recommendations.push('Update project plan and communicate to all stakeholders');
            recommendations.push('Adjust sprint backlog to accommodate new work');
        } else {
            recommendations.push('Obtain formal client confirmation before proceeding');
            recommendations.push('Prepare impact assessment for client review');
        }
    } else if (event.type === 'blocker') {
        interpretation = `Blocker identified in ${event.channel}. Risk level: ${event.impact.risk || 'medium'}. May delay timeline by ${event.impact.timeline} weeks.`;
        urgency = 'high';
        recommendations.push('Escalate blocker and assign owner immediately');
        recommendations.push('Prepare contingency plan if blocker persists');
    } else if (event.type === 'decision') {
        interpretation = `Key decision made via ${event.channel}. `;
        if (event.tags.includes('confirmed')) {
            interpretation += 'Decision confirmed and ready for implementation.';
            urgency = 'medium';
        } else {
            interpretation += 'Decision pending formal confirmation.';
            urgency = 'high';
            recommendations.push('Follow up for written confirmation');
        }
    } else if (event.severity === 'high' || event.severity === 'critical') {
        interpretation = `High-priority signal: ${event.content}`;
        urgency = event.severity;
    } else {
        interpretation = `Regular update from ${event.channel}: ${event.content}`;
        urgency = 'low';
    }

    return { ...event, interpretation, recommendations, urgency };
}

function extractCriticalSignals(events) {
    return events.filter(e =>
        e.urgency === 'critical' || e.urgency === 'high' ||
        e.type === 'scope-change' || e.type === 'blocker' ||
        e.tags.includes('decision-pending')
    );
}

function buildPMDashboard(data) {
    const interpretedEvents = data.events.map(interpretEvent);
    const criticalSignals = extractCriticalSignals(interpretedEvents);

    return {
        overview: {
            project: data.project.name,
            status: data.timeline.at_risk ? 'At Risk' : 'On Track',
            budgetHealth: calculateBudgetHealth(data.budget),
            timelineHealth: calculateTimelineHealth(data.timeline),
            sprintHealth: calculateSprintHealth(data.sprint)
        },
        signals: interpretedEvents.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        criticalSignals,
        recommendations: generatePMRecommendations(data, criticalSignals),
        channelBreakdown: getChannelBreakdown(data.events)
    };
}

function buildClientPortal(data) {
    const recentDecisions = data.events.filter(e =>
        e.type === 'decision' && e.tags.includes('confirmed')
    );

    return {
        projectName: data.project.name,
        progress: {
            overallCompletion: Math.round((data.timeline.weeks_elapsed / data.timeline.current_estimate) * 100),
            currentPhase: 'Development & Integration',
            milestonesCompleted: 8,
            milestonesTotal: 12
        },
        budget: {
            original: data.budget.original,
            current: data.budget.current_total,
            spent: data.budget.spent_to_date,
            remaining: data.budget.remaining,
            projectedTotal: projectFinalBudget(data),
            variance: data.budget.current_total - data.budget.original,
            burnRate: data.budget.burn_rate_weekly
        },
        timeline: {
            originalWeeks: data.timeline.original_weeks,
            currentEstimate: data.timeline.current_estimate,
            elapsed: data.timeline.weeks_elapsed,
            remaining: data.timeline.weeks_remaining,
            projectedDelay: data.timeline.current_estimate - data.timeline.original_weeks
        },
        recentDecisions: recentDecisions.map(e => ({
            date: e.timestamp,
            decision: e.content,
            impact: formatImpactForClient(e.impact)
        })),
        pendingDecisions: extractPendingDecisions(data.events),
        risks: identifyClientFacingRisks(data)
    };
}

function buildSquadView(data) {
    return {
        sprint: {
            name: data.sprint.current_sprint,
            velocity: data.sprint.velocity,
            committed: data.sprint.committed_points,
            completed: data.sprint.completed_points,
            remaining: data.sprint.committed_points - data.sprint.completed_points,
            health: calculateSprintHealth(data.sprint)
        },
        blockers: data.sprint.blockers.map(b => ({
            description: b,
            severity: 'high',
            owner: 'Unassigned'
        })),
        upcomingWork: getUpcomingWork(data.events),
        contextFromOtherChannels: getSquadContextUpdates(data.events),
        teamCapacity: { current: 'Normal', upcomingChanges: [] }
    };
}

function calculateBudgetHealth(budget) {
    const percentUsed = (budget.spent_to_date / budget.current_total) * 100;
    if (percentUsed > 85) return 'Critical';
    if (percentUsed > 70) return 'Warning';
    return 'Healthy';
}

function calculateTimelineHealth(timeline) {
    if (timeline.at_risk) return 'At Risk';
    return 'Healthy';
}

function calculateSprintHealth(sprint) {
    const completionRate = (sprint.completed_points / sprint.committed_points) * 100;
    if (sprint.blocked_points > 0) return 'Blocked';
    if (completionRate < 50) return 'Behind';
    if (completionRate > 80) return 'On Track';
    return 'Normal';
}

function generatePMRecommendations(data, criticalSignals) {
    const recommendations = [];
    if (data.timeline.at_risk) {
        recommendations.push('Timeline at risk: Consider scope reduction or timeline extension');
    }
    if (criticalSignals.some(s => s.type === 'blocker')) {
        recommendations.push('Active blockers detected: Prioritize blocker resolution');
    }
    if (data.budget.remaining < data.budget.burn_rate_weekly * 2) {
        recommendations.push('Budget running low: Review remaining work and adjust scope');
    }
    return recommendations;
}

function getChannelBreakdown(events) {
    return events.reduce((acc, event) => {
        acc[event.channel] = (acc[event.channel] || 0) + 1;
        return acc;
    }, {});
}

function projectFinalBudget(data) {
    return data.budget.spent_to_date + (data.timeline.weeks_remaining * data.budget.burn_rate_weekly);
}

function formatImpactForClient(impact) {
    const parts = [];
    if (impact.budget !== 0) {
        parts.push(`Budget: ${impact.budget > 0 ? '+' : ''}$${impact.budget.toLocaleString()}`);
    }
    if (impact.timeline !== 0) {
        parts.push(`Timeline: ${impact.timeline > 0 ? '+' : ''}${impact.timeline} weeks`);
    }
    return parts.join(', ') || 'No direct impact';
}

function extractPendingDecisions(events) {
    return events
        .filter(e => e.tags.includes('decision-pending') || e.tags.includes('potential-scope-creep'))
        .map(e => ({
            description: e.content,
            channel: e.channel,
            date: e.timestamp,
            estimatedImpact: formatImpactForClient(e.impact)
        }));
}

function identifyClientFacingRisks(data) {
    const risks = [];
    if (data.timeline.at_risk) {
        risks.push({
            type: 'Timeline',
            description: 'Project timeline may extend beyond original estimate',
            impact: 'Potential delay in launch date',
            mitigation: 'Phased delivery approach proposed'
        });
    }
    if (data.budget.remaining < data.budget.burn_rate_weekly * 3) {
        risks.push({
            type: 'Budget',
            description: 'Budget utilization tracking ahead of timeline progress',
            impact: 'May require additional budget for completion',
            mitigation: 'Weekly budget review and scope prioritization'
        });
    }
    return risks;
}

function getUpcomingWork(events) {
    return events
        .filter(e => e.tags.includes('feature-request') || e.type === 'scope-change')
        .filter(e => e.tags.includes('confirmed'))
        .map(e => ({
            title: e.content.substring(0, 60) + '...',
            source: e.channel,
            estimatedEffort: `${Math.ceil(e.impact.timeline * 12)} story points`
        }));
}

function getSquadContextUpdates(events) {
    return events
        .filter(e => e.channel === 'voice' || e.channel === 'email')
        .filter(e => e.type === 'decision' || e.type === 'scope-change' || e.type === 'meeting')
        .slice(-5)
        .map(e => ({
            date: e.timestamp,
            channel: e.channel,
            summary: e.content,
            actionRequired: e.tags.includes('confirmed')
        }));
}

function calculateScopeChangeImpact(change, projectData) {
    const effort = change.estimatedEffort || 13;
    const pointCost = 1200;
    const developmentCost = effort * pointCost;
    const total = Math.round(developmentCost * 1.45);
    const velocity = projectData.sprint.velocity;
    const weeksAdded = Math.ceil(effort / velocity) * 2;

    return {
        immediate: {
            budget: {
                increase: total,
                newTotal: projectData.budget.current_total + total,
                percentageIncrease: (total / projectData.budget.current_total) * 100
            },
            timeline: {
                weeksAdded,
                newEstimate: projectData.timeline.current_estimate + weeksAdded,
                newCompletionDate: `Week ${projectData.timeline.current_estimate + weeksAdded}`
            },
            sprint: {
                pointsAdded: effort,
                sprintsRequired: Math.ceil(effort / velocity)
            }
        },
        cascading: {
            riskRipple: [{
                type: 'Scope',
                level: 'Medium',
                description: 'Additional feature may affect current sprint commitments'
            }]
        },
        mitigation: {
            options: [{
                name: 'Phased delivery',
                description: 'Deliver core functionality first, defer enhancements',
                budgetImpact: Math.round(total * 0.5),
                timelineImpact: Math.ceil(weeksAdded / 2),
                recommendation: true,
                pros: ['Reduces immediate budget impact', 'Faster initial delivery'],
                cons: ['Partial feature set initially']
            }],
            recommendations: [
                'Review scope change with client before committing',
                'Update sprint backlog and timeline estimates'
            ]
        }
    };
}
