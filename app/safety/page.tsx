
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  Brain, 
  Heart, 
  Phone, 
  Lock, 
  Camera, 
  Zap,
  AlertTriangle,
  UserCheck,
  Clock,
  Fingerprint,
  Database,
  Trash2,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Building
} from 'lucide-react';

export default function SafetyPage() {
  const safetyFeatures = [
    {
      icon: AlertTriangle,
      title: "Distress Detection",
      description: "AI-powered recognition of children in distress or needing help",
      details: [
        "Real-time emotion and body language analysis",
        "Automatic staff alerts for immediate response",
        "Parent notifications with live video feed",
        "Integration with venue emergency protocols",
        "False-positive reduction through advanced algorithms"
      ],
      color: "red"
    },
    {
      icon: Users,
      title: "Bullying Monitoring", 
      description: "Advanced behavioral analysis to detect and prevent bullying incidents",
      details: [
        "Pattern recognition for aggressive interactions",
        "Immediate intervention alerts to staff",
        "Detailed incident documentation",
        "Parent notification system",
        "Trend analysis for prevention strategies"
      ],
      color: "orange"
    },
    {
      icon: Heart,
      title: "Injury Alerts",
      description: "Instant detection and response system for accidents and injuries",
      details: [
        "AI-powered fall and injury detection",
        "Automatic medical alert system",
        "Staff location and response coordination",
        "Parent emergency notifications",
        "Integration with local emergency services"
      ],
      color: "blue"
    },
    {
      icon: Phone,
      title: "Emergency Response",
      description: "Comprehensive emergency communication connecting families with venue teams",
      details: [
        "One-touch emergency activation",
        "Simultaneous alerts to parents and staff",
        "Real-time location tracking",
        "Emergency contact cascade system", 
        "Integration with local first responders"
      ],
      color: "purple"
    }
  ];

  const securityMeasures = [
    {
      icon: Fingerprint,
      title: "Biometric Data Protection",
      description: "Your child's biometric data stays on your phone",
      details: [
        "Biometric templates stored locally on parent device only",
        "Uploaded temporarily during check-in for recognition",
        "Automatically deleted from servers on check-out",
        "No long-term server storage of biometric data",
        "COPPA and GDPR compliant data handling"
      ]
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Military-grade encryption protects all data in transit",
      details: [
        "AES-256 encryption for all data transmission",
        "Zero-knowledge architecture for sensitive data",
        "Secure API endpoints with OAuth 2.0",
        "Regular security audits and penetration testing",
        "SOC 2 Type II compliance"
      ]
    },
    {
      icon: Database,
      title: "Minimal Data Storage",
      description: "We store only what's necessary for safety and delete the rest",
      details: [
        "Automatic data expiration policies",
        "Child data deleted when they age out",
        "Parent-controlled data retention settings",
        "Regular data purging of inactive accounts",
        "Right to be forgotten compliance"
      ]
    },
    {
      icon: UserCheck,
      title: "Identity Verification",
      description: "Rigorous verification ensures only authorized individuals access children",
      details: [
        "Multi-factor identity verification for parents",
        "Background checks for venue staff",
        "Biometric pickup authorization",
        "Real-time ID verification at check-out",
        "Audit trail for all access attempts"
      ]
    }
  ];

  const platformRobustness = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      stat: "99.9%",
      description: "Accuracy in threat detection and child safety monitoring"
    },
    {
      icon: Clock,
      title: "Real-Time Response",
      stat: "<3 sec",
      description: "Average time from incident detection to alert notification"
    },
    {
      icon: Camera,
      title: "24/7 Monitoring",
      stat: "100%",
      description: "Uptime with redundant systems and failover protection"
    },
    {
      icon: Zap,
      title: "Instant Alerts",
      stat: "0 delay",
      description: "Immediate notifications through multiple communication channels"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      red: "bg-red-50 border-red-200 text-red-800",
      orange: "bg-orange-50 border-orange-200 text-orange-800", 
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Shield className="w-4 h-4 mr-2" />
              Advanced Child Safety Platform
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Uncompromising Safety Through Advanced Technology
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              SafePlay combines cutting-edge AI, biometric security, and real-time monitoring 
              to create the most comprehensive child safety platform available today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                <CheckCircle className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Eye className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Robustness Stats */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Robustness</h2>
          <p className="text-xl text-gray-600">Industry-leading performance and reliability metrics</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {platformRobustness.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <item.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{item.stat}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Safety Innovations */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Safety Innovations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI-powered safety features that protect children and provide peace of mind for parents
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {safetyFeatures.map((feature, index) => (
              <Card key={index} className={`border-2 ${getColorClasses(feature.color)} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <feature.icon className="w-6 h-6 mr-3" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-3 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Security & Privacy First</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your family's privacy and data security are our top priorities. We implement the highest standards of protection.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {securityMeasures.map((measure, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <measure.icon className="w-6 h-6 mr-3 text-green-600" />
                    {measure.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {measure.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {measure.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <Lock className="w-4 h-4 mr-3 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Biometric Data Handling */}
      <div className="bg-green-50 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-white border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-2xl text-green-800">
                <Fingerprint className="w-8 h-8 mr-3" />
                Biometric Data Handling
              </CardTitle>
              <CardDescription className="text-lg text-green-700">
                Complete transparency about how we handle your child's biometric information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">Stored on Your Phone</h3>
                  <p className="text-sm text-green-700">
                    Biometric templates remain securely on your personal device only
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">Temporary Upload</h3>
                  <p className="text-sm text-green-700">
                    Uploaded only during check-in for real-time recognition purposes
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">Auto-Deleted</h3>
                  <p className="text-sm text-green-700">
                    Immediately removed from servers when your child checks out
                  </p>
                </div>
              </div>
              
              <Alert className="mt-6 bg-green-50 border-green-200">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>Our Promise:</strong> We never store biometric data long-term on our servers. 
                  Your child's biometric information is under your complete control and remains on your device.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Next-Level Safety?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust SafePlay to keep their children safe while they play and explore.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                <Star className="w-5 h-5 mr-2" />
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/memory-features">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <ArrowRight className="w-5 h-5 mr-2" />
                Explore Memory Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
