export class ConsequenceEngine {
  
  calculateScopeChangeImpact(change: any, projectData: any) {
    const { type, description, estimatedEffort } = change;
    
    // Base calculations
    const budgetImpact = this.calculateBudgetImpact(estimatedEffort, projectData);
    const timelineImpact = this.calculateTimelineImpact(estimatedEffort, projectData);
    const sprintImpact = this.calculateSprintImpact(estimatedEffort, projectData);
    const riskAssessment = this.assessRisk(budgetImpact, timelineImpact, projectData);
    
    // Calculate ripple effects
    const consequences = {
      immediate: {
        budget: {
          increase: budgetImpact.total,
          newTotal: projectData.budget.current_total + budgetImpact.total,
          percentageIncrease: (budgetImpact.total / projectData.budget.current_total) * 100,
          breakdown: budgetImpact.breakdown
        },
        timeline: {
          weeksAdded: timelineImpact.weeks,
          newEstimate: projectData.timeline.current_estimate + timelineImpact.weeks,
          newCompletionDate: this.calculateNewDate(
            projectData.timeline.weeks_remaining,
            timelineImpact.weeks
          ),
          impact: timelineImpact.description
        },
        sprint: {
          pointsAdded: sprintImpact.points,
          sprintsRequired: sprintImpact.sprintsNeeded,
          velocityImpact: sprintImpact.velocityImpact,
          currentSprintAffected: sprintImpact.currentSprintAffected
        }
      },
      cascading: {
        budgetRipple: this.calculateBudgetRipple(budgetImpact, projectData),
        resourceRipple: this.calculateResourceRipple(timelineImpact, projectData),
        stakeholderRipple: this.calculateStakeholderRipple(budgetImpact, timelineImpact),
        riskRipple: riskAssessment
      },
      mitigation: {
        options: this.generateMitigationOptions(budgetImpact, timelineImpact, projectData),
        recommendations: this.generateRecommendations(budgetImpact, timelineImpact, riskAssessment)
      },
      visualization: {
        beforeAfter: this.createBeforeAfterComparison(budgetImpact, timelineImpact, projectData),
        trajectory: this.createTrajectoryData(budgetImpact, timelineImpact, projectData)
      }
    };
    
    return consequences;
  }
  
  private calculateBudgetImpact(effort: number, projectData: any) {
    // Effort is in story points, convert to budget
    const pointCost = 1200; // Average cost per story point
    const developmentCost = effort * pointCost;
    const designCost = developmentCost * 0.2; // 20% for design
    const testingCost = developmentCost * 0.15; // 15% for QA
    const pmCost = developmentCost * 0.1; // 10% for PM overhead
    
    const total = developmentCost + designCost + testingCost + pmCost;
    
    return {
      total: Math.round(total),
      breakdown: {
        development: developmentCost,
        design: designCost,
        testing: testingCost,
        projectManagement: pmCost
      }
    };
  }
  
  private calculateTimelineImpact(effort: number, projectData: any) {
    const velocity = projectData.sprint.velocity;
    const sprintsNeeded = Math.ceil(effort / velocity);
    const weeksNeeded = sprintsNeeded * 2; // 2-week sprints
    
    return {
      weeks: weeksNeeded,
      sprints: sprintsNeeded,
      description: `Requires ${sprintsNeeded} sprint${sprintsNeeded > 1 ? 's' : ''} (${weeksNeeded} weeks) at current velocity`
    };
  }
  
  private calculateSprintImpact(effort: number, projectData: any) {
    const velocity = projectData.sprint.velocity;
    const sprintsNeeded = Math.ceil(effort / velocity);
    const remainingCapacity = projectData.sprint.committed_points - projectData.sprint.completed_points;
    
    return {
      points: effort,
      sprintsNeeded,
      velocityImpact: effort > velocity ? "Exceeds current velocity" : "Within velocity",
      currentSprintAffected: effort > remainingCapacity
    };
  }
  
  private assessRisk(budgetImpact: any, timelineImpact: any, projectData: any) {
    const risks = [];
    
    const newBudget = projectData.budget.current_total + budgetImpact.total;
    const budgetIncrease = (budgetImpact.total / projectData.budget.original) * 100;
    
    if (budgetIncrease > 20) {
      risks.push({
        type: "Budget",
        level: "High",
        description: `Budget increase of ${budgetIncrease.toFixed(1)}% may require client re-approval`,
        probability: "High",
        impact: "High"
      });
    } else if (budgetIncrease > 10) {
      risks.push({
        type: "Budget",
        level: "Medium",
        description: "Significant budget increase requires client notification",
        probability: "Medium",
        impact: "Medium"
      });
    }
    
    if (timelineImpact.weeks > 2) {
      risks.push({
        type: "Timeline",
        level: "High",
        description: "Timeline extension may affect client launch plans",
        probability: "High",
        impact: "High"
      });
    }
    
    const projectedBurn = (projectData.timeline.weeks_remaining + timelineImpact.weeks) * projectData.budget.burn_rate_weekly;
    if (projectedBurn > projectData.budget.remaining + budgetImpact.total) {
      risks.push({
        type: "Cash Flow",
        level: "Critical",
        description: "Extended timeline will exceed available budget",
        probability: "High",
        impact: "Critical"
      });
    }
    
    return risks;
  }
  
  private calculateBudgetRipple(budgetImpact: any, projectData: any) {
    const newTotal = projectData.budget.current_total + budgetImpact.total;
    const newRemaining = newTotal - projectData.budget.spent_to_date;
    
    return {
      newBudgetTotal: newTotal,
      newRemaining: newRemaining,
      weeksOfRunwayCurrent: Math.floor(projectData.budget.remaining / projectData.budget.burn_rate_weekly),
      weeksOfRunwayNew: Math.floor(newRemaining / projectData.budget.burn_rate_weekly),
      clientApprovalRequired: budgetImpact.total > 5000,
      contractAmendmentRequired: budgetImpact.total > 10000
    };
  }
  
  private calculateResourceRipple(timelineImpact: any, projectData: any) {
    return {
      additionalSprintCount: timelineImpact.sprints,
      teamHoursRequired: timelineImpact.weeks * 40 * 4, // 4 team members, 40 hrs/week
      potentialResourceConflicts: timelineImpact.weeks > 4,
      otherProjectsAffected: []
    };
  }
  
  private calculateStakeholderRipple(budgetImpact: any, timelineImpact: any) {
    const impacts = [];
    
    if (budgetImpact.total > 5000) {
      impacts.push({
        stakeholder: "Client",
        impact: "Requires budget increase approval",
        action: "Schedule review meeting",
        urgency: "High"
      });
    }
    
    if (timelineImpact.weeks > 2) {
      impacts.push({
        stakeholder: "Client",
        impact: "Launch date may shift",
        action: "Update project timeline and communicate",
        urgency: "High"
      });
      
      impacts.push({
        stakeholder: "Development Team",
        impact: "Sprint plan needs adjustment",
        action: "Replan backlog and sprints",
        urgency: "Medium"
      });
    }
    
    return impacts;
  }
  
  private generateMitigationOptions(budgetImpact: any, timelineImpact: any, projectData: any) {
    const options = [];
    
    // Option 1: Full implementation
    options.push({
      name: "Full Implementation",
      description: "Implement complete scope change as described",
      budgetImpact: budgetImpact.total,
      timelineImpact: timelineImpact.weeks,
      pros: ["Complete feature set", "No technical debt"],
      cons: [`+$${budgetImpact.total.toLocaleString()}`, `+${timelineImpact.weeks} weeks`],
      recommendation: false
    });
    
    // Option 2: MVP approach
    const mvpBudget = Math.round(budgetImpact.total * 0.6);
    const mvpTimeline = Math.ceil(timelineImpact.weeks * 0.6);
    options.push({
      name: "MVP Approach",
      description: "Implement core functionality, defer enhancements to phase 2",
      budgetImpact: mvpBudget,
      timelineImpact: mvpTimeline,
      pros: ["Faster delivery", "Lower initial cost", "Validate before full build"],
      cons: ["Reduced feature set", "May require refactoring later"],
      recommendation: true
    });
    
    // Option 3: Defer to phase 2
    options.push({
      name: "Defer to Phase 2",
      description: "Complete current scope, add this feature in next phase",
      budgetImpact: 0,
      timelineImpact: 0,
      pros: ["No impact on current timeline", "No additional budget now"],
      cons: ["Feature delayed", "May affect client satisfaction"],
      recommendation: false
    });
    
    return options;
  }
  
  private generateRecommendations(budgetImpact: any, timelineImpact: any, riskAssessment: any[]) {
    const recommendations = [];
    
    const highRisks = riskAssessment.filter(r => r.level === "High" || r.level === "Critical");
    
    if (highRisks.length > 0) {
      recommendations.push("⚠️ High-risk change detected. Schedule client review before proceeding.");
    }
    
    if (budgetImpact.total > 10000) {
      recommendations.push("💰 Significant budget impact. Prepare detailed ROI analysis for client.");
    }
    
    if (timelineImpact.weeks > 2) {
      recommendations.push("📅 Timeline impact substantial. Consider phased delivery approach.");
    }
    
    recommendations.push("📋 Update all project documentation before communicating to team.");
    recommendations.push("🗣️ Schedule stakeholder alignment meeting within 48 hours.");
    
    return recommendations;
  }
  
  private createBeforeAfterComparison(budgetImpact: any, timelineImpact: any, projectData: any) {
    return {
      before: {
        budget: projectData.budget.current_total,
        timeline: projectData.timeline.current_estimate,
        completion: projectData.timeline.weeks_elapsed + projectData.timeline.weeks_remaining
      },
      after: {
        budget: projectData.budget.current_total + budgetImpact.total,
        timeline: projectData.timeline.current_estimate + timelineImpact.weeks,
        completion: projectData.timeline.weeks_elapsed + projectData.timeline.weeks_remaining + timelineImpact.weeks
      }
    };
  }
  
  private createTrajectoryData(budgetImpact: any, timelineImpact: any, projectData: any) {
    const weeks = [];
    const currentWeek = projectData.timeline.weeks_elapsed;
    const totalWeeks = projectData.timeline.current_estimate + timelineImpact.weeks;
    
    for (let i = 0; i <= totalWeeks; i++) {
      const budgetSpent = i <= currentWeek 
        ? (projectData.budget.spent_to_date / currentWeek) * i
        : projectData.budget.spent_to_date + ((i - currentWeek) * projectData.budget.burn_rate_weekly);
      
      weeks.push({
        week: i,
        budgetSpent: Math.round(budgetSpent),
        budgetTotal: i > currentWeek && i > projectData.timeline.current_estimate
          ? projectData.budget.current_total + budgetImpact.total
          : projectData.budget.current_total,
        isProjection: i > currentWeek
      });
    }
    
    return weeks;
  }
  
  private calculateNewDate(weeksRemaining: number, weeksAdded: number): string {
    const totalWeeks = weeksRemaining + weeksAdded;
    const date = new Date();
    date.setDate(date.getDate() + (totalWeeks * 7));
    return date.toISOString().split('T')[0];
  }
}
