
"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Camera, AlertTriangle, Activity, TrendingUp } from "lucide-react";

export default function VenueAdminDashboard() {
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
                  <button className="btn-accent text-sm px-3 py-1">
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
            <button className="btn-primary p-4 h-auto flex flex-col items-center space-y-2">
              <Activity className="h-6 w-6" />
              <span className="text-sm">Live Tracking</span>
            </button>
            <button className="btn-secondary p-4 h-auto flex flex-col items-center space-y-2">
              <Camera className="h-6 w-6" />
              <span className="text-sm">View Cameras</span>
            </button>
            <button className="btn-primary p-4 h-auto flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Staff Status</span>
            </button>
            <button className="btn-secondary p-4 h-auto flex flex-col items-center space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm">Emergency</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
