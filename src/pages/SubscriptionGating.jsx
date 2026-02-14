import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  FileCheck,
  Layers,
  MapPin,
  DoorOpen,
  Wallet,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

const GATING_REQUIREMENTS = [
  { code: 'HAS_VERIFIED_LICENSE', label: 'Has Verified License', icon: FileCheck, description: 'At least 1 license in Active/Verified status' },
  { code: 'HAS_ACTIVE_PROGRAM', label: 'Has Active Program', icon: Layers, description: 'At least 1 program model activated' },
  { code: 'HAS_ACTIVE_SITE', label: 'Has Active Site', icon: MapPin, description: 'At least 1 active site (for residential programs)' },
  { code: 'HAS_ACTIVE_OPENING', label: 'Has Active Opening', icon: DoorOpen, description: 'At least 1 opening in Active status' },
  { code: 'HAS_FUNDING_SELECTION', label: 'Has Funding Selection', icon: Wallet, description: 'Funding sources selected per opening' },
  { code: 'HAS_CAPABILITY_PROFILE', label: 'Has Capability Profile', icon: Sparkles, description: 'Capabilities defined for each opening' },
  { code: 'LICENSE_PROGRAM_VALID', label: 'License-Program Valid', icon: CheckCircle2, description: 'No license-program mismatches' },
];

export default function SubscriptionGating() {
  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date', 200)
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses-gating'],
    queryFn: () => base44.entities.LicenseInstance.list()
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs-gating'],
    queryFn: () => base44.entities.ProgramActivation.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites-gating'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['openings-gating'],
    queryFn: () => base44.entities.Opening.list()
  });

  // Calculate gating status for each provider
  const providerGating = useMemo(() => {
    return organizations.map(org => {
      const orgLicenses = licenses.filter(l => l.organization_id === org.id);
      const orgPrograms = programs.filter(p => p.organization_id === org.id);
      const orgSites = sites.filter(s => s.organization_id === org.id);
      const orgOpenings = openings.filter(o => o.organization_id === org.id);

      const requirements = {
        HAS_VERIFIED_LICENSE: orgLicenses.some(l => l.status === 'verified'),
        HAS_ACTIVE_PROGRAM: orgPrograms.some(p => p.status === 'active'),
        HAS_ACTIVE_SITE: orgSites.some(s => s.status === 'active'),
        HAS_ACTIVE_OPENING: orgOpenings.some(o => o.status === 'active'),
        HAS_FUNDING_SELECTION: orgOpenings.every(o => o.funding_accepted?.length > 0) && orgOpenings.length > 0,
        HAS_CAPABILITY_PROFILE: true, // Simplified for now
        LICENSE_PROGRAM_VALID: orgOpenings.every(o => o.is_compliant !== false),
      };

      const metCount = Object.values(requirements).filter(Boolean).length;
      const totalCount = Object.keys(requirements).length;
      const isSearchable = metCount === totalCount;

      return {
        ...org,
        requirements,
        metCount,
        totalCount,
        isSearchable,
        completionPercent: Math.round((metCount / totalCount) * 100)
      };
    });
  }, [organizations, licenses, programs, sites, openings]);

  const stats = useMemo(() => ({
    searchable: providerGating.filter(p => p.isSearchable).length,
    notSearchable: providerGating.filter(p => !p.isSearchable).length,
    total: providerGating.length
  }), [providerGating]);

  const columns = [
    {
      key: 'legal_name',
      header: 'Provider',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{value?.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{row.city}, {row.state}</p>
          </div>
        </div>
      )
    },
    {
      key: 'isSearchable',
      header: 'Searchable',
      render: (value) => value ? (
        <Badge className="bg-emerald-100 text-emerald-700">
          <Eye className="w-3 h-3 mr-1" />
          Visible
        </Badge>
      ) : (
        <Badge variant="outline" className="text-slate-500">
          <EyeOff className="w-3 h-3 mr-1" />
          Hidden
        </Badge>
      )
    },
    {
      key: 'completionPercent',
      header: 'Readiness',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Progress value={value} className="w-20 h-2" />
          <span className={`text-sm font-medium ${
            value === 100 ? 'text-emerald-600' : value >= 70 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {row.metCount}/{row.totalCount}
          </span>
        </div>
      )
    },
    {
      key: 'requirements',
      header: 'Requirements',
      render: (value) => (
        <div className="flex gap-1">
          {GATING_REQUIREMENTS.map(req => {
            const isMet = value[req.code];
            return (
              <div
                key={req.code}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  isMet ? 'bg-emerald-100' : 'bg-red-100'
                }`}
                title={`${req.label}: ${isMet ? 'Met' : 'Not Met'}`}
              >
                {isMet ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-600" />
                )}
              </div>
            );
          })}
        </div>
      )
    },
    {
      key: 'subscription_tier',
      header: 'Plan',
      render: (value) => (
        <Badge variant="outline" className="capitalize">{value || 'none'}</Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Gating"
        description="Minimum requirements for providers to be visible in search results"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Eye className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-800">{stats.searchable}</p>
              <p className="text-sm text-emerald-600">Searchable Providers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <EyeOff className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.notSearchable}</p>
              <p className="text-sm text-slate-500">Hidden (Incomplete)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Providers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Requirements Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gating Requirements</CardTitle>
          <CardDescription>
            Providers must meet ALL requirements to be visible in case manager search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GATING_REQUIREMENTS.map(req => {
              const Icon = req.icon;
              return (
                <div key={req.code} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-sm">{req.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{req.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Provider Gating Table */}
      <DataTable
        columns={columns}
        data={providerGating}
        isLoading={orgsLoading}
        emptyMessage="No providers found"
      />
    </div>
  );
}