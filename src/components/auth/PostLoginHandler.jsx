import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getDashboardForRole } from './auth-utils';

/**
 * PostLoginHandler - processes pending registration data after Base44 auth completes
 * Should be included in the main app layout to run on every page load
 */
export default function PostLoginHandler() {
  useEffect(() => {
    handlePostLogin();
  }, []);

  const handlePostLogin = async () => {
    try {
      // Check if user is authenticated first
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;

      // Check if there's pending registration data
      const pendingData = localStorage.getItem('pending_registration');
      if (!pendingData) return;

      const registration = JSON.parse(pendingData);
      
      // Check if registration is stale (older than 10 minutes)
      if (Date.now() - registration.timestamp > 10 * 60 * 1000) {
        localStorage.removeItem('pending_registration');
        return;
      }

      const user = await base44.auth.me();

      // Update user profile with role if not already set
      if (!user.primary_role && registration.primary_role) {
        try {
          await base44.auth.updateMe({
            primary_role: registration.primary_role,
            full_name: registration.full_name || user.full_name
          });
          
          console.log('✅ User profile updated with role:', registration.primary_role);
          
          // Reload user data
          const updatedUser = await base44.auth.me();
          
          // Clear pending registration
          localStorage.removeItem('pending_registration');
          
          // Redirect to appropriate dashboard
          const dashboard = getDashboardForRole(updatedUser.primary_role);
          window.location.replace(dashboard);
        } catch (error) {
          console.error('Failed to update user profile:', error);
          localStorage.removeItem('pending_registration');
        }
      } else {
        // User already has role, just clear pending data
        localStorage.removeItem('pending_registration');
      }
    } catch (error) {
      console.error('Post-login handler error:', error);
      // Clear stale data on error
      localStorage.removeItem('pending_registration');
    }
  };

  return null; // This component doesn't render anything
}