/**
 * Auth Utilities for CareLinkMN
 * 
 * Handles:
 * - Sanitizing return URLs to prevent redirect loops
 * - Role-based dashboard routing
 * - Session management
 */

/**
 * Get the correct dashboard URL for a user's role
 * @param {string} role - User's primary role
 * @returns {string} - Dashboard path
 */
export function getDashboardForRole(role) {
  const roleMap = {
    'provider': '/provider/overview',
    'cm': '/cm/search',
    'case_manager': '/cm/search',
    'family': '/family/overview',
    'guardian': '/family/overview',
    'hospital': '/hospital/overview',
    'admin': '/overview'
  };
  
  return roleMap[role?.toLowerCase()] || '/';
}

/**
 * Clear all auth-related local storage and session storage
 */
export function clearAuthStorage() {
  // Clear any cached auth data
  const keysToRemove = [];
  
  // Find all storage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('supabase') ||
      key.includes('auth') ||
      key.includes('session') ||
      key.includes('token')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove them
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove storage key:', key, e);
    }
  });
  
  // Also clear session storage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error('Failed to clear session storage:', e);
  }
}