import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Building2,
  FileCheck,
  Layers,
  MapPin,
  DoorOpen,
  GitMerge,
  ArrowRight,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

export default function ProviderOverview() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => base44.entities.Organization.filter({ created_by: user?.email }),
    enabled: !!user?.email
  });

  const org = organizations[0];

  const { data: licenses = [] } = useQuery({
    queryKey: ['my-licenses', org?.id],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['my-programs', org?.id],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['my-sites', org?.id],
    queryFn: () => base44.entities.Site.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['my-openings', org?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['my-referrals', org?.id],
    queryFn: () => base44.entities.Referral.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  // Calculate readiness score
  const readiness = useMemo(() => {
    const checks = {
      identity: !!org && !!org.legal_name && !!org.email && !!org.counties_served?.length,
      license: licenses.some(l => l.status === 'verified' || l.status === 'active'),
      program: programs.some(p => p.status === 'active'),
      site: sites.some(s => s.status === 'active'),
      opening: openings.some(o => o.status === 'active')
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const score = Math.round((completed / total) * 100);

    return { checks, score };
  }, [org, licenses, programs, sites, openings]);

  // Alerts
  const alerts = useMemo(() => {
    const items = [];
    
    // Expiring licenses
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    licenses.forEach(l => {
      if (l.expiration_date && new Date(l.expiration_date) <= thirtyDaysFromNow) {
        items.push({
          type: 'warning',
          message: `License ${l.license_number} expires ${l.expiration_date}`,
          link: createPageUrl('ProviderLicenses')
        });
      }
    });

    // No active license
    if (!licenses.some(l => ['verified', 'active'].includes(l.status))) {
      items.push({
        type: 'error',
        message: 'You cannot publish openings without a verified license',
        link: createPageUrl('ProviderLicenses')
      });
    }

    return items;
  }, [licenses]);

  // Stats
  const stats = useMemo(() => ({
    openings: {
      active: openings.filter(o => o.status === 'active').length,
      pending: openings.filter(o => o.status === 'pending_approval').length,
      draft: openings.filter(o => o.status === 'draft').length
    },
    referrals: {
      new: referrals.filter(r => r.status === 'new').length,
      awaiting: referrals.filter(r => r.status === 'under_review').length,
      closed: referrals.filter(r => ['placed', 'declined', 'withdrawn'].includes(r.status)).length
    }
  }), [openings, referrals]);

  const checklistItems = [
    { key: 'identity', label: 'Complete organization identity', icon: Building2, page: 'ProviderIdentity' },
    { key: 'license', label: 'Upload and verify license', icon: FileCheck, page: 'ProviderLicenses' },
    { key: 'program', label: 'Activate a program', icon: Layers, page: 'ProviderPrograms' },
    { key: 'site', label: 'Add a site location', icon: MapPin, page: 'ProviderSites' },
    { key: 'opening', label: 'Publish an opening', icon: DoorOpen, page: 'ProviderOpenings' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Provider Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back{org?.legal_name ? `, ${org.legal_name}` : ''}
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <Card 
              key={idx} 
              className={`p-4 ${alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${alert.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-medium ${alert.type === 'error' ? 'text-red-800' : 'text-amber-800'}`}>
                    {alert.message}
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={alert.link}>
                    Fix Now <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Score */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Readiness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={readiness.score >= 80 ? '#10b981' : readiness.score >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${readiness.score * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{readiness.score}%</span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {checklistItems.map((item) => {
                const isComplete = readiness.checks[item.key];
                return (
                  <Link
                    key={item.key}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isComplete ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                    <span className={`text-sm ${isComplete ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Openings Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Openings</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={createPageUrl('ProviderOpenings')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {openings.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-700">{stats.openings.active}</p>
                    <p className="text-sm text-emerald-600">Active</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">{stats.openings.pending}</p>
                    <p className="text-sm text-amber-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-700">{stats.openings.draft}</p>
                    <p className="text-sm text-slate-600">Draft</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No openings yet</p>
                  <p className="text-sm text-slate-500 mt-1">Create your first opening to start receiving referrals</p>
                  <Button className="mt-4" asChild>
                    <Link to={createPageUrl('ProviderOpenings')}>
                      Create Opening
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referrals Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Referrals</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={createPageUrl('Matching')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {referrals.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{stats.referrals.new}</p>
                    <p className="text-sm text-blue-600">New</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{stats.referrals.awaiting}</p>
                    <p className="text-sm text-purple-600">Awaiting Response</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-700">{stats.referrals.closed}</p>
                    <p className="text-sm text-slate-600">Closed</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitMerge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No referrals yet</p>
                  <p className="text-sm text-slate-500 mt-1">Referrals will appear here once your openings are active</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}