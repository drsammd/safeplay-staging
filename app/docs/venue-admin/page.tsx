
import Link from "next/link";
import { 
  Building, 
  Map, 
  Camera, 
  Brain, 
  BarChart3,
  Users,
  AlertTriangle,
  Shield,
  QrCode,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DocumentationLayout from "@/components/documentation/documentation-layout";

export default function VenueAdminManual() {
  const tableOfContents = [
    { id: "getting-started", title: "Getting Started", level: 1 },
    { id: "dashboard-overview", title: "Dashboard Overview", level: 1 },
    { id: "floor-plan-management", title: "Floor Plan Management", level: 1 },
    { id: "child-tracking", title: "Child Tracking & Safety", level: 1 },
    { id: "ai-features", title: "AI Features & Analytics", level: 1 },
    { id: "check-in-out", title: "Check-in/Check-out System", level: 1 },
    { id: "emergency-procedures", title: "Emergency Procedures", level: 1 },
    { id: "parent-communication", title: "Parent Communication", level: 1 },
    { id: "staff-management", title: "Staff Management", level: 1 },
    { id: "troubleshooting", title: "Troubleshooting", level: 1 },
    { id: "support", title: "Support & Resources", level: 1 }
  ];

  return (
    <DocumentationLayout 
      title="Venue Admin Manual"
      description="Comprehensive venue management guide for SafePlay venue administrators"
    >
      {/* Quick Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Building className="h-6 w-6 text-green-600 mt-1" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Venue Administrator Access</h3>
            <p className="text-green-800 mb-4">
              This manual is for venue administrators responsible for day-to-day operations, safety management, 
              and coordination at SafePlay venues. You have comprehensive venue-level administrative privileges.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Venue Operations</Badge>
              <Badge variant="secondary">Child Safety</Badge>
              <Badge variant="secondary">Staff Management</Badge>
              <Badge variant="secondary">Parent Communication</Badge>
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
            <strong>Prerequisites:</strong> You must have venue administrator credentials assigned by a company administrator. 
            Your access is specific to your assigned venue(s).
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-green-600" />
                <span>Initial Venue Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Access your venue dashboard at <code>/venue-admin</code></li>
                <li>Complete venue profile and operational details</li>
                <li>Upload and configure floor plans</li>
                <li>Set up camera systems and monitoring zones</li>
                <li>Configure check-in/check-out procedures</li>
                <li>Train staff on SafePlay procedures</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <span>Safety Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Set up emergency contact protocols</li>
                <li>Configure AI safety monitoring preferences</li>
                <li>Establish restricted areas and safety zones</li>
                <li>Test alert notification systems</li>
                <li>Review and practice emergency procedures</li>
                <li>Verify staff safety training completion</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dashboard Overview */}
      <section id="dashboard-overview" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Main Dashboard</CardTitle>
              <CardDescription>Primary venue control center</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Real-time venue occupancy and capacity</li>
                <li>• Active children and current locations</li>
                <li>• Recent check-ins and check-outs</li>
                <li>• Safety alerts and notifications</li>
                <li>• Staff activity and status updates</li>
                <li>• Quick access to emergency procedures</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation Menu</CardTitle>
              <CardDescription>Access to all venue features</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li><Link href="/venue-admin/floor-plans" className="text-blue-600 hover:underline">• Floor Plans & Cameras</Link></li>
                <li><Link href="/venue-admin/tracking" className="text-blue-600 hover:underline">• Child Tracking</Link></li>
                <li><Link href="/venue-admin/ai-features" className="text-blue-600 hover:underline">• AI Features</Link></li>
                <li><Link href="/venue-admin/ai-analytics" className="text-blue-600 hover:underline">• AI Analytics</Link></li>
                <li>• Check-in/Check-out Management</li>
                <li>• Emergency Management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Most commonly used functions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Emergency alert activation</li>
                <li>• New child check-in registration</li>
                <li>• View current venue occupancy</li>
                <li>• Access parent communication tools</li>
                <li>• Generate QR codes for check-in</li>
                <li>• Review recent safety incidents</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Floor Plan Management */}
      <section id="floor-plan-management" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Floor Plan Management</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploading and Configuring Floor Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Upload New Floor Plan</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Navigate to <strong>Floor Plans & Cameras</strong> section</li>
                  <li>Click "Upload New Floor Plan" button</li>
                  <li>Select image file (PNG, JPG, PDF supported)</li>
                  <li>Enter floor plan details:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Floor name and description</li>
                      <li>Physical dimensions and scale</li>
                      <li>Capacity limits and restrictions</li>
                      <li>Emergency exits and safety routes</li>
                    </ul>
                  </li>
                  <li>Save and proceed to zone configuration</li>
                </ol>

                <h4 className="font-semibold">Zone Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Zone Types</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <span className="text-green-600">Safe Zones:</span> General play areas</li>
                      <li>• <span className="text-yellow-600">Supervised Zones:</span> Adult-required areas</li>
                      <li>• <span className="text-red-600">Restricted Zones:</span> Staff-only areas</li>
                      <li>• <span className="text-blue-600">Exit Zones:</span> Entry/exit monitoring</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Zone Settings</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Capacity limits per zone</li>
                      <li>• Age restrictions and requirements</li>
                      <li>• Supervision requirements</li>
                      <li>• Alert triggers and thresholds</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Camera System Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    Camera placement is critical for effective child tracking and safety monitoring. 
                    Ensure adequate coverage of all play areas and entry/exit points.
                  </AlertDescription>
                </Alert>
                
                <h4 className="font-semibold">Camera Placement Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Required Locations</h5>
                    <ul className="text-sm space-y-1">
                      <li>• All entry and exit points</li>
                      <li>• Main play areas and zones</li>
                      <li>• Transition areas between zones</li>
                      <li>• Emergency exit routes</li>
                      <li>• Staff supervision areas</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Placement Best Practices</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Avoid blind spots and obstructions</li>
                      <li>• Ensure adequate lighting coverage</li>
                      <li>• Consider privacy requirements</li>
                      <li>• Allow for equipment maintenance access</li>
                      <li>• Test coverage during different activities</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Adding Cameras to Floor Plan</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Click "Add Camera" on the floor plan interface</li>
                  <li>Position camera icon at the physical location</li>
                  <li>Configure camera settings:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Camera ID and description</li>
                      <li>Field of view and coverage area</li>
                      <li>Recording and monitoring preferences</li>
                      <li>Alert triggers and motion detection</li>
                    </ul>
                  </li>
                  <li>Test camera connectivity and image quality</li>
                  <li>Save configuration and enable monitoring</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Child Tracking & Safety */}
      <section id="child-tracking" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Child Tracking & Safety</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Child Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Tracking Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Live location tracking on floor plans</li>
                      <li>• Movement history and activity patterns</li>
                      <li>• Zone entry/exit notifications</li>
                      <li>• Proximity alerts and safety warnings</li>
                      <li>• Duration tracking in different areas</li>
                      <li>• Social interaction and friend groupings</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Safety Monitoring</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Unauthorized area access alerts</li>
                      <li>• Extended absence notifications</li>
                      <li>• Capacity limit warnings</li>
                      <li>• Emergency evacuation tracking</li>
                      <li>• Staff attention requirements</li>
                      <li>• Parent notification triggers</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Using the Tracking Dashboard</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Access <strong>Tracking</strong> section from main menu</li>
                  <li>View live floor plan with child locations</li>
                  <li>Use filters to show specific children or groups</li>
                  <li>Click on child icons for detailed information</li>
                  <li>Set up custom alerts for specific children</li>
                  <li>Review movement history and patterns</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Safety Alert Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-900 mb-2">Low Priority Alerts</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Zone capacity approaching limit</li>
                      <li>• Extended time in single area</li>
                      <li>• Minor policy violations</li>
                      <li>• Routine safety reminders</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-orange-900 mb-2">Medium Priority Alerts</h5>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Unauthorized area access</li>
                      <li>• Zone capacity exceeded</li>
                      <li>• Unaccompanied child in restricted area</li>
                      <li>• Equipment malfunction detected</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-900 mb-2">High Priority Alerts</h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Child missing or unaccounted for</li>
                      <li>• Emergency evacuation required</li>
                      <li>• Safety incident detected</li>
                      <li>• Immediate staff intervention needed</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Alert Response Procedures</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li><strong>Receive Alert:</strong> Review alert details and priority level</li>
                  <li><strong>Assess Situation:</strong> Use cameras and tracking to evaluate</li>
                  <li><strong>Take Action:</strong> Deploy appropriate response (staff, parent contact)</li>
                  <li><strong>Monitor Resolution:</strong> Track progress until issue resolved</li>
                  <li><strong>Document Incident:</strong> Complete incident report if required</li>
                  <li><strong>Follow Up:</strong> Review procedures and prevent recurrence</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Features & Analytics */}
      <section id="ai-features" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">AI Features & Analytics</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>AI Safety Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Behavioral Analysis</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Real-time emotion and mood detection</li>
                    <li>• Unusual behavior pattern identification</li>
                    <li>• Social interaction monitoring</li>
                    <li>• Distress signal recognition</li>
                    <li>• Activity level and engagement tracking</li>
                  </ul>
                  
                  <h4 className="font-semibold mb-3 mt-4">Safety Predictions</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Risk assessment and prevention</li>
                    <li>• Crowd density analysis</li>
                    <li>• Accident prediction modeling</li>
                    <li>• Fatigue and overexertion detection</li>
                    <li>• Equipment usage safety monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Automated Responses</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Instant alert generation</li>
                    <li>• Staff notification and dispatch</li>
                    <li>• Parent communication triggers</li>
                    <li>• Emergency protocol activation</li>
                    <li>• Documentation and reporting</li>
                  </ul>
                  
                  <h4 className="font-semibold mb-3 mt-4">Configuration Options</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Sensitivity threshold adjustment</li>
                    <li>• Custom alert rule creation</li>
                    <li>• Age-specific behavior models</li>
                    <li>• Venue-specific customization</li>
                    <li>• Integration with external systems</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>AI Analytics Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Access comprehensive AI analytics at: <strong>Venue Admin → AI Analytics</strong>
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Real-time Insights</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Current emotional states overview</li>
                      <li>• Active behavior patterns</li>
                      <li>• Safety risk assessments</li>
                      <li>• Social interaction maps</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Historical Analysis</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Behavioral trend analysis</li>
                      <li>• Safety incident correlations</li>
                      <li>• Peak activity period identification</li>
                      <li>• Long-term engagement patterns</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-purple-900 mb-2">Predictive Modeling</h5>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Risk prediction algorithms</li>
                      <li>• Capacity planning insights</li>
                      <li>• Staff allocation optimization</li>
                      <li>• Safety protocol recommendations</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Using AI Insights for Operations</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Review daily AI analytics summary upon arrival</li>
                  <li>Identify high-risk periods and zones for extra attention</li>
                  <li>Adjust staff deployment based on predicted needs</li>
                  <li>Use behavioral insights to improve venue layout</li>
                  <li>Share relevant insights with parents and staff</li>
                  <li>Document successful interventions for future reference</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Check-in/Check-out System */}
      <section id="check-in-out" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Check-in/Check-out System</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-green-600" />
                <span>QR Code Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Generating QR Codes</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Navigate to <strong>QR Codes</strong> section</li>
                  <li>Click "Generate New QR Code" for new families</li>
                  <li>Enter family and child information</li>
                  <li>Configure check-in permissions and restrictions</li>
                  <li>Print or email QR codes to parents</li>
                  <li>Test QR code scanning functionality</li>
                </ol>

                <h4 className="font-semibold">QR Code Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Security Features</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Unique, tamper-proof codes</li>
                      <li>• Time-based expiration options</li>
                      <li>• Usage limit controls</li>
                      <li>• Instant deactivation capability</li>
                      <li>• Backup verification methods</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Functionality</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Multi-child family support</li>
                      <li>• Authorized pickup person verification</li>
                      <li>• Emergency contact integration</li>
                      <li>• Special needs and allergy alerts</li>
                      <li>• Parent preference settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check-in Process Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Standard Check-in Procedure</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li><strong>QR Code Scan:</strong> Parent scans QR code at kiosk or staff device</li>
                  <li><strong>Child Verification:</strong> Staff verifies child identity and condition</li>
                  <li><strong>Health Check:</strong> Brief wellness assessment (optional)</li>
                  <li><strong>Special Instructions:</strong> Review any special needs or restrictions</li>
                  <li><strong>Tracking Activation:</strong> Enable location monitoring systems</li>
                  <li><strong>Welcome Packet:</strong> Provide venue information and emergency contacts</li>
                </ol>

                <h4 className="font-semibold">Check-out Verification</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li><strong>Authorization Check:</strong> Verify authorized pickup person</li>
                  <li><strong>Child Location:</strong> Confirm child's current location</li>
                  <li><strong>Personal Items:</strong> Ensure all belongings are collected</li>
                  <li><strong>Final Scan:</strong> Complete check-out with QR code or manual entry</li>
                  <li><strong>Tracking Deactivation:</strong> Disable location monitoring</li>
                  <li><strong>Feedback Collection:</strong> Optional parent feedback (brief)</li>
                </ol>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Protocol:</strong> Never release a child without proper authorization verification. 
                    When in doubt, contact parents directly and require additional identification.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kiosk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Kiosk Setup and Maintenance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Daily Maintenance</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Clean screens and scanning surfaces</li>
                      <li>• Test QR code scanning functionality</li>
                      <li>• Verify network connectivity</li>
                      <li>• Check paper and supplies</li>
                      <li>• Review any error logs</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Configuration Options</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Language and accessibility settings</li>
                      <li>• Custom welcome messages</li>
                      <li>• Venue-specific information display</li>
                      <li>• Emergency contact information</li>
                      <li>• Promotional content management</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Troubleshooting Common Issues</h4>
                <div className="space-y-3">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">QR Code Won't Scan</p>
                    <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                      <li>• Clean camera lens and screen</li>
                      <li>• Check lighting conditions</li>
                      <li>• Verify QR code is not damaged</li>
                      <li>• Use manual entry as backup</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-900">System Connectivity Issues</p>
                    <ul className="text-sm text-red-800 mt-1 space-y-1">
                      <li>• Check network connection</li>
                      <li>• Restart kiosk system</li>
                      <li>• Switch to offline mode if available</li>
                      <li>• Contact technical support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Emergency Procedures */}
      <section id="emergency-procedures" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Emergency Procedures</h2>
        
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical:</strong> All staff must be trained on emergency procedures. Practice evacuation drills regularly 
            and ensure all emergency contacts and protocols are current.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Response Protocols</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Medical Emergency</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Assess the situation and ensure safety</li>
                    <li>Call 911 if serious injury/illness</li>
                    <li>Administer first aid if trained</li>
                    <li>Contact parents/guardians immediately</li>
                    <li>Document incident thoroughly</li>
                    <li>Follow up with parents and authorities</li>
                  </ol>
                  
                  <h4 className="font-semibold text-orange-600 mb-3 mt-4">Missing Child</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Initiate immediate venue search</li>
                    <li>Check last known location in system</li>
                    <li>Alert all staff and secure exits</li>
                    <li>Contact parents and law enforcement</li>
                    <li>Review security footage</li>
                    <li>Coordinate with emergency services</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-3">Evacuation Emergency</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Activate emergency alarm system</li>
                    <li>Direct children to nearest safe exit</li>
                    <li>Use attendance system for accountability</li>
                    <li>Establish safe assembly area</li>
                    <li>Contact emergency services</li>
                    <li>Communicate with parents</li>
                  </ol>
                  
                  <h4 className="font-semibold text-blue-600 mb-3 mt-4">System Failure</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Switch to manual tracking procedures</li>
                    <li>Maintain written attendance records</li>
                    <li>Increase staff vigilance and monitoring</li>
                    <li>Contact technical support</li>
                    <li>Inform parents of system status</li>
                    <li>Restore system before normal operations</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Critical Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-900 mb-2">Emergency Services</h5>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Police: 911</li>
                      <li>• Fire Department: 911</li>
                      <li>• Medical Emergency: 911</li>
                      <li>• Poison Control: 1-800-222-1222</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">SafePlay Support</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Emergency Hotline: 1-800-SAFE-911</li>
                      <li>• Technical Support: 1-800-SAFEPLAY</li>
                      <li>• Security Issues: security@safeplay.com</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Local Contacts</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Venue Manager: [Contact Info]</li>
                      <li>• Local Hospital: [Contact Info]</li>
                      <li>• Utility Companies: [Contact Info]</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Emergency Communication Plan</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Use SafePlay's emergency notification system for parent alerts</li>
                  <li>Prepare standard emergency message templates</li>
                  <li>Designate staff roles for communication during emergencies</li>
                  <li>Maintain backup communication methods (phone, email)</li>
                  <li>Document all emergency communications for later review</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Parent Communication */}
      <section id="parent-communication" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Parent Communication</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Tools and Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Real-time Updates</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Check-in/check-out confirmations</li>
                    <li>• Location and activity updates</li>
                    <li>• Photo and video sharing</li>
                    <li>• Safety alerts and notifications</li>
                    <li>• Special event announcements</li>
                    <li>• Weather or facility updates</li>
                  </ul>
                  
                  <h4 className="font-semibold mb-3 mt-4">Scheduled Communications</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Daily activity summaries</li>
                    <li>• Weekly progress reports</li>
                    <li>• Monthly venue newsletters</li>
                    <li>• Special event invitations</li>
                    <li>• Safety training updates</li>
                    <li>• Policy change notifications</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Interactive Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Parent-to-venue messaging</li>
                    <li>• Photo sharing permissions</li>
                    <li>• Playdate coordination</li>
                    <li>• Feedback and surveys</li>
                    <li>• Event RSVPs and registration</li>
                    <li>• Emergency contact updates</li>
                  </ul>
                  
                  <h4 className="font-semibold mb-3 mt-4">Privacy Controls</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Communication preference settings</li>
                    <li>• Photo/video sharing permissions</li>
                    <li>• Location sharing controls</li>
                    <li>• Data retention preferences</li>
                    <li>• Third-party sharing restrictions</li>
                    <li>• Marketing communication opt-outs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo and Video Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacy First:</strong> Always respect parent privacy preferences and obtain explicit consent 
                    before sharing any photos or videos containing their children.
                  </AlertDescription>
                </Alert>
                
                <h4 className="font-semibold">Photo Sharing Guidelines</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Check parent permissions before capturing/sharing photos</li>
                  <li>Use SafePlay's permission management system</li>
                  <li>Focus on positive, engaging activities and moments</li>
                  <li>Avoid photos that could be embarrassing or inappropriate</li>
                  <li>Include brief, positive captions about activities</li>
                  <li>Share photos promptly while activities are fresh</li>
                </ol>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Best Practices</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Capture natural, candid moments</li>
                      <li>• Show children engaged and happy</li>
                      <li>• Include group activities and friendships</li>
                      <li>• Highlight skill development and achievement</li>
                      <li>• Document special events and milestones</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Content to Avoid</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Children who appear upset or distressed</li>
                      <li>• Potentially embarrassing situations</li>
                      <li>• Children with explicit "no photo" preferences</li>
                      <li>• Images that could compromise safety/security</li>
                      <li>• Photos containing other people's children without permission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Staff Management */}
      <section id="staff-management" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Staff Management</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Training and Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Required Training Modules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Safety and Security</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Child safety protocols and procedures</li>
                      <li>• Emergency response and evacuation</li>
                      <li>• First aid and CPR certification</li>
                      <li>• Incident reporting and documentation</li>
                      <li>• SafePlay security system operation</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">System Operation</h5>
                    <ul className="text-sm space-y-1">
                      <li>• SafePlay platform navigation</li>
                      <li>• Check-in/check-out procedures</li>
                      <li>• Tracking system monitoring</li>
                      <li>• Parent communication tools</li>
                      <li>• AI feature interpretation</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Ongoing Training Requirements</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Monthly safety refresher sessions</li>
                  <li>• Quarterly emergency drill participation</li>
                  <li>• Annual CPR/First Aid recertification</li>
                  <li>• System update training as needed</li>
                  <li>• Customer service skill development</li>
                  <li>• Privacy and compliance updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Operations and Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Staff Roles and Responsibilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Entry/Exit Monitor</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Check-in/check-out processing</li>
                      <li>• QR code verification</li>
                      <li>• Parent communication</li>
                      <li>• Security checkpoint management</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">Floor Supervisor</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Child safety monitoring</li>
                      <li>• Activity facilitation</li>
                      <li>• Incident response</li>
                      <li>• Equipment maintenance</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-purple-900 mb-2">System Monitor</h5>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Tracking system oversight</li>
                      <li>• Alert response coordination</li>
                      <li>• Technology troubleshooting</li>
                      <li>• Data quality assurance</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold">Shift Management</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Review daily staff schedule and assignments</li>
                  <li>Conduct pre-shift briefing on special instructions</li>
                  <li>Ensure minimum staffing ratios are maintained</li>
                  <li>Handle staff breaks and rotation schedules</li>
                  <li>Document shift activities and any incidents</li>
                  <li>Prepare handoff notes for next shift</li>
                </ol>
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
              <CardTitle>Common Technical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Tracking System Issues</h4>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Symptoms:</strong> Missing location data, inaccurate positions, tracking delays</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Check camera connectivity and power status</li>
                      <li>Verify network connection and bandwidth</li>
                      <li>Restart affected cameras or zones</li>
                      <li>Calibrate tracking system if needed</li>
                      <li>Switch to manual monitoring temporarily</li>
                      <li>Contact technical support for persistent issues</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2">Check-in/Check-out Problems</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Symptoms:</strong> QR codes not scanning, system not recognizing families</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Clean kiosk camera and screen</li>
                      <li>Verify QR code is not damaged or expired</li>
                      <li>Use manual entry with family information</li>
                      <li>Check family account status in system</li>
                      <li>Restart kiosk if unresponsive</li>
                      <li>Process check-in manually and sync later</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Communication System Issues</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Symptoms:</strong> Parent notifications not sending, photos not uploading</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Check internet connectivity</li>
                      <li>Verify parent contact information</li>
                      <li>Test notification system with staff accounts</li>
                      <li>Clear cache and restart communication apps</li>
                      <li>Use alternative communication methods</li>
                      <li>Document failed communications for follow-up</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">High Volume Periods</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Implement express check-in lanes for returning families</li>
                  <li>• Deploy additional staff to high-traffic areas</li>
                  <li>• Use pre-registration to speed up arrivals</li>
                  <li>• Monitor capacity limits and implement waiting list if needed</li>
                  <li>• Communicate expected wait times to parents</li>
                  <li>• Ensure emergency procedures remain accessible</li>
                </ul>

                <h4 className="font-semibold">Staff Shortage Situations</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Contact backup staff or management immediately</li>
                  <li>• Adjust venue capacity to match available supervision</li>
                  <li>• Prioritize safety monitoring over optional activities</li>
                  <li>• Inform parents of reduced services if necessary</li>
                  <li>• Document staffing issues for future planning</li>
                  <li>• Never operate below minimum safety ratios</li>
                </ul>

                <h4 className="font-semibold">Difficult Parent Situations</h4>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Remain calm and professional at all times</li>
                  <li>• Listen actively to parent concerns</li>
                  <li>• Explain policies clearly and provide alternatives</li>
                  <li>• Escalate to management when appropriate</li>
                  <li>• Document interactions for follow-up</li>
                  <li>• Focus on child safety as the primary concern</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support & Resources */}
      <section id="support" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Support & Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Venue Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/contact" className="text-blue-600 hover:underline">Submit Support Ticket</Link>
                    </li>
                    <li>📧 Email: venue-support@safeplay.com</li>
                    <li>📞 Phone: 1-800-VENUE-HELP</li>
                    <li>💬 Live Chat: Available in venue admin dashboard</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Emergency Contacts</h4>
                  <ul className="space-y-1 text-sm">
                    <li>🚨 Emergency Hotline: 1-800-SAFE-911</li>
                    <li>🔧 Technical Emergency: 1-800-TECH-911</li>
                    <li>🏥 Medical Emergency: 911</li>
                    <li>👮 Security Emergency: 911</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training and Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Documentation</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/docs/quick-reference" className="text-blue-600 hover:underline">Quick Reference Guides</Link>
                    </li>
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/faq" className="text-blue-600 hover:underline">Frequently Asked Questions</Link>
                    </li>
                    <li>📋 Staff Training Materials</li>
                    <li>🎓 Online Training Modules</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Compliance Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                    </li>
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </li>
                    <li>📄 Safety Guidelines</li>
                    <li>🔐 Security Protocols</li>
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
          <Link href="/venue-admin" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Building className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Venue Dashboard</span>
          </Link>
          <Link href="/venue-admin/tracking" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Child Tracking</span>
          </Link>
          <Link href="/venue-admin/ai-analytics" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Brain className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium">AI Analytics</span>
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
