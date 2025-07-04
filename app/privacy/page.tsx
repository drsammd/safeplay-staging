
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Shield, Calendar, Mail, Phone, AlertTriangle } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logos/safeplay_combined_logo.png" 
                alt="SafePlay - Biometric Child Safety Platform" 
                width={120} 
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</Link>
              <Link href="/#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Features</Link>
              <Link href="/faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200">
                Login
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your privacy and your child's safety are our top priorities. This Privacy Policy explains how we collect, use, and protect your family's information.
          </p>
          <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            Effective Date: January 1, 2025 | Last Updated: January 1, 2025
          </div>
        </div>

        {/* Important Notice */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-amber-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Information About Children's Privacy</h3>
                <p className="text-amber-800">
                  SafePlay is designed to protect children and complies with both the Children's Online Privacy Protection Act (COPPA) and the General Data Protection Regulation (GDPR). We collect and process children's biometric data only with explicit parental consent and for the sole purpose of ensuring child safety.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 lg:p-12">
          
          {/* Table of Contents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <a href="#introduction" className="block text-blue-600 hover:text-blue-800">1. Introduction</a>
                <a href="#information-collected" className="block text-blue-600 hover:text-blue-800">2. Information We Collect</a>
                <a href="#biometric-data" className="block text-blue-600 hover:text-blue-800">3. Biometric Data Processing</a>
                <a href="#coppa-compliance" className="block text-blue-600 hover:text-blue-800">4. COPPA Compliance</a>
                <a href="#gdpr-compliance" className="block text-blue-600 hover:text-blue-800">5. GDPR Compliance</a>
                <a href="#data-use" className="block text-blue-600 hover:text-blue-800">6. How We Use Information</a>
                <a href="#data-sharing" className="block text-blue-600 hover:text-blue-800">7. Information Sharing</a>
              </div>
              <div className="space-y-2">
                <a href="#data-security" className="block text-blue-600 hover:text-blue-800">8. Data Security</a>
                <a href="#retention" className="block text-blue-600 hover:text-blue-800">9. Data Retention</a>
                <a href="#your-rights" className="block text-blue-600 hover:text-blue-800">10. Your Rights</a>
                <a href="#international-transfers" className="block text-blue-600 hover:text-blue-800">11. International Data Transfers</a>
                <a href="#policy-updates" className="block text-blue-600 hover:text-blue-800">12. Policy Updates</a>
                <a href="#contact-privacy" className="block text-blue-600 hover:text-blue-800">13. Contact Information</a>
              </div>
            </div>
          </section>

          {/* Introduction */}
          <section id="introduction" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                SafePlay Technologies, Inc. ("SafePlay," "we," "us," or "our") is committed to protecting the privacy and safety of children and families who use our biometric child safety platform. This Privacy Policy explains how we collect, use, disclose, and safeguard information from and about you and your children when you use our Services.
              </p>
              <p>
                Our Services are specifically designed for child safety and involve the collection and processing of sensitive information, including biometric identifiers such as facial recognition data. We understand the special responsibility we have when handling children's information and are committed to compliance with all applicable privacy laws, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Children's Online Privacy Protection Act (COPPA)</li>
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>State biometric privacy laws</li>
              </ul>
            </div>
          </section>

          {/* Information We Collect */}
          <section id="information-collected" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information from Parents</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>Account login credentials</li>
                  <li>Payment and billing information</li>
                  <li>Emergency contact information</li>
                  <li>Relationship verification documents</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Children's Personal Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name, age, and physical characteristics</li>
                  <li>Photos and videos for registration and safety monitoring</li>
                  <li>Medical alerts and special care instructions</li>
                  <li>Emergency contact information</li>
                  <li>School and activity preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Biometric Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Facial recognition templates and measurements</li>
                  <li>Facial geometry and distinctive features</li>
                  <li>Voice patterns (when voice recognition is enabled)</li>
                  <li>Behavioral biometric patterns</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4 Location and Tracking Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Real-time location within monitored venues</li>
                  <li>GPS coordinates (when location services are enabled)</li>
                  <li>Zone entry and exit timestamps</li>
                  <li>Movement patterns and duration data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.5 Behavioral and AI Analysis Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Emotion detection and mood analysis</li>
                  <li>Social interaction patterns</li>
                  <li>Activity engagement levels</li>
                  <li>Safety risk assessments</li>
                  <li>Behavioral trend analysis</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.6 Technical Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device identifiers and IP addresses</li>
                  <li>App usage statistics and preferences</li>
                  <li>Camera and sensor data from venue systems</li>
                  <li>Network connection information</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Biometric Data */}
          <section id="biometric-data" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Biometric Data Processing</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Special Notice About Biometric Data</h4>
                <p className="text-blue-800">
                  Biometric identifiers are unique biological characteristics that can be used to identify individuals. We collect and process biometric data solely for child safety purposes and with explicit parental consent.
                </p>
              </div>

              <p>
                <strong>3.1 Types of Biometric Data:</strong> We collect facial recognition templates, which are mathematical representations of facial features, not actual photos. These templates cannot be reverse-engineered to recreate a photo.
              </p>
              
              <p>
                <strong>3.2 Collection Methods:</strong> Biometric data is collected through high-resolution cameras installed in participating venues. Initial enrollment requires multiple photos in different lighting conditions for accuracy.
              </p>
              
              <p>
                <strong>3.3 Processing Purposes:</strong> Biometric data is used exclusively for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Real-time child identification and location tracking</li>
                <li>Safety alerts and emergency notifications</li>
                <li>Automated check-in and check-out processes</li>
                <li>Unauthorized access prevention</li>
                <li>Memory capture and photo organization</li>
              </ul>

              <p>
                <strong>3.4 Storage and Security:</strong> Biometric templates are encrypted using AES-256 encryption and stored in secure, access-controlled databases. Raw biometric data is processed locally and not transmitted unless necessary for identification.
              </p>

              <p>
                <strong>3.5 Retention Period:</strong> Biometric data is retained only as long as your child is actively using our Services, plus 30 days for account recovery purposes. You may request immediate deletion at any time.
              </p>
            </div>
          </section>

          {/* COPPA Compliance */}
          <section id="coppa-compliance" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. COPPA Compliance</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                The Children's Online Privacy Protection Act (COPPA) requires special protections for children under 13. SafePlay is fully compliant with COPPA requirements:
              </p>

              <p>
                <strong>4.1 Parental Consent:</strong> Before collecting any personal information from children under 13, we obtain verifiable parental consent through:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email confirmation with follow-up verification</li>
                <li>Credit card verification for paid services</li>
                <li>Digital signature on consent forms</li>
                <li>Phone verification for sensitive data collection</li>
              </ul>

              <p>
                <strong>4.2 Information Collection Limits:</strong> We collect only information that is reasonably necessary for child safety monitoring. We do not collect information for marketing or advertising purposes.
              </p>

              <p>
                <strong>4.3 Parental Rights:</strong> Parents have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Review all information collected about their child</li>
                <li>Request deletion of their child's information</li>
                <li>Refuse to allow further collection of information</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <p>
                <strong>4.4 Safe Harbor:</strong> We do not disclose children's personal information to third parties except as necessary for safety monitoring services or as required by law.
              </p>

              <p>
                <strong>4.5 Data Minimization:</strong> We collect only the minimum amount of information necessary to provide safety services and delete information when it is no longer needed.
              </p>
            </div>
          </section>

          {/* GDPR Compliance */}
          <section id="gdpr-compliance" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. GDPR Compliance</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                For users in the European Union, we comply with the General Data Protection Regulation (GDPR), which provides enhanced protections for children's data:
              </p>

              <p>
                <strong>5.1 Legal Basis for Processing:</strong> We process children's data based on:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Explicit parental consent for children under 16</li>
                <li>Legitimate interests in child safety (with appropriate safeguards)</li>
                <li>Legal obligations for safety reporting</li>
              </ul>

              <p>
                <strong>5.2 Enhanced Child Protections:</strong> Under GDPR, children's data receives special protection:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Age verification before data collection</li>
                <li>Clear, child-friendly privacy notices</li>
                <li>Regular consent renewal requirements</li>
                <li>Enhanced security measures for children's data</li>
              </ul>

              <p>
                <strong>5.3 Data Subject Rights:</strong> EU residents have enhanced rights including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Right of access to all personal data</li>
                <li>Right to data portability</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to object to processing</li>
              </ul>

              <p>
                <strong>5.4 Data Protection Officer:</strong> We have appointed a Data Protection Officer who can be contacted at <a href="mailto:dpo@mysafeplay.ai" className="text-blue-600 hover:text-blue-800">dpo@mysafeplay.ai</a> for GDPR-related inquiries.
              </p>
            </div>
          </section>

          {/* How We Use Information */}
          <section id="data-use" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. How We Use Information</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                We use collected information solely for child safety and service provision purposes:
              </p>

              <p>
                <strong>6.1 Safety Monitoring:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Real-time child location tracking and alerts</li>
                <li>Unauthorized access detection and prevention</li>
                <li>Emergency response coordination</li>
                <li>Behavioral analysis for safety risk assessment</li>
              </ul>

              <p>
                <strong>6.2 Service Provision:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Account management and authentication</li>
                <li>Parent communication and notifications</li>
                <li>Memory capture and photo organization</li>
                <li>Service improvement and optimization</li>
              </ul>

              <p>
                <strong>6.3 AI and Analytics:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Emotion detection for wellbeing monitoring</li>
                <li>Friendship and social interaction analysis</li>
                <li>Safety pattern recognition</li>
                <li>Predictive safety analytics</li>
              </ul>

              <p>
                <strong>6.4 Communication:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Safety alerts and notifications</li>
                <li>Service updates and announcements</li>
                <li>Parent-to-parent messaging (with consent)</li>
                <li>Customer support communications</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section id="data-sharing" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Information Sharing and Disclosure</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                We do not sell, rent, or trade personal information. We share information only in these limited circumstances:
              </p>

              <p>
                <strong>7.1 Service Providers:</strong> We work with trusted third-party providers for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Cloud storage and computing (AWS with strict data processing agreements)</li>
                <li>Payment processing (PCI-compliant processors)</li>
                <li>Analytics and security monitoring</li>
                <li>Customer support services</li>
              </ul>

              <p>
                <strong>7.2 Venue Partners:</strong> We share limited information with participating venues for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Check-in and check-out processes</li>
                <li>Emergency contact information</li>
                <li>Special care instructions and medical alerts</li>
              </ul>

              <p>
                <strong>7.3 Legal Requirements:</strong> We may disclose information when required by law:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Court orders or legal process</li>
                <li>Emergency situations involving child safety</li>
                <li>Law enforcement investigations</li>
                <li>Regulatory compliance requirements</li>
              </ul>

              <p>
                <strong>7.4 Parental Consent:</strong> We may share information with explicit parental consent for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Parent-to-parent communications</li>
                <li>Community features and events</li>
                <li>Media sharing with other families</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section id="data-security" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Data Security</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                We implement comprehensive security measures to protect your family's information:
              </p>

              <p>
                <strong>8.1 Technical Safeguards:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AES-256 encryption for data at rest and in transit</li>
                <li>Multi-factor authentication for account access</li>
                <li>Regular security audits and penetration testing</li>
                <li>Intrusion detection and monitoring systems</li>
                <li>Secure API endpoints with rate limiting</li>
              </ul>

              <p>
                <strong>8.2 Administrative Safeguards:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Background checks for all employees with data access</li>
                <li>Role-based access controls and least privilege principles</li>
                <li>Regular security training and awareness programs</li>
                <li>Incident response and breach notification procedures</li>
              </ul>

              <p>
                <strong>8.3 Physical Safeguards:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Secure data centers with biometric access controls</li>
                <li>Environmental monitoring and disaster recovery systems</li>
                <li>Redundant backup systems in multiple geographic locations</li>
                <li>Secure destruction of physical media</li>
              </ul>

              <p>
                <strong>8.4 Vendor Security:</strong> All third-party vendors undergo security assessments and must meet our security standards through contractual obligations.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section id="retention" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Data Retention</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                We retain personal information only as long as necessary for the purposes outlined in this Privacy Policy:
              </p>

              <p>
                <strong>9.1 Active Account Data:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Profile and registration information: Until account deletion</li>
                <li>Biometric templates: Until account deletion plus 30 days</li>
                <li>Location and tracking data: 90 days from collection</li>
                <li>Photos and videos: Until deleted by parent or account closure</li>
              </ul>

              <p>
                <strong>9.2 Safety and Legal Records:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Emergency incidents: 7 years for legal compliance</li>
                <li>Safety alerts and responses: 3 years</li>
                <li>Consent records: 7 years to demonstrate compliance</li>
                <li>Communication logs: 1 year</li>
              </ul>

              <p>
                <strong>9.3 Automatic Deletion:</strong> We implement automated deletion processes to ensure data is removed when retention periods expire. Parents can request immediate deletion of their child's data at any time.
              </p>

              <p>
                <strong>9.4 Backup Systems:</strong> Data in backup systems is deleted according to the same retention schedule, typically within 90 days of the primary deletion.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section id="your-rights" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Your Privacy Rights</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                You have significant rights regarding your family's personal information:
              </p>

              <p>
                <strong>10.1 Access and Review:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>View all information collected about you and your children</li>
                <li>Download copies of your data in machine-readable formats</li>
                <li>Review how your information is being used</li>
                <li>Access consent and agreement history</li>
              </ul>

              <p>
                <strong>10.2 Control and Correction:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Update or correct inaccurate information</li>
                <li>Modify privacy settings and consent preferences</li>
                <li>Control media sharing and communication settings</li>
                <li>Manage notification preferences</li>
              </ul>

              <p>
                <strong>10.3 Deletion and Withdrawal:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Delete your child's account and all associated data</li>
                <li>Withdraw consent for specific data processing activities</li>
                <li>Request deletion of specific information or media</li>
                <li>Opt out of non-essential communications</li>
              </ul>

              <p>
                <strong>10.4 Exercising Your Rights:</strong> To exercise these rights, contact us at <a href="mailto:privacy@mysafeplay.ai" className="text-blue-600 hover:text-blue-800">privacy@mysafeplay.ai</a> or through your account settings. We will respond to requests within 30 days and may require identity verification for security purposes.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section id="international-transfers" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. International Data Transfers</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                SafePlay operates globally, and your information may be transferred to and processed in countries other than your country of residence:
              </p>

              <p>
                <strong>11.1 Data Transfer Safeguards:</strong> When transferring data internationally, we implement appropriate safeguards including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Adequacy decisions for countries with adequate protection levels</li>
                <li>Binding Corporate Rules for internal data transfers</li>
                <li>Explicit consent for transfers when required</li>
              </ul>

              <p>
                <strong>11.2 Primary Data Locations:</strong> Your data is primarily stored and processed in:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>United States (AWS data centers with SOC 2 compliance)</li>
                <li>European Union (for EU residents, with GDPR compliance)</li>
                <li>Other regions as necessary for service provision</li>
              </ul>

              <p>
                <strong>11.3 Data Localization:</strong> Where required by local law, we maintain data within specific geographic boundaries and comply with data localization requirements.
              </p>
            </div>
          </section>

          {/* Policy Updates */}
          <section id="policy-updates" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Privacy Policy Updates</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements:
              </p>

              <p>
                <strong>12.1 Notification Process:</strong> When we make material changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Send email notifications to registered users</li>
                <li>Display prominent notices in our applications</li>
                <li>Post updates on our website</li>
                <li>Provide 30 days' advance notice for significant changes</li>
              </ul>

              <p>
                <strong>12.2 Consent for Changes:</strong> For material changes affecting children's data processing, we may require renewed parental consent before continuing to collect or process information.
              </p>

              <p>
                <strong>12.3 Version History:</strong> We maintain a history of privacy policy versions and will provide access to previous versions upon request.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section id="contact-privacy" className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Contact Information</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                If you have questions about this Privacy Policy or want to exercise your privacy rights, please contact us:
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Privacy Officer</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-blue-600 mr-3" />
                        <a href="mailto:privacy@mysafeplay.ai" className="text-blue-600 hover:text-blue-800">privacy@mysafeplay.ai</a>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-blue-600 mr-3" />
                        <span>1-800-SAFEPLAY (1-800-723-3752)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Data Protection Officer (EU Residents)</h4>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-blue-600 mr-3" />
                      <a href="mailto:dpo@mysafeplay.ai" className="text-blue-600 hover:text-blue-800">dpo@mysafeplay.ai</a>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Mailing Address</h4>
                    <p className="text-gray-600">
                      SafePlay Technologies, Inc.<br />
                      Privacy Department<br />
                      123 Innovation Drive<br />
                      San Francisco, CA 94107<br />
                      United States
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">EU Representative</h4>
                    <p className="text-gray-600">
                      SafePlay EU Privacy Services<br />
                      GDPR Representative<br />
                      Dublin, Ireland<br />
                      <a href="mailto:eu-privacy@mysafeplay.ai" className="text-blue-600 hover:text-blue-800">eu-privacy@mysafeplay.ai</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Related Links */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Related Information
            </h3>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                Terms of Service
              </Link>
              <Link href="/faq" className="text-blue-600 hover:text-blue-800 font-medium">
                Privacy FAQ
              </Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                Contact Support
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Column */}
              <div className="md:col-span-1">
                <div className="mb-4">
                  <Image 
                    src="/logos/safeplay_combined_logo.png" 
                    alt="SafePlay" 
                    width={120} 
                    height={40}
                    className="h-10 w-auto filter brightness-0 invert"
                  />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Keeping families connected and children safe with cutting-edge biometric technology.
                </p>
              </div>
              
              {/* Legal Column */}
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="text-blue-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
              
              {/* Support Column */}
              <div>
                <h3 className="font-semibold text-white mb-4">Support</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                </ul>
              </div>
              
              {/* Navigate Column */}
              <div>
                <h3 className="font-semibold text-white mb-4">Navigate</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
                  <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-gray-700 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2025 SafePlay Technologies, Inc. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
