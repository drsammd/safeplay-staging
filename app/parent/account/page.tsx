
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, CreditCard, Bell, Shield, Save, Loader2 } from "lucide-react";

interface SubscriptionData {
  id: string;
  status: string;
  planType: string;
  planId: string;
  currentPeriodEnd: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodStart: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
  isPaid: boolean;
  isFree: boolean;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription: SubscriptionData | null;
}

// Helper function to get plan display information
const getPlanInfo = (planType: string) => {
  const planMap = {
    'FREE': { name: 'Free Plan', price: 0, currency: 'usd' },
    'BASIC': { name: 'Basic Plan', price: 9.99, currency: 'usd' },
    'PREMIUM': { name: 'Premium Plan', price: 19.99, currency: 'usd' },
    'FAMILY': { name: 'Family Plan', price: 29.99, currency: 'usd' },
    'LIFETIME': { name: 'Lifetime Plan', price: 499.99, currency: 'usd' }
  };
  return planMap[planType as keyof typeof planMap] || { name: 'Unknown Plan', price: 0, currency: 'usd' };
};

export default function AccountPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    checkInOut: true,
    memoryAvailable: true,
    alerts: true,
    marketing: false,
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data including subscription
  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUserData(data);
      
      // Update form data with real user info
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: "+1 (555) 123-4567", // Mock data - replace with real phone if available
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating profile:", formData);
    // In a real app, this would call the API
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile, notifications, and subscription
        </p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                className="input-field mt-1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                className="input-field mt-1"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              className="input-field mt-1"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Check-in/Check-out Alerts</h3>
              <p className="text-sm text-gray-500">Get notified when your children enter or leave venues</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={notifications.checkInOut}
              onChange={(e) => handleNotificationChange('checkInOut', e.target.checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">New Memory Available</h3>
              <p className="text-sm text-gray-500">Notifications when new photos or videos are captured</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={notifications.memoryAvailable}
              onChange={(e) => handleNotificationChange('memoryAvailable', e.target.checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Safety Alerts</h3>
              <p className="text-sm text-gray-500">Important safety notifications and emergencies</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={notifications.alerts}
              onChange={(e) => handleNotificationChange('alerts', e.target.checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Marketing Communications</h3>
              <p className="text-sm text-gray-500">Updates about new features and promotions</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={notifications.marketing}
              onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="card">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading subscription data...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchUserData}
              className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        ) : userData?.subscription ? (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {getPlanInfo(userData.subscription.planType).name}
                </h3>
                <span className="text-2xl font-bold text-green-600">
                  {userData.subscription.planType === 'FREE' ? 'Free' : 
                   userData.subscription.planType === 'LIFETIME' ? 'One-time' :
                   `$${getPlanInfo(userData.subscription.planType).price}/month`}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Status: <span className={`font-medium capitalize ${
                  userData.subscription.status === 'ACTIVE' ? 'text-green-600' : 
                  userData.subscription.status === 'TRIALING' ? 'text-blue-600' :
                  userData.subscription.status === 'PAST_DUE' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {userData.subscription.status.toLowerCase()}
                  {userData.subscription.status === 'TRIALING' && ' (Trial Period)'}
                </span>
              </p>
              {userData.subscription.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  {userData.subscription.planType === 'FREE' ? 'Active until: ' : 'Next billing date: '}
                  {new Date(userData.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {userData.subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Your subscription will cancel at the end of the current billing period.
                </p>
              )}
            </div>
            
            <div className="flex space-x-4">
              {userData.subscription.planType === 'FREE' ? (
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = '/parent/subscription'}
                >
                  Upgrade Plan
                </button>
              ) : (
                <>
                  <button 
                    className="btn-primary"
                    onClick={() => window.location.href = '/parent/subscription'}
                  >
                    Change Plan
                  </button>
                  <button className="btn-secondary">Update Payment</button>
                  <button className="text-red-600 hover:text-red-700 font-medium">
                    Cancel Subscription
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4 text-center">
              <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">
                You don't have an active subscription yet. Choose a plan to get started with SafePlay premium features.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Real-time safety monitoring</p>
                <p>✓ Automatic memory capture</p>
                <p>✓ Advanced alert system</p>
                <p>✓ Unlimited venue access</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button 
                className="btn-primary"
                onClick={() => window.location.href = '/parent/subscription'}
              >
                Choose a Plan
              </button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </>
        )}
      </div>

      {/* Security */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">Last updated 2 months ago</p>
            </div>
            <button className="btn-secondary">Change Password</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="btn-primary">Enable 2FA</button>
          </div>
        </div>
      </div>
    </div>
  );
}
