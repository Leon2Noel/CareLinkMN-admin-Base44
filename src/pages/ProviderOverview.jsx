import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import ProviderShell from '@/components/layouts/ProviderShell';
import { useAuth } from '@/components/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import { 
  FileCheck, 
  DoorOpen, 
  AlertTriangle, 
  GitMerge,
  Plus,
  Upload,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function ProviderOverviewContent() {
  const { user } = useAuth();

  // Fetch provider data
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', user?.email],
    queryFn: async () => {
      const orgs = await base44.entities.Organization.list();
      return orgs.filter(org => org.primary_contact_email === user?.email);
    },
    enabled: !!user,
  });

  const myOrg = organizations[0];

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses', myOrg?.id],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg,
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['openings', myOrg?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', myOrg?.id],
    queryFn: () => base44.entities.Referral.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg,
  });

  // Calculate metrics
  const verifiedLicenses = licenses.filter(l => l.status === 'verified').length;
  const activeOpenings = openings.filter(o => o.status === 'active').length;
  const expiringOpenings = openings.filter(o => {
    if (!o.last_confirmed_at) return true;
    const hoursSince = (Date.now() - new Date(o.last_confirmed_at).getTime()) / (1000 * 60 * 60);
    return hoursSince > 156; // 6.5 days
  }).length;
  const newReferrals = referrals.filter(r => r.status === 'new' || r.status === 'under_review').length;

  return (
    <ProviderShell currentPageName="ProviderOverview">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!</h1>
          <p className="text-slate-600 mt-1">Here's what's happening with your openings and referrals</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Verified Licenses"
            value={verifiedLicenses}
            label={`of ${licenses.length} total`}
            icon={FileCheck}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Active Openings"
            value={activeOpenings}
            label={`${expiringOpenings} expiring soon`}
            icon={DoorOpen}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="New Referrals"
            value={newReferrals}
            label="awaiting response"
            icon={GitMerge}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Profile Views"
            value="--"
            label="last 7 days"
            icon={Eye}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
          />
        </div>

        {/* Readiness & Compliance */}
        {(!myOrg || licenses.length === 0 || openings.length === 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5" />
                Complete Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!myOrg && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">1</span>
                    </div>
                    <span className="text-slate-700">Complete organization registration</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={createPageUrl('ProviderOnboarding')}>Start</Link>
                  </Button>
                </div>
              )}
              {myOrg && licenses.length === 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">2</span>
                    </div>
                    <span className="text-slate-700">Upload your first license</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={createPageUrl('ProviderLicenses')}>Upload</Link>
                  </Button>
                </div>
              )}
              {myOrg && licenses.length > 0 && openings.length === 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600">3</span>
                    </div>
                    <span className="text-slate-700">Create your first opening</span>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={createPageUrl('Openings')}>Create</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-auto py-4 flex-col gap-2" variant="outline" asChild>
                <Link to={createPageUrl('Openings')}>
                  <Plus className="w-6 h-6" />
                  <span>Create Opening</span>
                </Link>
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline" asChild>
                <Link to={createPageUrl('ProviderLicenses')}>
                  <Upload className="w-6 h-6" />
                  <span>Upload License</span>
                </Link>
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline" asChild>
                <Link to={createPageUrl('ReferralTracking')}>
                  <GitMerge className="w-6 h-6" />
                  <span>View Referrals</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Openings Needing Attention */}
        {expiringOpenings > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Openings Needing Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                {expiringOpenings} opening(s) need to be confirmed to stay active
              </p>
              <Button asChild>
                <Link to={createPageUrl('Openings')}>Confirm Openings</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* New Referrals */}
        {newReferrals > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-purple-600" />
                New Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                You have {newReferrals} new referral(s) awaiting your response
              </p>
              <Button asChild>
                <Link to={createPageUrl('ReferralTracking')}>Review Referrals</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProviderShell>
  );
}

export default function ProviderOverview() {
  return (
    <RoleGuard allowedRoles={['provider']}>
      <ProviderOverviewContent />
    </RoleGuard>
  );
}