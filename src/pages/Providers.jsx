import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ComplianceScore from '@/components/ui/ComplianceScore';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  Plus,
  Filter,
  Download,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  FileCheck,
  Layers,
  DoorOpen,
  ChevronRight,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const MN_COUNTIES = [
  'Anoka', 'Becker', 'Beltrami', 'Benton', 'Big Stone', 'Blue Earth', 'Brown', 'Carlton',
  'Carver', 'Cass', 'Chippewa', 'Chisago', 'Clay', 'Clearwater', 'Cook', 'Cottonwood',
  'Crow Wing', 'Dakota', 'Dodge', 'Douglas', 'Faribault', 'Fillmore', 'Freeborn', 'Goodhue',
  'Grant', 'Hennepin', 'Houston', 'Hubbard', 'Isanti', 'Itasca', 'Jackson', 'Kanabec',
  'Kandiyohi', 'Kittson', 'Koochiching', 'Lac qui Parle', 'Lake', 'Lake of the Woods',
  'Le Sueur', 'Lincoln', 'Lyon', 'Mahnomen', 'Marshall', 'Martin', 'McLeod', 'Meeker',
  'Mille Lacs', 'Morrison', 'Mower', 'Murray', 'Nicollet', 'Nobles', 'Norman', 'Olmsted',
  'Otter Tail', 'Pennington', 'Pine', 'Pipestone', 'Polk', 'Pope', 'Ramsey', 'Red Lake',
  'Redwood', 'Renville', 'Rice', 'Rock', 'Roseau', 'Scott', 'Sherburne', 'Sibley',
  'St. Louis', 'Stearns', 'Steele', 'Stevens', 'Swift', 'Todd', 'Traverse', 'Wabasha',
  'Wadena', 'Waseca', 'Washington', 'Watonwan', 'Wilkin', 'Winona', 'Wright', 'Yellow Medicine'
];

const WAIVERS = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];
const POPULATIONS = ['DD', 'MI', 'TBI', 'Elderly', 'Physical Disability'];
const AGE_RANGES = ['0-17', '18-21', '22-64', '65+'];

export default function Providers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [newProvider, setNewProvider] = useState({
    legal_name: '',
    dba_name: '',
    ein: '',
    address: '',
    city: '',
    state: 'MN',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    counties_served: [],
    waivers_accepted: [],
    age_ranges: [],
    populations_served: [],
    gender_accepted: 'all',
    status: 'pending_review',
    verification_status: 'unverified',
    completeness_score: 10,
    onboarding_step: 1
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => base44.entities.Organization.list('-created_date', 200)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setShowAddDialog(false);
      setNewProvider({
        legal_name: '',
        email: '',
        status: 'pending_review',
        verification_status: 'unverified',
        completeness_score: 10,
        onboarding_step: 1,
        state: 'MN'
      });
    }
  });

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const matchesSearch = !searchTerm || 
        p.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [providers, searchTerm, statusFilter]);

  const columns = [
    {
      key: 'legal_name',
      header: 'Provider',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {value?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {row.city}, {row.state}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'verification_status',
      header: 'Verification',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'completeness_score',
      header: 'Completeness',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                value >= 80 ? 'bg-emerald-500' : 
                value >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600">{value || 0}%</span>
        </div>
      )
    },
    {
      key: 'onboarding_step',
      header: 'Onboarding',
      render: (value) => (
        <span className="text-sm text-slate-600">Step {value || 1} of 9</span>
      )
    },
    {
      key: 'created_date',
      header: 'Added',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-slate-600">
          {value ? format(new Date(value), 'MMM d, yyyy') : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (_, row) => (
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.stopPropagation();
          setSelectedProvider(row);
        }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )
    }
  ];

  const handleSubmit = () => {
    createMutation.mutate(newProvider);
  };

  const toggleArrayValue = (field, value) => {
    const current = newProvider[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setNewProvider({ ...newProvider, [field]: updated });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Providers"
        description="Manage provider organizations, verification status, and onboarding progress"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search providers by name, city, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <DataTable
        columns={columns}
        data={filteredProviders}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedProvider(row)}
        emptyMessage="No providers found"
      />

      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Provider</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="identity" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="identity">Organization Info</TabsTrigger>
              <TabsTrigger value="filters">Placement Filters</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="legal_name">Legal Name *</Label>
                  <Input
                    id="legal_name"
                    value={newProvider.legal_name}
                    onChange={(e) => setNewProvider({...newProvider, legal_name: e.target.value})}
                    placeholder="Full legal business name"
                  />
                </div>
                <div>
                  <Label htmlFor="dba_name">DBA Name</Label>
                  <Input
                    id="dba_name"
                    value={newProvider.dba_name}
                    onChange={(e) => setNewProvider({...newProvider, dba_name: e.target.value})}
                    placeholder="Doing business as"
                  />
                </div>
                <div>
                  <Label htmlFor="ein">EIN</Label>
                  <Input
                    id="ein"
                    value={newProvider.ein}
                    onChange={(e) => setNewProvider({...newProvider, ein: e.target.value})}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={newProvider.address}
                    onChange={(e) => setNewProvider({...newProvider, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newProvider.city}
                    onChange={(e) => setNewProvider({...newProvider, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={newProvider.zip_code}
                    onChange={(e) => setNewProvider({...newProvider, zip_code: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newProvider.phone}
                    onChange={(e) => setNewProvider({...newProvider, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newProvider.email}
                    onChange={(e) => setNewProvider({...newProvider, email: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newProvider.website}
                    onChange={(e) => setNewProvider({...newProvider, website: e.target.value})}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Primary Contact</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Name</Label>
                    <Input
                      id="contact_name"
                      value={newProvider.primary_contact_name}
                      onChange={(e) => setNewProvider({...newProvider, primary_contact_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={newProvider.primary_contact_email}
                      onChange={(e) => setNewProvider({...newProvider, primary_contact_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      value={newProvider.primary_contact_phone}
                      onChange={(e) => setNewProvider({...newProvider, primary_contact_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4 mt-4">
              <div>
                <Label className="mb-2 block">Counties Served</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  {MN_COUNTIES.map(county => (
                    <Badge
                      key={county}
                      variant={newProvider.counties_served?.includes(county) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue('counties_served', county)}
                    >
                      {county}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Waivers Accepted</Label>
                <div className="flex flex-wrap gap-2">
                  {WAIVERS.map(waiver => (
                    <Badge
                      key={waiver}
                      variant={newProvider.waivers_accepted?.includes(waiver) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue('waivers_accepted', waiver)}
                    >
                      {waiver}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Age Ranges Served</Label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map(age => (
                    <Badge
                      key={age}
                      variant={newProvider.age_ranges?.includes(age) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue('age_ranges', age)}
                    >
                      {age}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Populations Served</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULATIONS.map(pop => (
                    <Badge
                      key={pop}
                      variant={newProvider.populations_served?.includes(pop) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayValue('populations_served', pop)}
                    >
                      {pop}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="gender">Gender Accepted</Label>
                <Select 
                  value={newProvider.gender_accepted} 
                  onValueChange={(v) => setNewProvider({...newProvider, gender_accepted: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!newProvider.legal_name || !newProvider.email || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Provider Detail Drawer */}
      {selectedProvider && (
        <ProviderDetailDrawer 
          provider={selectedProvider} 
          onClose={() => setSelectedProvider(null)} 
        />
      )}
    </div>
  );
}

function ProviderDetailDrawer({ provider, onClose }) {
  const { data: licenses = [] } = useQuery({
    queryKey: ['provider-licenses', provider.id],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: provider.id })
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['provider-programs', provider.id],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: provider.id })
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['provider-sites', provider.id],
    queryFn: () => base44.entities.Site.filter({ organization_id: provider.id })
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['provider-openings', provider.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: provider.id })
  });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {provider.legal_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{provider.legal_name}</h2>
              <p className="text-sm text-slate-500">{provider.city}, {provider.state}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <StatusBadge status={provider.status} />
              <p className="text-xs text-slate-500 mt-2">Account Status</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <StatusBadge status={provider.verification_status} />
              <p className="text-xs text-slate-500 mt-2">Verification</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <ComplianceScore score={provider.completeness_score || 0} showLabel={false} />
              <p className="text-xs text-slate-500 mt-2">Completeness</p>
            </div>
          </div>

          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {provider.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                    {provider.email}
                  </a>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{provider.phone}</span>
                </div>
              )}
              {provider.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{provider.address}, {provider.city}, {provider.state} {provider.zip_code}</span>
                </div>
              )}
              {provider.website && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {provider.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <FileCheck className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{licenses.length}</p>
              <p className="text-xs text-slate-500">Licenses</p>
            </Card>
            <Card className="p-4 text-center">
              <Layers className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{programs.length}</p>
              <p className="text-xs text-slate-500">Programs</p>
            </Card>
            <Card className="p-4 text-center">
              <MapPin className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{sites.length}</p>
              <p className="text-xs text-slate-500">Sites</p>
            </Card>
            <Card className="p-4 text-center">
              <DoorOpen className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{openings.filter(o => o.status === 'active').length}</p>
              <p className="text-xs text-slate-500">Openings</p>
            </Card>
          </div>

          {/* Placement Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Placement Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider.waivers_accepted?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Waivers Accepted</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.waivers_accepted.map(w => (
                      <Badge key={w} variant="secondary">{w}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {provider.populations_served?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Populations Served</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.populations_served.map(p => (
                      <Badge key={p} variant="outline">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {provider.age_ranges?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Age Ranges</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.age_ranges.map(a => (
                      <Badge key={a} variant="outline">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={createPageUrl('Licenses') + `?organization_id=${provider.id}`}>
                View Licenses
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link to={createPageUrl('ProviderOnboarding') + `?id=${provider.id}`}>
                Continue Onboarding
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}