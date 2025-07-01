

import Image from "next/image";
import Link from "next/link";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
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
              <Link href="/testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Testimonials</Link>
              <span className="text-blue-600 font-medium">FAQ</span>
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
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get answers to common questions about SafePlay's biometric child safety technology, 
            pricing, and implementation.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {/* General Questions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">General Questions</h2>
              
              <AccordionItem value="what-is-safeplay" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What is SafePlay and how does it work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay is a comprehensive biometric child safety platform that uses advanced AI and facial recognition technology to protect children in play venues. Our system provides real-time location tracking, instant safety alerts, emotion detection, and automatic photo capture. Features include QR code check-in/out, permission-based photo sharing between families, parent-to-parent communication, AI friendship detection, and enhanced navigation to help you find your child. We ensure complete privacy and security while creating a connected community of families.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how-safe-is-data" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How safe is my child's biometric data?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Data security is our top priority. All biometric data is encrypted using military-grade encryption and stored in secure, GDPR-compliant data centers. We never share personal data with third parties, and parents have full control over their data with the ability to delete it at any time. Our system is regularly audited by independent security firms.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="age-range" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What age range does SafePlay support?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay is designed for children aged 2-16 years. Our facial recognition technology is optimized to work accurately with children's faces as they grow and change. The system learns and adapts to recognize children even as they age, ensuring consistent protection throughout their childhood.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="check-in-process" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do I check my child in and out of venues?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay uses a simple QR code system for check-in and check-out. Each family receives a unique QR code that can be scanned at the venue entrance. The system automatically recognizes your child through facial recognition and confirms their identity. You can also use the mobile app to check in multiple children at once and receive instant confirmation when they're safely in the venue.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="real-time-alerts" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What types of real-time alerts will I receive?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay sends instant notifications for various safety and activity events: check-in/out confirmations, restricted area alerts, emotion detection triggers (if your child appears distressed), emergency situations, friendship activities, photo sharing opportunities, and location updates when your child moves between zones. You can customize which alerts you receive and how you want to be notified (push notification, text, or email).
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* AI Safety Features */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Safety Features</h2>

              <AccordionItem value="ai-protection" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How does SafePlay's AI protect my child?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay's AI continuously monitors for safety concerns using advanced computer vision and behavioral analysis. Our system detects emotional distress, bullying situations, overcrowding, and unauthorized access to restricted areas. When potential risks are identified, parents and venue staff receive instant alerts. The AI also ensures age-appropriate access to different areas and activities within the venue.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="emotion-detection" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What is emotion detection and how does it work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Our emotion detection technology analyzes facial expressions and body language to identify signs of distress, fear, or discomfort in children. This helps venue staff quickly respond to situations where a child might need help or attention. The system respects privacy by processing this information locally and only alerting when intervention may be needed for the child's wellbeing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="behavioral-monitoring" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What behavioral patterns does SafePlay monitor?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay monitors patterns that could indicate safety concerns, such as aggressive behavior, social isolation, or situations that might escalate into conflicts. The system also tracks positive interactions and friendships, helping parents understand their child's social development. All monitoring is designed to enhance safety while respecting children's natural play and social interactions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="age-verification" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How does age estimation help with safety?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay's age estimation ensures children access age-appropriate areas and activities. For example, toddler areas are protected from older children who might accidentally cause harm, while teen areas remain accessible only to appropriate age groups. This creates safer play environments tailored to different developmental stages and physical capabilities.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Photo & Video Sharing */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Photo & Video Sharing</h2>

              <AccordionItem value="photo-sharing" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How does photo sharing work with other families?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay's smart photo sharing system automatically identifies when your child appears in photos with other children and offers to share those moments with the other families involved. All sharing requires explicit permission from both families, and you maintain complete control over which photos of your child can be shared. You can also request photos your child appears in from other families.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="connection-bonus" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What is the connection bonus system?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  When children play together frequently, their families earn "connection bonuses" that unlock enhanced features like automatic photo sharing, priority playtime notifications, and coordinated activity suggestions. This system encourages positive social connections while giving parents more ways to capture and share their children's friendships and memories.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="photo-permissions" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do I control who can see photos of my child?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  You have complete control over photo permissions through your SafePlay account. You can set preferences for automatic sharing with specific families, approve or deny individual photo sharing requests, and block sharing with any family. All photos remain private by default, and sharing only occurs with your explicit consent for each family or individual photo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="photo-copies" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Can I get copies of photos my child appears in?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Yes! When other families capture photos that include your child, you can request copies through the SafePlay app. The system automatically identifies your child in photos and notifies you when new photos are available. Other families can approve or share these photos with you, creating a collaborative approach to capturing memories.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Communication & Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Communication & Navigation</h2>

              <AccordionItem value="parent-communication" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How can I connect with other parents?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay includes secure parent-to-parent messaging features that let you connect with other families whose children play with yours. You can coordinate playdates, share parenting tips, organize group activities, and build community connections. All communication is moderated for safety and privacy, and you control who can contact you.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="friendship-detection" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How does friendship detection work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay's AI analyzes play patterns, proximity, and positive interactions to identify developing friendships between children. When children consistently play together and show positive social behaviors, the system suggests friendship connections to parents. This helps you understand your child's social circle and can facilitate deeper friendships through coordinated activities.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="playdate-coordination" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Can I coordinate playdates through SafePlay?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Yes! SafePlay includes playdate coordination tools that let you schedule activities with other families, share venue preferences, and coordinate timing. You can see when your child's friends are at the same venue and receive suggestions for group activities. The system also helps you find families with similar schedules and interests.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="find-child" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do I find my child in the venue?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay's enhanced navigation system provides real-time location tracking and optimal pathfinding to help you locate your child quickly. The mobile app shows your child's current location, suggests the best route to reach them, and considers crowd density to avoid congested areas. You'll also receive notifications when your child moves to different zones within the venue.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Zone Management & Location */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Zone Management & Location</h2>

              <AccordionItem value="restricted-zones" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What are restricted zones and how do they work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Restricted zones are areas within venues that are designated as off-limits for safety reasons - such as storage areas, kitchens, or maintenance zones. SafePlay automatically detects when children enter these areas and immediately alerts both parents and venue staff. The system helps guide children back to safe play areas and prevents accidents before they happen.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="capacity-monitoring" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How does capacity monitoring keep children safe?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay continuously monitors the number of children in each area to prevent overcrowding, which can lead to accidents or discomfort. When areas approach capacity limits, the system alerts venue staff and suggests alternative play areas to parents. This ensures optimal play experiences and maintains safe crowd densities throughout the venue.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="emergency-evacuation" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What happens during an emergency evacuation?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  During emergencies, SafePlay's system immediately activates evacuation protocols, providing real-time guidance for the safest exit routes while avoiding congested areas. Parents receive instant notifications with their child's location and evacuation status. The system helps venue staff account for all children and ensures families are reunited safely at designated meeting points.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location-accuracy" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How accurate is the location tracking?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay's location tracking is accurate to within 3-5 feet using a combination of facial recognition, camera networks, and zone-based monitoring. The system updates location information in real-time as children move throughout the venue, providing parents with current and precise information about their child's whereabouts and activities.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Check-in & Access */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Check-in & Access</h2>

              <AccordionItem value="qr-code-system" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How does the QR code check-in system work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Each family receives a unique QR code that serves as their digital key to SafePlay venues. Simply scan your QR code at the entrance, and the system automatically recognizes your children through facial recognition. The process takes seconds and provides instant confirmation that your children are safely checked in. The system also handles membership verification and payment processing automatically.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="multiple-children" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Can I check in multiple children at once?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Yes! One QR code scan can check in your entire family. The facial recognition system automatically identifies all your registered children as they enter, sending you individual confirmations for each child. You can also add temporary guests or playdates to your group through the mobile app before arriving at the venue.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="lost-qr-code" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What if I lose my QR code?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  No problem! You can access your QR code anytime through the SafePlay mobile app, email, or by providing identification at the venue. Venue staff can also verify your identity through the system and provide temporary access. For added security, QR codes can be regenerated instantly if needed, and the old codes are automatically deactivated.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="checkout-process" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do I check my child out?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Checking out is as simple as checking in - just scan your QR code at the exit. The system automatically confirms your children's identities and processes their departure. You'll receive a summary of their visit including photos, activities, and any notable moments. The checkout process ensures only authorized adults can remove children from the venue.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Technology Questions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology & Privacy</h2>

              <AccordionItem value="accuracy-rate" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How accurate is the facial recognition technology?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Our facial recognition system boasts a 99.9% accuracy rate with minimal false positives. The technology is specifically trained on children's facial patterns and continuously improves through machine learning. We use multiple verification points and real-time validation to ensure the highest level of accuracy.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="camera-setup" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What type of cameras and setup is required?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay works with high-definition IP cameras that we provide and install. Our team handles the complete setup including camera placement, network configuration, and system integration. Cameras are strategically positioned at entry/exit points and play areas for optimal coverage while respecting privacy boundaries.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="internet-requirement" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What internet requirements are needed?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  A stable broadband internet connection with minimum 10 Mbps upload speed is required for optimal performance. Our system includes offline backup capabilities that store data locally during internet outages and synchronizes when connection is restored. We recommend dedicated bandwidth for mission-critical venues.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Pricing & Implementation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing & Implementation</h2>

              <AccordionItem value="pricing-model" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How much does SafePlay cost?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay offers flexible pricing based on venue size and requirements. Our basic package starts at $299/month for small venues (up to 50 children), with enterprise solutions available for larger facilities. This includes hardware, software, installation, training, and 24/7 support. Contact us for a customized quote based on your specific needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="setup-time" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How long does implementation take?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Typical implementation takes 2-4 weeks from contract signing to full operation. This includes site survey (1 day), equipment installation (2-3 days), system configuration and testing (1 week), staff training (2 days), and soft launch period (1 week). We work around your operating schedule to minimize disruption.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="staff-training" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What training is provided for venue staff?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  We provide comprehensive training for all venue staff including system operation, parent enrollment process, emergency procedures, and basic troubleshooting. Training includes both hands-on sessions and digital resources. Ongoing support is available 24/7, and we offer refresher training as needed.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Legal & Privacy Compliance */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal & Privacy Compliance</h2>

              <AccordionItem value="coppa-compliance" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What is COPPA and how does SafePlay comply?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  The Children's Online Privacy Protection Act (COPPA) is a U.S. federal law that protects children under 13 from inappropriate data collection. SafePlay fully complies with COPPA by obtaining verifiable parental consent before collecting any personal information from children, limiting data collection to what's necessary for safety services, providing parents with full control over their child's information, and implementing enhanced security measures for children's data. We never use children's information for marketing or advertising purposes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gdpr-rights" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What are my rights under GDPR?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  If you're in the European Union, GDPR gives you enhanced rights regarding your family's data: Right of Access (view all collected data), Right to Rectification (correct inaccurate information), Right to Erasure ("right to be forgotten"), Right to Data Portability (receive your data in a machine-readable format), Right to Restrict Processing (limit how we use your data), and Right to Object (opt out of certain processing activities). For children under 16, we require explicit parental consent and provide additional protections. Contact our Data Protection Officer at dpo@safeplay.com to exercise these rights.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="biometric-protection" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How is my child's biometric data protected?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Your child's biometric data receives the highest level of protection. We use AES-256 encryption for all biometric templates, store data in secure, access-controlled environments, never share biometric data with third parties, automatically delete data when your child's account is closed, process data locally whenever possible to minimize transmission, and comply with state biometric privacy laws including Illinois BIPA and Texas biometric laws. Biometric templates cannot be reverse-engineered to recreate photos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delete-data" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Can I delete my child's data from SafePlay?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Yes, absolutely. You have complete control over your child's data and can request deletion at any time. You can delete specific photos/videos, remove biometric templates, delete location history, close your child's account entirely, or request a complete data purge. Most deletions are processed immediately, with some taking up to 30 days for complete removal from backup systems. We'll provide confirmation when deletion is complete. Contact privacy@safeplay.com or use your account settings to request data deletion.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="exercise-rights" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How do I exercise my privacy rights?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  You can exercise your privacy rights in several ways: Use your account settings for basic data management, email privacy@safeplay.com for complex requests, call 1-800-SAFEPLAY for urgent privacy concerns, or mail written requests to our Privacy Department. We respond to most requests within 30 days and may require identity verification for security. All privacy requests are handled by our dedicated privacy team and are free of charge.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy-contact" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Who can I contact about privacy concerns?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  For privacy-related questions or concerns, contact our Privacy Officer at privacy@safeplay.com or call 1-800-SAFEPLAY. EU residents can contact our Data Protection Officer at dpo@safeplay.com. For general questions, use our customer support chat or email support@safeplay.com. Our privacy team is available Monday-Friday, 9 AM-6 PM EST, with emergency privacy support available 24/7 for urgent concerns involving child safety or data breaches.
                </AccordionContent>
              </AccordionItem>
            </div>

            {/* Support & Maintenance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Support & Maintenance</h2>

              <AccordionItem value="support-availability" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What support is available?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  SafePlay provides 24/7 technical support via phone, email, and live chat. Our support team includes technical specialists and customer success managers. We also offer remote diagnostics, on-site support when needed, and proactive system monitoring to prevent issues before they occur.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="system-updates" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How are system updates handled?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  Software updates are deployed automatically during off-peak hours with minimal downtime. Major updates are scheduled in advance with venue notification. All updates are thoroughly tested and include rollback capabilities. Hardware maintenance is performed quarterly, and equipment replacement is included in enterprise packages.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-backup" className="border-b border-gray-200">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How is data backed up and protected?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-4">
                  All data is automatically backed up in real-time to secure cloud servers with 99.99% uptime guarantee. We maintain redundant backups in multiple geographic locations and can restore data within minutes if needed. Regular backup testing ensures data integrity and rapid recovery capabilities.
                </AccordionContent>
              </AccordionItem>
            </div>
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6">
              Still have questions?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Our team is here to help you understand how SafePlay can protect your children and enhance your venue operations.
            </p>
            <div className="space-x-4">
              <Link href="/contact" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Contact Us
              </Link>
              <Link href="/auth/signup" className="btn-outline border-white text-white hover:bg-white hover:text-blue-600">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 mt-16">
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
              
              {/* Navigate Column */}
              <div>
                <h3 className="font-semibold text-white mb-4">Navigate</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
                  <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                  <li><Link href="/testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</Link></li>
                </ul>
              </div>
              
              {/* Legal Column */}
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
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
              
              {/* Connect Column */}
              <div>
                <h3 className="font-semibold text-white mb-4">Connect</h3>
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">f</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">t</span>
                  </div>
                  <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">i</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-gray-700 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2025 SafePlay. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

