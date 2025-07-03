
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Camera,
  Settings,
  CreditCard,
  Shield,
  Building,
  Map,
  Brain,
  BarChart3,
  AlertTriangle,
  Fingerprint,
  QrCode,
  UserCheck,
  Zap,
  Activity,
  DollarSign,
  Tag,
  TrendingUp,
  BookOpen,
  Phone,
  MapPin,
  User,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
  roles?: string[];
  badge?: string;
}

interface ModernSidebarProps {
  userRole: 'parent' | 'admin' | 'venue-admin';
  isOpen: boolean;
  onToggle: () => void;
}

const getNavigationItems = (role: string): NavigationItem[] => {
  switch (role) {
    case 'parent':
      return [
        { name: "Dashboard", href: "/parent", icon: Home },
        {
          name: "Children & Family",
          icon: Users,
          children: [
            { name: "My Children", href: "/parent/children", icon: Users },
            { name: "Family Management", href: "/parent/family", icon: Users },
            { name: "Memories", href: "/parent/memories", icon: Camera },
          ]
        },
        {
          name: "Account & Settings",
          icon: Settings,
          children: [
            { name: "Account Settings", href: "/parent/account", icon: User },
            { name: "Subscription", href: "/parent/subscription", icon: CreditCard },
            { name: "Security & Verification", href: "/verification", icon: Shield },
            { name: "Discount History", href: "/parent/discount-history", icon: Tag },
          ]
        },
        {
          name: "Mobile Features",
          icon: Phone,
          children: [
            { name: "Mobile App", href: "/parent/mobile", icon: Phone },
          ]
        },
      ];

    case 'admin':
      return [
        { name: "Dashboard", href: "/admin", icon: Home },
        {
          name: "Analytics & Reports",
          icon: BarChart3,
          children: [
            { name: "System Analytics", href: "/admin/analytics", icon: BarChart3 },
            { name: "Discount Analytics", href: "/admin/discount-analytics", icon: TrendingUp },
          ]
        },
        {
          name: "User Management",
          icon: Users,
          children: [
            { name: "All Users", href: "/admin/users", icon: Users },
            { name: "Verification Management", href: "/admin/verification", icon: Shield },
          ]
        },
        {
          name: "Business Management",
          icon: Building,
          children: [
            { name: "Venues", href: "/admin/venues", icon: Building },
            { name: "Payment Management", href: "/admin/payments", icon: CreditCard },
            { name: "Discount Codes", href: "/admin/discount-codes", icon: Tag },
          ]
        },
        {
          name: "Communications",
          icon: Phone,
          children: [
            { name: "Email Automation", href: "/admin/email-automation", icon: Phone },
          ]
        },
        {
          name: "System",
          icon: Settings,
          children: [
            { name: "System Settings", href: "/admin/settings", icon: Settings },
            { name: "AI Oversight", href: "/admin/ai-oversight", icon: Brain },
            { name: "System Alerts", href: "/admin/alerts", icon: AlertTriangle },
            { name: "Documentation", href: "/docs", icon: BookOpen },
          ]
        },
      ];

    case 'venue-admin':
      return [
        { name: "Dashboard", href: "/venue-admin", icon: Home },
        {
          name: "Venue Setup",
          icon: Building,
          children: [
            { name: "Floor Plans", href: "/venue-admin/floor-plans", icon: Map },
            { name: "Zone Configuration", href: "/venue-admin/zone-configuration", icon: Settings },
            { name: "Advanced Zones", href: "/venue-admin/advanced-zones", icon: Zap },
          ]
        },
        {
          name: "Safety & Tracking",
          icon: Shield,
          children: [
            { name: "Child Tracking", href: "/venue-admin/tracking", icon: MapPin },
            { name: "Check-In/Out", href: "/venue-admin/check-in-out", icon: UserCheck },
            { name: "Biometric Management", href: "/venue-admin/biometric", icon: Fingerprint },
            { name: "Emergency Management", href: "/venue-admin/emergency-management", icon: AlertTriangle },
            { name: "Alerts", href: "/venue-admin/alerts", icon: AlertTriangle },
            { name: "Child Pickup", href: "/venue-admin/pickup", icon: Users },
          ]
        },
        {
          name: "Technology & AI",
          icon: Brain,
          children: [
            { name: "AI Features", href: "/venue-admin/ai-features", icon: Brain },
            { name: "AI Analytics", href: "/venue-admin/ai-analytics", icon: BarChart3 },
            { name: "QR Codes", href: "/venue-admin/qr-codes", icon: QrCode },
            { name: "Kiosks", href: "/venue-admin/kiosks", icon: Users },
          ]
        },
        {
          name: "Analytics & Revenue",
          icon: BarChart3,
          children: [
            { name: "Zone Analytics", href: "/venue-admin/zone-analytics", icon: Activity },
            { name: "Revenue Analytics", href: "/venue-admin/revenue", icon: DollarSign },
          ]
        },
        {
          name: "Business Setup",
          icon: CreditCard,
          children: [
            { name: "Payment Setup", href: "/venue-admin/payment-setup", icon: CreditCard },
            { name: "Documentation", href: "/docs", icon: BookOpen },
          ]
        },
      ];

    default:
      return [];
  }
};

export default function ModernSidebar({ userRole, isOpen, onToggle }: ModernSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navigationItems = getNavigationItems(userRole);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (children?: NavigationItem[]) => 
    children?.some(child => child.href && isActive(child.href)) || false;

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isItemActive = item.href ? isActive(item.href) : isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              depth === 0 ? "text-gray-700" : "text-gray-600 text-xs",
              isItemActive 
                ? "bg-blue-50 text-blue-700" 
                : "hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center">
              <item.icon className={cn(
                "flex-shrink-0",
                depth === 0 ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4",
                isItemActive ? "text-blue-500" : "text-gray-400"
              )} />
              <span>{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1 border-l-2 border-gray-100 pl-4">
              {item.children?.map(child => renderNavigationItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || "#"}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
          depth === 0 ? "text-gray-700" : "text-gray-600",
          isItemActive
            ? "bg-blue-50 text-blue-700"
            : "hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <item.icon className={cn(
          "flex-shrink-0",
          depth === 0 ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4",
          isItemActive ? "text-blue-500" : "text-gray-400"
        )} />
        <span>{item.name}</span>
        {item.badge && (
          <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-gray-200">
          <Link href={`/${userRole === 'admin' ? 'admin' : userRole === 'venue-admin' ? 'venue-admin' : 'parent'}`} className="flex items-center">
            <Image
              src="/logos/safeplay_combined_logo5.png"
              alt="mySafePlay™"
              width={140}
              height={45}
              className="h-8 w-auto"
            />
            <span className="ml-2 text-xl font-bold text-gray-900">mySafePlay™</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>

        {/* User Info */}
        {session?.user && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userRole === 'admin' ? 'System Admin' : 
                   userRole === 'venue-admin' ? 'Venue Admin' : 'Parent'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
