
import Link from "next/link";
import { Building, Heart, FileText, Clock, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DocumentationLayout from "@/components/documentation/documentation-layout";

export default function DocumentationHub() {
  const manuals = [
    {
      title: "Venue Admin Manual", 
      description: "Comprehensive venue management guide covering all administrative functions for venue staff.",
      icon: Building,
      href: "/docs/venue-admin",
      features: ["Floor Plan Management", "AI Features", "Child Tracking", "Emergency Procedures"],
      color: "bg-green-50 text-green-600",
      readTime: "25 min read"
    },
    {
      title: "Parent Manual",
      description: "Complete user guide for parents to maximize SafePlay features and ensure child safety.",
      icon: Heart,
      href: "/docs/parent",
      features: ["Child Registration", "Real-time Tracking", "Photo Sharing", "Mobile Features"],
      color: "bg-purple-50 text-purple-600",
      readTime: "10 min read"
    }
  ];

  const quickLinks = [
    {
      title: "Emergency Procedures",
      description: "Critical safety and emergency response guide",
      icon: Zap,
      href: "/docs/venue-admin#emergency-procedures"
    },
    {
      title: "Training Resources",
      description: "Staff training materials and onboarding guides",
      icon: Users,
      href: "/docs/venue-admin#training"
    }
  ];

  return (
    <DocumentationLayout 
      title="SafePlay Documentation Hub"
      description="Comprehensive guides, manuals, and reference materials for all SafePlay users"
    >
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to SafePlay Documentation</h2>
        <p className="text-lg mb-6">
          Everything you need to master SafePlay's comprehensive child safety platform. From basic setup to advanced features, 
          our documentation provides step-by-step guidance for all user types.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Always up-to-date</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>For all user types</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick reference available</span>
          </div>
        </div>
      </div>

      {/* User Manuals */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Manuals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manuals.map((manual) => {
            const Icon = manual.icon;
            return (
              <Card key={manual.title} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${manual.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{manual.title}</CardTitle>
                  <CardDescription>{manual.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      {manual.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="text-sm text-gray-500 mb-4">{manual.readTime}</div>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={manual.href}>
                      View Manual
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card key={link.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription className="text-sm">{link.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={link.href}>
                      Access Resource
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Support Section */}
      <section className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Need Additional Help?</h2>
        <p className="text-gray-600 mb-4">
          Can't find what you're looking for? Our support team is here to help with any questions about SafePlay.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/faq">View FAQ</Link>
          </Button>
        </div>
      </section>
    </DocumentationLayout>
  );
}
