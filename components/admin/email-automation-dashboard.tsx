
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Mail,
  Send,
  Users,
  TrendingUp,
  Settings,
  Play,
  Pause,
  BarChart3,
  MessageSquare,
  Bot,
  Calendar,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface EmailAnalytics {
  summary: {
    totalEmails: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    failureRate: number;
  };
  emailsByStatus: Record<string, number>;
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
  };
  automation: {
    totalRules: number;
    activeRules: number;
    inactiveRules: number;
  };
  preferences: {
    totalUsers: number;
    emailEnabled: number;
    emailDisabled: number;
    globalUnsubscribes: number;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    emailsSent: number;
    createdAt: string;
  }>;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  templateType: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaignType: string;
  status: string;
  createdAt: string;
  _count: {
    emailLogs: number;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  isActive: boolean;
  template: {
    name: string;
  };
  _count: {
    executions: number;
  };
  createdAt: string;
}

interface OnboardingAnalytics {
  overview: {
    totalUsers: number;
    usersWithOnboarding: number;
    onboardingAdoptionRate: number;
    totalScheduledEmails: number;
    sentEmails: number;
    openedEmails: number;
    clickedEmails: number;
    cancelledEmails: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    cancellationRate: number;
  };
  completionByDay: Record<string, {
    day: number;
    scheduled: number;
    sent: number;
    opened: number;
    clicked: number;
    sentRate: number;
    openRate: number;
    clickRate: number;
  }>;
  userCompletionStats: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    templateName: string;
    status: string;
    scheduledAt: string;
    opened: boolean;
    clicked: boolean;
  }>;
}

interface WeeklyCampaignsAnalytics {
  totalCampaignsSent: number;
  totalRecipients: number;
  averageOpenRate: number;
  averageClickRate: number;
  topPerformingTemplate: string | null;
  campaignBreakdown: Array<{
    templateName: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
}

interface WeeklyCampaign {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  template: {
    name: string;
  };
  triggerConditions: Record<string, any>;
  metadata: Record<string, any>;
  emailAutomationExecutions: Array<{
    id: string;
    status: string;
    scheduledFor: string;
    emailLog?: {
      openedAt?: string;
      clickedAt?: string;
    };
  }>;
  createdAt: string;
}

export default function EmailAutomationDashboard() {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [onboardingAnalytics, setOnboardingAnalytics] = useState<OnboardingAnalytics | null>(null);
  const [weeklyCampaigns, setWeeklyCampaigns] = useState<WeeklyCampaign[]>([]);
  const [weeklyCampaignsAnalytics, setWeeklyCampaignsAnalytics] = useState<WeeklyCampaignsAnalytics | null>(null);
  const [weeklyCampaignsStats, setWeeklyCampaignsStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingQueue, setProcessingQueue] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, templatesRes, campaignsRes, rulesRes, onboardingRes, weeklyCampaignsRes, weeklyCampaignsAnalyticsRes] = await Promise.all([
        fetch('/api/email-automation/analytics'),
        fetch('/api/email-automation/templates?limit=5'),
        fetch('/api/email-automation/campaigns?limit=5'),
        fetch('/api/email-automation/rules?limit=5'),
        fetch('/api/email-automation/onboarding/analytics'),
        fetch('/api/email-automation/weekly-campaigns'),
        fetch('/api/email-automation/weekly-campaigns?action=analytics')
      ]);

      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);
      }
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setAutomationRules(rulesData.rules || []);
      }
      if (onboardingRes.ok) {
        const onboardingData = await onboardingRes.json();
        setOnboardingAnalytics(onboardingData.analytics || null);
      }
      if (weeklyCampaignsRes.ok) {
        const weeklyCampaignsData = await weeklyCampaignsRes.json();
        setWeeklyCampaigns(weeklyCampaignsData.campaigns || []);
        setWeeklyCampaignsStats(weeklyCampaignsData.stats || null);
      }
      if (weeklyCampaignsAnalyticsRes.ok) {
        const weeklyAnalyticsData = await weeklyCampaignsAnalyticsRes.json();
        setWeeklyCampaignsAnalytics(weeklyAnalyticsData.analytics || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load email automation data');
    } finally {
      setLoading(false);
    }
  };

  const processEmailQueue = async () => {
    try {
      setProcessingQueue(true);
      const response = await fetch('/api/email-automation/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-queue', limit: 100 })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Queue processed: ${result.result.succeeded} succeeded, ${result.result.failed} failed`);
        fetchData(); // Refresh analytics
      } else {
        toast.error('Failed to process email queue');
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      toast.error('Failed to process email queue');
    } finally {
      setProcessingQueue(false);
    }
  };

  const processAutomations = async () => {
    try {
      setProcessingQueue(true);
      const response = await fetch('/api/email-automation/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-automations', limit: 100 })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Automations processed: ${result.result.succeeded} succeeded, ${result.result.failed} failed`);
        fetchData(); // Refresh analytics
      } else {
        toast.error('Failed to process automations');
      }
    } catch (error) {
      console.error('Error processing automations:', error);
      toast.error('Failed to process automations');
    } finally {
      setProcessingQueue(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'RUNNING':
      case 'SENT':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
      case 'PENDING':
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'BOUNCED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PAUSED':
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Weekly Campaign Management Functions
  const createWeeklyCampaign = async () => {
    try {
      setProcessingQueue(true);
      const response = await fetch('/api/email-automation/weekly-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_campaign' })
      });

      if (response.ok) {
        toast.success('Weekly safety tips campaign created successfully');
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create weekly campaign');
      }
    } catch (error) {
      console.error('Error creating weekly campaign:', error);
      toast.error('Failed to create weekly campaign');
    } finally {
      setProcessingQueue(false);
    }
  };

  const toggleWeeklyCampaign = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/email-automation/weekly-campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, isActive })
      });

      if (response.ok) {
        toast.success(`Campaign ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating weekly campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const testWeeklyCampaign = async (templateName: string, testEmail: string = 'admin@mysafeplay.ai') => {
    try {
      setProcessingQueue(true);
      const response = await fetch('/api/email-automation/weekly-campaigns/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateName, 
          testEmail, 
          weekNumber: Math.floor(Math.random() * 8) + 1 
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error testing weekly campaign:', error);
      toast.error('Failed to send test email');
    } finally {
      setProcessingQueue(false);
    }
  };

  const processWeeklyTrigger = async () => {
    try {
      setProcessingQueue(true);
      const response = await fetch('/api/email-automation/weekly-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_weekly_trigger' })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Weekly campaigns processed: ${result.processedCampaigns} campaigns`);
        if (result.errors && result.errors.length > 0) {
          console.warn('Weekly campaign errors:', result.errors);
        }
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to process weekly campaigns');
      }
    } catch (error) {
      console.error('Error processing weekly campaigns:', error);
      toast.error('Failed to process weekly campaigns');
    } finally {
      setProcessingQueue(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading email automation dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Automation</h1>
          <p className="text-gray-600">Manage email campaigns, templates, and automation rules</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={processEmailQueue} 
            disabled={processingQueue}
            variant="outline"
          >
            {processingQueue ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Process Queue
          </Button>
          <Button 
            onClick={processAutomations} 
            disabled={processingQueue}
            variant="outline"
          >
            {processingQueue ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bot className="h-4 w-4 mr-2" />
            )}
            Run Automations
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Emails</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalEmails}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.deliveryRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.openRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MousePointer className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.clickRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="weekly-campaigns">Weekly Tips</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Active Users</span>
                      <Badge variant="secondary">{analytics.preferences.emailEnabled}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Rules</span>
                      <Badge variant="secondary">{analytics.automation.activeRules}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Running Campaigns</span>
                      <Badge variant="secondary">{analytics.campaigns.byStatus.RUNNING || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Unsubscribes</span>
                      <Badge variant="destructive">{analytics.preferences.globalUnsubscribes}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Top Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-600">{campaign.emailsSent} emails sent</p>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                  ))}
                  {(!analytics?.topCampaigns || analytics.topCampaigns.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No campaigns found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Email Templates
                </span>
                <Button size="sm">
                  Create Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                      <p className="text-xs text-gray-500">{template.templateType} • {template.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(template.isActive ? 'ACTIVE' : 'INACTIVE')}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No templates found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Email Campaigns
                </span>
                <Button size="sm">
                  Create Campaign
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      {campaign.description && (
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {campaign.campaignType} • {campaign._count.emailLogs} emails sent
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No campaigns found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  Automation Rules
                </span>
                <Button size="sm">
                  Create Rule
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      {rule.description && (
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {rule.trigger} • Template: {rule.template.name} • {rule._count.executions} executions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(rule.isActive ? 'ACTIVE' : 'INACTIVE')}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {automationRules.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No automation rules found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          {/* Onboarding Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onboardingAnalytics?.overview.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Onboarding Rate: {onboardingAnalytics?.overview.onboardingAdoptionRate?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onboardingAnalytics?.overview.deliveryRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {onboardingAnalytics?.overview.sentEmails || 0} of {onboardingAnalytics?.overview.totalScheduledEmails || 0} sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onboardingAnalytics?.overview.openRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {onboardingAnalytics?.overview.openedEmails || 0} emails opened
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onboardingAnalytics?.overview.clickRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {onboardingAnalytics?.overview.clickedEmails || 0} emails clicked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                User Completion Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {onboardingAnalytics?.userCompletionStats.notStarted || 0}
                  </div>
                  <p className="text-sm text-gray-500">Not Started</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {onboardingAnalytics?.userCompletionStats.inProgress || 0}
                  </div>
                  <p className="text-sm text-gray-500">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {onboardingAnalytics?.userCompletionStats.completed || 0}
                  </div>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                7-Day Sequence Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(onboardingAnalytics?.completionByDay || {}).map(([key, dayData]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Day {dayData.day}</span>
                      <div className="flex gap-4 text-xs">
                        <span>Sent: {dayData.sentRate?.toFixed(1) || 0}%</span>
                        <span>Opened: {dayData.openRate?.toFixed(1) || 0}%</span>
                        <span>Clicked: {dayData.clickRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(dayData.sentRate || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {dayData.sent || 0} sent • {dayData.opened || 0} opened • {dayData.clicked || 0} clicked
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Onboarding Activity
                </span>
                <Button size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onboardingAnalytics?.recentActivity?.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{activity.userName || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{activity.userEmail}</p>
                      <p className="text-xs text-gray-500">
                        {activity.templateName} • {new Date(activity.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                      {activity.opened && (
                        <Badge variant="outline" className="text-blue-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Opened
                        </Badge>
                      )}
                      {activity.clicked && (
                        <Badge variant="outline" className="text-green-600">
                          <MousePointer className="h-3 w-3 mr-1" />
                          Clicked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {(!onboardingAnalytics?.recentActivity || onboardingAnalytics.recentActivity.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No recent onboarding activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly-campaigns" className="space-y-4">
          {/* Weekly Campaigns Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyCampaignsStats?.activeCampaigns || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {weeklyCampaignsStats?.totalCampaigns || 0} total campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyCampaignsStats?.totalRecipients || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Subscribed to weekly tips
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyCampaignsAnalytics?.averageOpenRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {weeklyCampaignsAnalytics?.totalCampaignsSent || 0} campaigns sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyCampaignsAnalytics?.averageClickRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {weeklyCampaignsStats?.recentExecutions || 0} recent emails
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Weekly Campaigns
                  </span>
                  <div className="flex gap-2">
                    <Button onClick={createWeeklyCampaign} size="sm" disabled={processingQueue}>
                      <Play className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                    <Button onClick={processWeeklyTrigger} size="sm" variant="outline" disabled={processingQueue}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Process Trigger
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyCampaigns && weeklyCampaigns.length > 0 ? (
                    weeklyCampaigns.map((campaign) => (
                      <div key={campaign.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{campaign.name}</h4>
                            <p className="text-sm text-gray-600">
                              {campaign.template?.name || 'No template'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(campaign.isActive ? 'ACTIVE' : 'INACTIVE')}>
                              {campaign.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleWeeklyCampaign(campaign.id, !campaign.isActive)}
                              disabled={processingQueue}
                            >
                              {campaign.isActive ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testWeeklyCampaign(campaign.template?.name || '')}
                              disabled={processingQueue}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Week {(campaign.metadata as any)?.weekNumber || 1} • 
                          {campaign.emailAutomationExecutions?.length || 0} executions • 
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs">
                          Schedule: Tuesdays at {(campaign.triggerConditions as any)?.hour || 10}:00 AM
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No weekly campaigns found</p>
                      <p className="text-sm text-gray-400 mb-4">Create your first weekly safety tips campaign</p>
                      <Button onClick={createWeeklyCampaign} disabled={processingQueue}>
                        <Play className="h-4 w-4 mr-2" />
                        Create Weekly Campaign
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Campaign Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyCampaignsAnalytics?.topPerformingTemplate && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">Top Performing Campaign</h4>
                      <p className="text-sm text-green-600">{weeklyCampaignsAnalytics.topPerformingTemplate}</p>
                    </div>
                  )}
                  
                  {weeklyCampaignsAnalytics?.campaignBreakdown && weeklyCampaignsAnalytics.campaignBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {weeklyCampaignsAnalytics.campaignBreakdown.slice(0, 5).map((campaign, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium truncate">
                              {campaign.templateName.replace('Weekly Safety Tips - ', '')}
                            </span>
                            <div className="flex gap-4 text-xs">
                              <span>📧 {campaign.sent}</span>
                              <span>👀 {campaign.openRate.toFixed(1)}%</span>
                              <span>🖱️ {campaign.clickRate.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(campaign.openRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No performance data yet</p>
                      <p className="text-xs text-gray-400">Data will appear after campaigns are sent</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Campaign Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Campaign Activity
                </span>
                <Button size="sm" variant="outline" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyCampaigns && weeklyCampaigns.length > 0 ? (
                  weeklyCampaigns
                    .flatMap(campaign => 
                      campaign.emailAutomationExecutions?.map(execution => ({
                        ...execution,
                        campaignName: campaign.name,
                        templateName: campaign.template?.name
                      })) || []
                    )
                    .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
                    .slice(0, 10)
                    .map((execution, index) => (
                      <div key={execution.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            execution.status === 'COMPLETED' ? 'bg-green-500' : 
                            execution.status === 'PENDING' ? 'bg-yellow-500' : 
                            execution.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium">{execution.campaignName}</p>
                            <p className="text-xs text-gray-600">{execution.templateName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(execution.scheduledFor).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-400 mt-1">
                            {execution.emailLog?.openedAt && (
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                Opened
                              </span>
                            )}
                            {execution.emailLog?.clickedAt && (
                              <span className="flex items-center">
                                <MousePointer className="h-3 w-3 mr-1" />
                                Clicked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent campaign activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
