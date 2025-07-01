
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Mail, Phone } from "lucide-react";

export default function TermsOfServicePage() {
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
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These Terms of Service govern your use of SafePlay's biometric child safety platform and services.
          </p>
          <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            Effective Date: January 1, 2025 | Last Updated: January 1, 2025
          </div>
        </div>

        {/* Document Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 lg:p-12">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction and Acceptance</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                Welcome to SafePlay, a comprehensive biometric child safety platform operated by SafePlay Technologies, Inc. ("SafePlay," "we," "us," or "our"). These Terms of Service ("Terms") constitute a legally binding agreement between you ("you," "your," "Parent," or "User") and SafePlay regarding your use of our biometric child safety services, including facial recognition technology, location tracking, AI-powered safety monitoring, and related mobile applications and websites (collectively, the "Services").
              </p>
              <p>
                By creating an account, registering your child, or using any part of our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our Services.
              </p>
              <p>
                <strong>IMPORTANT:</strong> Our Services involve the collection and processing of biometric data, including facial recognition of children. By agreeing to these Terms, you provide explicit consent for the collection, processing, and storage of your child's biometric information as described in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Service Description</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                SafePlay provides biometric child safety services including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Facial Recognition Technology:</strong> Automated detection and recognition of registered children using advanced biometric algorithms</li>
                <li><strong>Real-time Safety Monitoring:</strong> Continuous monitoring of child location and safety status within participating venues</li>
                <li><strong>Location Tracking:</strong> GPS and venue-based location tracking with real-time alerts and notifications</li>
                <li><strong>AI-Powered Analysis:</strong> Behavioral analysis, emotion detection, and safety risk assessment using artificial intelligence</li>
                <li><strong>Media Capture and Sharing:</strong> Automated photo and video capture with privacy-controlled sharing features</li>
                <li><strong>Parent Communication Platform:</strong> Messaging, community features, and parent-to-parent connections</li>
                <li><strong>Emergency Alert System:</strong> Instant notifications for safety concerns, unauthorized access, or emergency situations</li>
                <li><strong>Mobile Applications:</strong> iOS and Android applications for real-time monitoring and communication</li>
              </ul>
            </div>
          </section>

          {/* User Eligibility */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Eligibility and Registration</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>3.1 Age Requirements:</strong> You must be at least 18 years old and the legal parent or guardian of any child you register for our Services. You represent and warrant that you have the legal authority to enter into these Terms on behalf of yourself and any children you register.
              </p>
              <p>
                <strong>3.2 COPPA Compliance:</strong> Our Services are designed for children under 13 years of age. In compliance with the Children's Online Privacy Protection Act (COPPA), we require verifiable parental consent before collecting personal information from children under 13. By registering your child, you provide such consent.
              </p>
              <p>
                <strong>3.3 Account Accuracy:</strong> You must provide accurate, complete, and current information during registration and maintain the accuracy of your account information. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
              </p>
              <p>
                <strong>3.4 One Account Per Family:</strong> Each family unit may maintain only one primary account. Additional authorized users may be added to the account as emergency contacts or co-parents with appropriate verification.
              </p>
            </div>
          </section>

          {/* Biometric Data and Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Biometric Data Collection and Processing</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>4.1 Biometric Consent:</strong> By using our Services, you explicitly consent to the collection, processing, storage, and use of biometric identifiers and biometric information, including facial recognition data, from your registered children. This consent is required for the operation of our safety monitoring services.
              </p>
              <p>
                <strong>4.2 Data Security:</strong> We implement industry-standard security measures, including encryption and secure storage protocols, to protect biometric data. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p>
                <strong>4.3 Data Retention:</strong> Biometric data will be retained only as long as necessary to provide Services or as required by law. You may request deletion of biometric data as described in our Privacy Policy.
              </p>
              <p>
                <strong>4.4 Third-Party Processing:</strong> We may use third-party service providers (including AWS services) to process biometric data. All such providers are bound by strict data protection agreements.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Acceptable Use Policy</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                You agree to use our Services only for their intended purpose of child safety and monitoring. You agree NOT to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Services for any unlawful purpose or in violation of any applicable laws or regulations</li>
                <li>Attempt to circumvent, disable, or interfere with security features of the Services</li>
                <li>Access or attempt to access other users' accounts or personal information</li>
                <li>Upload or transmit viruses, malware, or other harmful code</li>
                <li>Harass, abuse, or harm other users through our communication features</li>
                <li>Share inappropriate content through our media sharing features</li>
                <li>Use automated systems to access the Services without authorization</li>
                <li>Reverse engineer, decompile, or attempt to extract source code from our Services</li>
                <li>Register false information or create fake accounts</li>
                <li>Use the Services to monitor children without proper parental authority</li>
              </ul>
            </div>
          </section>

          {/* AI and Machine Learning */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Artificial Intelligence and Machine Learning</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>6.1 AI Processing:</strong> Our Services use artificial intelligence and machine learning algorithms to analyze behavioral patterns, detect emotions, assess safety risks, and provide insights. By using our Services, you consent to AI processing of your child's data for these purposes.
              </p>
              <p>
                <strong>6.2 Algorithm Accuracy:</strong> While our AI systems are highly accurate, they are not infallible. We do not guarantee 100% accuracy in facial recognition, behavioral analysis, or safety assessments. Parents should use their own judgment in conjunction with our Services.
              </p>
              <p>
                <strong>6.3 Continuous Learning:</strong> Our AI systems may learn and improve from aggregated, anonymized data. Individual identifying information is not used for algorithm training without explicit consent.
              </p>
            </div>
          </section>

          {/* Media and Content */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Media Capture and Content Sharing</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>7.1 Photo and Video Capture:</strong> Our Services automatically capture photos and videos of registered children for safety monitoring and memory creation. You consent to such capture and understand that media may include other children in the background.
              </p>
              <p>
                <strong>7.2 Media Sharing:</strong> You control the sharing settings for media containing your child. We provide granular privacy controls to manage who can view, download, or share media.
              </p>
              <p>
                <strong>7.3 Content Ownership:</strong> You retain ownership of media containing your child. We retain a license to process and store such media for the provision of Services.
              </p>
              <p>
                <strong>7.4 Content Standards:</strong> All shared content must comply with our community standards. We reserve the right to remove inappropriate content and suspend accounts for violations.
              </p>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Payment Terms and Subscriptions</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>8.1 Service Fees:</strong> Certain features of our Services may require payment of subscription fees. All fees are clearly disclosed at the time of purchase.
              </p>
              <p>
                <strong>8.2 Billing:</strong> Subscription fees are billed in advance on a recurring basis. You authorize us to charge your chosen payment method for all applicable fees.
              </p>
              <p>
                <strong>8.3 Refunds:</strong> Subscription fees are generally non-refundable except as required by applicable law or as expressly stated in our refund policy.
              </p>
              <p>
                <strong>8.4 Fee Changes:</strong> We may change subscription fees with 30 days' advance notice. Continued use of paid Services after such notice constitutes acceptance of new fees.
              </p>
            </div>
          </section>

          {/* Disclaimers and Limitations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Disclaimers and Limitation of Liability</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>9.1 Service Availability:</strong> We strive to maintain continuous service availability but do not guarantee uninterrupted access. Services may be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>
              <p>
                <strong>9.2 Technology Limitations:</strong> Biometric technology and AI systems have inherent limitations. False positives and false negatives may occur. Our Services supplement but do not replace parental supervision and responsibility.
              </p>
              <p>
                <strong>9.3 Third-Party Venues:</strong> Our Services operate in third-party venues that we do not control. We are not responsible for venue policies, safety standards, or incidents that occur at venue locations.
              </p>
              <p className="font-semibold">
                <strong>9.4 LIMITATION OF LIABILITY:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAFEPLAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICES.
              </p>
              <p className="font-semibold">
                <strong>9.5 DISCLAIMER OF WARRANTIES:</strong> THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. SAFEPLAY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Termination</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>10.1 Termination by You:</strong> You may terminate your account at any time through your account settings or by contacting customer support. Upon termination, your access to Services will cease, and your data will be handled according to our Privacy Policy.
              </p>
              <p>
                <strong>10.2 Termination by SafePlay:</strong> We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, or for any other reason at our discretion.
              </p>
              <p>
                <strong>10.3 Effect of Termination:</strong> Upon termination, all rights and licenses granted to you will cease, and you must discontinue use of the Services. Sections of these Terms that by their nature should survive termination will remain in effect.
              </p>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Dispute Resolution and Governing Law</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                <strong>11.1 Governing Law:</strong> These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
              </p>
              <p>
                <strong>11.2 Arbitration:</strong> Any disputes arising from these Terms or your use of the Services will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
              <p>
                <strong>11.3 Class Action Waiver:</strong> You agree to resolve disputes individually and waive the right to participate in class action lawsuits or collective arbitrations.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Changes to Terms</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                We may update these Terms from time to time. When we make material changes, we will notify you by email and through our Services at least 30 days before the changes take effect. Your continued use of the Services after such notification constitutes acceptance of the updated Terms.
              </p>
              <p>
                For significant changes affecting biometric data processing or privacy rights, we may require your explicit re-consent before continuing to provide Services.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Contact Information</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                If you have questions about these Terms or need to contact us regarding your account, please reach out:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium">Email:</span>
                    <a href="mailto:legal@safeplay.com" className="text-blue-600 hover:text-blue-800 ml-2">legal@safeplay.com</a>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">1-800-SAFEPLAY (1-800-723-3752)</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium">Mailing Address:</p>
                    <p className="text-gray-600 mt-1">
                      SafePlay Technologies, Inc.<br />
                      Legal Department<br />
                      123 Innovation Drive<br />
                      San Francisco, CA 94107
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
              Related Legal Documents
            </h3>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                Privacy Policy
              </Link>
              <Link href="/faq" className="text-blue-600 hover:text-blue-800 font-medium">
                Frequently Asked Questions
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
                  <li><Link href="/terms" className="text-blue-400 hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
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
