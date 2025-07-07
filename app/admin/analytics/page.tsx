
"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, Users, Camera, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("month");
  const [metrics] = useState({
    totalRevenue: 28750,
    totalUsers: 1247,
    totalMemories: 5432,
    totalVisits: 2834,
    growth: {
      revenue: 15.2,
      users: 8.5,
      memories: 22.1,
      visits: 12.8
    }
  });

  // Chart data available for future implementation
  // const chartData = [
  //   { month: "Jan", revenue: 2400, users: 89, memories: 412 },
  //   { month: "Feb", revenue: 2100, users: 95, memories: 398 },
  //   { month: "Mar", revenue: 2800, users: 102, memories: 456 },
  //   { month: "Apr", revenue: 3200, users: 118, memories: 502 },
  //   { month: "May", revenue: 2900, users: 125, memories: 489 },
  //   { month: "Jun", revenue: 3100, users: 132, memories: 528 },
  // ];

  const [topVenues] = useState([
    { name: "Adventure Playground", revenue: 8450, visits: 342, growth: 18.5 },
    { name: "Happy Kids Zone", revenue: 7890, visits: 298, growth: 12.3 },
    { name: "Fun City", revenue: 6650, visits: 276, growth: 8.7 },
    { name: "Play Paradise", revenue: 5200, visits: 245, growth: 15.2 },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights across the SafePlay platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input-field"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last 12 months</option>
          </select>
          <button className="btn-primary flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${metrics.totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{metrics.growth.revenue}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalUsers.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-600 ml-1">
                  +{metrics.growth.users}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Memories Created</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalMemories.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600 ml-1">
                  +{metrics.growth.memories}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Camera className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Visits</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalVisits.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-600 ml-1">
                  +{metrics.growth.visits}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Revenue chart would be displayed here</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">User growth chart would be displayed here</p>
          </div>
        </div>
      </div>

      {/* Top Performing Venues */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Venues</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topVenues.map((venue, index) => (
                <tr key={venue.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${venue.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {venue.visits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 ml-1">
                        +{venue.growth}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
