
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Users, 
  Shield, 
  Camera, 
  MapPin, 
  CreditCard, 
  Bell, 
  Settings, 
  Baby, 
  Heart, 
  Eye, 
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  FileText,
  ExternalLink,
  Home,
  Book
} from 'lucide-react';

export default function QuickReferencePage() {
  const venueAdminGuides = [
    {
      title: "Getting Started",
      icon: Building,
      items: [
        { task: "Set up your venue profile", status: "essential", time: "5 min" },
        { task: "Upload floor plans", status: "essential", time: "10 min" },
        { task: "Configure safety zones", status: "essential", time: "15 min" },
        { task: "Install and position cameras", status: "essential", time: "30 min" },
        { task: "Test emergency protocols", status: "essential", time: "20 min" }
      ]
    },
    {
      title: "Daily Operations",
      icon: Shield,
      items: [
        { task: "Check camera system status", status: "daily", time: "2 min" },
        { task: "Review safety alerts", status: "daily", time: "5 min" },
        { task: "Monitor zone capacity", status: "ongoing", time: "ongoing" },
        { task: "Update emergency contacts", status: "weekly", time: "5 min" },
        { task: "Review incident reports", status: "daily", time: "10 min" }
      ]
    },
    {
      title: "Emergency Procedures",
      icon: AlertTriangle,
      items: [
        { task: "Locate emergency button in admin panel", status: "critical", time: "instant" },
        { task: "Know your emergency contact numbers", status: "critical", time: "instant" },
        { task: "Understand evacuation procedures", status: "critical", time: "instant" },
        { task: "Access real-time child locations", status: "critical", time: "instant" },
        { task: "Communicate with all parents", status: "critical", time: "1 min" }
      ]
    },
    {
      title: "System Management",
      icon: Settings,
      items: [
        { task: "Manage staff accounts", status: "weekly", time: "10 min" },
        { task: "Review camera coverage", status: "weekly", time: "15 min" },
        { task: "Update safety protocols", status: "monthly", time: "30 min" },
        { task: "Check system backups", status: "weekly", time: "5 min" },
        { task: "Monitor storage usage", status: "weekly", time: "5 min" }
      ]
    }
  ];

  const parentGuides = [
    {
      title: "Getting Started",
      icon: Users,
      items: [
        { task: "Complete identity verification", status: "essential", time: "10 min" },
        { task: "Add children to your account", status: "essential", time: "5 min per child" },
        { task: "Upload child photos for recognition", status: "essential", time: "3 min per child" },
        { task: "Set emergency contacts", status: "essential", time: "5 min" },
        { task: "Configure notification preferences", status: "recommended", time: "5 min" }
      ]
    },
    {
      title: "Check-In Process",
      icon: CheckCircle,
      items: [
        { task: "Use QR code for quick check-in", status: "daily", time: "30 seconds" },
        { task: "Verify child's safety wristband", status: "daily", time: "30 seconds" },
        { task: "Update emergency contacts if needed", status: "as-needed", time: "2 min" },
        { task: "Set pickup authorization", status: "daily", time: "1 min" },
        { task: "Review venue safety briefing", status: "first-visit", time: "5 min" }
      ]
    },
    {
      title: "Monitoring Your Child",
      icon: Eye,
      items: [
        { task: "Check real-time location", status: "ongoing", time: "instant" },
        { task: "View live camera feeds", status: "as-needed", time: "instant" },
        { task: "Receive safety alerts", status: "automatic", time: "instant" },
        { task: "Access memory highlights", status: "ongoing", time: "instant" },
        { task: "Track activity levels", status: "ongoing", time: "instant" }
      ]
    },
    {
      title: "Safety Features",
      icon: Heart,
      items: [
        { task: "Emergency panic button", status: "critical", time: "instant" },
        { task: "Instant location alerts", status: "automatic", time: "instant" },
        { task: "Distress detection notifications", status: "automatic", time: "instant" },
        { task: "Injury alert system", status: "automatic", time: "instant" },
        { task: "Secure check-out verification", status: "automatic", time: "30 seconds" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'essential':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'daily':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'weekly':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'monthly':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ongoing':
      case 'automatic':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'essential':
      case 'critical':
        return <AlertTriangle className="w-3 h-3" />;
      case 'daily':
        return <Clock className="w-3 h-3" />;
      case 'ongoing':
      case 'automatic':
        return <Zap className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Quick Reference Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Essential guides and checklists for venue administrators and parents to maximize 
            safety and get the most out of SafePlay's comprehensive child protection system.
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-2 text-center">
                <Book className="h-5 w-5 text-blue-600" />
                <span>Documentation Center</span>
              </CardTitle>
              <CardDescription className="text-center">
                Access comprehensive manuals and detailed guides for your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Building className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Venue Administrator Manual</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Complete guide for venue management, safety monitoring, and operations
                      </p>
                      <Link href="/docs/venue-admin">
                        <Button className="w-full" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Open Manual
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Parent Manual</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Complete user guide for parents to maximize safety features and monitoring
                      </p>
                      <Link href="/docs/parent">
                        <Button className="w-full" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Open Manual
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Home className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Main Documentation</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Overview and general information about SafePlay platform
                      </p>
                      <Link href="/docs">
                        <Button className="w-full" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Docs
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Safety Features</p>
                  <p className="text-2xl font-bold">20+</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Camera className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Monitoring</p>
                  <p className="text-2xl font-bold">24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Instant Alerts</p>
                  <p className="text-2xl font-bold">&lt;3s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Peace of Mind</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="venue-admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="venue-admin" className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              Venue Administrator
            </TabsTrigger>
            <TabsTrigger value="parent" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Parent
            </TabsTrigger>
          </TabsList>

          {/* Venue Admin Guide */}
          <TabsContent value="venue-admin">
            <div className="space-y-6">
              <Alert>
                <Building className="h-4 w-4" />
                <AlertDescription>
                  <strong>Venue Administrator Guide:</strong> Complete setup and operational checklists 
                  to ensure maximum safety coverage and optimal system performance for your venue.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {venueAdminGuides.map((guide, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <guide.icon className="w-5 h-5 mr-3 text-blue-600" />
                        {guide.title}
                      </CardTitle>
                      <CardDescription>
                        Essential tasks and procedures for {guide.title.toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {guide.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.task}</p>
                              <p className="text-xs text-gray-500">Estimated time: {item.time}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                {getStatusIcon(item.status)}
                                <span className="ml-1">{item.status}</span>
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Parent Guide */}
          <TabsContent value="parent">
            <div className="space-y-6">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>Parent Guide:</strong> Step-by-step instructions to set up your account, 
                  monitor your children, and make the most of SafePlay's safety features.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {parentGuides.map((guide, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <guide.icon className="w-5 h-5 mr-3 text-purple-600" />
                        {guide.title}
                      </CardTitle>
                      <CardDescription>
                        Essential steps for {guide.title.toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {guide.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.task}</p>
                              <p className="text-xs text-gray-500">Time needed: {item.time}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                {getStatusIcon(item.status)}
                                <span className="ml-1">{item.status}</span>
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Emergency Contact Section */}
        <Card className="mt-8 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <Phone className="w-5 h-5 mr-3" />
              Emergency Contacts
            </CardTitle>
            <CardDescription className="text-red-700">
              Keep these numbers easily accessible at all times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Emergency Services</h4>
                <p className="text-2xl font-bold text-red-600">911</p>
                <p className="text-sm text-red-600">Fire, Police, Medical</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">SafePlay Support</h4>
                <p className="text-lg font-bold text-red-600">1-800-SAFEPLAY</p>
                <p className="text-sm text-red-600">24/7 Technical Support</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Venue Emergency</h4>
                <p className="text-lg font-bold text-red-600">Contact Venue</p>
                <p className="text-sm text-red-600">Direct venue emergency line</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
