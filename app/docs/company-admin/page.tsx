
import Link from "next/link";
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  Database, 
  Lock,
  AlertTriangle,
  FileText,
  Smartphone,
  Clock,
  CheckCircle,
  ExternalLink,
  Building
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DocumentationLayout from "@/components/documentation/documentation-layout";

export default function CompanyAdminManual() {
  const tableOfContents = [
    { id: "getting-started", title: "Getting Started", level: 1 },
    { id: "system-overview", title: "System Overview", level: 1 },
    { id: "user-management", title: "User Management", level: 1 },
    { id: "venue-management", title: "Venue Management", level: 1 },
    { id: "analytics-reporting", title: "Analytics & Reporting", level: 1 },
    { id: "security-compliance", title: "Security & Compliance", level: 1 },
    { id: "system-maintenance", title: "System Maintenance", level: 1 },
    { id: "troubleshooting", title: "Troubleshooting", level: 1 },
    { id: "support", title: "Support & Resources", level: 1 }
  ];

  return (
    <DocumentationLayout 
      title="Company Admin Manual"
      description="Comprehensive system administration guide for SafePlay platform administrators"
    >
      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Company Administrator Access</h3>
            <p className="text-blue-800 mb-4">
              This manual is for system administrators with company-level access to the SafePlay platform. 
              You have full administrative privileges and responsibility for system-wide configuration and management.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">System Configuration</Badge>
              <Badge variant="secondary">User Management</Badge>
              <Badge variant="secondary">Security Settings</Badge>
              <Badge variant="secondary">Platform Analytics</Badge>
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
          <nav className="space-y-2">
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
            <strong>Prerequisites:</strong> You must have company administrator credentials and valid SafePlay account with admin privileges.
            Demo account: email "john@doe.com", password "johndoe123"
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Initial Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Access the admin dashboard at <code>/admin</code></li>
                <li>Complete your admin profile setup</li>
                <li>Review system status and health checks</li>
                <li>Configure company settings and preferences</li>
                <li>Set up initial user roles and permissions</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-green-600" />
                <span>Security First Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Enable two-factor authentication</li>
                <li>Review and update security policies</li>
                <li>Configure audit logging settings</li>
                <li>Set up backup and recovery procedures</li>
                <li>Review compliance requirements</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* System Overview */}
      <section id="system-overview" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">System Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dashboard Overview</CardTitle>
              <CardDescription>Main administrative interface</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• System health and status monitoring</li>
                <li>• Real-time platform analytics</li>
                <li>• Recent activity and alerts</li>
                <li>• Quick access to critical functions</li>
                <li>• Performance metrics overview</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Core Components</CardTitle>
              <CardDescription>Platform architecture elements</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• User management system</li>
                <li>• Venue administration portal</li>
                <li>• Analytics and reporting engine</li>
                <li>• Security and compliance framework</li>
                <li>• API and integration services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Administrative Rights</CardTitle>
              <CardDescription>Your access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Full system configuration access</li>
                <li>• User account management</li>
                <li>• Venue setup and administration</li>
                <li>• Security policy configuration</li>
                <li>• Platform-wide analytics access</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Management */}
      <section id="user-management" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">User Management</h2>
        
        <Alert className="mb-6">
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>User Types:</strong> SafePlay supports three main user types: Company Admins, Venue Admins, and Parents. 
            Each has specific permissions and access levels.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creating and Managing User Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Company Administrator Accounts</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Navigate to Admin Dashboard → Users</li>
                  <li>Click "Add New Admin" button</li>
                  <li>Complete user information form:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Full name and email address</li>
                      <li>Initial password (user will reset on first login)</li>
                      <li>Role assignment and permissions</li>
                      <li>Department and contact information</li>
                    </ul>
                  </li>
                  <li>Assign specific administrative permissions</li>
                  <li>Send welcome email with login instructions</li>
                </ol>

                <h4 className="font-semibold">Venue Administrator Accounts</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Access venue management section</li>
                  <li>Select target venue or create new venue first</li>
                  <li>Add venue administrator with appropriate permissions</li>
                  <li>Configure venue-specific access rights</li>
                  <li>Set up venue-level operational permissions</li>
                </ol>

                <h4 className="font-semibold">Parent Account Management</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Monitor parent registrations and account status</li>
                  <li>Handle account verification and approval processes</li>
                  <li>Assist with password resets and account recovery</li>
                  <li>Manage family account merging and permissions</li>
                  <li>Review and resolve account-related support requests</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Company Admin</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Full system access</li>
                    <li>• User management</li>
                    <li>• Security configuration</li>
                    <li>• Platform analytics</li>
                    <li>• Billing management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Venue Admin</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Venue configuration</li>
                    <li>• Floor plan management</li>
                    <li>• Child tracking oversight</li>
                    <li>• Staff management</li>
                    <li>• Venue analytics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">Parent</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Child account management</li>
                    <li>• Real-time tracking access</li>
                    <li>• Photo and memory access</li>
                    <li>• Communication features</li>
                    <li>• Privacy settings control</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Venue Management */}
      <section id="venue-management" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Venue Management</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Venue Setup and Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Creating New Venues</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Navigate to Admin Dashboard → Venues</li>
                  <li>Click "Add New Venue" button</li>
                  <li>Complete venue information:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Venue name and description</li>
                      <li>Physical address and contact details</li>
                      <li>Operating hours and capacity limits</li>
                      <li>Emergency contact information</li>
                      <li>Special requirements or restrictions</li>
                    </ul>
                  </li>
                  <li>Assign venue administrator(s)</li>
                  <li>Configure initial security and safety settings</li>
                  <li>Set up billing and subscription details</li>
                </ol>

                <h4 className="font-semibold">Venue Configuration Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Safety & Security</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Emergency contact protocols</li>
                      <li>• Access control settings</li>
                      <li>• Camera system integration</li>
                      <li>• AI monitoring preferences</li>
                      <li>• Alert notification rules</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Operational Settings</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Check-in/check-out procedures</li>
                      <li>• Capacity management rules</li>
                      <li>• Staff access permissions</li>
                      <li>• Parent communication settings</li>
                      <li>• Data retention policies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Venue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track key performance indicators and operational metrics across all venues in your network.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Safety Metrics</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Incident response times</li>
                    <li>• Alert resolution rates</li>
                    <li>• Emergency procedure compliance</li>
                    <li>• Safety protocol adherence</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-green-900 mb-2">Operational Metrics</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Daily check-in volumes</li>
                    <li>• Average visit duration</li>
                    <li>• Capacity utilization rates</li>
                    <li>• Staff efficiency measures</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-purple-900 mb-2">User Satisfaction</h5>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Parent feedback scores</li>
                    <li>• Feature usage analytics</li>
                    <li>• Support request volumes</li>
                    <li>• User retention rates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Analytics & Reporting */}
      <section id="analytics-reporting" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Analytics & Reporting</h2>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Platform Analytics Dashboard</span>
            </CardTitle>
            <CardDescription>Access comprehensive analytics at: Admin Dashboard → Analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Real-Time Metrics</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Current active users across all venues</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Real-time check-in/check-out activities</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Active alerts and safety notifications</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>System performance and health status</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Historical Reports</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Daily, weekly, and monthly usage reports</li>
                  <li>• Safety incident summaries and trends</li>
                  <li>• User engagement and retention analytics</li>
                  <li>• Revenue and billing analytics</li>
                  <li>• Compliance and audit trail reports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Access the "Reports" section in analytics dashboard</li>
                <li>Select report type and date range</li>
                <li>Choose specific metrics and filters</li>
                <li>Configure output format (PDF, Excel, CSV)</li>
                <li>Schedule automated report delivery</li>
                <li>Share reports with stakeholders</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Export and Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• API access for external integrations</li>
                <li>• Automated data exports to external systems</li>
                <li>• Real-time data streaming capabilities</li>
                <li>• Integration with business intelligence tools</li>
                <li>• Custom dashboard creation options</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security-compliance" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Security & Compliance</h2>
        
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical:</strong> SafePlay handles sensitive child data and must comply with COPPA, GDPR, and other privacy regulations. 
            Regular security audits and compliance reviews are mandatory.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Authentication & Access</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Multi-factor authentication setup</li>
                    <li>• Password policy configuration</li>
                    <li>• Session timeout settings</li>
                    <li>• IP access restrictions</li>
                    <li>• Role-based permission management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Data Protection</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Encryption settings for data at rest</li>
                    <li>• Secure transmission protocols</li>
                    <li>• Backup and recovery procedures</li>
                    <li>• Data retention policy management</li>
                    <li>• Secure deletion protocols</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">COPPA Compliance</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Verifiable parental consent</li>
                      <li>• Limited data collection from children</li>
                      <li>• Enhanced privacy protections</li>
                      <li>• Regular compliance audits</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-2">GDPR Compliance</h5>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Data subject rights implementation</li>
                      <li>• Consent management systems</li>
                      <li>• Data portability features</li>
                      <li>• Breach notification procedures</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-purple-900 mb-2">Biometric Privacy</h5>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Explicit consent for biometric data</li>
                      <li>• Secure biometric storage</li>
                      <li>• Limited retention periods</li>
                      <li>• State law compliance monitoring</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Audit and Monitoring</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                    <li>Review audit logs regularly for security incidents</li>
                    <li>Monitor compliance dashboard for policy violations</li>
                    <li>Conduct quarterly security assessments</li>
                    <li>Document all security-related decisions and changes</li>
                    <li>Maintain incident response and breach notification procedures</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* System Maintenance */}
      <section id="system-maintenance" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">System Maintenance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Regular Maintenance Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Daily Tasks</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Review system health dashboard</li>
                    <li>• Check for critical alerts and notifications</li>
                    <li>• Monitor user activity and performance metrics</li>
                    <li>• Verify backup completion status</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Weekly Tasks</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Review security audit logs</li>
                    <li>• Analyze performance trends and capacity</li>
                    <li>• Update system documentation</li>
                    <li>• Conduct user access reviews</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Monthly Tasks</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Complete compliance assessments</li>
                    <li>• Review and update security policies</li>
                    <li>• Analyze usage analytics and trends</li>
                    <li>• Plan system updates and improvements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Updates and Patches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    System updates are automatically applied during maintenance windows. 
                    Critical security patches may be applied immediately.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <h4 className="font-semibold mb-2">Update Process</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Receive update notifications via admin dashboard</li>
                    <li>Review update details and impact assessment</li>
                    <li>Schedule maintenance window if required</li>
                    <li>Communicate planned downtime to users</li>
                    <li>Monitor post-update system performance</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rollback Procedures</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Immediate rollback triggers and procedures</li>
                    <li>• Data integrity verification steps</li>
                    <li>• User notification protocols</li>
                    <li>• Post-rollback testing requirements</li>
                  </ul>
                </div>
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
                  <h4 className="font-semibold text-red-600 mb-2">User Access Issues</h4>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Symptoms:</strong> Users unable to login, access denied errors</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Verify user account status and permissions</li>
                      <li>Check for expired passwords or locked accounts</li>
                      <li>Review IP access restrictions and firewalls</li>
                      <li>Validate multi-factor authentication setup</li>
                      <li>Check system maintenance status</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2">Performance Issues</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Symptoms:</strong> Slow loading times, timeouts, high resource usage</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Check system resource utilization</li>
                      <li>Review recent changes and updates</li>
                      <li>Analyze database performance metrics</li>
                      <li>Verify network connectivity and bandwidth</li>
                      <li>Consider scaling resources if needed</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Data Synchronization Issues</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm mb-2"><strong>Symptoms:</strong> Outdated information, sync failures, data conflicts</p>
                    <p className="text-sm mb-2"><strong>Solutions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Check data synchronization logs</li>
                      <li>Verify API connectivity and authentication</li>
                      <li>Review data validation and conflict resolution</li>
                      <li>Manually trigger synchronization if needed</li>
                      <li>Contact support for persistent issues</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalation Procedures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-green-900 mb-2">Level 1: Self-Service</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Check system status dashboard</li>
                    <li>• Review documentation and FAQ</li>
                    <li>• Attempt standard troubleshooting</li>
                    <li>• Check recent change logs</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-yellow-900 mb-2">Level 2: Technical Support</h5>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Submit support ticket with details</li>
                    <li>• Provide logs and error messages</li>
                    <li>• Include reproduction steps</li>
                    <li>• Specify business impact level</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-red-900 mb-2">Level 3: Emergency</h5>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Call emergency support hotline</li>
                    <li>• Critical safety or security issues</li>
                    <li>• Complete system outages</li>
                    <li>• Data breach or compromise</li>
                  </ul>
                </div>
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
                  <h4 className="font-semibold mb-2">Primary Support Channels</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <Link href="/contact" className="text-blue-600 hover:underline">Submit Support Ticket</Link>
                    </li>
                    <li>📧 Email: admin-support@mysafeplay.ai</li>
                    <li>📞 Phone: 1-800-SAFEPLAY (1-800-723-3752)</li>
                    <li>💬 Live Chat: Available 24/7 in admin dashboard</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Emergency Contacts</h4>
                  <ul className="space-y-1 text-sm">
                    <li>🚨 Emergency Hotline: 1-800-SAFE-911</li>
                    <li>🔒 Security Incidents: security@mysafeplay.ai</li>
                    <li>⚖️ Legal/Compliance: legal@mysafeplay.ai</li>
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
                    <li>📋 API Documentation (admin dashboard)</li>
                    <li>🎓 Training Materials and Webinars</li>
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
                    <li>📄 Compliance Documentation</li>
                    <li>🔐 Security Certifications</li>
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
          <Link href="/admin" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Admin Dashboard</span>
          </Link>
          <Link href="/admin/analytics" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium">View Analytics</span>
          </Link>
          <Link href="/admin/venues" className="text-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <Building className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Manage Venues</span>
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
