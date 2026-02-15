import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DoorOpen,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  MapPin,
  Bed,
  Calendar,
  ArrowRight,
  FileCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const FUNDING_OPTIONS = [
  { code: 'CADI', label: 'CADI' },
  { code: 'DD', label: 'DD Waiver' },
  { code: 'BI', label: 'BI Waiver' },
  { code: 'EW', label: 'Elderly Waiver' },
  { code: 'AC', label: 'Alternative Care' },
  { code: 'CAC', label: 'CAC' },
  { code: 'MA_FFS', label: 'MA Fee-for-Service' },
  { code: 'MA_MCO', label: 'MA Managed Care' },
  { code: 'Private_Pay', label: 'Private Pay' },
  { code: 'County_Contract', label: 'County Contract' }
];

const OPENING_TYPES = [
  { value: 'immediate', label: 'Immediate Availability' },
  { value: 'upcoming', label: 'Upcoming Availability' },
  { value: 'waitlist', label: 'Waitlist' }
];

export default function ProviderOpenings() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [errors, setErrors] = useState({});
  const [blockReasons, setBlockReasons] = useState([]);

  const [formData, setFormData] = useState({
    site_id: '',
    program_activation_id: '',
    title: '',
    description: '',
    opening_type: 'immediate',
    available_date: '',
    spots_available: 1,
    gender_requirement: 'any',
    age_min: '',
    age_max: '',
    funding_accepted: [],
    special_considerations: ''
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

  const { data: openings = [], isLoading } = useQuery({
    queryKey: ['my-openings', org?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['my-sites', org?.id],
    queryFn: () => base44.entities.Site.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['my-programs', org?.id],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['my-licenses', org?.id],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['my-capabilities', org?.id],
    queryFn: () => base44.entities.CapabilityProfile.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  // Validation checks
  const validationState = useMemo(() => {
    const activeLicenses = licenses.filter(l => 
      ['verified', 'active'].includes(l.status) && 
      (!l.expiration_date || new Date(l.expiration_date) > new Date())
    );
    const activePrograms = programs.filter(p => p.status === 'active');
    const activeSites = sites.filter(s => s.status === 'active');

    return {
      hasActiveLicense: activeLicenses.length > 0,
      hasActiveProgram: activePrograms.length > 0,
      hasActiveSite: activeSites.length > 0,
      activeLicenses,
      activePrograms,
      activeSites
    };
  }, [licenses, programs, sites]);

  // Get available programs for selected site
  const availableProgramsForSite = useMemo(() => {
    if (!formData.site_id) return [];
    const site = sites.find(s => s.id === formData.site_id);
    if (!site) return [];
    
    // Programs assigned to this site
    if (site.assigned_program_ids?.length > 0) {
      return programs.filter(p => 
        site.assigned_program_ids.includes(p.id) && p.status === 'active'
      );
    }
    
    // Fall back to all active programs
    return programs.filter(p => p.status === 'active');
  }, [formData.site_id, sites, programs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Opening.create({
      ...data,
      organization_id: org.id,
      status: 'draft',
      is_compliant: true,
      views_count: 0,
      inquiries_count: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-openings'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opening.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-openings'] });
    }
  });

  const resetForm = () => {
    setShowAddDialog(false);
    setErrors({});
    setBlockReasons([]);
    setFormData({
      site_id: '',
      program_activation_id: '',
      title: '',
      description: '',
      opening_type: 'immediate',
      available_date: '',
      spots_available: 1,
      gender_requirement: 'any',
      age_min: '',
      age_max: '',
      funding_accepted: [],
      special_considerations: ''
    });
  };

  const checkBlockers = () => {
    const blocks = [];
    
    if (!validationState.hasActiveLicense) {
      blocks.push({ type: 'license', message: 'No active/verified license', link: 'ProviderLicenses' });
    }
    if (!validationState.hasActiveProgram) {
      blocks.push({ type: 'program', message: 'No active program', link: 'ProviderPrograms' });
    }
    if (!validationState.hasActiveSite) {
      blocks.push({ type: 'site', message: 'No active site', link: 'ProviderSites' });
    }
    if (formData.program_activation_id) {
      const hasCapability = capabilities.some(c => c.program_activation_id === formData.program_activation_id);
      if (!hasCapability) {
        blocks.push({ type: 'capability', message: 'Capability profile not configured for this program', link: 'ProviderCapabilities' });
      }
    }
    
    return blocks;
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.site_id) newErrors.site_id = 'Select a site';
    if (!formData.program_activation_id) newErrors.program_activation_id = 'Select a program';
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.spots_available || formData.spots_available < 1) newErrors.spots_available = 'At least 1 spot required';
    if (!formData.funding_accepted?.length) newErrors.funding_accepted = 'Select at least one funding type';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = () => {
    const blocks = checkBlockers();
    if (blocks.length > 0) {
      setBlockReasons(blocks);
    } else {
      setShowAddDialog(true);
    }
  };

  const handleSubmit = () => {
    if (validate()) {
      createMutation.mutate({
        ...formData,
        spots_available: parseInt(formData.spots_available),
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null
      });
    }
  };

  const handleFundingToggle = (code) => {
    setFormData(prev => ({
      ...prev,
      funding_accepted: prev.funding_accepted.includes(code)
        ? prev.funding_accepted.filter(f => f !== code)
        : [...prev.funding_accepted, code]
    }));
  };

  const handlePublish = (opening) => {
    updateMutation.mutate({ id: opening.id, data: { status: 'pending_approval' } });
  };

  const columns = [
    {
      key: 'title',
      header: 'Opening',
      render: (value, row) => {
        const site = sites.find(s => s.id === row.site_id);
        const program = programs.find(p => p.id === row.program_activation_id);
        return (
          <div>
            <p className="font-medium text-slate-900">{value}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {site?.name || 'Unknown site'}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> {program?.program_code || 'Unknown program'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'spots_available',
      header: 'Spots',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Bed className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'opening_type',
      header: 'Type',
      render: (value) => {
        const type = OPENING_TYPES.find(t => t.value === value);
        return <Badge variant="outline">{type?.label || value}</Badge>;
      }
    },
    {
      key: 'funding_accepted',
      header: 'Funding',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {(value || []).slice(0, 3).map(f => (
            <Badge key={f} className="bg-slate-100 text-slate-700 text-xs">{f}</Badge>
          ))}
          {(value || []).length > 3 && (
            <Badge className="bg-slate-100 text-slate-700 text-xs">+{value.length - 3}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => row.status === 'draft' && (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePublish(row); }}>
          Submit for Review
        </Button>
      )
    }
  ];

  const canCreate = validationState.hasActiveLicense && 
                   validationState.hasActiveProgram && 
                   validationState.hasActiveSite;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Openings</h1>
          <p className="text-slate-500 mt-1">Create and manage your availability listings</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Create Opening
        </Button>
      </div>

      {/* Blockers Alert */}
      {blockReasons.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Cannot create openings yet</p>
              <p className="text-sm text-red-700 mt-1">Complete the following requirements first:</p>
              <div className="mt-3 space-y-2">
                {blockReasons.map((block, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                    <span className="text-sm text-red-800">{block.message}</span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={createPageUrl(block.link)}>
                        Fix <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setBlockReasons([])}>×</Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && openings.length === 0 ? (
        <Card className="p-12 text-center">
          <DoorOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No openings yet</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            {canCreate 
              ? "Create your first opening to start receiving referrals."
              : "Complete program and site setup first."
            }
          </p>
          {canCreate && (
            <Button className="mt-6" onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Opening
            </Button>
          )}
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={openings}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedOpening(row)}
        />
      )}

      {/* Create Opening Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Opening</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Site Selection */}
            <div>
              <Label>Site <span className="text-red-500">*</span></Label>
              <Select
                value={formData.site_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, site_id: v, program_activation_id: '' }))}
              >
                <SelectTrigger className={errors.site_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a site..." />
                </SelectTrigger>
                <SelectContent>
                  {validationState.activeSites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {site.name} - {site.city}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.site_id && <p className="text-xs text-red-500 mt-1">{errors.site_id}</p>}
            </div>

            {/* Program Selection */}
            {formData.site_id && (
              <div>
                <Label>Program <span className="text-red-500">*</span></Label>
                {availableProgramsForSite.length === 0 ? (
                  <Card className="p-3 bg-amber-50 border-amber-200 mt-1">
                    <p className="text-sm text-amber-700">No programs assigned to this site. Assign programs first.</p>
                  </Card>
                ) : (
                  <Select
                    value={formData.program_activation_id}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, program_activation_id: v }))}
                  >
                    <SelectTrigger className={errors.program_activation_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a program..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProgramsForSite.map(program => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.custom_name || program.program_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.program_activation_id && <p className="text-xs text-red-500 mt-1">{errors.program_activation_id}</p>}
              </div>
            )}

            {/* Opening Details */}
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Private Room Available - CRS"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the opening..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.opening_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, opening_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPENING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Spots <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.spots_available}
                  onChange={(e) => setFormData(prev => ({ ...prev, spots_available: e.target.value }))}
                  className={errors.spots_available ? 'border-red-500' : ''}
                />
              </div>

              <div>
                <Label>Available Date</Label>
                <Input
                  type="date"
                  value={formData.available_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, available_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.gender_requirement}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gender_requirement: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Age</Label>
                <Input
                  type="number"
                  value={formData.age_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_min: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label>Max Age</Label>
                <Input
                  type="number"
                  value={formData.age_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_max: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Funding */}
            <div>
              <Label>Funding Accepted <span className="text-red-500">*</span></Label>
              {errors.funding_accepted && <p className="text-xs text-red-500 mb-2">{errors.funding_accepted}</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {FUNDING_OPTIONS.map(fund => (
                  <label key={fund.code} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <Checkbox
                      checked={formData.funding_accepted.includes(fund.code)}
                      onCheckedChange={() => handleFundingToggle(fund.code)}
                    />
                    <span className="text-sm">{fund.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Special Considerations</Label>
              <Textarea
                value={formData.special_considerations}
                onChange={(e) => setFormData(prev => ({ ...prev, special_considerations: e.target.value }))}
                placeholder="Any additional requirements or notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Opening'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}