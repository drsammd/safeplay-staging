
"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, MapPin, Calendar, Camera, Shield, Eye, Settings } from "lucide-react";
import Image from "next/image";
import { FaceRegistrationWizard, FaceManagement } from "@/components/face-recognition";

export default function ChildrenPage() {
  const [children, setChildren] = useState([
    {
      id: "1",
      firstName: "Emma",
      lastName: "Johnson",
      dateOfBirth: "2017-03-15",
      profilePhoto: "https://thumbs.dreamstime.com/z/portrait-cute-young-girl-pigtails-isolated-white-68910712.jpg",
      status: "CHECKED_IN",
      currentVenue: { name: "Adventure Playground" },
      _count: { memories: 23, trackingEvents: 45 },
      faceRecognitionEnabled: true,
      faceRecognitionConsent: true,
      recognitionThreshold: 0.95,
      faceCollection: { id: "fc1", status: "ACTIVE", faceRecords: [{ id: "fr1" }, { id: "fr2" }] }
    },
    {
      id: "2",
      firstName: "Lucas",
      lastName: "Johnson",
      dateOfBirth: "2019-07-22",
      profilePhoto: "https://i.pinimg.com/originals/be/e3/55/bee3559c606717fec5f0d7b753a5f788.png",
      status: "CHECKED_OUT",
      currentVenue: null,
      _count: { memories: 18, trackingEvents: 32 },
      faceRecognitionEnabled: false,
      faceRecognitionConsent: false,
      recognitionThreshold: 0.95,
      faceCollection: null
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFaceWizard, setShowFaceWizard] = useState(false);
  const [showFaceManagement, setShowFaceManagement] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    profilePhoto: ""
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call the API
    console.log("Adding child:", formData);
    setShowAddModal(false);
    setFormData({ firstName: "", lastName: "", dateOfBirth: "", profilePhoto: "" });
  };

  // Face recognition handlers
  const handleSetupFaceRecognition = (child: any) => {
    setSelectedChild(child);
    setShowFaceWizard(true);
  };

  const handleManageFaces = (child: any) => {
    setSelectedChild(child);
    setShowFaceManagement(true);
  };

  const handleFaceRecognitionComplete = () => {
    setShowFaceWizard(false);
    setShowFaceManagement(false);
    setSelectedChild(null);
    // In a real app, this would refresh the child data
    console.log("Face recognition setup completed");
  };

  const getFaceRecognitionStatus = (child: any) => {
    if (!child.faceRecognitionEnabled) {
      return { status: "disabled", color: "gray", text: "Disabled" };
    }
    if (!child.faceCollection) {
      return { status: "not-setup", color: "yellow", text: "Not Set Up" };
    }
    const faceCount = child.faceCollection.faceRecords?.length || 0;
    if (faceCount === 0) {
      return { status: "no-faces", color: "orange", text: "No Faces" };
    }
    return { status: "active", color: "green", text: `${faceCount} Face(s)` };
  };

  return (
    <div className="min-h-full bg-registration bg-overlay-light">
      <div className="space-y-6 content-overlay">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Children</h1>
          <p className="text-gray-600 mt-1">
            Manage your children's profiles and track their safety
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Child</span>
        </button>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <div key={child.id} className="card hover:shadow-lg transition-shadow">
            <div className="text-center">
              {/* Profile Photo */}
              <div className="relative w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full overflow-hidden">
                <Image
                  src={child.profilePhoto}
                  alt={`${child.firstName} ${child.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Child Info */}
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {child.firstName} {child.lastName}
              </h3>
              <p className="text-gray-500 mb-3">
                Age {calculateAge(child.dateOfBirth)}
              </p>

              {/* Status */}
              <div className="flex items-center justify-center mb-4">
                {child.status === "CHECKED_IN" ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700 font-medium">
                      At {child.currentVenue?.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-500">Not checked in</span>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{child._count.memories}</p>
                  <p className="text-xs text-gray-500">Memories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{child._count.trackingEvents}</p>
                  <p className="text-xs text-gray-500">Visits</p>
                </div>
              </div>

              {/* Face Recognition Status */}
              <div className="mb-4">
                {(() => {
                  const faceStatus = getFaceRecognitionStatus(child);
                  return (
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-600">Face Recognition:</span>
                      <span className={`text-xs font-medium ${
                        faceStatus.color === 'green' ? 'text-green-600' :
                        faceStatus.color === 'yellow' ? 'text-yellow-600' :
                        faceStatus.color === 'orange' ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        {faceStatus.text}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button className="flex-1 btn-primary text-sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button className="flex-1 btn-secondary text-sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Memories
                  </button>
                </div>
                
                {/* Face Recognition Actions */}
                <div className="flex space-x-2">
                  {!child.faceRecognitionEnabled || !child.faceCollection ? (
                    <button 
                      onClick={() => handleSetupFaceRecognition(child)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Setup Face ID
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleManageFaces(child)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage Faces
                    </button>
                  )}
                  
                  {child.faceCollection && (
                    <button 
                      onClick={() => handleManageFaces(child)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Child Card */}
        <div 
          onClick={() => setShowAddModal(true)}
          className="card border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors"
        >
          <div className="text-center py-8">
            <Plus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Child</h3>
            <p className="text-gray-500">Create a profile for another child</p>
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Child</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    className="input-field mt-1"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="input-field mt-1"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700">Profile Photo URL (Optional)</label>
                  <input
                    type="url"
                    className="input-field mt-1"
                    placeholder="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png"
                    value={formData.profilePhoto}
                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 btn-primary">
                    Add Child
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Face Recognition Wizard Modal */}
      {showFaceWizard && selectedChild && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white">
            <FaceRegistrationWizard
              child={selectedChild}
              onComplete={handleFaceRecognitionComplete}
              onCancel={() => {
                setShowFaceWizard(false);
                setSelectedChild(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Face Management Modal */}
      {showFaceManagement && selectedChild && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Face Recognition Management - {selectedChild.firstName} {selectedChild.lastName}
              </h3>
              <button
                onClick={() => {
                  setShowFaceManagement(false);
                  setSelectedChild(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <FaceManagement
              childId={selectedChild.id}
              onUpdate={handleFaceRecognitionComplete}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
