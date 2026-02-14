import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  FileCheck, 
  DoorOpen, 
  GitMerge,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function Overview() {
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date', 100)
  });

  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.LicenseInstance.list('-created_date', 100)
  });

  const { data: openings = [], isLoading: openingsLoading } = useQuery({
    queryKey: ['openings'],
    queryFn: () => base44.entities.Opening.list('-created_date', 100)
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 50)
  });

  // Calculate stats
  const activeProviders = organizations.filter(o => o.status === 'active').length;
  const pendingVerifications = licenses.filter(l => l.status === 'pending_verification').length;
  const activeOpenings = openings.filter(o => o.status === 'active').length;
  const newReferrals = referrals.filter(r => r.status === 'new').length;

  // Expiring licenses (within 30 days)
  const expiringLicenses = licenses.filter(l => {
    if (!l.expiration_date) return false;
    const daysUntil = differenceInDays(new Date(l.expiration_date), new Date());
    return daysUntil >= 0 && daysUntil <= 30 && l.status === 'verified';
  });

  // Recent activity items
  const recentProviders = organizations.slice(0, 5);

  const alertColumns = [
    {
      key: 'type',
      header: 'Alert',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${row.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'}`}>
            {row.severity === 'high' ? (
              <ShieldAlert className="w-4 h-4 text-red-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.title}</p>
            <p className="text-sm text-slate-500">{row.description}</p>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      header: '',
      className: 'w-24',
      render: (_, row) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={row.link}>
            Review <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      )
    }
  ];

  const alerts = [
    ...(pendingVerifications > 0 ? [{
      id: 'pending-verifications',
      severity: 'high',
      title: `${pendingVerifications} licenses pending verification`,
      description: 'These licenses need review before providers can operate',
      link: createPageUrl('Licenses') + '?status=pending_verification'
    }] : []),
    ...expiringLicenses.map(l => ({
      id: `expiring-${l.id}`,
      severity: 'medium',
      title: `License expiring: ${l.license_number}`,
      description: `Expires on ${format(new Date(l.expiration_date), 'MMM d, yyyy')}`,
      link: createPageUrl('Licenses') + `?id=${l.id}`
    })),
    ...(newReferrals > 0 ? [{
      id: 'new-referrals',
      severity: 'medium',
      title: `${newReferrals} new referrals awaiting review`,
      description: 'Match these referrals to appropriate openings',
      link: createPageUrl('Matching')
    }] : [])
  ].slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Overview"
        description="Monitor platform health and compliance across all providers"
        actions={
          <Button asChild>
            <Link to={createPageUrl('Providers') + '?action=add'}>
              <Building2 className="w-4 h-4 mr-2" />
              Add Provider
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Providers"
          value={activeProviders}
          change={12}
          changeLabel="vs last month"
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Pending Verifications"
          value={pendingVerifications}
          icon={FileCheck}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Active Openings"
          value={activeOpenings}
          change={8}
          changeLabel="vs last month"
          icon={DoorOpen}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="New Referrals"
          value={newReferrals}
          icon={GitMerge}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Compliance Alerts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to={createPageUrl('Compliance')}>
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {alerts.length > 0 ? (
                <DataTable
                  columns={alertColumns}
                  data={alerts}
                  className="border-0"
                />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>No compliance alerts at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={createPageUrl('Licenses') + '?status=pending_verification'}>
                <FileCheck className="w-4 h-4 mr-3 text-amber-600" />
                Review Pending Licenses
                {pendingVerifications > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                    {pendingVerifications}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={createPageUrl('Matching')}>
                <GitMerge className="w-4 h-4 mr-3 text-purple-600" />
                Process Referrals
                {newReferrals > 0 && (
                  <span className="ml-auto bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                    {newReferrals}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={createPageUrl('Openings') + '?status=pending_approval'}>
                <DoorOpen className="w-4 h-4 mr-3 text-blue-600" />
                Approve Openings
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to={createPageUrl('Providers')}>
                <Building2 className="w-4 h-4 mr-3 text-slate-600" />
                Browse Providers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Providers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Recent Providers</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={createPageUrl('Providers')}>
              View All <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable
            columns={[
              {
                key: 'legal_name',
                header: 'Provider',
                render: (value, row) => (
                  <div>
                    <p className="font-medium text-slate-900">{value}</p>
                    <p className="text-sm text-slate-500">{row.city}, {row.state}</p>
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (value) => <StatusBadge status={value} />
              },
              {
                key: 'verification_status',
                header: 'Verification',
                render: (value) => <StatusBadge status={value} />
              },
              {
                key: 'completeness_score',
                header: 'Completeness',
                render: (value) => (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          value >= 80 ? 'bg-emerald-500' : 
                          value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{value || 0}%</span>
                  </div>
                )
              },
              {
                key: 'created_date',
                header: 'Added',
                render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
              }
            ]}
            data={recentProviders}
            isLoading={orgsLoading}
            onRowClick={(row) => window.location.href = createPageUrl('Providers') + `?id=${row.id}`}
            emptyMessage="No providers added yet"
            className="border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}