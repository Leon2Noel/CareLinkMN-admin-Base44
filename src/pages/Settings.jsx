import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Key,
  Save
} from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform configuration and preferences"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>General platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input id="platform-name" defaultValue="CareLinkMN" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@carelinkmn.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Input id="timezone" defaultValue="America/Chicago" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Compliance Settings
                </CardTitle>
                <CardDescription>License and compliance thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">License Expiration Warning</p>
                    <p className="text-sm text-slate-500">Days before expiration to trigger alerts</p>
                  </div>
                  <Input className="w-20" type="number" defaultValue="60" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-suspend Expired Licenses</p>
                    <p className="text-sm text-slate-500">Automatically suspend providers with expired licenses</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require License Verification</p>
                    <p className="text-sm text-slate-500">Block openings until licenses are verified</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure email and system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">License Expiration Alerts</p>
                  <p className="text-sm text-slate-500">Email when licenses are expiring</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Referral Notifications</p>
                  <p className="text-sm text-slate-500">Email when new referrals are received</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Verification Request Alerts</p>
                  <p className="text-sm text-slate-500">Email when licenses need verification</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Summary Reports</p>
                  <p className="text-sm text-slate-500">Weekly digest of platform activity</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Access control and security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Require 2FA for admin accounts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-slate-500">Minutes of inactivity before logout</p>
                </div>
                <Input className="w-20" type="number" defaultValue="30" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">IP Whitelisting</p>
                  <p className="text-sm text-slate-500">Restrict admin access to specific IPs</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit Log Retention</p>
                  <p className="text-sm text-slate-500">Days to retain audit logs</p>
                </div>
                <Input className="w-20" type="number" defaultValue="365" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>SMTP settings for outbound emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>SMTP Host</Label>
                    <Input placeholder="smtp.example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>SMTP Port</Label>
                    <Input placeholder="587" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Username</Label>
                    <Input placeholder="user@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage API access credentials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Production API Key</p>
                      <p className="text-sm text-slate-500 font-mono">clmn_live_••••••••••••</p>
                    </div>
                    <Button variant="outline" size="sm">Regenerate</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Test API Key</p>
                      <p className="text-sm text-slate-500 font-mono">clmn_test_••••••••••••</p>
                    </div>
                    <Button variant="outline" size="sm">Regenerate</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}