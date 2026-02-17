
function handleLogout() {
    // Clear user state and auth storage
    clearUserState();
    clearAuthStorage();
    
    // Call logout with a sanitized return URL
    const returnUrl = sanitizeReturnUrl('/');
    base44.auth.logout(returnUrl);
}