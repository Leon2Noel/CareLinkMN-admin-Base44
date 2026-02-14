import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileCheck,
  Building2,
  Calendar,
  Download,
  ChevronRight,
  XCircle,
  Ban
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

export default function Compliance() {
  const [activeTab, setActiveTab] = useState('expiring');

  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ['licenses-compliance'],
    queryFn: () => base44.entities.LicenseInstance.list('-expiration_date', 500)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['openings-compliance'],
    queryFn: () => base44.entities.Opening.list()
  });

  const orgMap = useMemo(() => organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [organizations]);

  // Calculate compliance issues
  const expiringLicenses = useMemo(() => {
    return licenses.filter(l => {
      if (!l.expiration_date || l.status !== 'verified') return false;
      const daysUntil = differenceInDays(new Date(l.expiration_date), new Date());
      return daysUntil >= 0 && daysUntil <= 60;
    }).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
  }, [licenses]);

  const expiredLicenses = useMemo(() => {
    return licenses.filter(l => {
      if (!l.expiration_date) return false;
      return new Date(l.expiration_date) < new Date();
    });
  }, [licenses]);

  const pendingVerifications = useMemo(() => {
    return licenses.filter(l => l.status === 'pending_verification');
  }, [licenses]);

  const nonCompliantOpenings = useMemo(() => {
    return openings.filter(o => !o.is_compliant && o.status === 'active');
  }, [openings]);

  const unverifiedHighTraffic = useMemo(() => {
    return openings.filter(o => {
      const org = orgMap[o.organization_id];
      return org?.verification_status !== 'verified' && (o.views_count || 0) > 10;
    });
  }, [openings, orgMap]);

  const stats = {
    totalIssues: expiringLicenses.length + expiredLicenses.length + pendingVerifications.length + nonCompliantOpenings.length,
    expiring: expiringLicenses.length,
    expired: expiredLicenses.length,
    pending: pendingVerifications.length,
    noncompliant: nonCompliantOpenings.length
  };

  const expiringColumns = [
    {
      key: 'provider',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{org?.legal_name || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      key: 'license_type_code',
      header: 'License Type',
      render: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-slate-500">#{row.license_number}</p>
        </div>
      )
    },
    {
      key: 'expiration_date',
      header: 'Expiration',
      render: (value) => {
        const daysUntil = differenceInDays(new Date(value), new Date());
        return (
          <div>
            <p className="font-medium">{format(new Date(value), 'MMM d, yyyy')}</p>
            <p className={`text-xs ${daysUntil <= 30 ? 'text-red-600' : 'text-amber-600'}`}>
              {daysUntil} days remaining
            </p>
          </div>
        );
      }
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (_, row) => {
        const daysUntil = differenceInDays(new Date(row.expiration_date), new Date());
        if (daysUntil <= 14) {
          return <Badge variant="destructive">Critical</Badge>;
        }
        if (daysUntil <= 30) {
          return <Badge className="bg-amber-100 text-amber-700">High</Badge>;
        }
        return <Badge variant="outline">Medium</Badge>;
      }
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl('Licenses') + `?id=${row.id}`}>
            Review <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      )
    }
  ];

  const pendingColumns = [
    {
      key: 'provider',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{org?.legal_name || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      key: 'license_type_code',
      header: 'License Type',
      render: (value, row) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-slate-500">#{row.license_number}</p>
        </div>
      )
    },
    {
      key: 'issuing_authority',
      header: 'Authority',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'created_date',
      header: 'Submitted',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl('Licenses') + `?status=pending_verification`}>
            Review <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Center"
        description="Monitor license expirations, verification status, and compliance issues"
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.totalIssues}</p>
              <p className="text-sm text-slate-300">Total Issues</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.expiring}</p>
              <p className="text-sm text-slate-500">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.expired}</p>
              <p className="text-sm text-slate-500">Expired</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-500">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Ban className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.noncompliant}</p>
              <p className="text-sm text-slate-500">Non-Compliant</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expiring" className="relative">
            Expiring Licenses
            {stats.expiring > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{stats.expiring}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired Licenses
            {stats.expired > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700">{stats.expired}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Verification
            {stats.pending > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="openings">
            Non-Compliant Openings
            {stats.noncompliant > 0 && (
              <Badge className="ml-2 bg-purple-100 text-purple-700">{stats.noncompliant}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="mt-6">
          {expiringLicenses.length > 0 ? (
            <DataTable
              columns={expiringColumns}
              data={expiringLicenses}
              isLoading={licensesLoading}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">All Clear!</h3>
              <p className="text-slate-500 mt-1">No licenses expiring in the next 60 days</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {expiredLicenses.length > 0 ? (
            <DataTable
              columns={expiringColumns}
              data={expiredLicenses}
              isLoading={licensesLoading}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No Expired Licenses</h3>
              <p className="text-slate-500 mt-1">All licenses are current</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingVerifications.length > 0 ? (
            <DataTable
              columns={pendingColumns}
              data={pendingVerifications}
              isLoading={licensesLoading}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">All Caught Up!</h3>
              <p className="text-slate-500 mt-1">No licenses pending verification</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="openings" className="mt-6">
          {nonCompliantOpenings.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'title',
                  header: 'Opening',
                  render: (value) => <span className="font-medium">{value}</span>
                },
                {
                  key: 'provider',
                  header: 'Provider',
                  render: (_, row) => orgMap[row.organization_id]?.legal_name || 'Unknown'
                },
                {
                  key: 'validation_errors',
                  header: 'Issues',
                  render: (value) => (
                    <div className="flex flex-wrap gap-1">
                      {(value || ['Unknown issue']).map((err, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">{err}</Badge>
                      ))}
                    </div>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  render: (_, row) => (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={createPageUrl('Openings') + `?id=${row.id}`}>
                        Review <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )
                }
              ]}
              data={nonCompliantOpenings}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">All Compliant!</h3>
              <p className="text-slate-500 mt-1">No non-compliant openings found</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}