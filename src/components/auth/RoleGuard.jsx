import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

// Role-based route protection component
export default function RoleGuard({ allowedRoles, children, redirectTo }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          // Redirect to login
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        const user = await base44.auth.me();
        
        // Check if user has required role
        if (allowedRoles.includes(user.primary_role)) {
          setIsAuthorized(true);
        } else {
          // Redirect to user's correct dashboard
          const roleRedirects = {
            provider: '/provider/overview',
            cm: '/cm/overview',
            family: '/family/overview',
            guardian: '/family/overview',
            hospital: '/hospital/overview',
            admin: '/admin/overview'
          };
          
          const correctDashboard = roleRedirects[user.primary_role] || '/';
          window.location.href = redirectTo || correctDashboard;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
}