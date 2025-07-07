
"use client";

import { useState } from "react";
import { Users, MapPin, Camera, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const [stats] = useState({
    totalUsers: 1247,
    totalVenues: 89,
    totalMemories: 5432,
    totalRevenue: 28750,
    activeUsers: 324,
    alertsToday: 12
  });

  const [recentActivity] = useState([
    { id: 1, type: "venue_created", venue: "Happy Kids Playground", time: "2 hours ago" },
    { id: 2, type: "memory_sold", venue: "Fun Zone", amount: 9.99, time: "3 hours ago" },
    { id: 3, type: "alert_resolved", venue: "Adventure Park", time: "5 hours ago" },
    { id: 4, type: "user_registered", user: "Sarah Johnson", time: "1 day ago" },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Platform overview and performance metrics across all venues
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
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 animate-count-up">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Venues</p>
              <p className="text-2xl font-bold text-gray-900 animate-count-up">
                {stats.totalVenues}
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
              <p className="text-sm font-medium text-gray-500">Memories Created</p>
              <p className="text-2xl font-bold text-gray-900 animate-count-up">
                {stats.totalMemories.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 animate-count-up">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Today</p>
              <p className="text-2xl font-bold text-gray-900 animate-count-up">
                {stats.activeUsers}
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
              <p className="text-sm font-medium text-gray-500">Alerts Today</p>
              <p className="text-2xl font-bold text-gray-900 animate-count-up">
                {stats.alertsToday}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  {activity.type === "venue_created" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">New venue created</p>
                      <p className="text-sm text-gray-500">{activity.venue}</p>
                    </>
                  )}
                  {activity.type === "memory_sold" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">Memory purchased</p>
                      <p className="text-sm text-gray-500">{activity.venue} - ${activity.amount}</p>
                    </>
                  )}
                  {activity.type === "alert_resolved" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">Alert resolved</p>
                      <p className="text-sm text-gray-500">{activity.venue}</p>
                    </>
                  )}
                  {activity.type === "user_registered" && (
                    <>
                      <p className="text-sm font-medium text-gray-900">New user registered</p>
                      <p className="text-sm text-gray-500">{activity.user}</p>
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Venues */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Venues</h2>
          <div className="space-y-4">
            {[
              { name: "Adventure Playground", revenue: 4250, visits: 342 },
              { name: "Happy Kids Zone", revenue: 3890, visits: 298 },
              { name: "Fun City", revenue: 3650, visits: 276 },
              { name: "Play Paradise", revenue: 3200, visits: 245 },
            ].map((venue, index) => (
              <div key={venue.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{venue.name}</p>
                    <p className="text-sm text-gray-500">{venue.visits} visits this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${venue.revenue}</p>
                  <p className="text-sm text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
