import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Sparkles,
  Building2,
  Heart,
  Brain,
  Users,
  Home,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const CAPABILITY_CATEGORIES = {
  behavioral: {
    label: 'Behavioral',
    icon: Brain,
    color: 'text-purple-600 bg-purple-50',
    fields: [
      { key: 'aggression_physical', label: 'Physical Aggression' },
      { key: 'aggression_verbal', label: 'Verbal Aggression' },
      { key: 'self_injury', label: 'Self-Injury' },
      { key: 'property_destruction', label: 'Property Destruction' },
      { key: 'elopement_risk', label: 'Elopement Risk' },
      { key: 'sexual_behaviors', label: 'Sexual Behaviors' },
      { key: 'substance_use', label: 'Substance Use', boolean: true },
      { key: 'pica', label: 'PICA', boolean: true },
    ]
  },
  medical: {
    label: 'Medical',
    icon: Heart,
    color: 'text-red-600 bg-red-50',
    fields: [
      { key: 'tube_feeding', label: 'Tube Feeding', boolean: true },
      { key: 'ventilator', label: 'Ventilator', boolean: true },
      { key: 'tracheostomy', label: 'Tracheostomy', boolean: true },
      { key: 'dialysis', label: 'Dialysis', boolean: true },
      { key: 'oxygen', label: 'Oxygen', boolean: true },
      { key: 'wound_care', label: 'Wound Care' },
      { key: 'medication_administration', label: 'Medication Admin' },
      { key: 'diabetic_care', label: 'Diabetic Care' },
      { key: 'seizure_management', label: 'Seizure Management' },
      { key: 'mobility_assistance', label: 'Mobility Assistance' },
    ]
  },
  staffing: {
    label: 'Staffing',
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
    fields: [
      { key: 'ratio_day', label: 'Day Ratio' },
      { key: 'ratio_night', label: 'Night Ratio' },
      { key: 'awake_overnight', label: 'Awake Overnight', boolean: true },
      { key: 'rn_on_staff', label: 'RN on Staff', boolean: true },
      { key: 'lpn_on_staff', label: 'LPN on Staff', boolean: true },
      { key: 'behavioral_specialist', label: 'Behavioral Specialist', boolean: true },
      { key: 'one_to_one_available', label: '1:1 Available', boolean: true },
    ]
  },
  environment: {
    label: 'Environment',
    icon: Home,
    color: 'text-emerald-600 bg-emerald-50',
    fields: [
      { key: 'wheelchair_accessible', label: 'Wheelchair Accessible', boolean: true },
      { key: 'single_story', label: 'Single Story', boolean: true },
      { key: 'secured_unit', label: 'Secured Unit', boolean: true },
      { key: 'private_rooms', label: 'Private Rooms', boolean: true },
      { key: 'shared_rooms', label: 'Shared Rooms', boolean: true },
      { key: 'sensory_room', label: 'Sensory Room', boolean: true },
      { key: 'outdoor_space', label: 'Outdoor Space', boolean: true },
    ]
  }
};

export default function Capabilities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['capability-profiles'],
    queryFn: () => base44.entities.CapabilityProfile.list('-created_date', 500)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites-lookup'],
    queryFn: () => base44.entities.Site.list()
  });

  const orgMap = useMemo(() => organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [organizations]);
  const siteMap = useMemo(() => sites.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}), [sites]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const org = orgMap[p.organization_id];
      const site = siteMap[p.site_id];
      
      const matchesSearch = !searchTerm || 
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [profiles, searchTerm, orgMap, siteMap]);

  const renderCapabilityValue = (value, field) => {
    if (field.boolean) {
      return value ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-300" />
      );
    }
    if (!value || value === 'none') {
      return <span className="text-slate-400">None</span>;
    }
    const colors = {
      mild: 'bg-amber-100 text-amber-700',
      moderate: 'bg-orange-100 text-orange-700',
      severe: 'bg-red-100 text-red-700',
      low: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700',
      basic: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
      self: 'bg-slate-100 text-slate-700',
      reminder: 'bg-blue-100 text-blue-700',
      full_admin: 'bg-purple-100 text-purple-700',
      monitoring: 'bg-blue-100 text-blue-700',
      insulin: 'bg-purple-100 text-purple-700',
      intervention: 'bg-purple-100 text-purple-700',
      independent: 'bg-emerald-100 text-emerald-700',
      minimal: 'bg-blue-100 text-blue-700',
      total: 'bg-purple-100 text-purple-700',
    };
    return (
      <Badge className={colors[value] || 'bg-slate-100 text-slate-700'}>
        {value.replace('_', ' ')}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'organization',
      header: 'Provider / Site',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        const site = siteMap[row.site_id];
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              {row.site_id ? <Home className="w-5 h-5 text-slate-600" /> : <Building2 className="w-5 h-5 text-slate-600" />}
            </div>
            <div>
              <p className="font-medium text-slate-900">{org?.legal_name || 'Unknown'}</p>
              {site && <p className="text-sm text-slate-500">{site.name}</p>}
            </div>
          </div>
        );
      }
    },
    {
      key: 'profile_type',
      header: 'Profile Type',
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {value?.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'behavioral_summary',
      header: 'Behavioral',
      render: (_, row) => {
        const behavioral = row.behavioral || {};
        const hasHigh = ['aggression_physical', 'aggression_verbal', 'self_injury', 'property_destruction']
          .some(k => ['moderate', 'severe'].includes(behavioral[k]));
        return hasHigh ? (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            High Acuity
          </Badge>
        ) : (
          <Badge variant="outline">Standard</Badge>
        );
      }
    },
    {
      key: 'medical_summary',
      header: 'Medical',
      render: (_, row) => {
        const medical = row.medical || {};
        const complexMedical = ['tube_feeding', 'ventilator', 'tracheostomy', 'dialysis']
          .some(k => medical[k]);
        return complexMedical ? (
          <Badge className="bg-red-100 text-red-700">
            <Heart className="w-3 h-3 mr-1" />
            Complex
          </Badge>
        ) : (
          <Badge variant="outline">Standard</Badge>
        );
      }
    },
    {
      key: 'staffing_summary',
      header: 'Staffing',
      render: (_, row) => {
        const staffing = row.staffing || {};
        return (
          <div className="text-sm">
            {staffing.ratio_day && <span className="text-slate-600">{staffing.ratio_day}</span>}
            {staffing.awake_overnight && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Awake</Badge>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capability Profiles"
        description="View and manage provider capability configurations across behavioral, medical, staffing, and environment dimensions"
      />

      {/* Category Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CAPABILITY_CATEGORIES).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{config.label}</p>
                  <p className="text-xs text-slate-500">{config.fields.length} dimensions</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by provider or site name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Table */}
      <DataTable
        columns={columns}
        data={filteredProfiles}
        isLoading={isLoading}
        emptyMessage="No capability profiles found"
      />

      {/* Capability Matrix Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capability Matrix Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="behavioral">
            <TabsList>
              {Object.entries(CAPABILITY_CATEGORIES).map(([key, config]) => (
                <TabsTrigger key={key} value={key}>{config.label}</TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(CAPABILITY_CATEGORIES).map(([key, config]) => (
              <TabsContent key={key} value={key} className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {config.fields.map(field => (
                    <div key={field.key} className="p-3 border rounded-lg">
                      <p className="font-medium text-sm text-slate-900">{field.label}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {field.boolean ? 'Yes/No' : 'None → Mild → Moderate → Severe'}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}