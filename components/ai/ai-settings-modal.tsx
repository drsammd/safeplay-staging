
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { 
  Brain, 
  Eye, 
  Heart, 
  Users, 
  Mic, 
  Activity, 
  Shield, 
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AISettings {
  ageEstimation: {
    enabled: boolean;
    accuracy: number;
    confidenceThreshold: number;
    updateInterval: number;
  };
  emotionDetection: {
    enabled: boolean;
    accuracy: number;
    confidenceThreshold: number;
    alertOnNegative: boolean;
    negativeThreshold: number;
  };
  crowdAnalysis: {
    enabled: boolean;
    accuracy: number;
    maxCapacity: number;
    alertThreshold: number;
    updateInterval: number;
  };
  behaviorDetection: {
    enabled: boolean;
    accuracy: number;
    aggressionDetection: boolean;
    bullyingDetection: boolean;
    alertSensitivity: number;
  };
  voiceAnalysis: {
    enabled: boolean;
    accuracy: number;
    stressDetection: boolean;
    volumeMonitoring: boolean;
    alertThreshold: number;
  };
  visualPatterns: {
    enabled: boolean;
    accuracy: number;
    motionTracking: boolean;
    objectRecognition: boolean;
    updateInterval: number;
  };
  general: {
    dataRetention: number;
    privacyMode: boolean;
    parentNotifications: boolean;
    realTimeAlerts: boolean;
    analyticsEnabled: boolean;
  };
}

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdate?: (settings: AISettings) => void;
}

const defaultSettings: AISettings = {
  ageEstimation: {
    enabled: true,
    accuracy: 94.5,
    confidenceThreshold: 85,
    updateInterval: 30,
  },
  emotionDetection: {
    enabled: true,
    accuracy: 89.2,
    confidenceThreshold: 80,
    alertOnNegative: true,
    negativeThreshold: 70,
  },
  crowdAnalysis: {
    enabled: true,
    accuracy: 92.8,
    maxCapacity: 50,
    alertThreshold: 80,
    updateInterval: 60,
  },
  behaviorDetection: {
    enabled: true,
    accuracy: 87.3,
    aggressionDetection: true,
    bullyingDetection: true,
    alertSensitivity: 75,
  },
  voiceAnalysis: {
    enabled: false,
    accuracy: 0,
    stressDetection: false,
    volumeMonitoring: false,
    alertThreshold: 80,
  },
  visualPatterns: {
    enabled: true,
    accuracy: 91.7,
    motionTracking: true,
    objectRecognition: true,
    updateInterval: 45,
  },
  general: {
    dataRetention: 30,
    privacyMode: false,
    parentNotifications: true,
    realTimeAlerts: true,
    analyticsEnabled: true,
  },
};

export function AISettingsModal({ open, onOpenChange, onSettingsUpdate }: AISettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/ai/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || defaultSettings);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      setSettings(defaultSettings);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('AI settings saved successfully');
        setHasChanges(false);
        onSettingsUpdate?.(settings);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error('Failed to save AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info('Settings reset to defaults');
  };

  const updateSetting = (category: keyof AISettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'ageEstimation': return <Eye className="h-5 w-5" />;
      case 'emotionDetection': return <Heart className="h-5 w-5" />;
      case 'crowdAnalysis': return <Users className="h-5 w-5" />;
      case 'behaviorDetection': return <Activity className="h-5 w-5" />;
      case 'voiceAnalysis': return <Mic className="h-5 w-5" />;
      case 'visualPatterns': return <Brain className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span>AI Configuration Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">AI Features</TabsTrigger>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Estimation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFeatureIcon('ageEstimation')}
                      <span>Age Estimation</span>
                    </div>
                    <Switch
                      checked={settings.ageEstimation.enabled}
                      onCheckedChange={(checked) => updateSetting('ageEstimation', 'enabled', checked)}
                    />
                  </CardTitle>
                  <CardDescription>
                    Automatically estimate children's ages for safety compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Accuracy</span>
                    <Badge className={getAccuracyColor(settings.ageEstimation.accuracy)}>
                      {settings.ageEstimation.accuracy}%
                    </Badge>
                  </div>
                  <div>
                    <Label>Confidence Threshold: {settings.ageEstimation.confidenceThreshold}%</Label>
                    <Slider
                      value={[settings.ageEstimation.confidenceThreshold]}
                      onValueChange={([value]) => updateSetting('ageEstimation', 'confidenceThreshold', value)}
                      max={100}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Update Interval: {settings.ageEstimation.updateInterval}s</Label>
                    <Slider
                      value={[settings.ageEstimation.updateInterval]}
                      onValueChange={([value]) => updateSetting('ageEstimation', 'updateInterval', value)}
                      max={120}
                      min={10}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Emotion Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFeatureIcon('emotionDetection')}
                      <span>Emotion Detection</span>
                    </div>
                    <Switch
                      checked={settings.emotionDetection.enabled}
                      onCheckedChange={(checked) => updateSetting('emotionDetection', 'enabled', checked)}
                    />
                  </CardTitle>
                  <CardDescription>
                    Monitor emotional states for wellbeing insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Accuracy</span>
                    <Badge className={getAccuracyColor(settings.emotionDetection.accuracy)}>
                      {settings.emotionDetection.accuracy}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alert on Negative Emotions</Label>
                    <Switch
                      checked={settings.emotionDetection.alertOnNegative}
                      onCheckedChange={(checked) => updateSetting('emotionDetection', 'alertOnNegative', checked)}
                    />
                  </div>
                  <div>
                    <Label>Negative Emotion Threshold: {settings.emotionDetection.negativeThreshold}%</Label>
                    <Slider
                      value={[settings.emotionDetection.negativeThreshold]}
                      onValueChange={([value]) => updateSetting('emotionDetection', 'negativeThreshold', value)}
                      max={100}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Crowd Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFeatureIcon('crowdAnalysis')}
                      <span>Crowd Analysis</span>
                    </div>
                    <Switch
                      checked={settings.crowdAnalysis.enabled}
                      onCheckedChange={(checked) => updateSetting('crowdAnalysis', 'enabled', checked)}
                    />
                  </CardTitle>
                  <CardDescription>
                    Monitor crowd density and capacity limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Accuracy</span>
                    <Badge className={getAccuracyColor(settings.crowdAnalysis.accuracy)}>
                      {settings.crowdAnalysis.accuracy}%
                    </Badge>
                  </div>
                  <div>
                    <Label>Maximum Capacity</Label>
                    <Input
                      type="number"
                      value={settings.crowdAnalysis.maxCapacity}
                      onChange={(e) => updateSetting('crowdAnalysis', 'maxCapacity', parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Alert Threshold: {settings.crowdAnalysis.alertThreshold}%</Label>
                    <Slider
                      value={[settings.crowdAnalysis.alertThreshold]}
                      onValueChange={([value]) => updateSetting('crowdAnalysis', 'alertThreshold', value)}
                      max={100}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Behavior Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFeatureIcon('behaviorDetection')}
                      <span>Behavior Detection</span>
                    </div>
                    <Switch
                      checked={settings.behaviorDetection.enabled}
                      onCheckedChange={(checked) => updateSetting('behaviorDetection', 'enabled', checked)}
                    />
                  </CardTitle>
                  <CardDescription>
                    Detect concerning behavioral patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Accuracy</span>
                    <Badge className={getAccuracyColor(settings.behaviorDetection.accuracy)}>
                      {settings.behaviorDetection.accuracy}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Aggression Detection</Label>
                    <Switch
                      checked={settings.behaviorDetection.aggressionDetection}
                      onCheckedChange={(checked) => updateSetting('behaviorDetection', 'aggressionDetection', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Bullying Detection</Label>
                    <Switch
                      checked={settings.behaviorDetection.bullyingDetection}
                      onCheckedChange={(checked) => updateSetting('behaviorDetection', 'bullyingDetection', checked)}
                    />
                  </div>
                  <div>
                    <Label>Alert Sensitivity: {settings.behaviorDetection.alertSensitivity}%</Label>
                    <Slider
                      value={[settings.behaviorDetection.alertSensitivity]}
                      onValueChange={([value]) => updateSetting('behaviorDetection', 'alertSensitivity', value)}
                      max={100}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Voice Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFeatureIcon('voiceAnalysis')}
                      <span>Voice Analysis</span>
                    </div>
                    <Switch
                      checked={settings.voiceAnalysis.enabled}
                      onCheckedChange={(checked) => updateSetting('voiceAnalysis', 'enabled', checked)}
                    />
                  </CardTitle>
                  <CardDescription>
                    Analyze voice patterns for stress detection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Accuracy</span>
                    <Badge className={settings.voiceAnalysis.enabled ? 'text-gray-500' : 'text-gray-400'}>
                      {settings.voiceAnalysis.enabled ? `${settings.voiceAnalysis.accuracy}%` : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Stress Detection</Label>
                    <Switch
                      checked={settings.voiceAnalysis.stressDetection}
                      onCheckedChange={(checked) => updateSetting('voiceAnalysis', 'stressDetection', checked)}
                      disabled={!settings.voiceAnalysis.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Volume Monitoring</Label>
                    <Switch
                      checked={settings.voiceAnalysis.volumeMonitoring}
                      onCheckedChange={(checked) => updateSetting('voiceAnalysis', 'volumeMonitoring', checked)}
                      disabled={!settings.voiceAnalysis.enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Visual Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFeatureIcon('visualPatterns')}
                      <span>Visual Patterns</span>
                    </div>
                    <Switch
                      checked={settings.visualPatterns.enabled}
                      onCheckedChange={(checked) => updateSetting('visualPatterns', 'enabled', checked)}
                    />
                  </CardTitle>
                  <CardDescription>
                    Advanced visual pattern recognition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Accuracy</span>
                    <Badge className={getAccuracyColor(settings.visualPatterns.accuracy)}>
                      {settings.visualPatterns.accuracy}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Motion Tracking</Label>
                    <Switch
                      checked={settings.visualPatterns.motionTracking}
                      onCheckedChange={(checked) => updateSetting('visualPatterns', 'motionTracking', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Object Recognition</Label>
                    <Switch
                      checked={settings.visualPatterns.objectRecognition}
                      onCheckedChange={(checked) => updateSetting('visualPatterns', 'objectRecognition', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="thresholds" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds & Sensitivity</CardTitle>
                <CardDescription>
                  Configure when and how AI features trigger alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Detection Thresholds</h4>
                    <div>
                      <Label>Age Estimation Confidence: {settings.ageEstimation.confidenceThreshold}%</Label>
                      <Slider
                        value={[settings.ageEstimation.confidenceThreshold]}
                        onValueChange={([value]) => updateSetting('ageEstimation', 'confidenceThreshold', value)}
                        max={100}
                        min={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Emotion Detection Confidence: {settings.emotionDetection.confidenceThreshold}%</Label>
                      <Slider
                        value={[settings.emotionDetection.confidenceThreshold]}
                        onValueChange={([value]) => updateSetting('emotionDetection', 'confidenceThreshold', value)}
                        max={100}
                        min={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Behavior Alert Sensitivity: {settings.behaviorDetection.alertSensitivity}%</Label>
                      <Slider
                        value={[settings.behaviorDetection.alertSensitivity]}
                        onValueChange={([value]) => updateSetting('behaviorDetection', 'alertSensitivity', value)}
                        max={100}
                        min={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Triggers</h4>
                    <div>
                      <Label>Crowd Capacity Alert: {settings.crowdAnalysis.alertThreshold}%</Label>
                      <Slider
                        value={[settings.crowdAnalysis.alertThreshold]}
                        onValueChange={([value]) => updateSetting('crowdAnalysis', 'alertThreshold', value)}
                        max={100}
                        min={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Negative Emotion Threshold: {settings.emotionDetection.negativeThreshold}%</Label>
                      <Slider
                        value={[settings.emotionDetection.negativeThreshold]}
                        onValueChange={([value]) => updateSetting('emotionDetection', 'negativeThreshold', value)}
                        max={100}
                        min={50}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Voice Alert Threshold: {settings.voiceAnalysis.alertThreshold}%</Label>
                      <Slider
                        value={[settings.voiceAnalysis.alertThreshold]}
                        onValueChange={([value]) => updateSetting('voiceAnalysis', 'alertThreshold', value)}
                        max={100}
                        min={50}
                        step={5}
                        className="mt-2"
                        disabled={!settings.voiceAnalysis.enabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General AI Settings</CardTitle>
                <CardDescription>
                  Configure general AI behavior and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Data & Privacy</h4>
                    <div>
                      <Label>Data Retention (days)</Label>
                      <Input
                        type="number"
                        value={settings.general.dataRetention}
                        onChange={(e) => updateSetting('general', 'dataRetention', parseInt(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Privacy Mode</Label>
                      <Switch
                        checked={settings.general.privacyMode}
                        onCheckedChange={(checked) => updateSetting('general', 'privacyMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Analytics Enabled</Label>
                      <Switch
                        checked={settings.general.analyticsEnabled}
                        onCheckedChange={(checked) => updateSetting('general', 'analyticsEnabled', checked)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="flex items-center justify-between">
                      <Label>Parent Notifications</Label>
                      <Switch
                        checked={settings.general.parentNotifications}
                        onCheckedChange={(checked) => updateSetting('general', 'parentNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Real-time Alerts</Label>
                      <Switch
                        checked={settings.general.realTimeAlerts}
                        onCheckedChange={(checked) => updateSetting('general', 'realTimeAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={loading || !hasChanges}>
              {loading ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
