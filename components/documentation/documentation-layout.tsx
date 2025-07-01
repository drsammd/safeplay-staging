
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Book, 
  Search, 
  Menu, 
  X, 
  Home, 
  Shield, 
  Building, 
  Heart,
  FileText,
  ChevronRight,
  Download,
  Printer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DocumentationLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function DocumentationLayout({ children, title, description }: DocumentationLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    {
      name: "Documentation Home",
      href: "/docs",
      icon: Home,
      current: pathname === "/docs"
    },
    {
      name: "Company Admin Manual",
      href: "/docs/company-admin",
      icon: Shield,
      current: pathname.startsWith("/docs/company-admin")
    },
    {
      name: "Venue Admin Manual", 
      href: "/docs/venue-admin",
      icon: Building,
      current: pathname.startsWith("/docs/venue-admin")
    },
    {
      name: "Parent Manual",
      href: "/docs/parent",
      icon: Heart,
      current: pathname.startsWith("/docs/parent")
    },
    {
      name: "Quick Reference",
      href: "/docs/quick-reference",
      icon: FileText,
      current: pathname.startsWith("/docs/quick-reference")
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logos/safeplay_combined_logo5.png"
                  alt="SafePlay"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
              <div className="hidden md:block">
                <div className="flex items-center space-x-2 text-gray-600">
                  <ChevronRight className="h-4 w-4" />
                  <Book className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Documentation</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="hidden md:flex">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none md:block
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 border-b md:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Documentation</h2>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="p-4 border-b md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors
                    ${item.current 
                      ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="p-4 border-t mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600">
                FAQ
              </Link>
              <Link href="/contact" className="block text-sm text-gray-600 hover:text-blue-600">
                Contact Support
              </Link>
              <Link href="/terms" className="block text-sm text-gray-600 hover:text-blue-600">
                Terms of Service
              </Link>
              <Link href="/privacy" className="block text-sm text-gray-600 hover:text-blue-600">
                Privacy Policy
              </Link>
            </div>
          </div>
        </nav>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {description && (
                <p className="text-lg text-gray-600">{description}</p>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-blue max-w-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
