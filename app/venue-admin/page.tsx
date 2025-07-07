
"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Camera, AlertTriangle, Activity, TrendingUp, Monitor, Play, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VenueAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    childrenInVenue: 23,
    averageStayTime: 125,
    memoriesCreated: 45,
    activeAlerts: 2,
    todayVisits: 78,
    satisfaction: 4.8
  });

  const [recentEvents, setRecentEvents] = useState([
    { id: 1, type: "check_in", child: "Emma Johnson", time: "2 minutes ago" },
    { id: 2, type: "memory_created", child: "Michael Chen", type_detail: "photo", time: "5 minutes ago" },
    { id: 3, type: "alert", child: "Sofia Martinez", alert: "Near exit zone", time: "8 minutes ago" },
    { id: 4, type: "check_out", child: "Lucas Anderson", time: "12 minutes ago" },
  ]);

  const [activeAlerts, setActiveAlerts] = useState([
    { id: 1, type: "SAFETY", child: "Sofia Martinez", message: "Child near unsupervised exit", severity: 3, time: "8 minutes ago" },
    { id: 2, type: "EXIT", child: "Noah Wilson", message: "Child detected at main entrance", severity: 2, time: "15 minutes ago" },
  ]);

  // Button click handlers
  const handleLiveTracking = () => {
    router.push('/venue-admin/tracking');
  };

  const handleViewCameras = () => {
    router.push('/venue-admin/cameras');
  };

  const handleStaffStatus = () => {
    router.push('/venue-admin/staff');
  };

  const handleEmergency = () => {
    router.push('/venue-admin/emergency');
  };

  const handleResolveAlert = (alertId: number) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Venue Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time monitoring and management for Adventure Playground
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Children in Venue</p>
              <p className="text-3xl font-bold text-blue-600 animate-count-up">
                {stats.childrenInVenue}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Stay Time</p>
              <p className="text-3xl font-bold text-green-600 animate-count-up">
                {stats.averageStayTime}m
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Camera className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Memories Today</p>
              <p className="text-3xl font-bold text-orange-600 animate-count-up">
                {stats.memoriesCreated}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-3xl font-bold text-red-600 animate-count-up">
                {stats.activeAlerts}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Visits</p>
              <p className="text-3xl font-bold text-purple-600 animate-count-up">
                {stats.todayVisits}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Satisfaction</p>
              <p className="text-3xl font-bold text-yellow-600 animate-count-up">
                {stats.satisfaction}★
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo System Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">mySafePlay™ Demo Center</h2>
              <p className="text-gray-600">Interactive demonstration of safety monitoring capabilities</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">LIVE DEMO</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Live Camera Feeds</span>
            </div>
            <p className="text-sm text-gray-600">Real-time detection with privacy-safe avatars</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Zone Tracking</span>
            </div>
            <p className="text-sm text-gray-600">Interactive venue map with occupancy data</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-gray-900">Smart Alerts</span>
            </div>
            <p className="text-sm text-gray-600">Automated safety notifications system</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href="/venue-admin/demo"
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Launch Full Demo Center</span>
          </Link>
          <Link
            href="/venue-admin/tracking"
            className="btn-secondary flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Demo Mode in Live Tracking</span>
          </Link>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 bg-white rounded px-3 py-2 border border-blue-100">
          <strong>Note:</strong> Demo uses generic avatars and simulated data to showcase safety monitoring capabilities 
          while maintaining privacy standards.
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {activeAlerts.length} active
            </span>
          </div>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.child}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alert.severity >= 3 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Level {alert.severity}
                  </span>
                  <button 
                    onClick={() => handleResolveAlert(alert.id)}
                    className="btn-accent text-sm px-3 py-1"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  event.type === 'alert' ? 'bg-red-600' : 
                  event.type === 'check_in' ? 'bg-green-600' : 
                  event.type === 'check_out' ? 'bg-yellow-600' : 'bg-blue-600'
                }`}></div>
                <div className="flex-1 min-w-0">
                  {event.type === "check_in" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">Child checked in</p>
                      <p className="text-sm text-gray-500">{event.child}</p>
                    </>
                  )}
                  {event.type === "check_out" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">Child checked out</p>
                      <p className="text-sm text-gray-500">{event.child}</p>
                    </>
                  )}
                  {event.type === "memory_created" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">Memory captured</p>
                      <p className="text-sm text-gray-500">{event.child} - {event.type_detail}</p>
                    </>
                  )}
                  {event.type === "alert" && (
                    <>
                      <p className="text-sm font-medium text-red-900">Safety alert</p>
                      <p className="text-sm text-red-600">{event.child} - {event.alert}</p>
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleLiveTracking}
              className="btn-primary p-4 h-auto flex flex-col items-center space-y-2 hover:bg-blue-700 transition-colors"
            >
              <Activity className="h-6 w-6" />
              <span className="text-sm">Live Tracking</span>
            </button>
            <button 
              onClick={handleViewCameras}
              className="btn-secondary p-4 h-auto flex flex-col items-center space-y-2 hover:bg-gray-700 transition-colors"
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm">View Cameras</span>
            </button>
            <button 
              onClick={handleStaffStatus}
              className="btn-primary p-4 h-auto flex flex-col items-center space-y-2 hover:bg-blue-700 transition-colors"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Staff Status</span>
            </button>
            <button 
              onClick={handleEmergency}
              className="btn-secondary p-4 h-auto flex flex-col items-center space-y-2 hover:bg-red-700 transition-colors"
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm">Emergency</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
