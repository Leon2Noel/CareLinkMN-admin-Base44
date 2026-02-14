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
  Ban,
  Layers,
  Link2Off,
  UserX
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

// Default license-program mapping rules (fallback if DB is empty)
const DEFAULT_LICENSE_PROGRAM_RULES = {
  '245D_INTENSIVE': ['CRS', 'IHS', 'SLS', 'RESPITE', 'CRISIS', 'DAY_SERVICES', 'EMPLOYMENT'],
  '245D_BASIC': ['SLS', 'RESPITE', 'DAY_SERVICES', 'EMPLOYMENT'],
  'ALF': ['ASSISTED_LIVING', 'RESPITE'],
  'ALD': ['ASSISTED_LIVING', 'MEMORY_CARE', 'RESPITE'],
  'HWS_REGISTERED': ['ASSISTED_LIVING'],
  'ADULT_FOSTER': ['AFC'],
  'SNF': ['SNF', 'MEMORY_CARE', 'REHAB'],
};

export default function Compliance() {
  const [activeTab, setActiveTab] = useState('mismatches');

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

  const { data: programs = [] } = useQuery({
    queryKey: ['programs-compliance'],
    queryFn: () => base44.entities.ProgramActivation.list()
  });

  const { data: licenseProgramMaps = [] } = useQuery({
    queryKey: ['license-program-maps'],
    queryFn: () => base44.entities.LicenseProgramMap.list()
  });

  const orgMap = useMemo(() => organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [organizations]);
  
  // Build license map by org
  const licensesByOrg = useMemo(() => {
    return licenses.reduce((acc, l) => {
      if (!acc[l.organization_id]) acc[l.organization_id] = [];
      acc[l.organization_id].push(l);
      return acc;
    }, {});
  }, [licenses]);

  // Build mapping rules (DB takes precedence over defaults)
  const mappingRules = useMemo(() => {
    const rules = { ...DEFAULT_LICENSE_PROGRAM_RULES };
    const dbAllowed = {};
    
    licenseProgramMaps.forEach(m => {
      if (m.allowed && m.is_active !== false) {
        if (!dbAllowed[m.license_type_code]) dbAllowed[m.license_type_code] = [];
        dbAllowed[m.license_type_code].push(m.program_model_code);
      }
    });
    
    // Merge DB rules
    Object.keys(dbAllowed).forEach(k => {
      rules[k] = dbAllowed[k];
    });
    
    return rules;
  }, [licenseProgramMaps]);

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

  // LICENSE-PROGRAM MISMATCHES: Check if active programs have valid licenses
  const licenseProgramMismatches = useMemo(() => {
    const mismatches = [];
    
    programs.filter(p => p.status === 'active').forEach(program => {
      const orgLicenses = licensesByOrg[program.organization_id] || [];
      const verifiedLicenses = orgLicenses.filter(l => l.status === 'verified');
      
      // Check if any verified license allows this program
      const hasValidLicense = verifiedLicenses.some(license => {
        const allowedPrograms = mappingRules[license.license_type_code] || [];
        return allowedPrograms.includes(program.program_code);
      });
      
      if (!hasValidLicense) {
        const org = orgMap[program.organization_id];
        mismatches.push({
          ...program,
          org_name: org?.legal_name || 'Unknown',
          issue: verifiedLicenses.length === 0 
            ? 'No verified licenses found' 
            : `No license supports ${program.program_code}`,
          available_licenses: verifiedLicenses.map(l => l.license_type_code).join(', ') || 'None'
        });
      }
    });
    
    return mismatches;
  }, [programs, licensesByOrg, mappingRules, orgMap]);

  // INCOMPLETE PROFILES: Active programs/openings with missing required fields
  const incompleteProfiles = useMemo(() => {
    const issues = [];
    
    // Check organizations with active openings but incomplete profiles
    const orgsWithActiveOpenings = [...new Set(openings.filter(o => o.status === 'active').map(o => o.organization_id))];
    
    orgsWithActiveOpenings.forEach(orgId => {
      const org = orgMap[orgId];
      if (!org) return;
      
      const missingFields = [];
      
      // Required org fields
      if (!org.phone) missingFields.push('Phone');
      if (!org.primary_contact_email) missingFields.push('Contact Email');
      if (!org.counties_served?.length) missingFields.push('Counties Served');
      if (!org.waivers_accepted?.length) missingFields.push('Waivers Accepted');
      
      // Check if they have capability profiles
      const orgOpenings = openings.filter(o => o.organization_id === orgId && o.status === 'active');
      const hasOpeningWithoutFunding = orgOpenings.some(o => !o.funding_accepted?.length);
      if (hasOpeningWithoutFunding) missingFields.push('Funding on Openings');
      
      if (missingFields.length > 0) {
        issues.push({
          id: orgId,
          org_name: org.legal_name,
          status: org.status,
          verification_status: org.verification_status,
          active_openings: orgOpenings.length,
          missing_fields: missingFields,
          completeness_score: org.completeness_score || 0
        });
      }
    });
    
    return issues.sort((a, b) => a.completeness_score - b.completeness_score);
  }, [openings, orgMap]);

  // EXPIRING LICENSES: Flag providers with expiring licenses (30-60 days)
  const providersWithExpiringLicenses = useMemo(() => {
    const providerFlags = {};
    
    expiringLicenses.forEach(license => {
      const daysUntil = differenceInDays(new Date(license.expiration_date), new Date());
      const org = orgMap[license.organization_id];
      
      if (!providerFlags[license.organization_id]) {
        providerFlags[license.organization_id] = {
          org_id: license.organization_id,
          org_name: org?.legal_name || 'Unknown',
          org_status: org?.status,
          licenses: [],
          critical_count: 0,
          high_count: 0,
          medium_count: 0
        };
      }
      
      providerFlags[license.organization_id].licenses.push({
        ...license,
        days_remaining: daysUntil,
        urgency: daysUntil <= 14 ? 'critical' : daysUntil <= 30 ? 'high' : 'medium'
      });
      
      if (daysUntil <= 14) providerFlags[license.organization_id].critical_count++;
      else if (daysUntil <= 30) providerFlags[license.organization_id].high_count++;
      else providerFlags[license.organization_id].medium_count++;
    });
    
    return Object.values(providerFlags).sort((a, b) => {
      // Sort by critical first, then high, then medium
      if (a.critical_count !== b.critical_count) return b.critical_count - a.critical_count;
      if (a.high_count !== b.high_count) return b.high_count - a.high_count;
      return b.medium_count - a.medium_count;
    });
  }, [expiringLicenses, orgMap]);

  const stats = {
    totalIssues: expiringLicenses.length + expiredLicenses.length + pendingVerifications.length + nonCompliantOpenings.length + licenseProgramMismatches.length + incompleteProfiles.length,
    expiring: expiringLicenses.length,
    expired: expiredLicenses.length,
    pending: pendingVerifications.length,
    noncompliant: nonCompliantOpenings.length,
    mismatches: licenseProgramMismatches.length,
    incomplete: incompleteProfiles.length,
    flaggedProviders: providersWithExpiringLicenses.length
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
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
              <p className="text-sm text-slate-500">Expiring Licenses</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Link2Off className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.mismatches}</p>
              <p className="text-sm text-slate-500">License Mismatches</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <UserX className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.incomplete}</p>
              <p className="text-sm text-slate-500">Incomplete Profiles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="p-2 bg-orange-50 rounded-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.flaggedProviders}</p>
              <p className="text-sm text-slate-500">Flagged Providers</p>
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
              <p className="text-sm text-slate-500">Non-Compliant Openings</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="mismatches" className="relative">
            License Mismatches
            {stats.mismatches > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700">{stats.mismatches}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incomplete">
            Incomplete Profiles
            {stats.incomplete > 0 && (
              <Badge className="ml-2 bg-purple-100 text-purple-700">{stats.incomplete}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring" className="relative">
            Expiring Licenses
            {stats.expiring > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{stats.expiring}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged Providers
            {stats.flaggedProviders > 0 && (
              <Badge className="ml-2 bg-orange-100 text-orange-700">{stats.flaggedProviders}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            {stats.expired > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700">{stats.expired}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {stats.pending > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700">{stats.pending}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* LICENSE-PROGRAM MISMATCHES TAB */}
        <TabsContent value="mismatches" className="mt-6">
          {licenseProgramMismatches.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'org_name',
                  header: 'Provider',
                  render: (value) => (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{value}</span>
                    </div>
                  )
                },
                {
                  key: 'program_code',
                  header: 'Program',
                  render: (value, row) => (
                    <div>
                      <Badge variant="outline">{value}</Badge>
                      {row.custom_name && <p className="text-xs text-slate-500 mt-1">{row.custom_name}</p>}
                    </div>
                  )
                },
                {
                  key: 'issue',
                  header: 'Issue',
                  render: (value) => (
                    <Badge variant="destructive" className="font-normal">{value}</Badge>
                  )
                },
                {
                  key: 'available_licenses',
                  header: 'Available Licenses',
                  render: (value) => (
                    <span className="text-sm text-slate-600">{value || 'None'}</span>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  render: (_, row) => (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={createPageUrl('ProviderDetail') + `?id=${row.organization_id}`}>
                        Fix <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )
                }
              ]}
              data={licenseProgramMismatches}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">All Programs Valid!</h3>
              <p className="text-slate-500 mt-1">All active programs have valid supporting licenses</p>
            </Card>
          )}
        </TabsContent>

        {/* INCOMPLETE PROFILES TAB */}
        <TabsContent value="incomplete" className="mt-6">
          {incompleteProfiles.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'org_name',
                  header: 'Provider',
                  render: (value) => (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{value}</span>
                    </div>
                  )
                },
                {
                  key: 'active_openings',
                  header: 'Active Openings',
                  render: (value) => <Badge variant="outline">{value}</Badge>
                },
                {
                  key: 'missing_fields',
                  header: 'Missing Fields',
                  render: (value) => (
                    <div className="flex flex-wrap gap-1">
                      {value.map((f, i) => (
                        <Badge key={i} className="bg-amber-100 text-amber-700 text-xs">{f}</Badge>
                      ))}
                    </div>
                  )
                },
                {
                  key: 'completeness_score',
                  header: 'Completeness',
                  render: (value) => (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{value}%</span>
                    </div>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  render: (_, row) => (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={createPageUrl('ProviderDetail') + `?id=${row.id}`}>
                        Complete <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )
                }
              ]}
              data={incompleteProfiles}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">All Profiles Complete!</h3>
              <p className="text-slate-500 mt-1">All providers with active openings have complete profiles</p>
            </Card>
          )}
        </TabsContent>

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

        {/* FLAGGED PROVIDERS TAB */}
        <TabsContent value="flagged" className="mt-6">
          {providersWithExpiringLicenses.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'org_name',
                  header: 'Provider',
                  render: (value, row) => (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        row.critical_count > 0 ? 'bg-red-100' : row.high_count > 0 ? 'bg-amber-100' : 'bg-slate-100'
                      }`}>
                        <Building2 className={`w-5 h-5 ${
                          row.critical_count > 0 ? 'text-red-600' : row.high_count > 0 ? 'text-amber-600' : 'text-slate-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{value}</p>
                        <p className="text-xs text-slate-500">{row.licenses.length} license(s) expiring</p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'urgency',
                  header: 'Urgency',
                  render: (_, row) => (
                    <div className="flex gap-2">
                      {row.critical_count > 0 && (
                        <Badge variant="destructive">{row.critical_count} Critical</Badge>
                      )}
                      {row.high_count > 0 && (
                        <Badge className="bg-amber-100 text-amber-700">{row.high_count} High</Badge>
                      )}
                      {row.medium_count > 0 && (
                        <Badge variant="outline">{row.medium_count} Medium</Badge>
                      )}
                    </div>
                  )
                },
                {
                  key: 'licenses',
                  header: 'Expiring Licenses',
                  render: (value) => (
                    <div className="flex flex-wrap gap-1">
                      {value.slice(0, 3).map((l, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {l.license_type_code} ({l.days_remaining}d)
                        </Badge>
                      ))}
                      {value.length > 3 && <Badge variant="outline" className="text-xs">+{value.length - 3}</Badge>}
                    </div>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  render: (_, row) => (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={createPageUrl('ProviderDetail') + `?id=${row.org_id}`}>
                        Review <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )
                }
              ]}
              data={providersWithExpiringLicenses}
            />
          ) : (
            <Card className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No Flagged Providers!</h3>
              <p className="text-slate-500 mt-1">All providers have current licenses</p>
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