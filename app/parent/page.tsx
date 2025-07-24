
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Camera, AlertTriangle, Baby, Play, Shield, Eye, Users, Activity, Loader2 } from "lucide-react";
import Image from "next/image";
import { FaceDetectionPreview, FaceRecognitionResults } from "@/components/face-recognition";
import { useStableSession } from "@/components/providers/stable-session-provider";

// Type definitions
interface Child {
  id: string;
  name: string;
  age: number;
  status: string;
  venue: string | null;
  checkInTime: string | null;
  profilePhoto: string;
  faceRecognitionEnabled: boolean;
  registeredFaces: number;
}

interface Memory {
  id: string;
  childName: string;
  type: string;
  venue: string;
  capturedAt: string;
  thumbnailUrl: string;
  price: number;
  purchased: boolean;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  time: string;
  child: string;
}

interface FaceActivity {
  id: string;
  childName: string;
  eventType: string;
  confidence: number;
  venue: string;
  timestamp: string;
  status: string;
}

export default function ParentDashboard() {
  const { data: session, status } = useStableSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [recentFaceActivity, setRecentFaceActivity] = useState<FaceActivity[]>([]);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // CRITICAL FIX: Only provide demo data for actual demo accounts
  const getDemoChildren = (userEmail?: string) => {
    // ONLY return demo data for actual demo accounts
    if (userEmail === 'parent@mysafeplay.ai') {
      console.log('🎭 Dashboard: Demo account parent@mysafeplay.ai - returning demo children');
      return [
        {
          id: "demo-1",
          name: "Emma Johnson",
          age: 7,
          status: "CHECKED_IN",
          venue: "Adventure Playground",
          checkInTime: "2:30 PM",
          profilePhoto: "https://thumbs.dreamstime.com/z/portrait-cute-young-girl-pigtails-isolated-white-68910712.jpg",
          faceRecognitionEnabled: true,
          registeredFaces: 2
        },
        {
          id: "demo-2", 
          name: "Lucas Johnson",
          age: 5,
          status: "CHECKED_OUT",
          venue: null,
          checkInTime: null,
          profilePhoto: "https://i.pinimg.com/originals/be/e3/55/bee3559c606717fec5f0d7b753a5f788.png",
          faceRecognitionEnabled: false,
          registeredFaces: 0
        },
        {
          id: "demo-3",
          name: "Sophia Johnson", 
          age: 4,
          status: "CHECKED_OUT",
          venue: null,
          checkInTime: null,
          profilePhoto: "https://thumbs.dreamstime.com/z/portrait-happy-smiling-little-girl-white-background-cute-child-looking-camera-studio-shot-childhood-happiness-concept-192784866.jpg",
          faceRecognitionEnabled: true,
          registeredFaces: 1
        }
      ];
    }

    // For ALL other accounts (including new signups), return empty array
    console.log('🧹 Dashboard: Real user account - returning empty children for clean start');
    return [];
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    // Fetch real user data
    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get user email for account-specific demo data
      const userEmail = session?.user?.email;
      console.log('🔍 Dashboard: Fetching data for user:', userEmail);
      
      // Fetch user's children
      const childrenResponse = await fetch('/api/children');
      let childrenData = [];
      if (childrenResponse.ok) {
        const apiData = await childrenResponse.json();
        console.log('✅ Dashboard: Children API data:', apiData);
        
        // Transform API data to match dashboard Child interface
        childrenData = apiData.map((child: any) => ({
          id: child.id,
          name: child.name || `${child.firstName || ''} ${child.lastName || ''}`.trim(),
          age: child.age || 0,
          status: child.status || "CHECKED_OUT",
          venue: child.venue || null,
          checkInTime: child.checkInTime || null,
          profilePhoto: child.profilePhoto || "https://i.pinimg.com/originals/88/ed/d8/88edd897f7ed1ef75a69a5f6f6815c12.jpg",
          faceRecognitionEnabled: child.faceRecognitionEnabled || false,
          registeredFaces: child.registeredFaces || 0
        }));
      }
      
      // CRITICAL FIX: Only use demo data for actual demo accounts, not as fallback
      if (childrenData.length === 0) {
        // Only provide demo data for actual demo accounts
        if (userEmail === 'parent@mysafeplay.ai') {
          console.log('🎭 Dashboard: Demo account - using demo children data');
          childrenData = getDemoChildren(userEmail);
        } else {
          console.log('🧹 Dashboard: Real user account - keeping empty children for clean start');
          childrenData = [];
        }
      }
      
      // Fetch user's memories
      const memoriesResponse = await fetch('/api/memories');
      let memoriesData = [];
      if (memoriesResponse.ok) {
        memoriesData = await memoriesResponse.json();
        console.log('✅ Dashboard: Memories data fetched:', memoriesData);
      }
      
      setChildren(childrenData);
      setRecentMemories(memoriesData || []);
      
      // For now, keep other data empty until we implement those features
      setRecentFaceActivity([]);
      setNotifications([]);
      
    } catch (error) {
      console.error('Dashboard: Error fetching user data:', error);
      // CRITICAL FIX: Only provide demo data for actual demo accounts on error
      const userEmail = session?.user?.email;
      if (userEmail === 'parent@mysafeplay.ai') {
        console.log('🎭 Dashboard: Demo account error fallback - using demo children data');
        setChildren(getDemoChildren(userEmail));
      } else {
        console.log('🧹 Dashboard: Real user account error - keeping empty children for clean start');
        setChildren([]);
      }
      setRecentMemories([]);
      setRecentFaceActivity([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-1">
          Keep track of your children's safety and create beautiful memories
        </p>
      </div>

      {/* Emergency Button */}
      <div className="card bg-orange-50 border-2 border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Emergency Alert</h3>
              <p className="text-sm text-orange-700">Tap to report an emergency for any of your children</p>
            </div>
          </div>
          <button className="btn-accent text-lg px-6 py-3">
            Report Emergency
          </button>
        </div>
      </div>

      {/* Security Enhancement Required - Only for john@mysafeplay.ai */}
      {(session?.user?.email === 'john@mysafeplay.ai' || session?.user?.email === 'john@doe.com') && (
        <div className="card bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-start space-x-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">Security Enhancement Required</h3>
              <p className="text-yellow-800 mb-4">
                To access child management features and ensure maximum security, please complete the enhanced verification process.
                This includes phone verification and additional security measures.
              </p>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-yellow-900 mb-2">Security Features to Enable:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Two-factor authentication via SMS</li>
                  <li>• Enhanced identity verification</li>
                  <li>• Secure child profile access</li>
                  <li>• Emergency contact verification</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => router.push('/parent/security-enhancement')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Complete Security Setup
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Children Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Children</h2>
          <button 
            onClick={() => router.push('/parent/children')}
            className="btn-primary"
          >
            Add Child
          </button>
        </div>
        {children?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => (
              <div key={child.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                    <Image
                      src={child.profilePhoto}
                      alt={`${child.name} profile`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">Age {child.age}</p>
                    <div className="flex items-center mt-2">
                      {child.status === "CHECKED_IN" ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-green-700 font-medium">
                            At {child.venue}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-500">Not checked in</span>
                        </>
                      )}
                    </div>
                    {child.checkInTime && (
                      <p className="text-xs text-gray-400 mt-1">Since {child.checkInTime}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Added Yet</h3>
            <p className="text-gray-600 mb-6">
              Add your children's profiles to start using SafePlay's safety features
            </p>
            <button 
              onClick={() => router.push('/parent/children')}
              className="btn-primary"
            >
              Add Your First Child
            </button>
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {notifications?.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notification.type === 'check_in' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Activity will appear here when your children check in to venues</p>
          </div>
        )}
      </div>

      {/* Recent Memories */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">New Memories Available</h2>
          <button 
            onClick={() => router.push('/parent/memories')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        {recentMemories?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMemories.map((memory) => (
              <div key={memory.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-32 bg-gray-200">
                  <Image
                    src={memory.thumbnailUrl}
                    alt="Memory thumbnail"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800">
                      {memory.type === "PHOTO" ? "Photo" : "Video"}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{memory.childName}</h3>
                    <span className="text-lg font-bold text-green-600">${memory.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{memory.venue} • {memory.capturedAt}</p>
                  <button className="w-full btn-primary">
                    Purchase Memory
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No New Memories</h3>
            <p className="text-gray-600 mb-6">
              When your children visit SafePlay venues, new photos and videos will appear here for purchase
            </p>
            <button 
              onClick={() => router.push('/parent/memories')}
              className="btn-secondary"
            >
              View All Memories
            </button>
          </div>
        )}
      </div>

      {/* Face Recognition Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Face Recognition Activity
          </h2>
          <button 
            onClick={() => setShowFaceRecognition(true)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            Test Recognition
          </button>
        </div>

        {/* Face Recognition Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {children.filter(c => c.faceRecognitionEnabled).length}
            </p>
            <p className="text-sm text-blue-700">Children with Face ID</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {children.reduce((sum, c) => sum + c.registeredFaces, 0)}
            </p>
            <p className="text-sm text-green-700">Registered Faces</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {recentFaceActivity.filter(a => a.status === 'success').length}
            </p>
            <p className="text-sm text-purple-700">Recent Matches</p>
          </div>
        </div>

        {/* Recent Face Recognition Events */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Recent Events</h3>
          {recentFaceActivity.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent face recognition activity</p>
              <p className="text-sm text-gray-400 mt-1">Set up face recognition for your children to see activity here</p>
            </div>
          ) : (
            recentFaceActivity.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.status === 'success' ? 'bg-green-500' :
                    event.status === 'info' ? 'bg-blue-500' :
                    event.status === 'warning' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{event.eventType}</h4>
                    <p className="text-sm text-gray-600">{event.childName}</p>
                    {event.venue !== 'N/A' && (
                      <p className="text-xs text-gray-500">{event.venue}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {event.confidence > 0 && (
                    <div className={`text-sm font-medium ${
                      event.confidence >= 95 ? 'text-green-600' :
                      event.confidence >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {event.confidence.toFixed(1)}%
                    </div>
                  )}
                  <div className="text-xs text-gray-500">{event.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Face Recognition Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button 
              onClick={() => window.location.href = '/parent/children'}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Shield className="h-4 w-4 mr-2 inline" />
              Manage Face Recognition
            </button>
            <button 
              onClick={() => setShowFaceRecognition(true)}
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Camera className="h-4 w-4 mr-2 inline" />
              Test Face Detection
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Baby className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{children?.length || 0}</p>
          <p className="text-sm text-gray-500">Children</p>
        </div>
        <div className="card text-center">
          <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {children?.filter(c => c.status === "CHECKED_IN")?.length || 0}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="card text-center">
          <Camera className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{recentMemories?.length || 0}</p>
          <p className="text-sm text-gray-500">New Memories</p>
        </div>
        <div className="card text-center">
          <Play className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500">Venues Visited</p>
        </div>
      </div>

      {/* Face Recognition Test Modal */}
      {showFaceRecognition && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Test Face Detection & Recognition
              </h3>
              <button
                onClick={() => setShowFaceRecognition(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Test Face Recognition</h4>
              <p className="text-sm text-blue-800">
                Upload a photo to test face detection and see how our system would identify faces. 
                This helps you understand how face recognition works for your children.
              </p>
            </div>

            <FaceDetectionPreview
              showDetailedAnalysis={true}
              onDetectionComplete={(result) => {
                console.log('Face detection result:', result);
                // In a real app, you could also test face recognition here
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
