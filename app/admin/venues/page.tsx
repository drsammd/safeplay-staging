
"use client";

import { useState } from "react";
import { MapPin, Users, Plus, Settings, Trash2, Edit } from "lucide-react";

export default function VenueManagementPage() {
  const [venues] = useState([
    {
      id: 1,
      name: "Adventure Playground",
      address: "123 Fun Street",
      city: "Denver",
      state: "CO",
      admin: { name: "John Smith", email: "john@adventure.com" },
      capacity: 150,
      active: true,
      _count: { children: 23, memories: 145, alerts: 2 }
    },
    {
      id: 2,
      name: "Happy Kids Zone",
      address: "456 Play Avenue",
      city: "Boulder",
      state: "CO",
      admin: { name: "Sarah Johnson", email: "sarah@happykids.com" },
      capacity: 200,
      active: true,
      _count: { children: 18, memories: 98, alerts: 0 }
    },
    {
      id: 3,
      name: "Fun City",
      address: "789 Joy Boulevard",
      city: "Colorado Springs",
      state: "CO",
      admin: { name: "Mike Wilson", email: "mike@funcity.com" },
      capacity: 120,
      active: false,
      _count: { children: 0, memories: 67, alerts: 1 }
    }
  ]);

  // Modal state available for future implementation
  // const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-full bg-venue bg-overlay-light">
      <div className="space-y-6 content-overlay">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Venue Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all SafePlay venues and their administrators
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Venue</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Venues</p>
              <p className="text-2xl font-bold text-gray-900">{venues.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Venues</p>
              <p className="text-2xl font-bold text-gray-900">
                {venues.filter(v => v.active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {venues.reduce((sum, v) => sum + v.capacity, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">
                {venues.reduce((sum, v) => sum + v._count.children, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Venues Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {venues.map((venue) => (
                <tr key={venue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                      <div className="text-sm text-gray-500">
                        {venue.address}, {venue.city}, {venue.state}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{venue.admin.name}</div>
                      <div className="text-sm text-gray-500">{venue.admin.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      venue.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {venue.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {venue.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {venue._count.children}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {venue._count.alerts > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {venue._count.alerts} active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        All clear
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
                        <Settings className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
