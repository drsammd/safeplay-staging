
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  MapPin, 
  Fingerprint, 
  Eye, 
  Play, 
  Heart, 
  Users, 
  Zap,
  Clock,
  Star,
  Trophy,
  Smile,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity,
  Target,
  Film,
  Image,
  Download,
  Share2
} from 'lucide-react';

export default function MemoryFeaturesPage() {
  const trackingFeatures = [
    {
      icon: MapPin,
      title: "Multi-Level Tracking",
      description: "Advanced tracking through complex play structures and multi-level environments",
      details: [
        "3D spatial tracking with height detection",
        "Navigation through tunnels, slides, and climbing structures", 
        "Multi-camera coordination for seamless tracking",
        "Zone-to-zone transition monitoring",
        "Lost child prevention with immediate alerts"
      ],
      color: "blue"
    },
    {
      icon: Target,
      title: "Zone-Based Monitoring",
      description: "Precise location tracking showing exactly where your child is playing",
      details: [
        "Real-time zone occupancy with child identification",
        "Interactive venue maps with live child locations",
        "Zone-specific safety protocols and monitoring",
        "Capacity management and crowd control",
        "Emergency evacuation assistance"
      ],
      color: "green"
    },
    {
      icon: Zap,
      title: "Instant Location Updates",
      description: "Never search for your child again with real-time location information",
      details: [
        "Sub-second location updates",
        "Push notifications when child moves between zones",
        "Historical movement tracking and patterns",
        "Geofence alerts for restricted areas",
        "Integration with venue emergency systems"
      ],
      color: "purple"
    },
    {
      icon: Fingerprint,
      title: "Biometric Check-Out",
      description: "Complete accountability ensuring children only leave with authorized individuals",
      details: [
        "Facial recognition verification for authorized pickup",
        "Biometric matching of parent and child",
        "Multi-factor authentication for high security",
        "Audit trail of all check-out attempts",
        "Emergency override with staff verification"
      ],
      color: "red"
    }
  ];

  const memoryFeatures = [
    {
      icon: Activity,
      title: "Action Recognition",
      description: "AI-powered recognition of special moments and achievements",
      details: [
        "First steps, jumps, and climbing achievements",
        "Sports activities and skill demonstrations",
        "Creative play and artistic expressions",
        "Social interactions and friendship moments",
        "Learning milestones and educational activities"
      ]
    },
    {
      icon: Users,
      title: "Social Interaction Capture",
      description: "Preserve precious moments of friendship and social development",
      details: [
        "Automatic detection of play partnerships",
        "Group activity documentation",
        "Friendship development tracking",
        "Collaborative play achievements",
        "Social skill milestone recording"
      ]
    },
    {
      icon: Film,
      title: "Personalized Highlight Reels",
      description: "AI-curated video compilations of your child's best moments",
      details: [
        "Daily, weekly, and monthly highlight videos",
        "Achievement-focused compilations",
        "Growth and development documentation",
        "Shareable family memories",
        "Custom video creation tools"
      ]
    },
    {
      icon: Eye,
      title: "Live Viewing",
      description: "Watch your child play in real-time from anywhere",
      details: [
        "High-definition live streaming",
        "Multi-camera angle selection",
        "Privacy-protected viewing (your child only)",
        "Remote interaction capabilities",
        "Mobile-optimized streaming"
      ]
    }
  ];

  const safetyIntegration = [
    {
      icon: AlertTriangle,
      title: "Distress Detection",
      description: "AI monitors for signs of distress or children needing help",
      integration: "Memory system captures context around safety incidents for review and improvement"
    },
    {
      icon: Shield,
      title: "Bullying Monitoring", 
      description: "Advanced behavioral analysis to detect and prevent bullying incidents",
      integration: "Interaction patterns help identify and document concerning behaviors"
    },
    {
      icon: Heart,
      title: "Injury Alerts",
      description: "Instant detection and response system for accidents and injuries",
      integration: "Automated incident documentation with video evidence for medical professionals"
    },
    {
      icon: Zap,
      title: "Emergency Response",
      description: "Comprehensive emergency communication and coordination",
      integration: "Real-time location data enables faster emergency response and family notification"
    }
  ];

  const platformStats = [
    {
      icon: Camera,
      title: "Memory Capture",
      stat: "1000+",
      description: "Moments automatically captured per child per day"
    },
    {
      icon: Clock,
      title: "Real-Time Processing",
      stat: "<1 sec",
      description: "Time from moment occurrence to parent notification"
    },
    {
      icon: Trophy,
      title: "Achievement Recognition",
      stat: "50+",
      description: "Different types of milestones and achievements tracked"
    },
    {
      icon: Star,
      title: "Parent Satisfaction",
      stat: "98%",
      description: "Of parents report improved peace of mind"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      green: "bg-green-50 border-green-200 text-green-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      red: "bg-red-50 border-red-200 text-red-800"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Camera className="w-4 h-4 mr-2" />
              Advanced Memory & Tracking Platform
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Never Miss a Moment, Always Know Where They Are
            </h1>
            <p className="text-xl text-purple-100 mb-8 leading-relaxed">
              SafePlay's revolutionary memory and tracking system captures every precious moment 
              while providing unparalleled safety monitoring and location awareness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-50">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <CheckCircle className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Capture Every Moment</h2>
          <p className="text-xl text-gray-600">Advanced AI technology that never sleeps, so you never miss a thing</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {platformStats.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <item.icon className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{item.stat}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tracking Features */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Tracking Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Revolutionary location technology that provides complete accountability and peace of mind
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {trackingFeatures.map((feature, index) => (
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

      {/* Memory Features */}
      <div className="bg-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Memory Capture & Highlights</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered memory creation that captures achievements, milestones, and precious moments automatically
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {memoryFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <feature.icon className="w-6 h-6 mr-3 text-purple-600" />
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
                        <Star className="w-4 h-4 mr-3 mt-0.5 text-yellow-500 flex-shrink-0" />
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

      {/* Safety Integration */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrated Safety Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Memory capture works hand-in-hand with our comprehensive safety monitoring system
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {safetyIntegration.map((safety, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <safety.icon className="w-6 h-6 mr-3 text-red-600" />
                    {safety.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {safety.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Memory Integration:</h4>
                    <p className="text-sm text-blue-700">{safety.integration}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Memory Management</h2>
            <p className="text-xl text-gray-600">Everything you need to capture, organize, and share your child's special moments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <Image className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-3">Smart Photo Organization</h3>
                <p className="text-gray-600 mb-4">
                  AI automatically organizes photos by child, activity, achievement, and date for easy browsing.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-1">
                  <li>• Facial recognition tagging</li>
                  <li>• Activity-based categorization</li>
                  <li>• Chronological timeline view</li>
                  <li>• Smart search capabilities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <Download className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-3">Easy Downloads</h3>
                <p className="text-gray-600 mb-4">
                  Download individual photos, video highlights, or complete day packages with one click.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-1">
                  <li>• High-resolution photo downloads</li>
                  <li>• HD video compilation exports</li>
                  <li>• Bulk download options</li>
                  <li>• Cloud storage integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <Share2 className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-3">Secure Sharing</h3>
                <p className="text-gray-600 mb-4">
                  Share special moments with family members while maintaining complete privacy control.
                </p>
                <ul className="text-left text-sm text-gray-600 space-y-1">
                  <li>• Private family sharing circles</li>
                  <li>• Time-limited share links</li>
                  <li>• Watermark protection</li>
                  <li>• Access control management</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-purple-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Capture Every Precious Moment?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust SafePlay to keep their children safe while preserving every special moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-purple-50">
                <Smile className="w-5 h-5 mr-2" />
                Start Capturing Memories
              </Button>
            </Link>
            <Link href="/safety">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <ArrowRight className="w-5 h-5 mr-2" />
                Learn About Safety Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
