
# Email Templates & Queue Management

## Overview

mySafePlay™(TM)'s email system features a sophisticated template engine with Handlebars support and an intelligent queue management system that ensures reliable email delivery with retry logic, priority handling, and performance optimization.

## Table of Contents

1. [Template System](#template-system)
2. [Queue Management](#queue-management)
3. [Template Engine](#template-engine)
4. [Queue Processing](#queue-processing)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Analytics](#monitoring--analytics)

## Template System

### Template Structure

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  category: EmailTemplateCategory;
  language: string;
  isActive: boolean;
  requiredVariables: string[];
  sampleData?: object;
  designTemplate?: string;
  customCSS?: string;
  previewText?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

enum EmailTemplateCategory {
  ONBOARDING = 'ONBOARDING',
  WEEKLY_TIPS = 'WEEKLY_TIPS',
  ALERTS = 'ALERTS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  MARKETING = 'MARKETING',
  TRANSACTIONAL = 'TRANSACTIONAL',
  SUPPORT = 'SUPPORT'
}
```

### Template Management API

```typescript
// lib/email/template-manager.ts
export class EmailTemplateManager {
  async createTemplate(templateData: CreateTemplateRequest): Promise<EmailTemplate> {
    // Validate template data
    const validation = await this.validateTemplate(templateData);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Parse and validate Handlebars syntax
    const compiledTemplate = this.compileTemplate(templateData.htmlContent);
    
    // Create template record
    const template = await this.templateRepository.create({
      ...templateData,
      version: 1,
      isActive: true,
      requiredVariables: this.extractRequiredVariables(templateData.htmlContent)
    });
    
    // Cache compiled template
    await this.cacheCompiledTemplate(template.id, compiledTemplate);
    
    return template;
  }
  
  async updateTemplate(templateId: string, updates: UpdateTemplateRequest): Promise<EmailTemplate> {
    const existingTemplate = await this.getTemplate(templateId);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }
    
    // Create new version if content changed
    const contentChanged = updates.htmlContent && updates.htmlContent !== existingTemplate.htmlContent;
    const newVersion = contentChanged ? existingTemplate.version + 1 : existingTemplate.version;
    
    // Update template
    const updatedTemplate = await this.templateRepository.update(templateId, {
      ...updates,
      version: newVersion,
      updatedAt: new Date()
    });
    
    // Update cache if content changed
    if (contentChanged) {
      const compiledTemplate = this.compileTemplate(updates.htmlContent);
      await this.cacheCompiledTemplate(templateId, compiledTemplate);
    }
    
    return updatedTemplate;
  }
  
  async renderTemplate(templateId: string, data: object): Promise<RenderedTemplate> {
    const template = await this.getTemplate(templateId);
    if (!template || !template.isActive) {
      throw new Error('Template not found or inactive');
    }
    
    // Get compiled template from cache
    const compiledTemplate = await this.getCachedCompiledTemplate(templateId);
    
    // Validate required variables
    const missingVariables = this.validateRequiredVariables(template.requiredVariables, data);
    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
    }
    
    // Render template
    const htmlContent = compiledTemplate(data);
    const textContent = template.textContent ? this.renderTextTemplate(template.textContent, data) : this.htmlToText(htmlContent);
    const subject = this.renderTextTemplate(template.subject, data);
    
    return {
      htmlContent,
      textContent,
      subject,
      templateId,
      renderedAt: new Date()
    };
  }
  
  private validateTemplate(templateData: CreateTemplateRequest): ValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (!templateData.name) errors.push('Template name is required');
    if (!templateData.subject) errors.push('Subject is required');
    if (!templateData.htmlContent) errors.push('HTML content is required');
    
    // Validate Handlebars syntax
    try {
      Handlebars.compile(templateData.htmlContent);
      Handlebars.compile(templateData.subject);
    } catch (error) {
      errors.push(`Handlebars syntax error: ${error.message}`);
    }
    
    // Check for required mySafePlay™(TM) variables
    const requiredmySafePlay™(TM)Vars = ['baseUrl', 'unsubscribeUrl'];
    for (const variable of requiredmySafePlay™(TM)Vars) {
      if (!templateData.htmlContent.includes(`{{${variable}}}`)) {
        errors.push(`Missing required variable: ${variable}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private extractRequiredVariables(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim().split('.')[0]; // Get root variable
      variables.add(variable);
    }
    
    return Array.from(variables);
  }
}
```

### Handlebars Helpers

```typescript
// lib/email/handlebars-helpers.ts
export class HandlebarsHelpers {
  static registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: format.includes('MMMM') ? 'long' : 'short',
        day: 'numeric'
      }).format(new Date(date));
    });
    
    // Age calculation helper
    Handlebars.registerHelper('calculateAge', (birthDate: Date) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    });
    
    // Conditional helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('and', (a: any, b: any) => a && b);
    Handlebars.registerHelper('or', (a: any, b: any) => a || b);
    
    // String helpers
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });
    
    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      return str.length > length ? str.substring(0, length) + '...' : str;
    });
    
    // Array helpers
    Handlebars.registerHelper('length', (array: any[]) => array?.length || 0);
    
    Handlebars.registerHelper('first', (array: any[], count: number = 1) => {
      return array?.slice(0, count) || [];
    });
    
    // URL helpers
    Handlebars.registerHelper('trackingUrl', function(this: any, url: string) {
      const baseUrl = this.baseUrl;
      const userId = this.user?.id;
      const emailId = this.emailId;
      
      if (!userId || !emailId) return url;
      
      const trackingParams = new URLSearchParams({
        utm_source: 'email',
        utm_medium: 'safeplay',
        utm_campaign: this.campaignId || 'general',
        user_id: userId,
        email_id: emailId
      });
      
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${trackingParams.toString()}`;
    });
    
    // mySafePlay™(TM) specific helpers
    Handlebars.registerHelper('verificationBadge', function(this: any) {
      const user = this.user;
      if (!user) return '';
      
      const level = user.verificationLevel;
      const badges = {
        UNVERIFIED: ' Verification Pending',
        EMAIL_VERIFIED: ' Email Verified',
        PHONE_VERIFIED: '* Phone Verified',
        IDENTITY_VERIFIED: ' Identity Verified',
        FULLY_VERIFIED: ' Fully Verified'
      };
      
      return badges[level] || badges.UNVERIFIED;
    });
    
    Handlebars.registerHelper('safetyTipIcon', (category: string) => {
      const icons = {
        DIGITAL_SAFETY: '*',
        HOME_SAFETY: '',
        OUTDOOR_SAFETY: '',
        TRANSPORTATION_SAFETY: '',
        HEALTH_WELLNESS: '',
        EMERGENCY_PREPAREDNESS: ''
      };
      
      return icons[category] || '*';
    });
  }
}
```

### Template Examples

```handlebars
<!-- Base template with layout -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        /* Responsive email styles */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 10px !important; }
        }
        
        /* Custom CSS */
        {{#if customCSS}}{{{customCSS}}}{{/if}}
    </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{{baseUrl}}/images/safeplay-logo.png" alt="mySafePlay™(TM)" style="height: 60px;">
        </div>
        
        <!-- Personalized greeting -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1e40af;">
                Hi {{user.name}}! 
                {{verificationBadge}}
            </h2>
        </div>
        
        <!-- Main content -->
        <div class="content">
            {{#if children}}
            <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #059669;">Your Children:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                {{#each children}}
                    <li>{{this.firstName}} {{this.lastName}} ({{calculateAge this.dateOfBirth}} years old)</li>
                {{/each}}
                </ul>
            </div>
            {{/if}}
            
            <!-- Dynamic content blocks -->
            {{#each contentBlocks}}
            <div style="margin: 20px 0;">
                {{#eq this.type 'safety_tip'}}
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                    <h3 style="color: #059669; margin-top: 0;">
                        {{safetyTipIcon this.category}} {{this.title}}
                    </h3>
                    <p>{{this.description}}</p>
                    {{#if this.actionItems}}
                    <ul>
                    {{#each this.actionItems}}
                        <li>{{this}}</li>
                    {{/each}}
                    </ul>
                    {{/if}}
                </div>
                {{/eq}}
                
                {{#eq this.type 'cta_button'}}
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{{trackingUrl this.url}}" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        {{this.text}}
                    </a>
                </div>
                {{/eq}}
            </div>
            {{/each}}
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
            <p>
                You're receiving this email because you're a mySafePlay™(TM) user.<br>
                <a href="{{unsubscribeUrl}}">Unsubscribe</a> | 
                <a href="{{baseUrl}}/email-preferences">Email Preferences</a> | 
                <a href="{{baseUrl}}/privacy">Privacy Policy</a>
            </p>
        </div>
    </div>
    
    <!-- Tracking pixel -->
    <img src="{{trackingPixelUrl}}" width="1" height="1" style="display: none;">
</body>
</html>
```

## Queue Management

### Queue Architecture

```typescript
// lib/email/queue-manager.ts
export class EmailQueueManager {
  private readonly QUEUE_CONFIG = {
    batchSize: 100,
    maxRetries: 3,
    retryDelays: [5, 15, 60], // minutes
    processingInterval: 30, // seconds
    priorityLevels: ['URGENT', 'HIGH', 'NORMAL', 'LOW']
  };
  
  async addToQueue(emailData: QueueEmailRequest): Promise<string> {
    // Validate email data
    const validation = await this.validateEmailData(emailData);
    if (!validation.valid) {
      throw new Error(`Invalid email data: ${validation.errors.join(', ')}`);
    }
    
    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(emailData);
    
    // Determine optimal send time
    const scheduledAt = emailData.scheduledAt || await this.calculateOptimalSendTime(emailData.userId);
    
    // Create queue entry
    const queueEntry = await this.queueRepository.create({
      emailLogId: emailData.emailLogId,
      priority: emailData.priority || 'NORMAL',
      priorityScore,
      scheduledAt,
      attempts: 0,
      maxAttempts: emailData.maxAttempts || this.QUEUE_CONFIG.maxRetries,
      status: 'PENDING',
      createdAt: new Date()
    });
    
    // Log queue addition
    await this.logQueueEvent({
      queueId: queueEntry.id,
      event: 'ADDED_TO_QUEUE',
      details: { priority: emailData.priority, scheduledAt }
    });
    
    return queueEntry.id;
  }
  
  async processQueue(): Promise<QueueProcessingResult> {
    const startTime = Date.now();
    const result = {
      processed: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      skipped: 0
    };
    
    try {
      // Get pending emails ready for processing
      const pendingEmails = await this.getPendingEmails();
      
      // Process in batches
      const batches = this.createBatches(pendingEmails, this.QUEUE_CONFIG.batchSize);
      
      for (const batch of batches) {
        const batchResult = await this.processBatch(batch);
        
        result.processed += batchResult.processed;
        result.successful += batchResult.successful;
        result.failed += batchResult.failed;
        result.retried += batchResult.retried;
        result.skipped += batchResult.skipped;
      }
      
      // Log processing results
      await this.logQueueProcessing({
        ...result,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      });
      
      return result;
      
    } catch (error) {
      console.error('Queue processing failed:', error);
      throw error;
    }
  }
  
  private async processBatch(batch: QueueEntry[]): Promise<BatchProcessingResult> {
    const result = {
      processed: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      skipped: 0
    };
    
    // Process emails in parallel with concurrency limit
    const concurrencyLimit = 10;
    const chunks = this.createChunks(batch, concurrencyLimit);
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (queueEntry) => {
        try {
          result.processed++;
          
          // Update queue entry status
          await this.updateQueueEntry(queueEntry.id, {
            status: 'PROCESSING',
            processingStartedAt: new Date()
          });
          
          // Send email
          const sendResult = await this.sendEmail(queueEntry);
          
          if (sendResult.success) {
            // Mark as completed
            await this.updateQueueEntry(queueEntry.id, {
              status: 'COMPLETED',
              processingCompletedAt: new Date(),
              processingDuration: Date.now() - new Date(queueEntry.processingStartedAt).getTime()
            });
            
            result.successful++;
          } else {
            // Handle failure
            await this.handleEmailFailure(queueEntry, sendResult.error);
            
            if (queueEntry.attempts < queueEntry.maxAttempts) {
              result.retried++;
            } else {
              result.failed++;
            }
          }
          
        } catch (error) {
          console.error(`Failed to process queue entry ${queueEntry.id}:`, error);
          await this.handleEmailFailure(queueEntry, error.message);
          result.failed++;
        }
      });
      
      await Promise.all(promises);
    }
    
    return result;
  }
  
  private async handleEmailFailure(queueEntry: QueueEntry, errorMessage: string): Promise<void> {
    const newAttempts = queueEntry.attempts + 1;
    
    if (newAttempts < queueEntry.maxAttempts) {
      // Schedule retry
      const retryDelay = this.QUEUE_CONFIG.retryDelays[Math.min(newAttempts - 1, this.QUEUE_CONFIG.retryDelays.length - 1)];
      const nextAttemptAt = new Date(Date.now() + retryDelay * 60 * 1000);
      
      await this.updateQueueEntry(queueEntry.id, {
        status: 'PENDING',
        attempts: newAttempts,
        nextAttemptAt,
        lastAttemptAt: new Date(),
        errorMessage
      });
      
      await this.logQueueEvent({
        queueId: queueEntry.id,
        event: 'RETRY_SCHEDULED',
        details: { attempt: newAttempts, nextAttemptAt, error: errorMessage }
      });
    } else {
      // Mark as failed
      await this.updateQueueEntry(queueEntry.id, {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage
      });
      
      // Move to dead letter queue
      await this.moveToDeadLetterQueue(queueEntry, errorMessage);
      
      await this.logQueueEvent({
        queueId: queueEntry.id,
        event: 'MOVED_TO_DLQ',
        details: { finalAttempt: newAttempts, error: errorMessage }
      });
    }
  }
  
  private calculatePriorityScore(emailData: QueueEmailRequest): number {
    let score = 50; // Base score
    
    // Priority level adjustment
    const priorityScores = {
      URGENT: 100,
      HIGH: 75,
      NORMAL: 50,
      LOW: 25
    };
    score = priorityScores[emailData.priority] || 50;
    
    // Email type adjustment
    if (emailData.emailType === 'ALERT') score += 20;
    if (emailData.emailType === 'SECURITY') score += 15;
    if (emailData.emailType === 'TRANSACTIONAL') score += 10;
    
    // User engagement adjustment
    if (emailData.userEngagementScore) {
      score += Math.min(emailData.userEngagementScore / 10, 10);
    }
    
    // Time sensitivity adjustment
    if (emailData.scheduledAt) {
      const hoursUntilSend = (new Date(emailData.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilSend < 1) score += 15; // Send within 1 hour
      if (hoursUntilSend < 24) score += 5; // Send within 24 hours
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  async getQueueStatus(): Promise<QueueStatus> {
    const [pending, processing, completed, failed, retrying] = await Promise.all([
      this.queueRepository.countByStatus('PENDING'),
      this.queueRepository.countByStatus('PROCESSING'),
      this.queueRepository.countByStatus('COMPLETED'),
      this.queueRepository.countByStatus('FAILED'),
      this.queueRepository.countByStatus('RETRYING')
    ]);
    
    const oldestPending = await this.queueRepository.getOldestPending();
    const averageProcessingTime = await this.calculateAverageProcessingTime();
    
    return {
      pending,
      processing,
      completed,
      failed,
      retrying,
      total: pending + processing + completed + failed + retrying,
      oldestPendingAge: oldestPending ? Date.now() - oldestPending.createdAt.getTime() : 0,
      averageProcessingTime,
      lastProcessedAt: await this.getLastProcessingTime()
    };
  }
}
```

### Queue Monitoring

```typescript
// lib/email/queue-monitor.ts
export class EmailQueueMonitor {
  private readonly ALERT_THRESHOLDS = {
    queueBacklog: 1000,
    processingDelay: 30 * 60 * 1000, // 30 minutes
    failureRate: 0.1, // 10%
    avgProcessingTime: 5 * 60 * 1000 // 5 minutes
  };
  
  async monitorQueue(): Promise<QueueHealthReport> {
    const status = await this.queueManager.getQueueStatus();
    const health = this.assessQueueHealth(status);
    
    // Check for alerts
    const alerts = await this.checkForAlerts(status, health);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(status, health);
    
    const report = {
      timestamp: new Date(),
      status,
      health,
      alerts,
      recommendations
    };
    
    // Send alerts if necessary
    if (alerts.length > 0) {
      await this.sendQueueAlerts(alerts);
    }
    
    return report;
  }
  
  private assessQueueHealth(status: QueueStatus): QueueHealth {
    const health = {
      overall: 'HEALTHY' as HealthStatus,
      backlog: 'HEALTHY' as HealthStatus,
      processing: 'HEALTHY' as HealthStatus,
      failures: 'HEALTHY' as HealthStatus,
      performance: 'HEALTHY' as HealthStatus
    };
    
    // Check backlog
    if (status.pending > this.ALERT_THRESHOLDS.queueBacklog) {
      health.backlog = 'CRITICAL';
      health.overall = 'CRITICAL';
    } else if (status.pending > this.ALERT_THRESHOLDS.queueBacklog * 0.7) {
      health.backlog = 'WARNING';
      if (health.overall === 'HEALTHY') health.overall = 'WARNING';
    }
    
    // Check processing delays
    if (status.oldestPendingAge > this.ALERT_THRESHOLDS.processingDelay) {
      health.processing = 'CRITICAL';
      health.overall = 'CRITICAL';
    } else if (status.oldestPendingAge > this.ALERT_THRESHOLDS.processingDelay * 0.7) {
      health.processing = 'WARNING';
      if (health.overall === 'HEALTHY') health.overall = 'WARNING';
    }
    
    // Check failure rate
    const failureRate = status.total > 0 ? status.failed / status.total : 0;
    if (failureRate > this.ALERT_THRESHOLDS.failureRate) {
      health.failures = 'CRITICAL';
      health.overall = 'CRITICAL';
    } else if (failureRate > this.ALERT_THRESHOLDS.failureRate * 0.7) {
      health.failures = 'WARNING';
      if (health.overall === 'HEALTHY') health.overall = 'WARNING';
    }
    
    // Check performance
    if (status.averageProcessingTime > this.ALERT_THRESHOLDS.avgProcessingTime) {
      health.performance = 'WARNING';
      if (health.overall === 'HEALTHY') health.overall = 'WARNING';
    }
    
    return health;
  }
  
  private async checkForAlerts(status: QueueStatus, health: QueueHealth): Promise<QueueAlert[]> {
    const alerts: QueueAlert[] = [];
    
    if (health.backlog === 'CRITICAL') {
      alerts.push({
        type: 'QUEUE_BACKLOG',
        severity: 'CRITICAL',
        message: `Queue backlog is critical: ${status.pending} pending emails`,
        threshold: this.ALERT_THRESHOLDS.queueBacklog,
        currentValue: status.pending
      });
    }
    
    if (health.processing === 'CRITICAL') {
      alerts.push({
        type: 'PROCESSING_DELAY',
        severity: 'CRITICAL',
        message: `Processing delay is critical: oldest pending email is ${Math.round(status.oldestPendingAge / 60000)} minutes old`,
        threshold: this.ALERT_THRESHOLDS.processingDelay,
        currentValue: status.oldestPendingAge
      });
    }
    
    if (health.failures === 'CRITICAL') {
      const failureRate = status.total > 0 ? (status.failed / status.total) * 100 : 0;
      alerts.push({
        type: 'HIGH_FAILURE_RATE',
        severity: 'CRITICAL',
        message: `Failure rate is critical: ${failureRate.toFixed(1)}%`,
        threshold: this.ALERT_THRESHOLDS.failureRate * 100,
        currentValue: failureRate
      });
    }
    
    return alerts;
  }
  
  async generateQueueMetrics(): Promise<QueueMetrics> {
    const timeRanges = {
      last1Hour: new Date(Date.now() - 60 * 60 * 1000),
      last24Hours: new Date(Date.now() - 24 * 60 * 60 * 1000),
      last7Days: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };
    
    const metrics = {
      throughput: {
        last1Hour: await this.getThroughput(timeRanges.last1Hour),
        last24Hours: await this.getThroughput(timeRanges.last24Hours),
        last7Days: await this.getThroughput(timeRanges.last7Days)
      },
      
      successRate: {
        last1Hour: await this.getSuccessRate(timeRanges.last1Hour),
        last24Hours: await this.getSuccessRate(timeRanges.last24Hours),
        last7Days: await this.getSuccessRate(timeRanges.last7Days)
      },
      
      averageProcessingTime: {
        last1Hour: await this.getAverageProcessingTime(timeRanges.last1Hour),
        last24Hours: await this.getAverageProcessingTime(timeRanges.last24Hours),
        last7Days: await this.getAverageProcessingTime(timeRanges.last7Days)
      },
      
      retryRate: {
        last1Hour: await this.getRetryRate(timeRanges.last1Hour),
        last24Hours: await this.getRetryRate(timeRanges.last24Hours),
        last7Days: await this.getRetryRate(timeRanges.last7Days)
      }
    };
    
    return metrics;
  }
}
```

## Performance Optimization

### Queue Optimization Strategies

```typescript
// lib/email/queue-optimizer.ts
export class QueueOptimizer {
  async optimizeQueue(): Promise<OptimizationResult> {
    const optimizations = [];
    
    // Analyze queue performance
    const performance = await this.analyzeQueuePerformance();
    
    // Optimize batch size
    const optimalBatchSize = await this.calculateOptimalBatchSize(performance);
    if (optimalBatchSize !== this.currentBatchSize) {
      optimizations.push({
        type: 'BATCH_SIZE',
        current: this.currentBatchSize,
        recommended: optimalBatchSize,
        expectedImprovement: '15-25% throughput increase'
      });
    }
    
    // Optimize processing intervals
    const optimalInterval = await this.calculateOptimalProcessingInterval(performance);
    if (optimalInterval !== this.currentProcessingInterval) {
      optimizations.push({
        type: 'PROCESSING_INTERVAL',
        current: this.currentProcessingInterval,
        recommended: optimalInterval,
        expectedImprovement: '10-20% latency reduction'
      });
    }
    
    // Optimize priority scoring
    const priorityOptimization = await this.optimizePriorityScoring(performance);
    if (priorityOptimization.shouldUpdate) {
      optimizations.push({
        type: 'PRIORITY_SCORING',
        current: 'Current algorithm',
        recommended: 'Optimized algorithm',
        expectedImprovement: '5-15% better prioritization'
      });
    }
    
    return {
      optimizations,
      estimatedImpact: this.calculateEstimatedImpact(optimizations),
      implementationComplexity: this.assessImplementationComplexity(optimizations)
    };
  }
  
  private async calculateOptimalBatchSize(performance: QueuePerformance): Promise<number> {
    const currentThroughput = performance.throughput;
    const currentLatency = performance.averageLatency;
    const errorRate = performance.errorRate;
    
    // Test different batch sizes (simulation)
    const testSizes = [50, 75, 100, 125, 150, 200];
    let optimalSize = 100;
    let bestScore = 0;
    
    for (const size of testSizes) {
      const estimatedThroughput = this.estimateThroughput(size, performance);
      const estimatedLatency = this.estimateLatency(size, performance);
      const estimatedErrorRate = this.estimateErrorRate(size, performance);
      
      // Calculate composite score
      const score = this.calculatePerformanceScore(
        estimatedThroughput,
        estimatedLatency,
        estimatedErrorRate
      );
      
      if (score > bestScore) {
        bestScore = score;
        optimalSize = size;
      }
    }
    
    return optimalSize;
  }
  
  async implementOptimizations(optimizations: Optimization[]): Promise<void> {
    for (const optimization of optimizations) {
      switch (optimization.type) {
        case 'BATCH_SIZE':
          await this.updateBatchSize(optimization.recommended);
          break;
        case 'PROCESSING_INTERVAL':
          await this.updateProcessingInterval(optimization.recommended);
          break;
        case 'PRIORITY_SCORING':
          await this.updatePriorityAlgorithm(optimization.recommended);
          break;
      }
      
      // Log optimization implementation
      await this.logOptimization(optimization);
    }
  }
}
```

### Caching Strategy

```typescript
// lib/email/template-cache.ts
export class TemplateCache {
  private cache = new Map<string, CachedTemplate>();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  
  async getCachedTemplate(templateId: string): Promise<CompiledTemplate | null> {
    const cached = this.cache.get(templateId);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(templateId);
      return null;
    }
    
    return cached.compiledTemplate;
  }
  
  async setCachedTemplate(templateId: string, compiledTemplate: CompiledTemplate): Promise<void> {
    this.cache.set(templateId, {
      compiledTemplate,
      timestamp: Date.now()
    });
    
    // Implement cache size limit
    if (this.cache.size > 1000) {
      this.evictOldestEntries(100);
    }
  }
  
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);
    
    for (const [key] of entries) {
      this.cache.delete(key);
    }
  }
  
  async warmCache(): Promise<void> {
    // Pre-load frequently used templates
    const frequentTemplates = await this.getFrequentlyUsedTemplates();
    
    for (const template of frequentTemplates) {
      const compiledTemplate = Handlebars.compile(template.htmlContent);
      await this.setCachedTemplate(template.id, compiledTemplate);
    }
  }
}
```

---

*For additional configuration options and advanced queue management features, refer to the main email automation documentation.*
