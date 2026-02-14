import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ComplianceScore from '@/components/ui/ComplianceScore';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  FileCheck, 
  Layers, 
  MapPin, 
  DoorOpen, 
  Wallet,
  Sparkles,
  ScrollText,
  Users,
  Download,
  Mail,
  Phone,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ProviderDetail() {
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('identity');

  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      const providers = await base44.entities.Organization.filter({ id: providerId });
      return providers[0];
    },
    enabled: !!providerId
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['provider-licenses', providerId],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: providerId }),
    enabled: !!providerId
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['provider-programs', providerId],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: providerId }),
    enabled: !!providerId
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['provider-sites', providerId],
    queryFn: () => base44.entities.Site.filter({ organization_id: providerId }),
    enabled: !!providerId
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['provider-openings', providerId],
    queryFn: () => base44.entities.Opening.filter({ organization_id: providerId }),
    enabled: !!providerId
  });

  const { data: funding = [] } = useQuery({
    queryKey: ['provider-funding', providerId],
    queryFn: () => base44.entities.FundingAcceptance.filter({ organization_id: providerId }),
    enabled: !!providerId
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['provider-audit', providerId],
    queryFn: () => base44.entities.AuditLog.filter({ organization_id: providerId }, '-created_date', 50),
    enabled: !!providerId
  });

  if (providerLoading || !provider) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = {
    licenses: licenses.length,
    verifiedLicenses: licenses.filter(l => l.status === 'verified').length,
    programs: programs.length,
    sites: sites.length,
    openings: openings.filter(o => o.status === 'active').length,
    expiringLicenses: licenses.filter(l => {
      if (!l.expiration_date || l.status !== 'verified') return false;
      const days = differenceInDays(new Date(l.expiration_date), new Date());
      return days >= 0 && days <= 60;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={createPageUrl('Providers')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Providers
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">
              {provider.legal_name?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{provider.legal_name}</h1>
            {provider.dba_name && (
              <p className="text-slate-500">DBA: {provider.dba_name}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={provider.status} />
              <StatusBadge status={provider.verification_status} />
              {stats.expiringLicenses > 0 && (
                <Badge className="bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats.expiringLicenses} License{stats.expiringLicenses > 1 ? 's' : ''} Expiring
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Snapshot
          </Button>
          <Button>
            Continue Onboarding
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <FileCheck className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.verifiedLicenses}/{stats.licenses}</p>
          <p className="text-xs text-slate-500">Verified Licenses</p>
        </Card>
        <Card className="p-4 text-center">
          <Layers className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.programs}</p>
          <p className="text-xs text-slate-500">Programs</p>
        </Card>
        <Card className="p-4 text-center">
          <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.sites}</p>
          <p className="text-xs text-slate-500">Sites</p>
        </Card>
        <Card className="p-4 text-center">
          <DoorOpen className="w-5 h-5 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.openings}</p>
          <p className="text-xs text-slate-500">Active Openings</p>
        </Card>
        <Card className="p-4 text-center">
          <ComplianceScore score={provider.completeness_score || 0} showLabel={false} />
          <p className="text-xs text-slate-500 mt-2">Completeness</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-lg font-bold text-slate-600">Step {provider.onboarding_step || 1}/9</p>
          <Progress value={(provider.onboarding_step || 1) / 9 * 100} className="mt-2 h-2" />
          <p className="text-xs text-slate-500 mt-1">Onboarding</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="licenses">Licenses ({stats.licenses})</TabsTrigger>
          <TabsTrigger value="programs">Programs ({stats.programs})</TabsTrigger>
          <TabsTrigger value="sites">Sites ({stats.sites})</TabsTrigger>
          <TabsTrigger value="openings">Openings ({stats.openings})</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Legal Name</p>
                    <p className="font-medium">{provider.legal_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">EIN</p>
                    <p className="font-medium font-mono">{provider.ein || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-medium">{provider.address}, {provider.city}, {provider.state} {provider.zip_code}</p>
                  </div>
                  {provider.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{provider.phone}</span>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">{provider.email}</a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Placement Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.counties_served?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Counties Served</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.counties_served.slice(0, 8).map(c => (
                        <Badge key={c} variant="outline">{c}</Badge>
                      ))}
                      {provider.counties_served.length > 8 && (
                        <Badge variant="outline">+{provider.counties_served.length - 8}</Badge>
                      )}
                    </div>
                  </div>
                )}
                {provider.waivers_accepted?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Waivers Accepted</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.waivers_accepted.map(w => (
                        <Badge key={w} className="bg-blue-100 text-blue-700">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {provider.populations_served?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Populations Served</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.populations_served.map(p => (
                        <Badge key={p} variant="secondary">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {provider.age_ranges?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Age Ranges</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.age_ranges.map(a => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="licenses" className="mt-6">
          <DataTable
            columns={[
              { 
                key: 'license_type_code', 
                header: 'Type', 
                render: (v) => <Badge variant="outline" className="font-mono">{v}</Badge> 
              },
              { key: 'license_number', header: 'Number', render: (v) => <span className="font-mono text-sm">{v}</span> },
              { key: 'issuing_authority', header: 'Authority', render: (v) => <Badge variant="secondary">{v}</Badge> },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
              { 
                key: 'expiration_date', 
                header: 'Expiration',
                render: (v) => {
                  if (!v) return '-';
                  const days = differenceInDays(new Date(v), new Date());
                  return (
                    <div className="flex items-center gap-2">
                      <span className={days < 30 ? 'text-red-600' : days < 60 ? 'text-amber-600' : ''}>
                        {format(new Date(v), 'MMM d, yyyy')}
                      </span>
                      {days < 60 && days >= 0 && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">{days}d</Badge>
                      )}
                    </div>
                  );
                }
              }
            ]}
            data={licenses}
            emptyMessage="No licenses added"
          />
        </TabsContent>

        <TabsContent value="programs" className="mt-6">
          <DataTable
            columns={[
              { key: 'program_code', header: 'Program', render: (v) => <Badge variant="outline">{v}</Badge> },
              { key: 'custom_name', header: 'Custom Name' },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
              { 
                key: 'funding_accepted', 
                header: 'Funding',
                render: (v) => (
                  <div className="flex gap-1">
                    {(v || []).slice(0, 3).map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                  </div>
                )
              },
              { key: 'effective_date', header: 'Effective', render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '-' }
            ]}
            data={programs}
            emptyMessage="No programs activated"
          />
        </TabsContent>

        <TabsContent value="sites" className="mt-6">
          <DataTable
            columns={[
              { key: 'name', header: 'Site Name', render: (v) => <span className="font-medium">{v}</span> },
              { key: 'site_type', header: 'Type', render: (v) => <Badge variant="outline" className="capitalize">{v?.replace('_', ' ')}</Badge> },
              { key: 'city', header: 'Location', render: (v, row) => `${v}, ${row.county}` },
              { 
                key: 'capacity', 
                header: 'Capacity',
                render: (_, row) => (
                  <div className="flex items-center gap-2">
                    <Progress value={(row.current_census / row.total_capacity) * 100} className="w-16 h-2" />
                    <span className="text-sm">{row.current_census}/{row.total_capacity}</span>
                  </div>
                )
              },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> }
            ]}
            data={sites}
            emptyMessage="No sites added"
          />
        </TabsContent>

        <TabsContent value="openings" className="mt-6">
          <DataTable
            columns={[
              { key: 'title', header: 'Opening', render: (v) => <span className="font-medium">{v}</span> },
              { key: 'opening_type', header: 'Type', render: (v) => <Badge variant="outline" className="capitalize">{v}</Badge> },
              { key: 'spots_available', header: 'Spots' },
              { 
                key: 'funding_accepted', 
                header: 'Funding',
                render: (v) => (
                  <div className="flex gap-1">
                    {(v || []).slice(0, 2).map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                  </div>
                )
              },
              { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
              { 
                key: 'is_compliant', 
                header: 'Compliant',
                render: (v) => v ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )
              }
            ]}
            data={openings}
            emptyMessage="No openings created"
          />
        </TabsContent>

        <TabsContent value="funding" className="mt-6">
          <DataTable
            columns={[
              { key: 'funding_source', header: 'Source', render: (v) => <Badge variant="outline">{v}</Badge> },
              { key: 'is_accepted', header: 'Status', render: (v) => v ? <Badge className="bg-emerald-100 text-emerald-700">Accepted</Badge> : <Badge variant="outline">Not Accepted</Badge> },
              { key: 'contract_number', header: 'Contract #', render: (v) => v || '-' },
              { key: 'contract_expiry', header: 'Expiry', render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '-' },
              { key: 'rate_negotiated', header: 'Rate', render: (v) => v ? `$${v}` : 'Standard' }
            ]}
            data={funding}
            emptyMessage="No funding acceptance records"
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <DataTable
            columns={[
              { key: 'created_date', header: 'Time', render: (v) => format(new Date(v), 'MMM d, HH:mm') },
              { key: 'action', header: 'Action', render: (v) => <Badge variant="outline" className="capitalize">{v}</Badge> },
              { key: 'entity_type', header: 'Entity' },
              { key: 'actor_email', header: 'User' },
              { key: 'notes', header: 'Notes', render: (v) => <span className="text-sm text-slate-600">{v || '-'}</span> }
            ]}
            data={auditLogs}
            emptyMessage="No audit events"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}