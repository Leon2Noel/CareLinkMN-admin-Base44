import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { clearAuthStorage } from '@/lib/auth-utils';

/**
 * Auth Debug Panel - only shows in development
 * Helps debug authentication issues
 */
export default function AuthDebugPanel() {
  const [authState, setAuthState] = useState({
    isAuth: null,
    user: null,
    error: null,
    loading: true
  });

  const loadAuthState = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const isAuth = await base44.auth.isAuthenticated();
      let user = null;
      if (isAuth) {
        user = await base44.auth.me();
      }
      setAuthState({ isAuth, user, error: null, loading: false });
    } catch (error) {
      setAuthState({ isAuth: false, user: null, error: error.message, loading: false });
    }
  };

  useEffect(() => {
    loadAuthState();
  }, []);

  const handleForceLogout = () => {
    clearAuthStorage();
    window.location.href = '/login';
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-amber-300 z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Auth Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Status:</span>
            <Badge variant={authState.isAuth ? 'default' : 'secondary'}>
              {authState.loading ? 'Loading...' : authState.isAuth ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>

          {authState.user && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Email:</span>
                <span className="font-mono text-xs">{authState.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Role:</span>
                <Badge variant="outline">{authState.user.primary_role || authState.user.role || 'none'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">User ID:</span>
                <span className="font-mono text-xs truncate max-w-[150px]">
                  {authState.user.id}
                </span>
              </div>
            </>
          )}

          {authState.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Error: {authState.error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Current Path:</span>
            <span className="font-mono text-xs truncate max-w-[150px]">
              {window.location.pathname}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAuthState}
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleForceLogout}
            className="flex-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Force Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}