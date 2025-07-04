
# Support Ticketing System

## Overview

mySafePlay™(TM)'s comprehensive ticketing system provides structured support management with AI-enhanced routing, priority handling, SLA tracking, and detailed analytics. The system integrates seamlessly with the AI chat system for escalated conversations.

## Table of Contents

1. [Ticket Lifecycle](#ticket-lifecycle)
2. [Priority & Categorization](#priority--categorization)
3. [AI Integration](#ai-integration)
4. [Agent Management](#agent-management)
5. [SLA Management](#sla-management)
6. [Analytics & Reporting](#analytics--reporting)

## Ticket Lifecycle

### Ticket States

```typescript
enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  WAITING_FOR_VENDOR = 'WAITING_FOR_VENDOR',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  ESCALATED = 'ESCALATED',
  ON_HOLD = 'ON_HOLD'
}

interface TicketTransition {
  from: SupportTicketStatus;
  to: SupportTicketStatus;
  allowedRoles: UserRole[];
  requiresComment: boolean;
  autoTriggers?: string[];
}
```

### Ticket Creation Flow

```typescript
// lib/support/ticket-manager.ts
export class SupportTicketManager {
  async createTicket(ticketData: CreateTicketRequest): Promise<SupportTicket> {
    // Generate unique ticket number
    const ticketNumber = await this.generateTicketNumber();
    
    // AI-powered initial analysis
    const aiAnalysis = await this.analyzeTicketContent(ticketData);
    
    // Auto-categorize and prioritize
    const category = aiAnalysis.suggestedCategory || ticketData.category;
    const priority = aiAnalysis.suggestedPriority || this.calculatePriority(ticketData);
    const severity = aiAnalysis.suggestedSeverity || 'NORMAL';
    
    // Create ticket
    const ticket = await this.ticketRepository.create({
      ticketNumber,
      title: ticketData.title,
      description: ticketData.description,
      userId: ticketData.userId,
      userRole: ticketData.userRole,
      venueId: ticketData.venueId,
      category,
      priority,
      severity,
      source: ticketData.source || 'WEB_FORM',
      status: 'OPEN',
      
      // AI analysis results
      aiProcessed: true,
      aiSuggestions: aiAnalysis.suggestions,
      aiConfidence: aiAnalysis.confidence,
      aiResponse: aiAnalysis.autoResponse,
      
      // SLA calculation
      slaTarget: this.calculateSLATarget(priority, severity),
      
      createdAt: new Date()
    });
    
    // Create initial timeline entry
    await this.addTimelineEntry(ticket.id, {
      eventType: 'TICKET_CREATED',
      description: 'Ticket created',
      performerType: 'USER'
    });
    
    // Attempt AI resolution
    if (aiAnalysis.confidence > 0.8 && aiAnalysis.autoResponse) {
      await this.attemptAIResolution(ticket, aiAnalysis);
    } else {
      // Route to appropriate agent
      await this.routeTicket(ticket);
    }
    
    // Send confirmation to user
    await this.sendTicketConfirmation(ticket);
    
    return ticket;
  }
  
  private async analyzeTicketContent(ticketData: CreateTicketRequest): Promise<AITicketAnalysis> {
    const prompt = `
      Analyze this support ticket and provide:
      1. Suggested category
      2. Suggested priority (LOW, MEDIUM, HIGH, URGENT, CRITICAL)
      3. Suggested severity (LOW, NORMAL, HIGH, CRITICAL)
      4. Confidence score (0-1)
      5. Auto-response if applicable
      6. Routing suggestions
      
      Title: ${ticketData.title}
      Description: ${ticketData.description}
      User Role: ${ticketData.userRole}
      Venue: ${ticketData.venueId ? 'Yes' : 'No'}
    `;
    
    const aiResponse = await this.aiService.analyze(prompt);
    
    return {
      suggestedCategory: aiResponse.category,
      suggestedPriority: aiResponse.priority,
      suggestedSeverity: aiResponse.severity,
      confidence: aiResponse.confidence,
      autoResponse: aiResponse.autoResponse,
      suggestions: aiResponse.suggestions,
      routingSuggestions: aiResponse.routing
    };
  }
  
  private async attemptAIResolution(ticket: SupportTicket, analysis: AITicketAnalysis): Promise<void> {
    // Add AI response as message
    await this.addTicketMessage(ticket.id, {
      senderId: null, // AI system
      senderType: 'AI',
      content: analysis.autoResponse,
      messageType: 'TEXT',
      aiGenerated: true,
      aiPrompt: 'Auto-resolution attempt'
    });
    
    // Update ticket
    await this.updateTicket(ticket.id, {
      aiResolutionAttempted: true,
      status: 'WAITING_FOR_USER',
      firstResponseAt: new Date()
    });
    
    // Add timeline entry
    await this.addTimelineEntry(ticket.id, {
      eventType: 'AI_RESPONSE_SENT',
      description: 'AI provided auto-response',
      performerType: 'AI'
    });
    
    // Schedule follow-up check
    await this.scheduleFollowUp(ticket.id, 24); // 24 hours
  }
  
  private async routeTicket(ticket: SupportTicket): Promise<void> {
    // Find best available agent
    const agent = await this.findBestAgent(ticket);
    
    if (agent) {
      await this.assignTicket(ticket.id, agent.id);
    } else {
      // Add to general queue
      await this.addToQueue(ticket.id);
    }
  }
  
  private async findBestAgent(ticket: SupportTicket): Promise<SupportAgent | null> {
    // Get available agents
    const availableAgents = await this.getAvailableAgents();
    
    if (availableAgents.length === 0) return null;
    
    // Score agents based on various factors
    const scoredAgents = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, ticket)
    }));
    
    // Sort by score and return best match
    scoredAgents.sort((a, b) => b.score - a.score);
    
    return scoredAgents[0].agent;
  }
  
  private calculateAgentScore(agent: SupportAgent, ticket: SupportTicket): number {
    let score = 0;
    
    // Specialization match
    if (agent.specializations?.includes(ticket.category)) {
      score += 30;
    }
    
    // Agent level vs ticket priority
    const levelScores = {
      L1: { LOW: 20, MEDIUM: 15, HIGH: 5, URGENT: 0, CRITICAL: 0 },
      L2: { LOW: 15, MEDIUM: 20, HIGH: 15, URGENT: 10, CRITICAL: 5 },
      L3: { LOW: 5, MEDIUM: 10, HIGH: 20, URGENT: 15, CRITICAL: 10 },
      SPECIALIST: { LOW: 0, MEDIUM: 5, HIGH: 15, URGENT: 20, CRITICAL: 15 },
      SUPERVISOR: { LOW: 0, MEDIUM: 0, HIGH: 10, URGENT: 15, CRITICAL: 20 }
    };
    
    score += levelScores[agent.agentLevel]?.[ticket.priority] || 0;
    
    // Current workload (inverse relationship)
    const workloadPenalty = agent.currentTicketLoad * 2;
    score -= workloadPenalty;
    
    // Performance metrics
    if (agent.customerSatisfactionAvg) {
      score += (agent.customerSatisfactionAvg - 3) * 5; // Boost for high CSAT
    }
    
    if (agent.averageResolutionTime) {
      // Prefer agents with faster resolution times
      const avgHours = agent.averageResolutionTime / 60;
      score += Math.max(0, 10 - avgHours);
    }
    
    return Math.max(0, score);
  }
}
```

### Ticket Updates & Transitions

```typescript
// lib/support/ticket-transitions.ts
export class TicketTransitionManager {
  private readonly VALID_TRANSITIONS: TicketTransition[] = [
    {
      from: 'OPEN',
      to: 'IN_PROGRESS',
      allowedRoles: ['SUPPORT_AGENT', 'SYSTEM_ADMIN'],
      requiresComment: false
    },
    {
      from: 'OPEN',
      to: 'ESCALATED',
      allowedRoles: ['SUPPORT_AGENT', 'SYSTEM_ADMIN'],
      requiresComment: true
    },
    {
      from: 'IN_PROGRESS',
      to: 'WAITING_FOR_USER',
      allowedRoles: ['SUPPORT_AGENT', 'SYSTEM_ADMIN'],
      requiresComment: true
    },
    {
      from: 'IN_PROGRESS',
      to: 'RESOLVED',
      allowedRoles: ['SUPPORT_AGENT', 'SYSTEM_ADMIN'],
      requiresComment: true
    },
    {
      from: 'WAITING_FOR_USER',
      to: 'IN_PROGRESS',
      allowedRoles: ['PARENT', 'GUARDIAN', 'VENUE_ADMIN', 'SUPPORT_AGENT'],
      requiresComment: false,
      autoTriggers: ['USER_RESPONSE']
    },
    {
      from: 'RESOLVED',
      to: 'CLOSED',
      allowedRoles: ['SUPPORT_AGENT', 'SYSTEM_ADMIN'],
      requiresComment: false,
      autoTriggers: ['AUTO_CLOSE_TIMER']
    },
    {
      from: 'RESOLVED',
      to: 'REOPENED',
      allowedRoles: ['PARENT', 'GUARDIAN', 'VENUE_ADMIN'],
      requiresComment: true
    }
  ];
  
  async transitionTicket(
    ticketId: string,
    newStatus: SupportTicketStatus,
    performedBy: string,
    comment?: string
  ): Promise<void> {
    const ticket = await this.getTicket(ticketId);
    const user = await this.getUser(performedBy);
    
    // Validate transition
    const transition = this.validateTransition(ticket.status, newStatus, user.role);
    if (!transition.valid) {
      throw new Error(`Invalid transition: ${transition.error}`);
    }
    
    // Check comment requirement
    if (transition.requiresComment && !comment) {
      throw new Error('Comment required for this transition');
    }
    
    // Perform transition
    await this.performTransition(ticket, newStatus, performedBy, comment);
  }
  
  private validateTransition(
    currentStatus: SupportTicketStatus,
    newStatus: SupportTicketStatus,
    userRole: UserRole
  ): TransitionValidation {
    const transition = this.VALID_TRANSITIONS.find(t =>
      t.from === currentStatus &&
      t.to === newStatus &&
      t.allowedRoles.includes(userRole)
    );
    
    if (!transition) {
      return {
        valid: false,
        error: `Transition from ${currentStatus} to ${newStatus} not allowed for role ${userRole}`
      };
    }
    
    return {
      valid: true,
      transition
    };
  }
  
  private async performTransition(
    ticket: SupportTicket,
    newStatus: SupportTicketStatus,
    performedBy: string,
    comment?: string
  ): Promise<void> {
    const oldStatus = ticket.status;
    const now = new Date();
    
    // Update ticket
    const updates: Partial<SupportTicket> = {
      status: newStatus,
      updatedAt: now
    };
    
    // Status-specific updates
    switch (newStatus) {
      case 'IN_PROGRESS':
        if (oldStatus === 'OPEN' && !ticket.firstResponseAt) {
          updates.firstResponseAt = now;
        }
        break;
      case 'RESOLVED':
        updates.resolvedAt = now;
        updates.resolutionTime = this.calculateResolutionTime(ticket.createdAt, now);
        break;
      case 'CLOSED':
        updates.closedAt = now;
        break;
      case 'ESCALATED':
        updates.escalatedAt = now;
        updates.escalationLevel = (ticket.escalationLevel || 0) + 1;
        break;
    }
    
    await this.updateTicket(ticket.id, updates);
    
    // Add timeline entry
    await this.addTimelineEntry(ticket.id, {
      eventType: this.getEventTypeForTransition(oldStatus, newStatus),
      description: comment || `Status changed from ${oldStatus} to ${newStatus}`,
      performedBy,
      performerType: 'USER',
      oldValue: oldStatus,
      newValue: newStatus
    });
    
    // Add comment if provided
    if (comment) {
      await this.addTicketMessage(ticket.id, {
        senderId: performedBy,
        senderType: 'USER',
        content: comment,
        messageType: 'TEXT'
      });
    }
    
    // Trigger post-transition actions
    await this.handlePostTransitionActions(ticket, newStatus, performedBy);
  }
  
  private async handlePostTransitionActions(
    ticket: SupportTicket,
    newStatus: SupportTicketStatus,
    performedBy: string
  ): Promise<void> {
    switch (newStatus) {
      case 'RESOLVED':
        // Send satisfaction survey
        await this.sendSatisfactionSurvey(ticket);
        // Schedule auto-close
        await this.scheduleAutoClose(ticket.id, 72); // 72 hours
        break;
        
      case 'ESCALATED':
        // Notify supervisors
        await this.notifyEscalation(ticket);
        // Update SLA target
        await this.updateSLAForEscalation(ticket);
        break;
        
      case 'WAITING_FOR_USER':
        // Schedule reminder
        await this.scheduleUserReminder(ticket.id, 48); // 48 hours
        break;
        
      case 'CLOSED':
        // Update agent metrics
        await this.updateAgentMetrics(ticket);
        // Archive ticket data
        await this.archiveTicketData(ticket);
        break;
    }
  }
}
```

## Priority & Categorization

### Priority Matrix

```typescript
// lib/support/priority-calculator.ts
export class TicketPriorityCalculator {
  private readonly PRIORITY_MATRIX = {
    // [Severity][Impact] = Priority
    CRITICAL: {
      HIGH: 'CRITICAL',
      MEDIUM: 'URGENT',
      LOW: 'HIGH'
    },
    HIGH: {
      HIGH: 'URGENT',
      MEDIUM: 'HIGH',
      LOW: 'MEDIUM'
    },
    NORMAL: {
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW'
    },
    LOW: {
      HIGH: 'MEDIUM',
      MEDIUM: 'LOW',
      LOW: 'LOW'
    }
  };
  
  calculatePriority(ticketData: CreateTicketRequest): SupportTicketPriority {
    const severity = this.calculateSeverity(ticketData);
    const impact = this.calculateImpact(ticketData);
    
    return this.PRIORITY_MATRIX[severity][impact];
  }
  
  private calculateSeverity(ticketData: CreateTicketRequest): TicketSeverity {
    const severityKeywords = {
      CRITICAL: [
        'system down', 'cannot access', 'emergency', 'urgent',
        'child missing', 'safety alert', 'security breach'
      ],
      HIGH: [
        'not working', 'error', 'broken', 'failed',
        'camera offline', 'alerts not received'
      ],
      NORMAL: [
        'slow', 'issue', 'problem', 'question',
        'how to', 'setup', 'configuration'
      ],
      LOW: [
        'enhancement', 'feature request', 'suggestion',
        'cosmetic', 'minor'
      ]
    };
    
    const content = `${ticketData.title} ${ticketData.description}`.toLowerCase();
    
    for (const [severity, keywords] of Object.entries(severityKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return severity as TicketSeverity;
      }
    }
    
    return 'NORMAL';
  }
  
  private calculateImpact(ticketData: CreateTicketRequest): TicketImpact {
    let impact: TicketImpact = 'LOW';
    
    // User role impact
    if (ticketData.userRole === 'VENUE_ADMIN') {
      impact = 'HIGH'; // Venue admins affect multiple users
    } else if (ticketData.userRole === 'STAFF_MEMBER') {
      impact = 'MEDIUM';
    }
    
    // Venue-related issues have higher impact
    if (ticketData.venueId) {
      impact = impact === 'LOW' ? 'MEDIUM' : 'HIGH';
    }
    
    // Category-specific impact
    const highImpactCategories = [
      'CHILD_SAFETY',
      'CAMERA_SUPPORT',
      'ALERTS_NOTIFICATIONS'
    ];
    
    if (highImpactCategories.includes(ticketData.category)) {
      impact = 'HIGH';
    }
    
    return impact;
  }
}
```

### Auto-Categorization

```typescript
// lib/support/auto-categorization.ts
export class TicketCategorizer {
  private readonly CATEGORY_PATTERNS = {
    TECHNICAL_ISSUE: [
      /error|bug|broken|not working|failed|crash/i,
      /500|404|timeout|connection/i,
      /login|authentication|access/i
    ],
    CAMERA_SUPPORT: [
      /camera|video|stream|recording/i,
      /offline|online|connection/i,
      /quality|resolution|focus/i
    ],
    FACE_RECOGNITION: [
      /face|recognition|detection|identify/i,
      /accuracy|confidence|match/i,
      /training|learning/i
    ],
    ALERTS_NOTIFICATIONS: [
      /alert|notification|email|sms/i,
      /receive|delivery|sent/i,
      /frequency|timing/i
    ],
    ACCOUNT_BILLING: [
      /billing|payment|subscription|plan/i,
      /charge|invoice|refund/i,
      /upgrade|downgrade/i
    ],
    CHILD_SAFETY: [
      /child|safety|security|protection/i,
      /missing|lost|found/i,
      /emergency|incident/i
    ],
    VENUE_SETUP: [
      /setup|configuration|install/i,
      /venue|location|zone/i,
      /staff|admin|permission/i
    ],
    CHECK_IN_OUT: [
      /check.?in|check.?out|arrival|departure/i,
      /pickup|drop.?off/i,
      /attendance|present/i
    ],
    FEATURE_REQUEST: [
      /feature|enhancement|improvement/i,
      /suggest|recommend|would like/i,
      /new|add|include/i
    ],
    BUG_REPORT: [
      /bug|issue|problem|glitch/i,
      /unexpected|wrong|incorrect/i,
      /reproduce|steps/i
    ]
  };
  
  categorizeTicket(title: string, description: string): SupportTicketCategory {
    const content = `${title} ${description}`.toLowerCase();
    
    // Score each category
    const categoryScores = new Map<SupportTicketCategory, number>();
    
    for (const [category, patterns] of Object.entries(this.CATEGORY_PATTERNS)) {
      let score = 0;
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      
      if (score > 0) {
        categoryScores.set(category as SupportTicketCategory, score);
      }
    }
    
    // Return category with highest score
    if (categoryScores.size > 0) {
      const sortedCategories = Array.from(categoryScores.entries())
        .sort((a, b) => b[1] - a[1]);
      
      return sortedCategories[0][0];
    }
    
    // Default category
    return 'TECHNICAL_ISSUE';
  }
  
  async improveCategorizationModel(feedback: CategorizationFeedback[]): Promise<void> {
    // Analyze feedback to improve categorization accuracy
    const categoryAccuracy = new Map<SupportTicketCategory, number>();
    
    for (const item of feedback) {
      const predicted = this.categorizeTicket(item.title, item.description);
      const isCorrect = predicted === item.actualCategory;
      
      const currentAccuracy = categoryAccuracy.get(item.actualCategory) || 0;
      const currentCount = categoryAccuracy.get(`${item.actualCategory}_count` as any) || 0;
      
      categoryAccuracy.set(item.actualCategory, currentAccuracy + (isCorrect ? 1 : 0));
      categoryAccuracy.set(`${item.actualCategory}_count` as any, currentCount + 1);
    }
    
    // Update patterns based on accuracy
    for (const [category, accuracy] of categoryAccuracy.entries()) {
      if (typeof category === 'string' && !category.endsWith('_count')) {
        const count = categoryAccuracy.get(`${category}_count` as any) || 1;
        const accuracyRate = accuracy / count;
        
        if (accuracyRate < 0.8) {
          // Category needs improvement
          await this.updateCategoryPatterns(category as SupportTicketCategory, feedback);
        }
      }
    }
  }
}
```

## AI Integration

### AI-Powered Ticket Analysis

```typescript
// lib/support/ai-ticket-analyzer.ts
export class AITicketAnalyzer {
  async analyzeTicket(ticket: SupportTicket): Promise<AITicketInsights> {
    const analysis = await this.performComprehensiveAnalysis(ticket);
    
    return {
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      complexity: analysis.complexity,
      suggestedActions: analysis.suggestedActions,
      relatedTickets: await this.findRelatedTickets(ticket),
      knowledgeBaseArticles: await this.findRelevantArticles(ticket),
      estimatedResolutionTime: analysis.estimatedResolutionTime,
      requiredExpertise: analysis.requiredExpertise
    };
  }
  
  private async performComprehensiveAnalysis(ticket: SupportTicket): Promise<AIAnalysisResult> {
    const prompt = `
      Analyze this support ticket comprehensively:
      
      Title: ${ticket.title}
      Description: ${ticket.description}
      Category: ${ticket.category}
      User Role: ${ticket.userRole}
      
      Provide analysis for:
      1. Sentiment (POSITIVE, NEUTRAL, NEGATIVE, FRUSTRATED, ANGRY)
      2. Urgency level (1-10)
      3. Complexity level (1-10)
      4. Suggested immediate actions
      5. Estimated resolution time in hours
      6. Required expertise level
      7. Potential escalation triggers
      
      Format as JSON.
    `;
    
    const response = await this.aiService.analyze(prompt);
    
    return {
      sentiment: response.sentiment,
      urgency: response.urgency,
      complexity: response.complexity,
      suggestedActions: response.suggestedActions,
      estimatedResolutionTime: response.estimatedResolutionTime,
      requiredExpertise: response.requiredExpertise,
      escalationTriggers: response.escalationTriggers
    };
  }
  
  async generateAIResponse(ticket: SupportTicket): Promise<AIResponseResult> {
    // Get relevant context
    const context = await this.gatherTicketContext(ticket);
    
    const prompt = `
      Generate a helpful response for this support ticket:
      
      Ticket: ${ticket.title}
      Description: ${ticket.description}
      Category: ${ticket.category}
      
      Context:
      - User Role: ${ticket.userRole}
      - Previous Tickets: ${context.previousTickets.length}
      - Knowledge Base Articles: ${context.relevantArticles.length}
      
      Guidelines:
      1. Be empathetic and professional
      2. Provide specific, actionable steps
      3. Include relevant links or resources
      4. Ask clarifying questions if needed
      5. Set appropriate expectations
      
      Also provide:
      - Confidence score (0-1)
      - Whether human escalation is recommended
      - Follow-up actions needed
    `;
    
    const response = await this.aiService.generateResponse(prompt);
    
    return {
      response: response.content,
      confidence: response.confidence,
      recommendEscalation: response.recommendEscalation,
      followUpActions: response.followUpActions,
      suggestedResources: response.suggestedResources
    };
  }
  
  private async gatherTicketContext(ticket: SupportTicket): Promise<TicketContext> {
    const [previousTickets, relevantArticles, userHistory] = await Promise.all([
      this.getPreviousTickets(ticket.userId),
      this.findRelevantKBArticles(ticket),
      this.getUserSupportHistory(ticket.userId)
    ]);
    
    return {
      previousTickets,
      relevantArticles,
      userHistory,
      venueContext: ticket.venueId ? await this.getVenueContext(ticket.venueId) : null
    };
  }
}
```

### Smart Routing

```typescript
// lib/support/smart-routing.ts
export class SmartTicketRouter {
  async routeTicket(ticket: SupportTicket): Promise<RoutingDecision> {
    // Analyze ticket for routing
    const analysis = await this.analyzeForRouting(ticket);
    
    // Get available agents
    const availableAgents = await this.getAvailableAgents();
    
    // Score and rank agents
    const rankedAgents = this.rankAgentsForTicket(ticket, availableAgents, analysis);
    
    // Make routing decision
    const decision = this.makeRoutingDecision(ticket, rankedAgents, analysis);
    
    return decision;
  }
  
  private rankAgentsForTicket(
    ticket: SupportTicket,
    agents: SupportAgent[],
    analysis: RoutingAnalysis
  ): RankedAgent[] {
    return agents.map(agent => ({
      agent,
      score: this.calculateRoutingScore(agent, ticket, analysis),
      reasoning: this.generateRoutingReasoning(agent, ticket, analysis)
    })).sort((a, b) => b.score - a.score);
  }
  
  private calculateRoutingScore(
    agent: SupportAgent,
    ticket: SupportTicket,
    analysis: RoutingAnalysis
  ): number {
    let score = 0;
    
    // Specialization match (40% weight)
    if (agent.specializations?.includes(ticket.category)) {
      score += 40;
    }
    
    // Experience level vs complexity (30% weight)
    const complexityScore = this.getComplexityScore(agent.agentLevel, analysis.complexity);
    score += complexityScore * 0.3;
    
    // Current workload (20% weight)
    const workloadScore = Math.max(0, 20 - (agent.currentTicketLoad * 2));
    score += workloadScore;
    
    // Performance metrics (10% weight)
    if (agent.customerSatisfactionAvg) {
      score += (agent.customerSatisfactionAvg - 3) * 2;
    }
    
    // Language match
    if (analysis.requiredLanguages?.length > 0) {
      const hasLanguage = analysis.requiredLanguages.some(lang =>
        agent.languages?.includes(lang)
      );
      if (hasLanguage) score += 5;
    }
    
    // Availability
    if (agent.status === 'AVAILABLE') {
      score += 10;
    } else if (agent.status === 'BUSY') {
      score -= 5;
    }
    
    return Math.max(0, score);
  }
  
  private makeRoutingDecision(
    ticket: SupportTicket,
    rankedAgents: RankedAgent[],
    analysis: RoutingAnalysis
  ): RoutingDecision {
    // Check if any agent meets minimum threshold
    const minimumScore = 60;
    const qualifiedAgents = rankedAgents.filter(ra => ra.score >= minimumScore);
    
    if (qualifiedAgents.length === 0) {
      return {
        action: 'QUEUE',
        reason: 'No qualified agents available',
        queueType: 'GENERAL',
        estimatedWaitTime: this.estimateQueueWaitTime('GENERAL')
      };
    }
    
    // Check for immediate assignment
    const bestAgent = qualifiedAgents[0];
    
    if (bestAgent.score >= 80 && bestAgent.agent.status === 'AVAILABLE') {
      return {
        action: 'ASSIGN',
        agentId: bestAgent.agent.id,
        reason: bestAgent.reasoning,
        confidence: bestAgent.score / 100
      };
    }
    
    // Check for escalation needs
    if (analysis.complexity >= 8 || ticket.priority === 'CRITICAL') {
      const specialists = qualifiedAgents.filter(ra =>
        ra.agent.agentLevel === 'SPECIALIST' || ra.agent.agentLevel === 'SUPERVISOR'
      );
      
      if (specialists.length > 0) {
        return {
          action: 'ASSIGN',
          agentId: specialists[0].agent.id,
          reason: 'High complexity requires specialist',
          confidence: specialists[0].score / 100
        };
      }
    }
    
    // Default to specialized queue
    const queueType = this.determineQueueType(ticket.category);
    
    return {
      action: 'QUEUE',
      reason: 'Waiting for optimal agent availability',
      queueType,
      estimatedWaitTime: this.estimateQueueWaitTime(queueType)
    };
  }
}
```

## Agent Management

### Agent Performance Tracking

```typescript
// lib/support/agent-performance.ts
export class AgentPerformanceTracker {
  async updateAgentMetrics(agentId: string, ticket: SupportTicket): Promise<void> {
    const agent = await this.getAgent(agentId);
    const metrics = await this.calculateTicketMetrics(ticket);
    
    // Update agent statistics
    await this.updateAgentStats(agentId, {
      totalTicketsHandled: agent.totalTicketsHandled + 1,
      averageResolutionTime: this.calculateNewAverage(
        agent.averageResolutionTime,
        metrics.resolutionTime,
        agent.totalTicketsHandled
      ),
      firstResponseTimeAvg: this.calculateNewAverage(
        agent.firstResponseTimeAvg,
        metrics.firstResponseTime,
        agent.totalTicketsHandled
      )
    });
    
    // Update satisfaction score if available
    if (ticket.customerSatisfaction) {
      await this.updateSatisfactionScore(agentId, ticket.customerSatisfaction);
    }
    
    // Check for performance alerts
    await this.checkPerformanceAlerts(agentId);
  }
  
  async generatePerformanceReport(agentId: string, period: DateRange): Promise<AgentPerformanceReport> {
    const tickets = await this.getAgentTickets(agentId, period);
    const metrics = this.calculatePeriodMetrics(tickets);
    
    return {
      agentId,
      period,
      metrics: {
        totalTickets: tickets.length,
        resolvedTickets: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        averageResolutionTime: metrics.avgResolutionTime,
        averageFirstResponseTime: metrics.avgFirstResponseTime,
        customerSatisfaction: metrics.avgSatisfaction,
        escalationRate: metrics.escalationRate,
        reopenRate: metrics.reopenRate
      },
      trends: await this.calculateTrends(agentId, period),
      recommendations: await this.generateRecommendations(agentId, metrics)
    };
  }
  
  private async generateRecommendations(
    agentId: string,
    metrics: AgentMetrics
  ): Promise<PerformanceRecommendation[]> {
    const recommendations: PerformanceRecommendation[] = [];
    
    // Resolution time recommendations
    if (metrics.avgResolutionTime > 24 * 60) { // More than 24 hours
      recommendations.push({
        type: 'RESOLUTION_TIME',
        priority: 'HIGH',
        description: 'Resolution time is above target',
        suggestions: [
          'Review ticket prioritization',
          'Consider additional training',
          'Improve knowledge base usage'
        ]
      });
    }
    
    // Customer satisfaction recommendations
    if (metrics.avgSatisfaction < 4.0) {
      recommendations.push({
        type: 'CUSTOMER_SATISFACTION',
        priority: 'HIGH',
        description: 'Customer satisfaction below target',
        suggestions: [
          'Focus on communication skills',
          'Ensure complete problem resolution',
          'Follow up with customers'
        ]
      });
    }
    
    // Escalation rate recommendations
    if (metrics.escalationRate > 0.15) { // More than 15%
      recommendations.push({
        type: 'ESCALATION_RATE',
        priority: 'MEDIUM',
        description: 'High escalation rate',
        suggestions: [
          'Additional technical training needed',
          'Review complex ticket handling',
          'Improve problem-solving skills'
        ]
      });
    }
    
    return recommendations;
  }
}
```

### Agent Workload Management

```typescript
// lib/support/workload-manager.ts
export class AgentWorkloadManager {
  async balanceWorkload(): Promise<WorkloadBalanceResult> {
    const agents = await this.getActiveAgents();
    const unassignedTickets = await this.getUnassignedTickets();
    
    // Calculate current workload distribution
    const workloadDistribution = this.calculateWorkloadDistribution(agents);
    
    // Identify overloaded and underutilized agents
    const overloaded = agents.filter(a => a.currentTicketLoad > a.maxConcurrentTickets * 0.9);
    const underutilized = agents.filter(a => a.currentTicketLoad < a.maxConcurrentTickets * 0.6);
    
    const rebalanceActions: RebalanceAction[] = [];
    
    // Redistribute tickets from overloaded agents
    for (const agent of overloaded) {
      const ticketsToRedistribute = await this.getRedistributableTickets(agent.id);
      
      for (const ticket of ticketsToRedistribute) {
        const newAgent = this.findBestAlternativeAgent(ticket, underutilized);
        
        if (newAgent) {
          rebalanceActions.push({
            type: 'REASSIGN',
            ticketId: ticket.id,
            fromAgentId: agent.id,
            toAgentId: newAgent.id,
            reason: 'Workload balancing'
          });
        }
      }
    }
    
    // Assign new tickets to underutilized agents
    for (const ticket of unassignedTickets) {
      const bestAgent = this.findBestAgent(ticket, underutilized);
      
      if (bestAgent) {
        rebalanceActions.push({
          type: 'ASSIGN',
          ticketId: ticket.id,
          toAgentId: bestAgent.id,
          reason: 'Initial assignment'
        });
      }
    }
    
    // Execute rebalancing actions
    for (const action of rebalanceActions) {
      await this.executeRebalanceAction(action);
    }
    
    return {
      actionsPerformed: rebalanceActions.length,
      workloadImprovement: await this.calculateWorkloadImprovement(workloadDistribution),
      newDistribution: this.calculateWorkloadDistribution(await this.getActiveAgents())
    };
  }
  
  async monitorAgentCapacity(): Promise<CapacityReport> {
    const agents = await this.getActiveAgents();
    const capacityData = agents.map(agent => ({
      agentId: agent.id,
      currentLoad: agent.currentTicketLoad,
      maxCapacity: agent.maxConcurrentTickets,
      utilizationRate: agent.currentTicketLoad / agent.maxConcurrentTickets,
      status: agent.status,
      department: agent.department
    }));
    
    const overallUtilization = capacityData.reduce((sum, agent) => 
      sum + agent.utilizationRate, 0) / capacityData.length;
    
    const alerts = this.generateCapacityAlerts(capacityData);
    
    return {
      timestamp: new Date(),
      overallUtilization,
      agentCapacity: capacityData,
      alerts,
      recommendations: this.generateCapacityRecommendations(capacityData)
    };
  }
}
```

## SLA Management

### SLA Configuration

```typescript
// lib/support/sla-manager.ts
export class SLAManager {
  private readonly SLA_TARGETS = {
    CRITICAL: {
      firstResponse: 15, // minutes
      resolution: 4 * 60 // 4 hours
    },
    URGENT: {
      firstResponse: 30, // minutes
      resolution: 8 * 60 // 8 hours
    },
    HIGH: {
      firstResponse: 60, // minutes
      resolution: 24 * 60 // 24 hours
    },
    MEDIUM: {
      firstResponse: 4 * 60, // 4 hours
      resolution: 48 * 60 // 48 hours
    },
    LOW: {
      firstResponse: 8 * 60, // 8 hours
      resolution: 72 * 60 // 72 hours
    }
  };
  
  calculateSLATarget(priority: SupportTicketPriority, severity: SupportTicketSeverity): SLATarget {
    const baseSLA = this.SLA_TARGETS[priority];
    
    // Adjust based on severity
    const severityMultiplier = {
      CRITICAL: 0.5,
      HIGH: 0.75,
      NORMAL: 1.0,
      LOW: 1.25
    };
    
    const multiplier = severityMultiplier[severity];
    
    return {
      firstResponseMinutes: Math.round(baseSLA.firstResponse * multiplier),
      resolutionMinutes: Math.round(baseSLA.resolution * multiplier)
    };
  }
  
  async checkSLACompliance(ticketId: string): Promise<SLAComplianceCheck> {
    const ticket = await this.getTicket(ticketId);
    const slaTarget = this.calculateSLATarget(ticket.priority, ticket.severity);
    
    const now = new Date();
    const createdAt = new Date(ticket.createdAt);
    
    // Check first response SLA
    const firstResponseSLA = this.checkFirstResponseSLA(ticket, slaTarget, now);
    
    // Check resolution SLA
    const resolutionSLA = this.checkResolutionSLA(ticket, slaTarget, now);
    
    return {
      ticketId,
      firstResponse: firstResponseSLA,
      resolution: resolutionSLA,
      overallCompliance: firstResponseSLA.compliant && resolutionSLA.compliant
    };
  }
  
  private checkFirstResponseSLA(
    ticket: SupportTicket,
    slaTarget: SLATarget,
    now: Date
  ): SLACheck {
    const targetTime = new Date(ticket.createdAt.getTime() + slaTarget.firstResponseMinutes * 60 * 1000);
    
    if (ticket.firstResponseAt) {
      // Response already provided
      const responseTime = ticket.firstResponseAt.getTime() - ticket.createdAt.getTime();
      const targetTimeMs = slaTarget.firstResponseMinutes * 60 * 1000;
      
      return {
        compliant: responseTime <= targetTimeMs,
        targetTime,
        actualTime: ticket.firstResponseAt,
        remainingTime: 0,
        breachTime: Math.max(0, responseTime - targetTimeMs)
      };
    } else {
      // No response yet
      const remainingTime = Math.max(0, targetTime.getTime() - now.getTime());
      
      return {
        compliant: now <= targetTime,
        targetTime,
        actualTime: null,
        remainingTime,
        breachTime: Math.max(0, now.getTime() - targetTime.getTime())
      };
    }
  }
  
  async generateSLAReport(period: DateRange): Promise<SLAReport> {
    const tickets = await this.getTicketsInPeriod(period);
    const slaChecks = await Promise.all(
      tickets.map(ticket => this.checkSLACompliance(ticket.id))
    );
    
    const metrics = this.calculateSLAMetrics(slaChecks);
    const trends = await this.calculateSLATrends(period);
    
    return {
      period,
      totalTickets: tickets.length,
      metrics,
      trends,
      breaches: slaChecks.filter(check => !check.overallCompliance),
      recommendations: this.generateSLARecommendations(metrics)
    };
  }
  
  private calculateSLAMetrics(slaChecks: SLAComplianceCheck[]): SLAMetrics {
    const total = slaChecks.length;
    
    const firstResponseCompliant = slaChecks.filter(check => check.firstResponse.compliant).length;
    const resolutionCompliant = slaChecks.filter(check => check.resolution.compliant).length;
    const overallCompliant = slaChecks.filter(check => check.overallCompliance).length;
    
    return {
      firstResponseComplianceRate: (firstResponseCompliant / total) * 100,
      resolutionComplianceRate: (resolutionCompliant / total) * 100,
      overallComplianceRate: (overallCompliant / total) * 100,
      
      averageFirstResponseTime: this.calculateAverageFirstResponseTime(slaChecks),
      averageResolutionTime: this.calculateAverageResolutionTime(slaChecks),
      
      breachesByPriority: this.groupBreachesByPriority(slaChecks),
      breachesByCategory: this.groupBreachesByCategory(slaChecks)
    };
  }
}
```

---

*For additional configuration options and advanced ticketing features, refer to the main support system documentation.*
