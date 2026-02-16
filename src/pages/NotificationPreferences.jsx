import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Smartphone, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      if (!user) return null;
      const prefs = await base44.entities.NotificationPreference.filter({ user_id: user.id });
      if (prefs.length > 0) return prefs[0];
      
      // Create default preferences
      return await base44.entities.NotificationPreference.create({
        user_id: user.id,
        channel_in_app: true,
        channel_email: true,
        channel_sms: false,
        referral_updates_enabled: true,
        opening_match_enabled: true,
        messages_enabled: true,
        opening_match_frequency: 'realtime',
        quiet_hours_enabled: false,
        timezone: 'America/Chicago'
      });
    },
    enabled: !!user
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationPreference.update(preferences.id, data),
    onSuccess: () => {
      toast.success('Preferences saved');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    }
  });

  const updateField = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading || !preferences) {
    return <div className="p-6">Loading preferences...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Notification Preferences"
        description="Control how and when you receive notifications"
      />

      <div className="space-y-6">
        {/* Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>Choose how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <Label>In-App Notifications</Label>
                  <p className="text-xs text-slate-500">Show notifications in the bell icon</p>
                </div>
              </div>
              <Switch
                checked={preferences.channel_in_app}
                onCheckedChange={(v) => updateField('channel_in_app', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-slate-500">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                checked={preferences.channel_email}
                onCheckedChange={(v) => updateField('channel_email', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-slate-400">SMS Notifications</Label>
                  <p className="text-xs text-slate-400">Coming soon</p>
                </div>
              </div>
              <Switch disabled checked={false} />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Categories</CardTitle>
            <CardDescription>Enable or disable specific types of notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Referral Updates</Label>
                <p className="text-xs text-slate-500">Status changes on your referrals</p>
              </div>
              <Switch
                checked={preferences.referral_updates_enabled}
                onCheckedChange={(v) => updateField('referral_updates_enabled', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Opening Matches</Label>
                <p className="text-xs text-slate-500">New openings matching your saved searches</p>
              </div>
              <Switch
                checked={preferences.opening_match_enabled}
                onCheckedChange={(v) => updateField('opening_match_enabled', v)}
              />
            </div>

            {preferences.opening_match_enabled && (
              <div className="ml-8 space-y-2">
                <Label>Match Notification Frequency</Label>
                <Select
                  value={preferences.opening_match_frequency}
                  onValueChange={(v) => updateField('opening_match_frequency', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time (immediate)</SelectItem>
                    <SelectItem value="daily_digest">Daily Digest</SelectItem>
                    <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Messages</Label>
                <p className="text-xs text-slate-500">New messages from providers</p>
              </div>
              <Switch
                checked={preferences.messages_enabled}
                onCheckedChange={(v) => updateField('messages_enabled', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Suppress non-urgent notifications during specific hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Quiet Hours</Label>
              <Switch
                checked={preferences.quiet_hours_enabled}
                onCheckedChange={(v) => updateField('quiet_hours_enabled', v)}
              />
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_start || '22:00'}
                    onChange={(e) => updateField('quiet_hours_start', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={preferences.quiet_hours_end || '08:00'}
                    onChange={(e) => updateField('quiet_hours_end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}