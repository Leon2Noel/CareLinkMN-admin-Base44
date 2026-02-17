import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from './utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X, Home, Building2, FileText, Users, Settings, BarChart3, Search, LogOut } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import PostLoginHandler from '@/components/auth/PostLoginHandler';
import { clearAuthStorage, sanitizeReturnUrl } from '@/components/auth/auth-utils';

function clearUserState() {
  // Clear any user-related state from memory
  // This is a placeholder - add any app-specific cleanup needed
}

function handleLogout() {
    // Clear user state and auth storage
    clearUserState();
    clearAuthStorage();
    
    // Call logout with a sanitized return URL
    const returnUrl = sanitizeReturnUrl('/');
    base44.auth.logout(returnUrl);
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.log('Not authenticated');
      }
    }
    loadUser();
  }, []);

  const roleBasedNavigation = {
    admin: [
      { name: 'Overview', path: '/Overview', icon: Home },
      { name: 'Providers', path: '/Providers', icon: Building2 },
      { name: 'Licenses', path: '/Licenses', icon: FileText },
      { name: 'Referrals', path: '/ReferralTracking', icon: Users },
      { name: 'Analytics', path: '/AdminAnalytics', icon: BarChart3 },
      { name: 'Settings', path: '/Settings', icon: Settings },
    ],
    provider: [
      { name: 'Overview', path: '/ProviderOverview', icon: Home },
      { name: 'Openings', path: '/ProviderOpeningsManager', icon: Building2 },
      { name: 'Referrals', path: '/ProviderReferralsView', icon: Users },
      { name: 'Profile', path: '/ProviderProfileSettings', icon: Settings },
    ],
    case_manager: [
      { name: 'Overview', path: '/CMOverview', icon: Home },
      { name: 'My Referrals', path: '/CMReferralsDashboard', icon: FileText },
      { name: 'Search Providers', path: '/CaseManagerSearch', icon: Search },
      { name: 'Analytics', path: '/CMAnalytics', icon: BarChart3 },
    ],
    family: [
      { name: 'Overview', path: '/FamilyOverview', icon: Home },
      { name: 'Search', path: '/CaseManagerSearch', icon: Search },
    ],
    hospital: [
      { name: 'Overview', path: '/HospitalOverview', icon: Home },
      { name: 'Referrals', path: '/ReferralTracking', icon: FileText },
    ],
  };

  const navigation = user?.role ? roleBasedNavigation[user.role] || [] : [];

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <PostLoginHandler />
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and brand */}
              <div className="flex items-center">
                <Link to={createPageUrl('Home')} className="flex items-center space-x-2">
                  <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">CareLinkMN</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              {user && (
                <nav className="hidden md:flex items-center space-x-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.path.substring(1))}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <NotificationBell />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar>
                            <AvatarFallback className="bg-indigo-600 text-white">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-1 capitalize">{user.role}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => base44.auth.redirectToLogin()}
                    >
                      Log in
                    </Button>
                    <Button
                      onClick={() => (window.location.href = createPageUrl('Register'))}
                    >
                      Get Started
                    </Button>
                  </div>
                )}

                {/* Mobile menu button */}
                {user && (
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {user && mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <nav className="px-4 py-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path.substring(1))}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; 2026 CareLinkMN. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}