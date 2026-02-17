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
    'provider': '/provider-overview',
    'cm': '/cm-overview',
    'case_manager': '/cm-overview',
    'family': '/family-overview',
    'guardian': '/family-overview',
    'hospital': '/hospital-overview',
    'admin': '/overview'
  };
  
  return roleMap[role?.toLowerCase()] || '/';
}

/**
 * Sanitizes return URL to prevent redirect loops and security issues
 * @param {string} url - The URL to sanitize
 * @returns {string} - Safe, validated return URL
 */
export function sanitizeReturnUrl(url) {
  if (!url || typeof url !== 'string') return '/';
  
  // Length check - prevent excessively long URLs (sign of redirect loop)
  if (url.length > 1000) {
    console.warn('Return URL too long, resetting to /');
    return '/';
  }
  
  // Decode once
  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch (e) {
    return '/';
  }
  
  // Must be a relative path starting with /
  if (!decoded.startsWith('/')) return '/';
  
  // Prevent redirect to login page (would cause loop)
  if (decoded.startsWith('/login')) {
    console.warn('Preventing redirect loop to /login');
    return '/';
  }
  
  // Extract pathname and clean query params
  try {
    // Use URL constructor to parse (need a base for relative URLs)
    const urlObj = new URL(decoded, 'http://dummy.com');
    let pathname = urlObj.pathname;
    
    // Remove any query params that could cause recursion
    const params = new URLSearchParams(urlObj.search);
    params.delete('from_url');
    params.delete('returnTo');
    params.delete('next');
    params.delete('redirect');
    
    // Rebuild clean URL
    const cleanParams = params.toString();
    const cleanUrl = cleanParams ? `${pathname}?${cleanParams}` : pathname;
    
    // Final safety check
    if (!cleanUrl.startsWith('/') || cleanUrl.length > 500) return '/';
    
    return cleanUrl;
  } catch (e) {
    console.error('Error sanitizing return URL:', e);
    return '/';
  }
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
      key.includes('sb-') ||
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
  
  // Clear pending registration
  try {
    localStorage.removeItem('pending_registration');
  } catch (e) {}
  
  // Also clear session storage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error('Failed to clear session storage:', e);
  }
}