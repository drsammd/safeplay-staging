
"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu,
  X,
  Settings,
  LogOut,
  Shield,
  User,
  Bell,
  HelpCircle,
  CreditCard,
  Building,
  BarChart3,
  Phone
} from "lucide-react";
import { VerificationBadge } from "@/components/verification/verification-badge";
import { cn } from "@/lib/utils";

interface ModernHeaderProps {
  userRole: 'parent' | 'admin' | 'venue-admin';
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const getPageTitle = (pathname: string, userRole: string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 1) {
    return 'Dashboard';
  }
  
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'text-blue-600';
    case 'venue-admin':
      return 'text-green-600';
    default:
      return 'text-purple-600';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return Shield;
    case 'venue-admin':
      return Building;
    default:
      return User;
  }
};

export default function ModernHeader({ userRole, sidebarOpen, onSidebarToggle }: ModernHeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const pageTitle = getPageTitle(pathname, userRole);
  const RoleIcon = getRoleIcon(userRole);
  const roleColor = getRoleColor(userRole);

  const getQuickActions = () => {
    switch (userRole) {
      case 'parent':
        return [
          { name: "Account Settings", href: "/parent/account", icon: Settings },
          { name: "Security & Verification", href: "/verification", icon: Shield },
          { name: "Subscription", href: "/parent/subscription", icon: CreditCard },
          { name: "Help & Support", href: "/support", icon: HelpCircle },
        ];
      case 'admin':
        return [
          { name: "System Analytics", href: "/admin/analytics", icon: BarChart3 },
          { name: "User Management", href: "/admin/users", icon: User },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
          { name: "Documentation", href: "/docs", icon: HelpCircle },
        ];
      case 'venue-admin':
        return [
          { name: "Zone Analytics", href: "/venue-admin/zone-analytics", icon: BarChart3 },
          { name: "Emergency Management", href: "/venue-admin/emergency-management", icon: Shield },
          { name: "Payment Setup", href: "/venue-admin/payment-setup", icon: CreditCard },
          { name: "Documentation", href: "/docs", icon: HelpCircle },
        ];
      default:
        return [];
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu and page title */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
            <div className={cn("flex items-center space-x-1 text-sm", roleColor)}>
              <RoleIcon className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">
                {userRole === 'admin' ? 'System Admin' : 
                 userRole === 'venue-admin' ? 'Venue Admin' : 'Parent Dashboard'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Verification Status Badge for Parents */}
          {userRole === 'parent' && session?.user && (
            <VerificationBadge 
              verificationLevel={session.user.verificationLevel || 'UNVERIFIED'}
              phoneVerified={session.user.phoneVerified}
              identityVerified={session.user.identityVerified}
              twoFactorEnabled={session.user.twoFactorEnabled}
              showDetails
              size="sm"
            />
          )}

          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">New security alert</p>
                    <p className="text-xs text-gray-500">Your account security settings have been updated</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">System update</p>
                    <p className="text-xs text-gray-500">mySafePlay™ has been updated with new features</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Welcome message</p>
                    <p className="text-xs text-gray-500">Welcome to the modernized mySafePlay™ interface</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {session?.user?.name ? getInitials(session.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {session?.user?.name ? getInitials(session.user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">{session?.user?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className={cn("flex items-center space-x-1 text-xs", roleColor)}>
                    <RoleIcon className="h-3 w-3" />
                    <span>
                      {userRole === 'admin' ? 'System Administrator' : 
                       userRole === 'venue-admin' ? 'Venue Administrator' : 'Parent Account'}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <div className="py-1">
                <DropdownMenuLabel className="text-xs font-medium text-gray-500">Quick Actions</DropdownMenuLabel>
                {getQuickActions().map((action) => (
                  <DropdownMenuItem key={action.name} asChild>
                    <Link href={action.href} className="flex items-center">
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
