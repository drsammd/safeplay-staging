
"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  MapPin, 
  Camera, 
  Eye,
  Shield,
  Bell,
  X,
  CheckCircle
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DemoAlert {
  id: string;
  type: 'safety' | 'exit' | 'overcrowding' | 'unauthorized' | 'emergency';
  severity: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  childName?: string;
  childAvatar?: string;
  location: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  cameraId?: string;
  confidence?: number;
  autoResolveTime?: number; // seconds until auto-resolve
}

export default function DemoAlertSystem() {
  const [alerts, setAlerts] = useState<DemoAlert[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  // Demo avatars
  const demoAvatars = [
    'https://cdn.abacus.ai/images/f4c211d6-381f-4a4c-9f9e-c83c1f16262a.png',
    'https://cdn.abacus.ai/images/717d6bf8-00ba-428a-be06-751273e7c291.png',
    'https://cdn.abacus.ai/images/5b8a3c7b-6ce9-4d97-8ba4-1c5cbbd72a91.png',
    'https://cdn.abacus.ai/images/c8f16198-68ee-40f3-86b4-43726d5d552b.png',
    'https://cdn.abacus.ai/images/a06294b5-8deb-4342-86fa-a7498885a50c.png',
    'https://cdn.abacus.ai/images/0e8496b3-a6f2-45fb-8ac0-a97f5e6eb921.png',
  ];

  const demoChildren = [
    'Emma Johnson', 'Michael Chen', 'Sofia Martinez', 
    'Marcus Thompson', 'Aria Kim', 'Diego Rodriguez',
    'Zoe Williams', 'Noah Davis', 'Maya Patel'
  ];

  const locations = [
    'Main Entrance', 'Play Area A', 'Play Area B', 'Climbing Zone', 
    'Ball Pit', 'Toddler Area', 'Snack Bar', 'Restrooms', 'Exit Zone'
  ];

  // Alert scenarios for realistic demo
  const alertScenarios = [
    {
      type: 'exit' as const,
      severity: 3 as const,
      title: 'Child Near Exit',
      description: 'Child detected near unsupervised exit zone',
      location: 'Exit Zone',
      requiresChild: true,
      autoResolveTime: 15
    },
    {
      type: 'overcrowding' as const,
      severity: 2 as const,
      title: 'Zone Capacity Alert',
      description: 'Area approaching maximum capacity',
      location: 'Play Area A',
      requiresChild: false,
      autoResolveTime: 30
    },
    {
      type: 'safety' as const,
      severity: 4 as const,
      title: 'Safety Violation',
      description: 'Child in restricted area',
      location: 'Staff Only Area',
      requiresChild: true,
      autoResolveTime: 20
    },
    {
      type: 'unauthorized' as const,
      severity: 3 as const,
      title: 'Unauthorized Person',
      description: 'Unknown individual detected in play area',
      location: 'Toddler Area',
      requiresChild: false,
      autoResolveTime: 25
    },
    {
      type: 'safety' as const,
      severity: 2 as const,
      title: 'Extended Stay Alert',
      description: 'Child has been in same zone for extended period',
      location: 'Restrooms',
      requiresChild: true,
      autoResolveTime: 40
    }
  ];

  // Generate new alert
  const generateAlert = (): DemoAlert => {
    const scenario = alertScenarios[Math.floor(Math.random() * alertScenarios.length)];
    const childName = scenario.requiresChild 
      ? demoChildren[Math.floor(Math.random() * demoChildren.length)]
      : undefined;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: scenario.type,
      severity: scenario.severity,
      title: scenario.title,
      description: childName 
        ? `${childName} - ${scenario.description}`
        : scenario.description,
      childName,
      childAvatar: childName ? demoAvatars[Math.floor(Math.random() * demoAvatars.length)] : undefined,
      location: scenario.location,
      timestamp: new Date(),
      status: 'active',
      cameraId: `CAM-${Math.floor(Math.random() * 8) + 1}`,
      confidence: 0.85 + Math.random() * 0.15,
      autoResolveTime: scenario.autoResolveTime
    };
  };

  // Simulate alert system
  useEffect(() => {
    if (!isSimulating) return;

    // Generate initial alerts
    setAlerts([
      {
        ...generateAlert(),
        type: 'exit',
        severity: 3,
        title: 'Child Near Exit',
        description: 'Sofia Martinez detected near unsupervised exit zone',
        childName: 'Sofia Martinez',
        childAvatar: demoAvatars[2],
        location: 'Exit Zone',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        autoResolveTime: 15
      },
      {
        ...generateAlert(),
        type: 'overcrowding',
        severity: 2,
        title: 'Zone Capacity Alert',
        description: 'Play Area A approaching capacity limit',
        location: 'Play Area A',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        autoResolveTime: 30
      }
    ]);

    // Randomly generate new alerts
    const alertInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every interval
        setAlerts(prev => [generateAlert(), ...prev.slice(0, 9)]);
      }
    }, 8000 + Math.random() * 12000);

    // Auto-resolve alerts based on their timer
    const resolveInterval = setInterval(() => {
      setAlerts(prev => prev.map(alert => {
        if (alert.status === 'active' && alert.autoResolveTime) {
          const elapsed = (Date.now() - alert.timestamp.getTime()) / 1000;
          if (elapsed > alert.autoResolveTime) {
            return { ...alert, status: 'resolved' };
          }
        }
        return alert;
      }));
    }, 2000);

    return () => {
      clearInterval(alertInterval);
      clearInterval(resolveInterval);
    };
  }, [isSimulating]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'text-blue-600 bg-blue-100 border-blue-200';
      case 2: return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 3: return 'text-orange-600 bg-orange-100 border-orange-200';
      case 4: return 'text-red-600 bg-red-100 border-red-200';
      case 5: return 'text-purple-600 bg-purple-100 border-purple-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety': return <Shield className="h-4 w-4" />;
      case 'exit': return <MapPin className="h-4 w-4" />;
      case 'overcrowding': return <Users className="h-4 w-4" />;
      case 'unauthorized': return <Eye className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return alert.status === 'active';
    if (filter === 'resolved') return alert.status === 'resolved';
    return true;
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const highPriorityAlerts = activeAlerts.filter(a => a.severity >= 3);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">Alert Management System</h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">LIVE DEMO</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1 text-sm rounded ${
              isSimulating 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="p-3 bg-red-100 rounded-lg w-fit mx-auto mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeAlerts.length}</p>
          <p className="text-sm text-gray-600">Active Alerts</p>
        </div>
        
        <div className="card text-center">
          <div className="p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-2">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{highPriorityAlerts.length}</p>
          <p className="text-sm text-gray-600">High Priority</p>
        </div>
        
        <div className="card text-center">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
            <Camera className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-600">Monitoring Cameras</p>
        </div>
        
        <div className="card text-center">
          <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-2">
            <Eye className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">97%</p>
          <p className="text-sm text-gray-600">Detection Accuracy</p>
        </div>
      </div>

      {/* Alert Filters */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {['all', 'active', 'resolved'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-3 py-1 text-sm rounded-full capitalize ${
              filter === filterOption
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption}
            <span className="ml-1 text-xs">
              ({filterOption === 'all' ? alerts.length : 
                filterOption === 'active' ? activeAlerts.length :
                alerts.filter(a => a.status === 'resolved').length})
            </span>
          </button>
        ))}
      </div>

      {/* Active Alerts List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Alert Feed</h3>
          <Badge variant="outline" className="text-xs">
            {filteredAlerts.length} alerts shown
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-lg transition-all ${
                alert.status === 'active' ? getSeverityColor(alert.severity) :
                alert.status === 'acknowledged' ? 'bg-blue-50 border-blue-300' :
                'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Alert icon */}
                  <div className={`p-2 rounded-lg ${
                    alert.status === 'active' ? getSeverityColor(alert.severity).replace('text-', 'bg-').replace('bg-', 'text-white bg-') :
                    'bg-gray-500 text-white'
                  }`}>
                    {getTypeIcon(alert.type)}
                  </div>

                  {/* Alert content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        Level {alert.severity}
                      </Badge>
                      {alert.status === 'resolved' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-2">{alert.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                      {alert.confidence && (
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{Math.round(alert.confidence * 100)}% confidence</span>
                        </div>
                      )}
                    </div>

                    {/* Child info if present */}
                    {alert.childName && alert.childAvatar && (
                      <div className="flex items-center space-x-2 mt-2 p-2 bg-white rounded border">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={alert.childAvatar}
                            alt={alert.childName}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{alert.childName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {alert.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs"
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="text-xs"
                      >
                        Resolve
                      </Button>
                    </>
                  )}
                  
                  {alert.status === 'acknowledged' && (
                    <Button
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="text-xs"
                    >
                      Resolve
                    </Button>
                  )}

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Auto-resolve countdown for active alerts */}
              {alert.status === 'active' && alert.autoResolveTime && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Auto-resolves in:</span>
                    <span className="font-mono">
                      {Math.max(0, alert.autoResolveTime - Math.floor((Date.now() - alert.timestamp.getTime()) / 1000))}s
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, 100 - ((Date.now() - alert.timestamp.getTime()) / 1000 / alert.autoResolveTime * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No alerts to display</p>
              <p className="text-sm">System monitoring is active and functioning normally</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
