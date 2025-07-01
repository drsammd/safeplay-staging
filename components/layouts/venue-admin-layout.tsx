
"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  User, 
  MapPin, 
  LogOut, 
  Menu, 
  X, 
  Building,
  Home,
  Map,
  Camera,
  Brain,
  BarChart3,
  Shield,
  AlertTriangle,
  Fingerprint,
  QrCode,
  Users,
  Zap,
  BookOpen,
  Settings,
  Activity,
  UserCheck,
  DollarSign,
  CreditCard
} from "lucide-react";

interface VenueAdminLayoutProps {
  children: React.ReactNode;
}

export default function VenueAdminLayout({ children }: VenueAdminLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/venue-admin", icon: Home },
    { name: "Floor Plans", href: "/venue-admin/floor-plans", icon: Map },
    { name: "Zone Configuration", href: "/venue-admin/zone-configuration", icon: Settings },
    { name: "Advanced Zones", href: "/venue-admin/advanced-zones", icon: Zap },
    { name: "Tracking", href: "/venue-admin/tracking", icon: MapPin },
    { name: "Check-In/Out", href: "/venue-admin/check-in-out", icon: UserCheck },
    { name: "QR Codes", href: "/venue-admin/qr-codes", icon: QrCode },
    { name: "Kiosks", href: "/venue-admin/kiosks", icon: Users },
    { name: "AI Features", href: "/venue-admin/ai-features", icon: Brain },
    { name: "AI Analytics", href: "/venue-admin/ai-analytics", icon: BarChart3 },
    { name: "Zone Analytics", href: "/venue-admin/zone-analytics", icon: Activity },
    { name: "Biometric", href: "/venue-admin/biometric", icon: Fingerprint },
    { name: "Alerts", href: "/venue-admin/alerts", icon: AlertTriangle },
    { name: "Emergency", href: "/venue-admin/emergency-management", icon: Shield },
    { name: "Pickup", href: "/venue-admin/pickup", icon: Users },
    { name: "Payment Setup", href: "/venue-admin/payment-setup", icon: CreditCard },
    { name: "Revenue Analytics", href: "/venue-admin/revenue", icon: DollarSign },
    { name: "Documentation", href: "/docs", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-venue bg-overlay-dark">
      <div className="content-overlay">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/venue-admin" className="flex items-center">
                <Image
                  src="/logos/safeplay_combined_logo5.png"
                  alt="SafePlay"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                        pathname === item.href
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Desktop User Menu */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Building className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Venue Admin</span>
                  <span className="text-gray-500">•</span>
                  <span className="font-medium">{session?.user?.name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
                <nav className="flex flex-col space-y-2 mt-4">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                          pathname === item.href
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-gray-700 px-3 py-2">
                      <Building className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Venue Admin</span>
                      <span className="text-gray-500">•</span>
                      <span className="font-medium">{session?.user?.name}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
