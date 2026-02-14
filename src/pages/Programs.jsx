import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter,
  Layers,
  Building2,
  ChevronRight,
  FileCheck,
  Info,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

// Program Models aligned with MN regulations
const PROGRAM_TEMPLATES = [
  { 
    code: 'CRS', 
    name: 'Community Residential Services', 
    category: 'residential',
    requiredLicenses: ['245D_INTENSIVE'],
    description: 'Residential services in a licensed community setting'
  },
  { 
    code: 'IHS', 
    name: 'In-Home Support Services', 
    category: 'in_home',
    requiredLicenses: ['245D_INTENSIVE'],
    description: 'Support services provided in the individuals home'
  },
  { 
    code: 'SLS', 
    name: 'Supported Living Services', 
    category: 'residential',
    requiredLicenses: ['245D_BASIC', '245D_INTENSIVE'],
    description: 'Basic support in community living arrangements'
  },
  { 
    code: 'RESPITE', 
    name: 'Respite Care', 
    category: 'respite',
    requiredLicenses: ['245D_BASIC', '245D_INTENSIVE', 'ALF', 'ALD'],
    description: 'Temporary relief care for primary caregivers'
  },
  { 
    code: 'CRISIS', 
    name: 'Crisis Services', 
    category: 'crisis',
    requiredLicenses: ['245D_INTENSIVE'],
    description: 'Emergency stabilization and crisis intervention'
  },
  { 
    code: 'MEMORY_CARE', 
    name: 'Memory Care Program', 
    category: 'residential',
    requiredLicenses: ['ALD', 'SNF'],
    description: 'Specialized dementia and memory care services'
  },
  { 
    code: 'ASSISTED_LIVING', 
    name: 'Assisted Living Services', 
    category: 'residential',
    requiredLicenses: ['ALF', 'ALD', 'HWS_REGISTERED'],
    description: 'Housing with supportive services'
  },
  { 
    code: 'AFC', 
    name: 'Adult Foster Care', 
    category: 'residential',
    requiredLicenses: ['ADULT_FOSTER'],
    description: 'Family-based residential care'
  },
  { 
    code: 'DAY_SERVICES', 
    name: 'Day Training & Habilitation', 
    category: 'day_services',
    requiredLicenses: ['245D_BASIC', '245D_INTENSIVE'],
    description: 'Community-based day programming'
  },
  { 
    code: 'EMPLOYMENT', 
    name: 'Employment Services', 
    category: 'employment',
    requiredLicenses: ['245D_BASIC', '245D_INTENSIVE'],
    description: 'Supported employment and job coaching'
  },
];

const SERVICE_CATEGORIES = {
  residential: { label: 'Residential', color: 'bg-blue-100 text-blue-700' },
  in_home: { label: 'In-Home', color: 'bg-purple-100 text-purple-700' },
  day_services: { label: 'Day Services', color: 'bg-emerald-100 text-emerald-700' },
  respite: { label: 'Respite', color: 'bg-amber-100 text-amber-700' },
  crisis: { label: 'Crisis', color: 'bg-red-100 text-red-700' },
  employment: { label: 'Employment', color: 'bg-cyan-100 text-cyan-700' },
};

export default function Programs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: activations = [], isLoading } = useQuery({
    queryKey: ['program-activations'],
    queryFn: () => base44.entities.ProgramActivation.list('-created_date', 500)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses-lookup'],
    queryFn: () => base44.entities.LicenseInstance.list()
  });

  const orgMap = useMemo(() => {
    return organizations.reduce((acc, org) => {
      acc[org.id] = org;
      return acc;
    }, {});
  }, [organizations]);

  const licenseMap = useMemo(() => {
    return licenses.reduce((acc, lic) => {
      acc[lic.id] = lic;
      return acc;
    }, {});
  }, [licenses]);

  const programMap = useMemo(() => {
    return PROGRAM_TEMPLATES.reduce((acc, p) => {
      acc[p.code] = p;
      return acc;
    }, {});
  }, []);

  const filteredActivations = useMemo(() => {
    return activations.filter(a => {
      const org = orgMap[a.organization_id];
      const program = programMap[a.program_code];
      
      const matchesSearch = !searchTerm || 
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.custom_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || program?.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [activations, searchTerm, categoryFilter, statusFilter, orgMap, programMap]);

  const columns = [
    {
      key: 'organization',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{org?.legal_name || 'Unknown'}</p>
              <p className="text-sm text-slate-500">{org?.city}, {org?.state}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'program',
      header: 'Program',
      render: (_, row) => {
        const program = programMap[row.program_code];
        const category = SERVICE_CATEGORIES[program?.category];
        return (
          <div>
            <p className="font-medium text-slate-900">{row.custom_name || program?.name || row.program_code}</p>
            {category && (
              <Badge className={`mt-1 ${category.color}`}>{category.label}</Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'qualifying_license',
      header: 'Qualifying License',
      render: (_, row) => {
        const license = licenseMap[row.qualifying_license_id];
        if (!license) return <span className="text-slate-400">-</span>;
        return (
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium">{license.license_type_code}</p>
              <p className="text-xs text-slate-500">#{license.license_number}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'funding_accepted',
      header: 'Funding',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {(value || []).slice(0, 3).map(f => (
            <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
          ))}
          {(value || []).length > 3 && (
            <Badge variant="outline" className="text-xs">+{value.length - 3}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'effective_date',
      header: 'Effective',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        description="Manage provider program activations and verify license-program compliance"
      />

      {/* Program Templates Overview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            MN Program Model Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROGRAM_TEMPLATES.map(program => {
              const category = SERVICE_CATEGORIES[program.category];
              return (
                <div 
                  key={program.code}
                  className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{program.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{program.description}</p>
                    </div>
                    <Badge className={`text-xs ${category.color}`}>{category.label}</Badge>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-slate-500 mb-1">Required Licenses:</p>
                    <div className="flex flex-wrap gap-1">
                      {program.requiredLicenses.map(l => (
                        <Badge key={l} variant="outline" className="text-xs font-mono">{l}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by provider or program name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(SERVICE_CATEGORIES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activations Table */}
      <DataTable
        columns={columns}
        data={filteredActivations}
        isLoading={isLoading}
        emptyMessage="No program activations found"
      />
    </div>
  );
}