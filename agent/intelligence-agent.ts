import { DataService } from "./data-service.ts";
import { ConsequenceEngine } from "./consequence-engine.ts";

interface Event {
  id: string;
  timestamp: string;
  channel: string;
  type: string;
  severity: string;
  author: string;
  content: string;
  tags: string[];
  impact: {
    budget: number;
    timeline: number;
    scope: string;
    risk?: string;
    dependencies?: string[];
  };
}

interface InterpretedEvent extends Event {
  interpretation: string;
  recommendations: string[];
  urgency: "low" | "medium" | "high" | "critical";
}

export class IntelligenceAgent {
  constructor(
    private dataService: DataService,
    private consequenceEngine: ConsequenceEngine
  ) {}

  async getInterpretedEvents(): Promise<InterpretedEvent[]> {
    const data = await this.dataService.getData();
    return data.events.map((event: Event) => this.interpretEvent(event));
  }

  async getEventsByChannel(channel: string): Promise<InterpretedEvent[]> {
    const data = await this.dataService.getData();
    return data.events
      .filter((e: Event) => e.channel === channel)
      .map((event: Event) => this.interpretEvent(event));
  }

  async getProjectOverview() {
    const data = await this.dataService.getData();
    return {
      project: data.project,
      budget: data.budget,
      timeline: data.timeline,
      sprint: data.sprint,
      summary: this.generateProjectSummary(data)
    };
  }

  async getPMDashboard() {
    const data = await this.dataService.getData();
    const interpretedEvents = data.events.map((e: Event) => this.interpretEvent(e));
    const criticalSignals = this.extractCriticalSignals(interpretedEvents);
    
    return {
      overview: {
        project: data.project.name,
        status: data.timeline.at_risk ? "At Risk" : "On Track",
        budgetHealth: this.calculateBudgetHealth(data.budget),
        timelineHealth: this.calculateTimelineHealth(data.timeline),
        sprintHealth: this.calculateSprintHealth(data.sprint)
      },
      signals: interpretedEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      criticalSignals,
      recommendations: this.generatePMRecommendations(data, criticalSignals),
      channelBreakdown: this.getChannelBreakdown(data.events)
    };
  }

  async getClientPortal() {
    const data = await this.dataService.getData();
    const recentDecisions = data.events.filter((e: Event) => 
      e.type === "decision" && e.tags.includes("confirmed")
    );

    return {
      projectName: data.project.name,
      progress: {
        overallCompletion: this.calculateProjectCompletion(data),
        currentPhase: "Development & Integration",
        milestonesCompleted: 8,
        milestonesTotal: 12
      },
      budget: {
        original: data.budget.original,
        current: data.budget.current_total,
        spent: data.budget.spent_to_date,
        remaining: data.budget.remaining,
        projectedTotal: this.projectFinalBudget(data),
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
      recentDecisions: recentDecisions.map((e: Event) => ({
        date: e.timestamp,
        decision: e.content,
        impact: this.formatImpactForClient(e.impact)
      })),
      pendingDecisions: this.extractPendingDecisions(data.events),
      risks: this.identifyClientFacingRisks(data)
    };
  }

  async getSquadView() {
    const data = await this.dataService.getData();
    
    return {
      sprint: {
        name: data.sprint.current_sprint,
        velocity: data.sprint.velocity,
        committed: data.sprint.committed_points,
        completed: data.sprint.completed_points,
        remaining: data.sprint.committed_points - data.sprint.completed_points,
        health: this.calculateSprintHealth(data.sprint)
      },
      blockers: data.sprint.blockers.map((b: string) => ({
        description: b,
        severity: "high",
        owner: "Unassigned"
      })),
      upcomingWork: this.getUpcomingWork(data.events),
      contextFromOtherChannels: this.getSquadContextUpdates(data.events),
      teamCapacity: {
        current: "Normal",
        upcomingChanges: []
      }
    };
  }

  async getCriticalSignals(): Promise<InterpretedEvent[]> {
    const interpreted = await this.getInterpretedEvents();
    return this.extractCriticalSignals(interpreted);
  }

  async getBudgetAnalysis() {
    const data = await this.dataService.getData();
    const budgetEvents = data.events.filter((e: Event) => e.impact.budget !== 0);

    return {
      current: data.budget,
      trajectory: this.calculateBudgetTrajectory(data),
      changes: budgetEvents.map((e: Event) => ({
        date: e.timestamp,
        channel: e.channel,
        change: e.impact.budget,
        reason: e.content,
        approved: e.tags.includes("confirmed")
      })),
      recommendations: this.generateBudgetRecommendations(data)
    };
  }

  async getTimelineAnalysis() {
    const data = await this.dataService.getData();
    const timelineEvents = data.events.filter((e: Event) => e.impact.timeline !== 0);

    return {
      current: data.timeline,
      delays: timelineEvents.map((e: Event) => ({
        date: e.timestamp,
        channel: e.channel,
        impact: e.impact.timeline,
        reason: e.content
      })),
      criticalPath: this.identifyCriticalPath(data),
      recommendations: this.generateTimelineRecommendations(data)
    };
  }

  // Private helper methods

  private interpretEvent(event: Event): InterpretedEvent {
    let interpretation = "";
    const recommendations: string[] = [];
    let urgency: "low" | "medium" | "high" | "critical" = "low";

    if (event.type === "scope-change") {
      interpretation = `Scope change detected: ${event.impact.scope}. Budget impact: $${event.impact.budget.toLocaleString()}, Timeline impact: ${event.impact.timeline} weeks.`;
      urgency = "critical";
      
      if (event.tags.includes("confirmed")) {
        recommendations.push("Update project plan and communicate to all stakeholders");
        recommendations.push("Adjust sprint backlog to accommodate new work");
      } else {
        recommendations.push("Obtain formal client confirmation before proceeding");
        recommendations.push("Prepare impact assessment for client review");
      }
    } else if (event.type === "blocker") {
      interpretation = `Blocker identified in ${event.channel}. Risk level: ${event.impact.risk}. May delay timeline by ${event.impact.timeline} weeks.`;
      urgency = "high";
      recommendations.push("Escalate blocker and assign owner immediately");
      recommendations.push("Prepare contingency plan if blocker persists");
    } else if (event.type === "decision") {
      interpretation = `Key decision made via ${event.channel}. `;
      if (event.tags.includes("confirmed")) {
        interpretation += "Decision confirmed and ready for implementation.";
        urgency = "medium";
      } else {
        interpretation += "Decision pending formal confirmation.";
        urgency = "high";
        recommendations.push("Follow up for written confirmation");
      }
    } else if (event.severity === "high" || event.severity === "critical") {
      interpretation = `High-priority signal: ${event.content}`;
      urgency = event.severity as "high" | "critical";
    } else {
      interpretation = `Regular update from ${event.channel}: ${event.content}`;
      urgency = "low";
    }

    return {
      ...event,
      interpretation,
      recommendations,
      urgency
    };
  }

  private extractCriticalSignals(events: InterpretedEvent[]): InterpretedEvent[] {
    return events.filter(e => 
      e.urgency === "critical" || e.urgency === "high" ||
      e.type === "scope-change" || e.type === "blocker" ||
      e.tags.includes("decision-pending")
    );
  }

  private generateProjectSummary(data: any): string {
    const status = data.timeline.at_risk ? "at risk" : "on track";
    const budgetVariance = data.budget.current_total - data.budget.original;
    
    return `${data.project.name} is currently ${status}. ` +
           `Budget variance: $${budgetVariance.toLocaleString()}. ` +
           `${data.timeline.weeks_remaining} weeks remaining of ${data.timeline.current_estimate} week timeline.`;
  }

  private calculateBudgetHealth(budget: any): string {
    const percentUsed = (budget.spent_to_date / budget.current_total) * 100;
    if (percentUsed > 85) return "Critical";
    if (percentUsed > 70) return "Warning";
    return "Healthy";
  }

  private calculateTimelineHealth(timeline: any): string {
    if (timeline.at_risk) return "At Risk";
    const percentComplete = (timeline.weeks_elapsed / timeline.current_estimate) * 100;
    if (percentComplete > 70) return "On Track";
    return "Healthy";
  }

  private calculateSprintHealth(sprint: any): string {
    const completionRate = (sprint.completed_points / sprint.committed_points) * 100;
    if (sprint.blocked_points > 0) return "Blocked";
    if (completionRate < 50) return "Behind";
    if (completionRate > 80) return "On Track";
    return "Normal";
  }

  private generatePMRecommendations(data: any, criticalSignals: InterpretedEvent[]): string[] {
    const recommendations: string[] = [];

    if (data.timeline.at_risk) {
      recommendations.push("Timeline at risk: Consider scope reduction or timeline extension");
    }

    if (criticalSignals.some(s => s.type === "blocker")) {
      recommendations.push("Active blockers detected: Prioritize blocker resolution");
    }

    if (data.budget.remaining < data.budget.burn_rate_weekly * 2) {
      recommendations.push("Budget running low: Review remaining work and adjust scope");
    }

    return recommendations;
  }

  private getChannelBreakdown(events: Event[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.channel] = (acc[event.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateProjectCompletion(data: any): number {
    return Math.round((data.timeline.weeks_elapsed / data.timeline.current_estimate) * 100);
  }

  private projectFinalBudget(data: any): number {
    const weeksRemaining = data.timeline.weeks_remaining;
    return data.budget.spent_to_date + (weeksRemaining * data.budget.burn_rate_weekly);
  }

  private formatImpactForClient(impact: any): string {
    const parts: string[] = [];
    if (impact.budget !== 0) {
      parts.push(`Budget: ${impact.budget > 0 ? '+' : ''}$${impact.budget.toLocaleString()}`);
    }
    if (impact.timeline !== 0) {
      parts.push(`Timeline: ${impact.timeline > 0 ? '+' : ''}${impact.timeline} weeks`);
    }
    return parts.join(", ") || "No direct impact";
  }

  private extractPendingDecisions(events: Event[]): any[] {
    return events
      .filter(e => e.tags.includes("decision-pending") || e.tags.includes("potential-scope-creep"))
      .map(e => ({
        description: e.content,
        channel: e.channel,
        date: e.timestamp,
        estimatedImpact: this.formatImpactForClient(e.impact)
      }));
  }

  private identifyClientFacingRisks(data: any): any[] {
    const risks: any[] = [];

    if (data.timeline.at_risk) {
      risks.push({
        type: "Timeline",
        description: "Project timeline may extend beyond original estimate",
        impact: "Potential delay in launch date",
        mitigation: "Phased delivery approach proposed"
      });
    }

    if (data.budget.remaining < data.budget.burn_rate_weekly * 3) {
      risks.push({
        type: "Budget",
        description: "Budget utilization tracking ahead of timeline progress",
        impact: "May require additional budget for completion",
        mitigation: "Weekly budget review and scope prioritization"
      });
    }

    return risks;
  }

  private getUpcomingWork(events: Event[]): any[] {
    return events
      .filter(e => e.tags.includes("feature-request") || e.type === "scope-change")
      .filter(e => e.tags.includes("confirmed"))
      .map(e => ({
        title: e.content.substring(0, 60) + "...",
        source: e.channel,
        estimatedEffort: `${Math.ceil(e.impact.timeline * 12)} story points`
      }));
  }

  private getSquadContextUpdates(events: Event[]): any[] {
    return events
      .filter(e => e.channel === "voice" || e.channel === "email")
      .filter(e => e.type === "decision" || e.type === "scope-change")
      .slice(-5)
      .map(e => ({
        date: e.timestamp,
        channel: e.channel,
        summary: e.content,
        actionRequired: e.tags.includes("confirmed")
      }));
  }

  private calculateBudgetTrajectory(data: any): string {
    const projected = this.projectFinalBudget(data);
    const overage = projected - data.budget.current_total;
    
    if (overage > 5000) return "Over budget";
    if (overage > 0) return "Slightly over";
    return "On budget";
  }

  private generateBudgetRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    const projected = this.projectFinalBudget(data);
    
    if (projected > data.budget.current_total) {
      recommendations.push("Current burn rate will exceed approved budget");
      recommendations.push("Consider scope reduction or budget increase request");
    }

    return recommendations;
  }

  private identifyCriticalPath(data: any): string[] {
    return [
      "Complete USD currency integration",
      "Resolve legal review for payment processor",
      "Complete remaining sprint work",
      "Client UAT and approval"
    ];
  }

  private generateTimelineRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.timeline.at_risk) {
      recommendations.push("Timeline extension of 2 weeks recommended");
      recommendations.push("Consider parallel workstreams to accelerate delivery");
    }

    return recommendations;
  }
}
