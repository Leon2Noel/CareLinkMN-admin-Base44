import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    base44.auth.logout('/');
  };

  const getRoleDashboard = (role) => {
    const dashboards = {
      provider: '/provider/overview',
      cm: '/cm/overview',
      family: '/family/overview',
      guardian: '/family/overview',
      hospital: '/hospital/overview',
      admin: '/admin/overview'
    };
    return dashboards[role] || '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    getRoleDashboard
  };
}