
import Link from "next/link";
import { 
  Heart, 
  Smartphone, 
  Camera, 
  MapPin, 
  Users,
  Bell,
  Shield,
  Settings,
  QrCode,
  MessageCircle,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  Baby,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DocumentationLayout from "@/components/documentation/documentation-layout";

export default function ParentManual() {
  const tableOfContents = [
    { id: "getting-started", title: "Getting Started", level: 1 },
    { id: "account-setup", title: "Account Setup & Child Registration", level: 1 },
    { id: "check-in-out", title: "Check-in & Check-out Process", level: 1 },
    { id: "real-time-tracking", title: "Real-time Child Tracking", level: 1 },
    { id: "mobile-features", title: "Mobile App Features", level: 1 },
    { id: "photo-sharing", title: "Photo & Video Sharing", level: 1 },
    { id: "communication", title: "Parent Communication", level: 1 },
    { id: "ai-safety", title: "AI Safety Features", level: 1 },
    { id: "privacy-settings", title: "Privacy & Security Settings", level: 1 },
    { id: "emergency-procedures", title: "Emergency Procedures", level: 1 },
    { id: "troubleshooting", title: "Troubleshooting", level: 1 },
    { id: "support", title: "Support & Contact", level: 1 }
  ];

  return (
    <DocumentationLayout 
      title="Parent Manual"
      description="Complete user guide for parents to maximize SafePlay features and ensure child safety"
    >
      {/* Quick Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Heart className="h-6 w-6 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-2">Welcome to SafePlay Parents</h3>
            <p className="text-purple-800 mb-4">
              This comprehensive guide will help you make the most of SafePlay's features to keep your children safe 
              while they enjoy their playtime. From initial setup to advanced features, we'll walk you through everything.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Child Safety</Badge>
              <Badge variant="secondary">Real-time Tracking</Badge>
              <Badge variant="secondary">Photo Sharing</Badge>
              <Badge variant="secondary">Mobile App</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Table of Contents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tableOfContents.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-blue-600 hover:text-blue-800 hover:underline"
              >
                {item.title}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <section id="getting-started" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Getting Started</h2>
        
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Welcome!</strong> SafePlay provides peace of mind through advanced child safety technology. 
            This guide will help you set up your account and start using all available features.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span>What You'll Need</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Valid email address for account creation</li>
                <li>• Smartphone with internet connection</li>
                <li>• Child's basic information and photos</li>
                <li>• Emergency contact details</li>
                <li>• Venue location and registration</li>
                <li>• Downloaded SafePlay mobile app (optional)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Key Safety Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Real-time child location tracking</li>
                <li>• AI-powered safety monitoring</li>
                <li>• Instant alerts and notifications</li>
                <li>• Secure check-in/check-out system</li>
                <li>• Emergency communication tools</li>
                <li>• Photo and memory sharing</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How SafePlay Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">Register</h4>
                <p className="text-xs text-gray-600">Create account and add children</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">Check-in</h4>
                <p className="text-xs text-gray-600">Scan QR code at venue</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">Monitor</h4>
                <p className="text-xs text-gray-600">Track and receive updates</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">Check-out</h4>
                <p className="text-xs text-gray-600">Secure pickup process</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Account Setup & Child Registration */}
      <section id="account-setup" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Account Setup & Child Registration</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creating Your SafePlay Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Step-by-Step Registration</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Visit SafePlay website or download the mobile app</li>
                  <li>Click "Sign Up" and provide your email address</li>
                  <li>Create a secure password (minimum 8 characters)</li>
                  <li>Verify your email address through confirmation link</li>
                  <li>Complete your parent profile information</li>
                  <li>Accept terms of service and privacy policy</li>
                  <li>Complete account verification process</li>
                </ol>

                <Alert>
                  <Baby className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> SafePlay requires parental verification for child safety compliance with COPPA regulations.
                    This process ensures only authorized parents can access child information.
                  </AlertDescription>
                </Alert>

                <h4 className="font-semibold">Required Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Personal Information</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Full legal name</li>
                      <li>• Email address and phone number</li>
                      <li>• Home address</li>
                      <li>• Date of birth</li>
                      <li>• Emergency contact information</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Verification Documents</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Government-issued photo ID</li>
                      <li>• Proof of parental relationship</li>
                      <li>• Child's birth certificate (if required)</li>
                      <li>• Additional identity verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adding Your Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Child Profile Setup</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Access "My Children" section from parent dashboard</li>
                  <li>Click "Add New Child" button</li>
                  <li>Enter child's basic information:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Full name and nickname</li>
                      <li>Date of birth and age</li>
                      <li>Physical description (height, weight, hair/eye color)</li>
                      <li>Recent clear photos (front face, profile)</li>
                      <li>Special needs or medical conditions</li>
                      <li>Allergies and dietary restrictions</li>
                    </ul>
                  </li>
                  <li>Set up emergency contacts specific to the child</li>
                  <li>Configure safety preferences and restrictions</li>
                  <li>Add authorized pickup persons</li>
                  <li>Review and save child profile</li>
                </ol>

                <h4 className="font-semibold">Important Child Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Safety Information</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Medical conditions and medications</li>
                      <li>• Allergies and emergency responses</li>
                      <li>• Behavioral considerations</li>
                      <li>• Communication preferences</li>
                      <li>• Special assistance needs</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Pickup Authorization</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Authorized pickup persons list</li>
                      <li>• Photo identification requirements</li>
                      <li>• Emergency backup contacts</li>
                      <li>• Court orders or custody restrictions</li>
                      <li>• Special pickup instructions</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Tip:</strong> Keep your child's profile information up-to-date, especially photos and emergency contacts. 
                    Regular updates ensure the best safety monitoring and response.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Check-in & Check-out Process */}
      <section id="check-in-out" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Check-in & Check-out Process</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-green-600" />
                <span>QR Code Check-in System</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Getting Your QR Code</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Complete account setup and child registration</li>
                  <li>Visit or contact your chosen SafePlay venue</li>
                  <li>Venue staff will generate your family QR code</li>
                  <li>QR code will be emailed or provided at venue</li>
                  <li>Save QR code to your phone's photos/wallet</li>
                  <li>Test QR code scanning before first visit</li>
                </ol>

                <h4 className="font-semibold">Check-in Process</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">At the Venue</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Approach check-in kiosk or staff</li>
                      <li>Present QR code for scanning</li>
                      <li>Verify child identity with staff</li>
                      <li>Review safety information and restrictions</li>
                      <li>Confirm emergency contact details</li>
                      <li>Receive venue information and guidelines</li>
                    </ol>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">System Activation</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Child's tracking system activated</li>
                      <li>• Real-time monitoring begins</li>
                      <li>• Parent notifications enabled</li>
                      <li>• Safety alerts configured</li>
                      <li>• Photo sharing permissions confirmed</li>
                      <li>• Expected pickup time recorded</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Arrive a few minutes early during busy periods to allow time for check-in process. 
                    Have your QR code ready and ensure your phone battery is charged.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check-out and Pickup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Secure Pickup Process</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Approach venue staff or check-out kiosk</li>
                  <li>Present QR code or provide family information</li>
                  <li>Staff will verify your identity and authorization</li>
                  <li>Child will be located and brought to pickup area</li>
                  <li>Verify child has all personal belongings</li>
                  <li>Complete check-out scan to end tracking</li>
                  <li>Receive summary of visit activities (optional)</li>
                </ol>

                <h4 className="font-semibold">Authorized Pickup Persons</h4>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Important:</strong> Only pre-authorized individuals can pick up your child. 
                    Ensure all potential pickup persons are added to your account.
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Photo identification required for all pickups</li>
                    <li>• Emergency changes require parent verification</li>
                    <li>• Staff may request additional verification if unsure</li>
                    <li>• Court orders or custody restrictions are strictly enforced</li>
                  </ul>
                </div>

                <h4 className="font-semibold">Emergency Pickup Procedures</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Contact venue directly by phone for emergency pickup changes</li>
                  <li>• Provide verification information and reason for change</li>
                  <li>• New pickup person must bring photo identification</li>
                  <li>• Venue may require additional verification steps</li>
                  <li>• All emergency pickups are documented for safety</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Real-time Child Tracking */}
      <section id="real-time-tracking" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Real-time Child Tracking</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Live Location Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Accessing Real-time Tracking</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Log into your SafePlay parent account</li>
                  <li>Navigate to "My Children" dashboard</li>
                  <li>Select the child currently at a venue</li>
                  <li>Click "View Live Location" or "Track Now"</li>
                  <li>View real-time position on venue floor plan</li>
                  <li>Access recent activity and movement history</li>
                </ol>

                <h4 className="font-semibold">Understanding the Tracking Display</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Map Features</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Real-time child location (blue dot)</li>
                      <li>• Movement trail and history</li>
                      <li>• Zone boundaries and restrictions</li>
                      <li>• Play area labels and descriptions</li>
                      <li>• Exit and entry points</li>
                      <li>• Staff and supervision areas</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Activity Information</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Current activity and zone</li>
                      <li>• Time spent in each area</li>
                      <li>• Social interactions and friendships</li>
                      <li>• Safety status and alerts</li>
                      <li>• Recent photos and updates</li>
                      <li>• Estimated remaining playtime</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacy Note:</strong> Location tracking is only active during venue visits and automatically 
                    stops when your child is checked out. Data is used solely for safety and is not shared with third parties.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety Alerts and Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Types of Notifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Regular Updates</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Check-in confirmation</li>
                      <li>• Activity zone changes</li>
                      <li>• New photos available</li>
                      <li>• Playtime milestones</li>
                      <li>• Social interactions</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-900 mb-2">Safety Alerts</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Extended time in one area</li>
                      <li>• Approaching restricted zones</li>
                      <li>• Unusual behavior patterns</li>
                      <li>• Low activity levels</li>
                      <li>• Social interaction concerns</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-900 mb-2">Urgent Alerts</h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Emergency situations</li>
                      <li>• Medical attention needed</li>
                      <li>• Unauthorized area access</li>
                      <li>• Immediate pickup requested</li>
                      <li>• Security incidents</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Notification Settings</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Customize your notification preferences in Account Settings:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Frequency of routine updates (every 15min, 30min, hourly)</li>
                  <li>• Types of activities to be notified about</li>
                  <li>• Emergency alert methods (SMS, push, email, call)</li>
                  <li>• Quiet hours or do-not-disturb periods</li>
                  <li>• Photo sharing notification preferences</li>
                  <li>• Social interaction and friendship updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mobile App Features */}
      <section id="mobile-features" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Mobile App Features</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <span>SafePlay Mobile App</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  The SafePlay mobile app provides convenient access to all parent features on your smartphone. 
                  Access through your phone's web browser at <Link href="/parent/mobile" className="text-blue-600 hover:underline">/parent/mobile</Link>
                </p>

                <h4 className="font-semibold">Mobile Dashboard Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Quick Access</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Current child locations and status</li>
                      <li>• Recent photos and activity updates</li>
                      <li>• Emergency contact and pickup options</li>
                      <li>• Real-time safety alerts</li>
                      <li>• Quick check-in history</li>
                      <li>• Venue information and contacts</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Interactive Features</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Live location tracking map</li>
                      <li>• Photo carousel and sharing</li>
                      <li>• Direct messaging with venue staff</li>
                      <li>• Emergency communication tools</li>
                      <li>• Settings and preferences</li>
                      <li>• Activity timeline and history</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Mobile-Specific Features</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Push notifications for real-time alerts</li>
                  <li>• GPS integration for venue directions</li>
                  <li>• Camera access for QR code scanning</li>
                  <li>• Offline mode for essential information</li>
                  <li>• Touch-optimized interface for easy navigation</li>
                  <li>• One-tap emergency calling and messaging</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Sections Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Check-in & Location</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <QrCode className="h-4 w-4 text-green-600" />
                      <Link href="/parent/mobile/check-in" className="text-blue-600 hover:underline">Check-in Scanner</Link>
                    </li>
                    <li className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <Link href="/parent/mobile/location" className="text-blue-600 hover:underline">Live Location Tracking</Link>
                    </li>
                    <li>• QR code management and backup</li>
                    <li>• Check-in history and patterns</li>
                    <li>• Venue maps and directions</li>
                  </ul>

                  <h4 className="font-semibold mb-3 mt-4">Photos & Memories</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-purple-600" />
                      <Link href="/parent/mobile/photos" className="text-blue-600 hover:underline">Photo Gallery</Link>
                    </li>
                    <li>• Real-time photo notifications</li>
                    <li>• Photo download and sharing</li>
                    <li>• Memory albums and collections</li>
                    <li>• Photo permission management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Emergency & Safety</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Link href="/parent/mobile/emergency" className="text-blue-600 hover:underline">Emergency Tools</Link>
                    </li>
                    <li>• One-tap emergency calling</li>
                    <li>• Direct venue communication</li>
                    <li>• Emergency contact management</li>
                    <li>• Incident reporting and feedback</li>
                  </ul>

                  <h4 className="font-semibold mb-3 mt-4">Settings & Preferences</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <Link href="/parent/mobile/settings" className="text-blue-600 hover:underline">App Settings</Link>
                    </li>
                    <li>• Notification preferences</li>
                    <li>• Privacy and sharing controls</li>
                    <li>• Account and profile management</li>
                    <li>• Device and security settings</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Photo & Video Sharing */}
      <section id="photo-sharing" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Photo & Video Sharing</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-purple-600" />
                <span>Memory Capture System</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">How Photo Sharing Works</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Venue staff capture photos during your child's activities</li>
                  <li>AI system identifies your child in group photos</li>
                  <li>Photos are filtered based on your privacy preferences</li>
                  <li>You receive notifications when new photos are available</li>
                  <li>Access photos through parent dashboard or mobile app</li>
                  <li>Download, share, or save photos to your device</li>
                </ol>

                <h4 className="font-semibold">Permission and Privacy Controls</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Sharing Permissions</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Allow/disallow photo capture</li>
                      <li>• Control photo sharing with other parents</li>
                      <li>• Set automatic sharing preferences</li>
                      <li>• Manage group photo permissions</li>
                      <li>• Configure photo quality and frequency</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Privacy Settings</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Facial recognition opt-in/out</li>
                      <li>• Photo storage and retention policies</li>
                      <li>• Third-party sharing restrictions</li>
                      <li>• Marketing and promotional use controls</li>
                      <li>• Data deletion and export options</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Your Choice:</strong> You have complete control over photo capture and sharing. 
                    You can opt out of photography entirely or customize exactly what types of photos you want to receive.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Managing Your Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Accessing Your Photos</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Navigate to "Memories" section in parent dashboard</li>
                  <li>• Use mobile app photo gallery for quick access</li>
                  <li>• Filter photos by date, activity, or venue</li>
                  <li>• Search photos by activity type or other children</li>
                  <li>• View photos in timeline or grid format</li>
                  <li>• Access detailed photo information and metadata</li>
                </ul>

                <h4 className="font-semibold">Photo Features and Tools</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Viewing Options</h5>
                    <ul className="text-sm space-y-1">
                      <li>• High-resolution photo viewing</li>
                      <li>• Slideshow and carousel modes</li>
                      <li>• Zoom and detail examination</li>
                      <li>• Photo comparison and selection</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Organization Tools</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Create custom photo albums</li>
                      <li>• Tag photos with activities</li>
                      <li>• Mark favorite photos</li>
                      <li>• Add personal notes and captions</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Sharing & Export</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Download original quality photos</li>
                      <li>• Share directly to social media</li>
                      <li>• Email photos to family members</li>
                      <li>• Create shareable photo links</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Photo Connection Bonuses</h4>
                <p className="text-sm text-gray-600 mb-2">
                  SafePlay rewards families who share photos with connection bonuses:
                </p>
                <ul className="space-y-1 text-sm ml-4">
                  <li>• Earn points for sharing photos with other families</li>
                  <li>• Build community connections through shared memories</li>
                  <li>• Unlock special features and venue benefits</li>
                  <li>• Participate in photo contests and events</li>
                  <li>• Connect with families who share similar interests</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Parent Communication */}
      <section id="communication" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Parent Communication</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span>Communication Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Ways to Communicate</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">With Venue Staff</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Direct messaging through SafePlay platform</li>
                      <li>• Emergency hotline for urgent matters</li>
                      <li>• Scheduled calls with venue administrators</li>
                      <li>• In-person meetings during pickup/dropoff</li>
                      <li>• Email communication for non-urgent issues</li>
                      <li>• Feedback forms and survey responses</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">With Other Parents</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Secure parent-to-parent messaging</li>
                      <li>• Playdate coordination and scheduling</li>
                      <li>• Group chats for venue events</li>
                      <li>• Friendship connection requests</li>
                      <li>• Community forum discussions</li>
                      <li>• Photo sharing and collaboration</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Enhanced Navigation and Discovery</h4>
                <p className="text-sm text-gray-600 mb-2">
                  SafePlay's AI helps you connect with other families and discover activities:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• AI-powered friendship detection between children</li>
                  <li>• Suggestions for parent connections based on children's interactions</li>
                  <li>• Activity recommendations based on your child's interests</li>
                  <li>• Event notifications for families with similar preferences</li>
                  <li>• Community building through shared experiences</li>
                  <li>• Enhanced venue navigation based on your child's favorite areas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Building Parent Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Making Parent Friends</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Enable "Parent Connections" in your privacy settings</li>
                  <li>SafePlay AI identifies when children play together frequently</li>
                  <li>Receive suggestions to connect with those children's parents</li>
                  <li>Send connection requests through the SafePlay platform</li>
                  <li>Start conversations about shared playdate scheduling</li>
                  <li>Build lasting friendships through ongoing communication</li>
                </ol>

                <h4 className="font-semibold">Playdate Coordination</h4>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800 mb-2">
                    <strong>Smart Scheduling:</strong> SafePlay makes it easy to coordinate playdates with families your children enjoy playing with.
                  </p>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• View mutual availability calendars</li>
                    <li>• Send playdate invitations through the platform</li>
                    <li>• Coordinate venue visits and activities</li>
                    <li>• Share transportation and logistics</li>
                    <li>• Track successful playdate outcomes</li>
                  </ul>
                </div>

                <h4 className="font-semibold">Communication Etiquette</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Respect other families' privacy preferences</li>
                  <li>• Use appropriate language and tone</li>
                  <li>• Respond promptly to time-sensitive messages</li>
                  <li>• Keep conversations focused on children and safety</li>
                  <li>• Report any inappropriate behavior to venue staff</li>
                  <li>• Follow venue-specific communication guidelines</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Safety Features */}
      <section id="ai-safety" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">AI Safety Features</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Understanding SafePlay's AI Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  SafePlay uses advanced artificial intelligence to enhance child safety through behavioral analysis, 
                  emotion detection, and predictive safety monitoring. All AI features respect your privacy and can be customized.
                </p>

                <h4 className="font-semibold">AI Safety Capabilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Behavioral Monitoring</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Real-time emotion and mood detection</li>
                      <li>• Activity level and engagement tracking</li>
                      <li>• Social interaction pattern analysis</li>
                      <li>• Unusual behavior identification</li>
                      <li>• Fatigue and overexertion detection</li>
                      <li>• Age-appropriate activity recommendations</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Safety Predictions</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Risk assessment and prevention</li>
                      <li>• Crowd density and safety analysis</li>
                      <li>• Equipment usage monitoring</li>
                      <li>• Environmental hazard detection</li>
                      <li>• Emergency situation prediction</li>
                      <li>• Personalized safety recommendations</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacy First:</strong> All AI analysis is performed with strict privacy protections. 
                    Data is used solely for safety purposes and is never shared without your explicit consent.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Insights for Parents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">What You'll Receive</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Activity Insights</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Favorite activities and zones</li>
                      <li>• Energy and engagement levels</li>
                      <li>• Skill development observations</li>
                      <li>• Social preference patterns</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Social Development</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Friendship formation patterns</li>
                      <li>• Communication and sharing behaviors</li>
                      <li>• Leadership and cooperation skills</li>
                      <li>• Conflict resolution abilities</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-purple-900 mb-2">Safety Patterns</h5>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Risk awareness and responses</li>
                      <li>• Following safety guidelines</li>
                      <li>• Response to supervision</li>
                      <li>• Emergency procedure understanding</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Customizing AI Features</h4>
                <p className="text-sm text-gray-600 mb-2">
                  You can adjust AI monitoring levels in your account settings:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Choose basic safety monitoring vs. detailed behavioral analysis</li>
                  <li>• Set alert sensitivity levels for different types of situations</li>
                  <li>• Opt in/out of specific AI features like emotion detection</li>
                  <li>• Configure age-appropriate monitoring preferences</li>
                  <li>• Control how AI insights are shared with venue staff</li>
                  <li>• Set data retention preferences for AI analysis</li>
                </ul>

                <h4 className="font-semibold">Using AI Insights for Development</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Identify your child's natural interests and strengths</li>
                  <li>• Understand social development patterns and needs</li>
                  <li>• Recognize potential areas for skill building</li>
                  <li>• Track progress over time with objective data</li>
                  <li>• Make informed decisions about activities and playdates</li>
                  <li>• Share insights with pediatricians or educators when helpful</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Privacy & Security Settings */}
      <section id="privacy-settings" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Privacy & Security Settings</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Managing Your Family's Privacy</h4>
                <p className="text-sm text-gray-600 mb-4">
                  SafePlay provides comprehensive privacy controls to ensure your family's information is protected according to your preferences.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Data Collection Settings</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Location tracking preferences</li>
                      <li>• Photo and video capture permissions</li>
                      <li>• Behavioral analysis opt-in/out</li>
                      <li>• Communication monitoring levels</li>
                      <li>• Social interaction data collection</li>
                      <li>• Marketing and promotional opt-outs</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Sharing Permissions</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Parent-to-parent communication</li>
                      <li>• Photo sharing with other families</li>
                      <li>• Activity data sharing for research</li>
                      <li>• Third-party integration permissions</li>
                      <li>• Emergency contact data sharing</li>
                      <li>• Venue staff communication levels</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>COPPA & GDPR Compliant:</strong> SafePlay adheres to strict privacy regulations for children's data protection. 
                    You have full control over what data is collected and how it's used.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Account Security</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Strong password requirements and periodic updates</li>
                  <li>• Two-factor authentication for enhanced security</li>
                  <li>• Login activity monitoring and alerts</li>
                  <li>• Automatic session timeout for inactive accounts</li>
                  <li>• Secure data encryption for all transmissions</li>
                  <li>• Regular security audits and updates</li>
                </ul>

                <h4 className="font-semibold">Child Protection Measures</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-900 mb-2">Identity Verification</h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Biometric data protection</li>
                      <li>• Secure facial recognition opt-in</li>
                      <li>• Limited data retention periods</li>
                      <li>• Encrypted storage and transmission</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Access Controls</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Strict pickup authorization protocols</li>
                      <li>• Real-time identity verification</li>
                      <li>• Emergency contact validation</li>
                      <li>• Staff background check requirements</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Data Rights and Control</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Request copies of all collected data</li>
                  <li>• Update or correct any inaccurate information</li>
                  <li>• Delete specific data or entire account</li>
                  <li>• Export data in portable formats</li>
                  <li>• Restrict processing for specific purposes</li>
                  <li>• Object to automated decision-making</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Emergency Procedures */}
      <section id="emergency-procedures" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Emergency Procedures</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Emergency Communication</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Emergency Contacts:</strong> In case of emergency, call 911 first, then contact the venue. 
                    SafePlay Emergency Hotline: 1-800-SAFE-911 (available 24/7)
                  </AlertDescription>
                </Alert>

                <h4 className="font-semibold">Emergency Contact Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Immediate Contact</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>911:</strong> Life-threatening emergencies</li>
                      <li>• <strong>Venue Direct:</strong> [Venue phone number]</li>
                      <li>• <strong>SafePlay Emergency:</strong> 1-800-SAFE-911</li>
                      <li>• <strong>Mobile App:</strong> Emergency button</li>
                      <li>• <strong>Text/SMS:</strong> Emergency alert system</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Follow-up Communication</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Email updates and incident reports</li>
                      <li>• Scheduled follow-up calls</li>
                      <li>• Parent portal emergency notifications</li>
                      <li>• Insurance and documentation assistance</li>
                      <li>• Counseling and support resources</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">What to Expect During Emergencies</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Immediate notification through all available channels</li>
                  <li>Clear information about the situation and your child's status</li>
                  <li>Instructions for any actions you need to take</li>
                  <li>Regular updates until the situation is resolved</li>
                  <li>Coordination with emergency services as needed</li>
                  <li>Follow-up support and incident documentation</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Types of Emergency Situations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-900 mb-2">Medical Emergencies</h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Serious injuries requiring immediate care</li>
                      <li>• Allergic reactions or medical episodes</li>
                      <li>• Loss of consciousness or breathing issues</li>
                      <li>• Emergency medication administration</li>
                    </ul>
                    <p className="text-xs text-red-700 mt-2">
                      <strong>Response:</strong> 911 called, parents notified immediately, medical care provided.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-orange-900 mb-2">Safety Incidents</h5>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Missing child or unauthorized departure</li>
                      <li>• Security breaches or threats</li>
                      <li>• Equipment failures affecting safety</li>
                      <li>• Evacuation situations (fire, weather)</li>
                    </ul>
                    <p className="text-xs text-orange-700 mt-2">
                      <strong>Response:</strong> Immediate search/security protocols, parent notification, authorities contacted.
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-900 mb-2">Facility Emergencies</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Power outages or system failures</li>
                      <li>• Severe weather warnings</li>
                      <li>• Building maintenance emergencies</li>
                      <li>• Technology system malfunctions</li>
                    </ul>
                    <p className="text-xs text-yellow-700 mt-2">
                      <strong>Response:</strong> Safe environment maintained, parents informed, alternative arrangements made.
                    </p>
                  </div>
                </div>

                <h4 className="font-semibold">Your Emergency Action Plan</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Keep your phone charged and easily accessible</li>
                  <li>• Maintain updated emergency contact information</li>
                  <li>• Know the venue location and best routes</li>
                  <li>• Have backup transportation arranged if needed</li>
                  <li>• Keep copies of important medical information</li>
                  <li>• Communicate plans with authorized pickup persons</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Troubleshooting</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues and Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Login and Account Issues</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Problems:</strong> Can't log in, forgot password, account locked</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Use "Forgot Password" link to reset password</li>
                      <li>Check email for verification messages (including spam folder)</li>
                      <li>Ensure you're using the correct email address</li>
                      <li>Clear browser cache and cookies</li>
                      <li>Try accessing from a different device or browser</li>
                      <li>Contact support if account appears locked</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Mobile App Issues</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Problems:</strong> App not loading, features missing, slow performance</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Refresh the web page or restart your browser</li>
                      <li>Check your internet connection</li>
                      <li>Clear browser cache and refresh</li>
                      <li>Update your browser to the latest version</li>
                      <li>Try accessing from a different network</li>
                      <li>Disable browser extensions temporarily</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">Notification Issues</h4>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Problems:</strong> Not receiving alerts, delayed notifications, missing photos</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Check notification settings in your account</li>
                      <li>Verify your contact information is current</li>
                      <li>Check spam/junk folders for email notifications</li>
                      <li>Enable browser notifications for the SafePlay website</li>
                      <li>Ensure your phone number is verified</li>
                      <li>Contact venue to verify your preferences are set correctly</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>When to Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Contact Support For:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Technical Issues</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Persistent login problems</li>
                      <li>• Missing or incorrect child information</li>
                      <li>• QR code not working</li>
                      <li>• Photos not appearing</li>
                      <li>• Tracking data inconsistencies</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Safety Concerns</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Inappropriate content or behavior</li>
                      <li>• Privacy or security concerns</li>
                      <li>• Incident reporting and documentation</li>
                      <li>• Emergency contact problems</li>
                      <li>• Data accuracy or safety issues</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Before Contacting Support</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                  <li>Try the basic troubleshooting steps above</li>
                  <li>Check the FAQ section for common solutions</li>
                  <li>Note the specific error messages you're seeing</li>
                  <li>Have your account information ready</li>
                  <li>Document the steps that led to the problem</li>
                  <li>Include screenshots if helpful</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support & Contact */}
      <section id="support" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Support & Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact SafePlay Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary Support Channels</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/contact" className="text-blue-600 hover:underline">Submit Support Request</Link>
                    </li>
                    <li>📧 Email: parents@safeplay.com</li>
                    <li>📞 Phone: 1-800-SAFEPLAY (1-800-723-3752)</li>
                    <li>💬 Live Chat: Available in parent dashboard</li>
                    <li>📱 Mobile: Help section in mobile interface</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Emergency Contacts</h4>
                  <ul className="space-y-1 text-sm">
                    <li>🚨 Emergency Hotline: 1-800-SAFE-911</li>
                    <li>🔒 Security Issues: security@safeplay.com</li>
                    <li>⚖️ Privacy Concerns: privacy@safeplay.com</li>
                    <li>🏥 Medical Emergency: Call 911 first</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Support Hours</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• General Support: Mon-Fri 8AM-8PM EST</li>
                    <li>• Emergency Hotline: 24/7</li>
                    <li>• Live Chat: Mon-Fri 9AM-6PM EST</li>
                    <li>• Email: Responded within 24 hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Help Documentation</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/docs/quick-reference" className="text-blue-600 hover:underline">Quick Reference Guide</Link>
                    </li>
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/faq" className="text-blue-600 hover:underline">Frequently Asked Questions</Link>
                    </li>
                    <li>📋 Video tutorials and walkthroughs</li>
                    <li>🎓 Parent training webinars</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Community Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li>👥 Parent forums and discussion groups</li>
                    <li>📰 SafePlay community newsletter</li>
                    <li>🎉 Local venue events and activities</li>
                    <li>🏆 Safety achievement programs</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Legal & Compliance</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                    </li>
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </li>
                    <li>🛡️ Safety guidelines and best practices</li>
                    <li>⚖️ Child protection and privacy rights</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/parent" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Heart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Parent Dashboard</span>
          </Link>
          <Link href="/parent/children" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Baby className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium">My Children</span>
          </Link>
          <Link href="/parent/mobile" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Smartphone className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Mobile App</span>
          </Link>
          <Link href="/contact" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <ExternalLink className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Get Support</span>
          </Link>
        </div>
      </div>
    </DocumentationLayout>
  );
}
