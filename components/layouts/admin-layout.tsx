
"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  User, 
  BarChart3, 
  Building, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  Home,
  BookOpen,
  Settings,
  Users,
  AlertTriangle,
  Brain,
  CreditCard,
  Tag,
  TrendingUp
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Venues", href: "/admin/venues", icon: Building },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Payment Management", href: "/admin/payments", icon: CreditCard },
    { name: "Discount Codes", href: "/admin/discount-codes", icon: Tag },
    { name: "Discount Analytics", href: "/admin/discount-analytics", icon: TrendingUp },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
    { name: "AI Oversight", href: "/admin/ai-oversight", icon: Brain },
    { name: "System Alerts", href: "/admin/alerts", icon: AlertTriangle },
    { name: "Documentation", href: "/docs", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-admin bg-overlay-dark">
      <div className="content-overlay">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/admin" className="flex items-center">
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
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Admin</span>
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
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Admin</span>
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
