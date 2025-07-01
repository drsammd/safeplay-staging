
import Link from "next/link";
import { 
  FileText, 
  Shield, 
  Building, 
  Heart,
  Download,
  Printer,
  Phone,
  AlertTriangle,
  QrCode,
  MapPin,
  Camera,
  Settings,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DocumentationLayout from "@/components/documentation/documentation-layout";

export default function QuickReferenceGuides() {
  const guides = [
    {
      title: "Company Admin Quick Reference",
      description: "Essential functions and emergency procedures for system administrators",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      sections: [
        "System Health Check",
        "User Management",
        "Emergency Procedures",
        "Security Protocols",
        "Support Contacts"
      ]
    },
    {
      title: "Venue Admin Quick Reference", 
      description: "Daily operations, safety procedures, and common tasks for venue staff",
      icon: Building,
      color: "text-green-600",
      bgColor: "bg-green-50",
      sections: [
        "Daily Startup Checklist",
        "Check-in/Check-out Process",
        "Emergency Responses",
        "AI Feature Monitoring",
        "Parent Communication"
      ]
    },
    {
      title: "Parent Quick Reference",
      description: "Step-by-step guides for parents using SafePlay features",
      icon: Heart,
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      sections: [
        "Check-in Process",
        "Tracking Your Child",
        "Emergency Contacts",
        "Photo Access",
        "Mobile App Guide"
      ]
    }
  ];

  return (
    <DocumentationLayout 
      title="Quick Reference Guides"
      description="Concise, printable reference cards and checklists for all SafePlay users"
    >
      {/* Introduction */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-3">Quick Reference Documentation</h2>
        <p className="mb-4">
          Fast access to essential information, emergency procedures, and step-by-step checklists. 
          These guides are designed for quick lookup during daily operations.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" className="text-gray-900">
            <Download className="h-4 w-4 mr-2" />
            Download All PDFs
          </Button>
          <Button variant="secondary" size="sm" className="text-gray-900">
            <Printer className="h-4 w-4 mr-2" />
            Print All Guides
          </Button>
        </div>
      </div>

      {/* Guide Selection */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Quick Reference Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card key={guide.title} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${guide.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${guide.color}`} />
                  </div>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Includes:</h4>
                    <ul className="space-y-1">
                      {guide.sections.map((section) => (
                        <li key={section} className="text-sm text-gray-600 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {section}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 space-y-2">
                      <Button size="sm" className="w-full">
                        View Guide
                      </Button>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Emergency Quick Reference */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Quick Reference</h2>
        
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical:</strong> Keep this emergency information easily accessible at all times. 
            In true emergencies, call 911 first, then follow SafePlay protocols.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Emergency Contacts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-red-900">Life-Threatening Emergency</p>
                  <p className="text-red-800">📞 911</p>
                </div>
                <div>
                  <p className="font-semibold text-red-900">SafePlay Emergency Hotline</p>
                  <p className="text-red-800">📞 1-800-SAFE-911</p>
                </div>
                <div>
                  <p className="font-semibold text-red-900">Technical Emergency</p>
                  <p className="text-red-800">📞 1-800-TECH-911</p>
                </div>
                <div>
                  <p className="font-semibold text-red-900">Security Issues</p>
                  <p className="text-red-800">📧 security@safeplay.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Emergency Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-orange-800">
                <li><strong>Assess:</strong> Determine severity and type</li>
                <li><strong>Call 911:</strong> If life-threatening</li>
                <li><strong>Secure Area:</strong> Ensure safety of others</li>
                <li><strong>Notify SafePlay:</strong> Call emergency hotline</li>
                <li><strong>Document:</strong> Record details for reporting</li>
                <li><strong>Follow Up:</strong> Complete incident reports</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Key Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-800">
                <div>
                  <p className="font-semibold">Venue Location:</p>
                  <p>[Your Venue Address]</p>
                </div>
                <div>
                  <p className="font-semibold">Nearest Hospital:</p>
                  <p>[Hospital Name & Address]</p>
                </div>
                <div>
                  <p className="font-semibold">Venue Manager:</p>
                  <p>[Manager Contact Info]</p>
                </div>
                <div>
                  <p className="font-semibold">Emergency Assembly Area:</p>
                  <p>[Designated Safe Area]</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Company Admin Quick Reference */}
      <section id="company-admin-ref" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>Company Admin Quick Reference</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Health Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">System Status Review</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Check system health dashboard
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Review overnight alerts and incidents
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Verify backup completion status
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Monitor user activity levels
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Check security audit logs
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Management Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Common Actions</h4>
                <div className="text-sm space-y-2">
                  <p><strong>Add New Admin:</strong> Admin → Users → Add Admin</p>
                  <p><strong>Reset Password:</strong> Select user → Reset Password</p>
                  <p><strong>Assign Venue:</strong> User profile → Venue Assignment</p>
                  <p><strong>Deactivate Account:</strong> User profile → Deactivate</p>
                  <p><strong>Role Changes:</strong> User profile → Edit Permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Protocols</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Incident Response</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Identify and assess the security incident</li>
                  <li>Contain the threat and secure systems</li>
                  <li>Document all details and evidence</li>
                  <li>Notify affected users and stakeholders</li>
                  <li>Implement remediation measures</li>
                  <li>Review and update security policies</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Critical Support Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Emergency:</strong> 1-800-SAFE-911</p>
                <p><strong>Technical:</strong> 1-800-SAFEPLAY</p>
                <p><strong>Security:</strong> security@safeplay.com</p>
                <p><strong>Legal:</strong> legal@safeplay.com</p>
                <p><strong>Billing:</strong> billing@safeplay.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Venue Admin Quick Reference */}
      <section id="venue-admin-ref" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Building className="h-6 w-6 text-green-600" />
          <span>Venue Admin Quick Reference</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opening Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Check venue safety and cleanliness</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Test camera systems and tracking</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Verify check-in kiosks are functional</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Review daily schedule and events</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Brief staff on any special instructions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Check emergency equipment and exits</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Check-in Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>1. QR Scan:</strong> Parent scans at kiosk</p>
                <p><strong>2. Verify:</strong> Check child identity</p>
                <p><strong>3. Health:</strong> Brief wellness check</p>
                <p><strong>4. Instructions:</strong> Review any special needs</p>
                <p><strong>5. Activate:</strong> Enable tracking system</p>
                <p><strong>6. Welcome:</strong> Provide venue guidelines</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-red-600 text-sm">Medical Emergency</h5>
                  <p className="text-xs">1. Call 911 → 2. First Aid → 3. Contact Parents → 4. Document</p>
                </div>
                <div>
                  <h5 className="font-semibold text-orange-600 text-sm">Missing Child</h5>
                  <p className="text-xs">1. Search → 2. Check System → 3. Alert Staff → 4. Call Parents/911</p>
                </div>
                <div>
                  <h5 className="font-semibold text-yellow-600 text-sm">Evacuation</h5>
                  <p className="text-xs">1. Alarm → 2. Direct to Exits → 3. Accountability → 4. Assembly</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Monitoring Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Green Alerts:</strong> Routine updates, no action needed</p>
                <p><strong>Yellow Alerts:</strong> Monitor situation, possible intervention</p>
                <p><strong>Red Alerts:</strong> Immediate action required</p>
                <p><strong>Dashboard:</strong> AI Analytics → Real-time insights</p>
                <p><strong>Reports:</strong> Daily behavioral summaries</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Parent Quick Reference */}
      <section id="parent-ref" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Heart className="h-6 w-6 text-purple-600" />
          <span>Parent Quick Reference</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <QrCode className="h-4 w-4" />
                <span>Check-in Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Have QR code ready on phone</li>
                <li>Approach check-in kiosk or staff</li>
                <li>Scan QR code</li>
                <li>Verify child identity with staff</li>
                <li>Review any special instructions</li>
                <li>Receive venue information</li>
                <li>Child tracking automatically begins</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Live Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Access:</strong> Parent Dashboard → My Children → Track</p>
                <p><strong>View:</strong> Real-time location on venue map</p>
                <p><strong>History:</strong> Movement trail and activity log</p>
                <p><strong>Alerts:</strong> Automatic safety notifications</p>
                <p><strong>Mobile:</strong> Use /parent/mobile for phone access</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Photo Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>View:</strong> Memories section or mobile app</p>
                <p><strong>Notifications:</strong> Instant alerts for new photos</p>
                <p><strong>Download:</strong> Save high-quality originals</p>
                <p><strong>Share:</strong> Direct sharing with family</p>
                <p><strong>Privacy:</strong> Control settings in account preferences</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Contact Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Emergency:</strong> 1-800-SAFE-911</p>
                <p><strong>Venue Direct:</strong> [Your venue's number]</p>
                <p><strong>Support:</strong> 1-800-SAFEPLAY</p>
                <p><strong>Mobile Emergency:</strong> Emergency button in app</p>
                <p><strong>General:</strong> parents@safeplay.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting Quick Fixes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Issues & Quick Fixes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 text-lg">QR Code Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-yellow-800">
                <p><strong>Won't Scan:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Clean camera lens</li>
                  <li>• Check lighting</li>
                  <li>• Use manual entry backup</li>
                  <li>• Try different angle</li>
                </ul>
                <p><strong>Lost QR Code:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Contact venue staff</li>
                  <li>• Provide ID verification</li>
                  <li>• Request new code generation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 text-lg">App/System Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>Not Loading:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Refresh page/restart browser</li>
                  <li>• Check internet connection</li>
                  <li>• Clear browser cache</li>
                  <li>• Try different device</li>
                </ul>
                <p><strong>Missing Notifications:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Check notification settings</li>
                  <li>• Verify contact info</li>
                  <li>• Check spam folder</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 text-lg">Login Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-green-800">
                <p><strong>Can't Login:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Use "Forgot Password" link</li>
                  <li>• Check email for reset</li>
                  <li>• Verify correct email address</li>
                  <li>• Contact support if locked</li>
                </ul>
                <p><strong>Account Issues:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Verify account verification</li>
                  <li>• Check email confirmation</li>
                  <li>• Contact support for help</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need the Complete Manual?</h3>
          <p className="text-gray-600 mb-4">
            For detailed information and step-by-step instructions, visit the complete user manuals.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/docs/company-admin">
              <Shield className="h-4 w-4 mr-2" />
              Company Admin Manual
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/docs/venue-admin">
              <Building className="h-4 w-4 mr-2" />
              Venue Admin Manual
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/docs/parent">
              <Heart className="h-4 w-4 mr-2" />
              Parent Manual
            </Link>
          </Button>
        </div>
      </div>
    </DocumentationLayout>
  );
}
