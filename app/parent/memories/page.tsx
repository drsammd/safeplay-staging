
"use client";

import { useEffect, useState } from "react";
import { Camera, Play, Download, Filter, ShoppingCart } from "lucide-react";
import Image from "next/image";

export default function MemoriesPage() {
  const [memories, setMemories] = useState([
    {
      id: 1,
      type: "PHOTO",
      fileName: "emma_playground_001.jpg",
      fileUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhn3NX43OWwDOHuKinz4Nd3FzThFH0ZHXdCBN1dRFusjKSfHYzGlVYV_rJ3WA-8TGhwi0GufcklHF9tQVNG8xEzuZOzpoqU-heJgLhYfzpw-YhmD_XTxKt6k5sUYfMuk2yc39aiL75orY8cPrVjaNI42xXdBGoQkrk2Tq0pUMRnDyiAXyLNY7zPcad31cQa/s1920/school-playground-equipment.jpg",
      capturedAt: "2025-01-15T15:30:00Z",
      price: 2.99,
      status: "AVAILABLE",
      child: { firstName: "Emma", lastName: "Johnson" },
      venue: { name: "Adventure Playground" }
    },
    {
      id: 2,
      type: "VIDEO",
      fileName: "emma_swing_video.mp4",
      fileUrl: "https://as2.ftcdn.net/v2/jpg/05/64/89/15/1000_F_564891556_FYqWlRk2H1wd4l1LxUUeHZ85EB5Wmp2i.jpg",
      capturedAt: "2025-01-15T14:45:00Z",
      price: 9.99,
      status: "AVAILABLE",
      child: { firstName: "Emma", lastName: "Johnson" },
      venue: { name: "Adventure Playground" }
    },
    {
      id: 3,
      type: "PHOTO",
      fileName: "lucas_ballpit_002.jpg",
      fileUrl: "https://img.freepik.com/premium-photo/laughing-child-boy-having-fun-ball-pit-birthday-party-kids-amusement-park-indoor-play-center-laughing-playing-with-colorful-balls-playground-ball-pool_1032209-9.jpg",
      capturedAt: "2025-01-14T16:20:00Z",
      price: 2.99,
      status: "PURCHASED",
      child: { firstName: "Lucas", lastName: "Johnson" },
      venue: { name: "Fun Zone" }
    },
    {
      id: 4,
      type: "PHOTO",
      fileName: "emma_climbing_003.jpg",
      fileUrl: "https://i.ytimg.com/vi/vA4x585ipqM/maxresdefault.jpg",
      capturedAt: "2025-01-14T13:15:00Z",
      price: 2.99,
      status: "PURCHASED",
      child: { firstName: "Emma", lastName: "Johnson" },
      venue: { name: "Adventure Playground" }
    }
  ]);

  const [filter, setFilter] = useState("all");
  const [selectedChild, setSelectedChild] = useState("all");

  const filteredMemories = memories.filter(memory => {
    if (filter !== "all" && memory.status !== filter) return false;
    if (selectedChild !== "all" && memory.child.firstName !== selectedChild) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const handlePurchase = async (memoryId: string) => {
    // In a real app, this would call the purchase API
    console.log("Purchasing memory:", memoryId);
    setMemories(prev => prev.map(memory => 
      memory.id.toString() === memoryId 
        ? { ...memory, status: "PURCHASED" as const }
        : memory
    ));
  };

  return (
    <div className="min-h-full bg-gallery bg-overlay-light">
      <div className="space-y-6 content-overlay">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Memory Gallery</h1>
        <p className="text-gray-600 mt-1">
          Beautiful moments captured during your children's playtime
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Camera className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{memories.length}</p>
          <p className="text-sm text-gray-500">Total Memories</p>
        </div>
        <div className="card text-center">
          <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {memories.filter(m => m.status === "AVAILABLE").length}
          </p>
          <p className="text-sm text-gray-500">Available</p>
        </div>
        <div className="card text-center">
          <Download className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {memories.filter(m => m.status === "PURCHASED").length}
          </p>
          <p className="text-sm text-gray-500">Purchased</p>
        </div>
        <div className="card text-center">
          <Play className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {memories.filter(m => m.type === "VIDEO").length}
          </p>
          <p className="text-sm text-gray-500">Videos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Memories</option>
            <option value="AVAILABLE">Available to Purchase</option>
            <option value="PURCHASED">Already Purchased</option>
          </select>
          <select 
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="input-field"
          >
            <option value="all">All Children</option>
            <option value="Emma">Emma</option>
            <option value="Lucas">Lucas</option>
          </select>
        </div>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMemories.map((memory) => (
          <div key={memory.id} className="card hover:shadow-lg transition-shadow overflow-hidden p-0">
            {/* Memory Preview */}
            <div className="relative aspect-video bg-gray-200">
              <Image
                src={memory.fileUrl}
                alt={`Memory of ${memory.child.firstName}`}
                fill
                className="object-cover"
              />
              {memory.type === "VIDEO" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full p-3">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800">
                  {memory.type === "PHOTO" ? "Photo" : "Video"}
                </span>
              </div>
              {memory.status === "PURCHASED" && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Purchased
                  </span>
                </div>
              )}
            </div>

            {/* Memory Details */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">
                  {memory.child.firstName} {memory.child.lastName}
                </h3>
                <span className="text-lg font-bold text-green-600">
                  ${memory.price}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {memory.venue.name} • {formatDate(memory.capturedAt)}
              </p>
              
              {memory.status === "AVAILABLE" ? (
                <button 
                  onClick={() => handlePurchase(memory.id.toString())}
                  className="w-full btn-primary"
                >
                  Purchase Memory
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button className="flex-1 btn-secondary">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                  <button className="flex-1 btn-primary">
                    View
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center py-12">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No memories found</h3>
          <p className="text-gray-500">
            {filter === "all" 
              ? "No memories have been captured yet. Visit a SafePlay venue to start creating memories!"
              : `No memories match your current filter selection.`
            }
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
