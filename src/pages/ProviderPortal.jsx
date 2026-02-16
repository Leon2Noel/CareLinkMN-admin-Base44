import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import DashboardMetrics from '@/components/provider/DashboardMetrics';
import OpeningQuickActions from '@/components/provider/OpeningQuickActions';
import UpcomingTasks from '@/components/provider/UpcomingTasks';
import {
  Building2,
  FileCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Edit,
  TrendingUp
} from 'lucide-react';

export default function ProviderPortal() {
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org_id');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['provider-org', orgId],
    queryFn: () => base44.entities.Organization.filter({ id: orgId }).then(r => r[0]),
    enabled: !!orgId
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['provider-licenses', orgId],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['provider-programs', orgId],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['provider-sites', orgId],
    queryFn: () => base44.entities.Site.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['provider-openings', orgId],
    queryFn: () => base44.entities.Opening.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['provider-referrals', orgId],
    queryFn: () => base44.entities.Referral.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  const { data: subscription } = useQuery({
    queryKey: ['provider-subscription', orgId],
    queryFn: () => base44.entities.Subscription.filter({ organization_id: orgId }).then(r => r[0]),
    enabled: !!orgId
  });

  const { data: messageQuota } = useQuery({
    queryKey: ['provider-message-quota', orgId],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const quotas = await base44.entities.ProviderMessageQuota.filter({
        provider_org_id: orgId,
        month: currentMonth
      });
      return quotas[0];
    },
    enabled: !!orgId
  });

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Organization Not Found</h2>
            <p className="text-slate-600 mb-6">We couldn't find your provider account.</p>
            <Button asChild>
              <Link to={createPageUrl('ProviderRegister')}>
                Create Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeLicenses = licenses.filter(l => ['active', 'verified'].includes(l.status));
  const activePrograms = programs.filter(p => p.status === 'active');
  const activeSites = sites.filter(s => s.status === 'active');
  const activeOpenings = openings.filter(o => o.status === 'active');
  
  // Calculate metrics
  const pendingReferrals = referrals.filter(r => r.status === 'new' || r.status === 'under_review');
  const acceptedReferrals = referrals.filter(r => r.status === 'accepted' || r.status === 'placed');
  const acceptanceRate = referrals.length > 0 
    ? Math.round((acceptedReferrals.length / referrals.length) * 100)
    : 0;
  
  const isPremium = subscription?.plan === 'professional' || subscription?.plan === 'enterprise';
  const messagesLimit = isPremium ? 10 : 0;
  const messagesUsed = messageQuota?.initiated_count || 0;

  const metrics = {
    activeOpenings: activeOpenings.length,
    pendingReferrals: pendingReferrals.length,
    acceptanceRate,
    messagesUsed,
    messagesLimit,
    openingsTrend: 5, // Could calculate from historical data
    acceptanceRateTrend: 3
  };

  // Generate upcoming tasks
  const tasks = [];
  
  pendingReferrals.slice(0, 3).forEach(ref => {
    tasks.push({
      type: 'referral',
      priority: ref.urgency === 'crisis' ? 'urgent' : ref.urgency === 'urgent' ? 'high' : 'normal',
      title: `Review Referral for ${ref.client_county}`,
      description: `New ${ref.urgency} referral awaiting your response`,
      due_date: ref.desired_start_date,
      link: createPageUrl('ReferralTracking')
    });
  });

  licenses.filter(l => {
    const expiryDate = new Date(l.expiration_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 60 && daysUntilExpiry > 0;
  }).forEach(license => {
    tasks.push({
      type: 'license',
      priority: 'high',
      title: 'License Renewal Due Soon',
      description: `License ${license.license_number} expires soon`,
      due_date: license.expiration_date,
      link: createPageUrl('ProviderLicenses')
    });
  });

  if (activeOpenings.length === 0 && activeSites.length > 0) {
    tasks.push({
      type: 'opening',
      priority: 'normal',
      title: 'Create Your First Opening',
      description: 'Start receiving referrals by posting an opening',
      link: createPageUrl('Openings')
    });
  }

  // Calculate readiness score
  const readinessChecks = {
    identity: organization.legal_name && organization.email,
    license: activeLicenses.length > 0,
    program: activePrograms.length > 0,
    site: activeSites.length > 0,
    opening: activeOpenings.length > 0
  };

  const completedChecks = Object.values(readinessChecks).filter(Boolean).length;
  const readinessScore = Math.round((completedChecks / 5) * 100);

  const checklistItems = [
    {
      id: 'identity',
      label: 'Organization Information',
      completed: readinessChecks.identity,
      action: 'Edit Profile',
      link: createPageUrl('ProviderRegister')
    },
    {
      id: 'license',
      label: 'Upload License',
      completed: readinessChecks.license,
      action: 'Add License',
      link: '#'
    },
    {
      id: 'program',
      label: 'Select Programs',
      completed: readinessChecks.program,
      action: 'Add Program',
      link: '#'
    },
    {
      id: 'site',
      label: 'Add Service Site',
      completed: readinessChecks.site,
      action: 'Add Site',
      link: '#'
    },
    {
      id: 'opening',
      label: 'Publish Opening',
      completed: readinessChecks.opening,
      action: 'Create Opening',
      link: '#'
    }
  ];

  const alerts = [];
  
  if (organization.status === 'pending_review') {
    alerts.push({
      type: 'warning',
      title: 'Account Under Review',
      message: 'Your organization is being reviewed. You\'ll be notified once approved.'
    });
  }

  if (activeLicenses.length === 0) {
    alerts.push({
      type: 'error',
      title: 'No Active License',
      message: 'You need to upload and verify at least one license before creating openings.'
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{organization.legal_name}</h1>
              <p className="text-sm text-slate-500">Provider Portal</p>
            </div>
          </div>
          <StatusBadge status={organization.status} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3 mb-6">
            {alerts.map((alert, idx) => (
              <Card key={idx} className={
                alert.type === 'error' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }>
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                    alert.type === 'error' ? 'text-red-600' :
                    alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      alert.type === 'error' ? 'text-red-900' :
                      alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                    }`}>{alert.title}</p>
                    <p className={`text-sm ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
                    }`}>{alert.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dashboard Metrics */}
        <div className="mb-6">
          <DashboardMetrics metrics={metrics} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Readiness Score */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Readiness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 mb-4">
                    <span className={`text-4xl font-bold ${
                      readinessScore >= 80 ? 'text-emerald-600' :
                      readinessScore >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {readinessScore}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{completedChecks} of 5 steps complete</p>
                </div>

                <div className="space-y-3">
                  {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                        <span className={`text-sm ${item.completed ? 'text-slate-900' : 'text-slate-600'}`}>
                          {item.label}
                        </span>
                      </div>
                      {!item.completed && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={item.link}>
                            {item.action}
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opening Management & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <OpeningQuickActions openings={openings} />
            
            <UpcomingTasks tasks={tasks} />

            {/* Next Steps */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Next Steps</h3>
                {!readinessChecks.license ? (
                  <div>
                    <p className="text-sm text-slate-700 mb-4">Upload your license to unlock program selection and opening creation.</p>
                    <Button disabled>
                      Upload License
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : !readinessChecks.program ? (
                  <div>
                    <p className="text-sm text-slate-700 mb-4">Select the programs you offer based on your license.</p>
                    <Button disabled>
                      Add Programs
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : !readinessChecks.site ? (
                  <div>
                    <p className="text-sm text-slate-700 mb-4">Add your service sites to start creating openings.</p>
                    <Button disabled>
                      Add Site
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-700 mb-4">You're all set! Create your first opening to start receiving referrals.</p>
                    <Button disabled>
                      Create Opening
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}