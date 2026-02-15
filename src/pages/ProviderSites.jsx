import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  MapPin,
  Building2,
  Bed,
  Users,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MN_COUNTIES = [
  'Aitkin', 'Anoka', 'Becker', 'Beltrami', 'Benton', 'Big Stone', 'Blue Earth', 'Brown',
  'Carlton', 'Carver', 'Cass', 'Chippewa', 'Chisago', 'Clay', 'Clearwater', 'Cook',
  'Cottonwood', 'Crow Wing', 'Dakota', 'Dodge', 'Douglas', 'Faribault', 'Fillmore',
  'Freeborn', 'Goodhue', 'Grant', 'Hennepin', 'Houston', 'Hubbard', 'Isanti', 'Itasca',
  'Jackson', 'Kanabec', 'Kandiyohi', 'Kittson', 'Koochiching', 'Lac qui Parle', 'Lake',
  'Lake of the Woods', 'Le Sueur', 'Lincoln', 'Lyon', 'Mahnomen', 'Marshall', 'Martin',
  'McLeod', 'Meeker', 'Mille Lacs', 'Morrison', 'Mower', 'Murray', 'Nicollet', 'Nobles',
  'Norman', 'Olmsted', 'Otter Tail', 'Pennington', 'Pine', 'Pipestone', 'Polk', 'Pope',
  'Ramsey', 'Red Lake', 'Redwood', 'Renville', 'Rice', 'Rock', 'Roseau', 'Scott',
  'Sherburne', 'Sibley', 'St. Louis', 'Stearns', 'Steele', 'Stevens', 'Swift', 'Todd',
  'Traverse', 'Wabasha', 'Wadena', 'Waseca', 'Washington', 'Watonwan', 'Wilkin', 'Winona',
  'Wright', 'Yellow Medicine'
];

const SITE_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'day_program', label: 'Day Program' },
  { value: 'office', label: 'Office' },
  { value: 'community_based', label: 'Community Based' }
];

export default function ProviderSites() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    site_type: 'residential',
    address: '',
    city: '',
    county: '',
    state: 'MN',
    zip_code: '',
    phone: '',
    total_capacity: '',
    gender_restriction: 'all',
    age_restriction_min: '',
    age_restriction_max: '',
    assigned_license_ids: [],
    assigned_program_ids: []
  });

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

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['my-sites', org?.id],
    queryFn: () => base44.entities.Site.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

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

  const { data: openings = [] } = useQuery({
    queryKey: ['my-openings', org?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const activeLicenses = useMemo(() => 
    licenses.filter(l => ['verified', 'active', 'provisional'].includes(l.status)),
    [licenses]
  );

  const activePrograms = useMemo(() => 
    programs.filter(p => p.status === 'active'),
    [programs]
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Site.create({
      ...data,
      organization_id: org.id,
      status: 'active',
      current_census: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sites'] });
      resetForm();
    }
  });

  const resetForm = () => {
    setShowAddDialog(false);
    setErrors({});
    setFormData({
      name: '',
      site_type: 'residential',
      address: '',
      city: '',
      county: '',
      state: 'MN',
      zip_code: '',
      phone: '',
      total_capacity: '',
      gender_restriction: 'all',
      age_restriction_min: '',
      age_restriction_max: '',
      assigned_license_ids: [],
      assigned_program_ids: []
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Site name is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.county) newErrors.county = 'County is required';
    if (formData.assigned_license_ids.length === 0) newErrors.licenses = 'Assign at least one license';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      createMutation.mutate({
        ...formData,
        total_capacity: formData.total_capacity ? parseInt(formData.total_capacity) : null,
        age_restriction_min: formData.age_restriction_min ? parseInt(formData.age_restriction_min) : null,
        age_restriction_max: formData.age_restriction_max ? parseInt(formData.age_restriction_max) : null
      });
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Site',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{row.address}, {row.city}</p>
          </div>
        </div>
      )
    },
    {
      key: 'county',
      header: 'County',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'total_capacity',
      header: 'Capacity',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Bed className="w-4 h-4 text-slate-400" />
          <span>{row.current_census || 0} / {value || '—'}</span>
        </div>
      )
    },
    {
      key: 'assigned_program_ids',
      header: 'Programs',
      render: (value) => {
        const count = value?.length || 0;
        return count > 0 ? (
          <Badge className="bg-blue-100 text-blue-700">{count} program{count > 1 ? 's' : ''}</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600">None</Badge>
        );
      }
    },
    {
      key: 'openings',
      header: 'Openings',
      render: (_, row) => {
        const siteOpenings = openings.filter(o => o.site_id === row.id && o.status === 'active');
        return siteOpenings.length > 0 ? (
          <Badge className="bg-emerald-100 text-emerald-700">{siteOpenings.length} active</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600">None</Badge>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    }
  ];

  const hasNoLicenses = activeLicenses.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sites</h1>
          <p className="text-slate-500 mt-1">Manage your service locations</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} disabled={hasNoLicenses}>
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* No Licenses Warning */}
      {hasNoLicenses && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">No active licenses</p>
                <p className="text-sm text-amber-700">You need an active license before adding sites.</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to={createPageUrl('ProviderLicenses')}>
                Upload License <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && sites.length === 0 && !hasNoLicenses ? (
        <Card className="p-12 text-center">
          <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No sites yet</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            Add your first service location to start creating openings.
          </p>
          <Button className="mt-6" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Site
          </Button>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={sites}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedSite(row)}
        />
      )}

      {/* Add Site Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Site</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Site Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Street Home"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label>Site Type</Label>
                <Select
                  value={formData.site_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, site_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SITE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div>
                <Label>Address <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label>County <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.county}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, county: v }))}
                  >
                    <SelectTrigger className={errors.county ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MN_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State</Label>
                  <Input value="MN" disabled />
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Capacity & Restrictions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Total Beds</Label>
                <Input
                  type="number"
                  value={formData.total_capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_capacity: e.target.value }))}
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.gender_restriction}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gender_restriction: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (Co-ed)</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Age</Label>
                <Input
                  type="number"
                  value={formData.age_restriction_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_restriction_min: e.target.value }))}
                />
              </div>
              <div>
                <Label>Max Age</Label>
                <Input
                  type="number"
                  value={formData.age_restriction_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_restriction_max: e.target.value }))}
                />
              </div>
            </div>

            {/* Assign Licenses */}
            <div>
              <Label>Assign Licenses <span className="text-red-500">*</span></Label>
              {errors.licenses && <p className="text-xs text-red-500 mb-2">{errors.licenses}</p>}
              <div className="space-y-2 mt-2">
                {activeLicenses.map(license => (
                  <label key={license.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <Checkbox
                      checked={formData.assigned_license_ids.includes(license.id)}
                      onCheckedChange={() => handleArrayToggle('assigned_license_ids', license.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{license.license_type_code}</p>
                      <p className="text-xs text-slate-500">#{license.license_number}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Assign Programs */}
            {activePrograms.length > 0 && (
              <div>
                <Label>Assign Programs (optional)</Label>
                <div className="space-y-2 mt-2">
                  {activePrograms.map(program => (
                    <label key={program.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                      <Checkbox
                        checked={formData.assigned_program_ids.includes(program.id)}
                        onCheckedChange={() => handleArrayToggle('assigned_program_ids', program.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{program.custom_name || program.program_code}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Site'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}