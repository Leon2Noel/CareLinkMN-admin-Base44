import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const PROGRAM_MODELS = [
  { code: 'CRS', name: 'Community Residential Services', category: 'residential', requiredLicenses: ['245D_INTENSIVE', '245D_BOTH'] },
  { code: 'SLS', name: 'Supported Living Services', category: 'residential', requiredLicenses: ['245D_BASIC', '245D_INTENSIVE', '245D_BOTH'] },
  { code: 'IHS', name: 'In-Home Support Services', category: 'in_home', requiredLicenses: ['245D_BASIC', '245D_BOTH', 'HC_BASIC', 'HC_COMPREHENSIVE'] },
  { code: 'RESPITE', name: 'Respite Care', category: 'respite', requiredLicenses: ['245D_BASIC', '245D_INTENSIVE', '245D_BOTH'] },
  { code: 'DAY_SERVICES', name: 'Day Services/Day Training', category: 'day_services', requiredLicenses: ['245D_BASIC', '245D_BOTH'] },
  { code: 'EMPLOYMENT', name: 'Employment Services', category: 'employment', requiredLicenses: ['245D_BASIC', '245D_BOTH'] },
  { code: 'CRISIS', name: 'Crisis Stabilization', category: 'crisis', requiredLicenses: ['245D_INTENSIVE', '245D_BOTH'] },
  { code: 'ALF_SERVICES', name: 'Assisted Living Services', category: 'residential', requiredLicenses: ['ALF', 'ALD', 'ALFMC'] },
  { code: 'MEMORY_CARE', name: 'Memory Care', category: 'residential', requiredLicenses: ['ALD', 'ALFMC'] }
];

const CATEGORY_LABELS = {
  residential: { label: 'Residential', color: 'bg-blue-100 text-blue-700' },
  in_home: { label: 'In-Home', color: 'bg-green-100 text-green-700' },
  respite: { label: 'Respite', color: 'bg-purple-100 text-purple-700' },
  day_services: { label: 'Day Services', color: 'bg-amber-100 text-amber-700' },
  employment: { label: 'Employment', color: 'bg-cyan-100 text-cyan-700' },
  crisis: { label: 'Crisis', color: 'bg-red-100 text-red-700' }
};

export default function ProviderPrograms() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  const [formData, setFormData] = useState({
    program_code: '',
    qualifying_license_id: '',
    custom_name: '',
    description: ''
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

  const { data: licenses = [] } = useQuery({
    queryKey: ['my-licenses', org?.id],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['my-programs', org?.id],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['my-capabilities', org?.id],
    queryFn: () => base44.entities.CapabilityProfile.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  // Get active/verified licenses
  const activeLicenses = useMemo(() => 
    licenses.filter(l => ['verified', 'active', 'provisional'].includes(l.status) && 
      (!l.expiration_date || new Date(l.expiration_date) > new Date())
    ),
    [licenses]
  );

  // Get available programs based on licenses
  const availablePrograms = useMemo(() => {
    const licenseTypeCodes = activeLicenses.map(l => l.license_type_code);
    return PROGRAM_MODELS.filter(p => 
      p.requiredLicenses.some(req => licenseTypeCodes.includes(req))
    );
  }, [activeLicenses]);

  // Get qualifying licenses for selected program
  const qualifyingLicenses = useMemo(() => {
    if (!formData.program_code) return [];
    const programModel = PROGRAM_MODELS.find(p => p.code === formData.program_code);
    if (!programModel) return [];
    
    return activeLicenses.filter(l => 
      programModel.requiredLicenses.includes(l.license_type_code)
    );
  }, [formData.program_code, activeLicenses]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProgramActivation.create({
      ...data,
      organization_id: org.id,
      status: 'active',
      effective_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
      resetForm();
    }
  });

  const resetForm = () => {
    setShowAddDialog(false);
    setFormData({
      program_code: '',
      qualifying_license_id: '',
      custom_name: '',
      description: ''
    });
  };

  const handleSubmit = () => {
    if (formData.program_code && formData.qualifying_license_id) {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      key: 'program_code',
      header: 'Program',
      render: (value, row) => {
        const model = PROGRAM_MODELS.find(p => p.code === value);
        const category = CATEGORY_LABELS[model?.category];
        return (
          <div>
            <p className="font-medium text-slate-900">{row.custom_name || model?.name || value}</p>
            {category && <Badge className={`${category.color} mt-1`}>{category.label}</Badge>}
          </div>
        );
      }
    },
    {
      key: 'qualifying_license_id',
      header: 'Linked License',
      render: (value) => {
        const license = licenses.find(l => l.id === value);
        return license ? (
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-mono">{license.license_number}</span>
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'capability_configured',
      header: 'Capabilities',
      render: (_, row) => {
        const hasCapability = capabilities.some(c => c.program_activation_id === row.id);
        return hasCapability ? (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Configured
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3 mr-1" /> Not Set
          </Badge>
        );
      }
    },
    {
      key: 'effective_date',
      header: 'Active Since',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    }
  ];

  const hasNoLicenses = activeLicenses.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
          <p className="text-slate-500 mt-1">Activate service programs based on your licenses</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} disabled={hasNoLicenses}>
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      {/* No Licenses Warning */}
      {hasNoLicenses && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">No qualifying licenses found</p>
                <p className="text-sm text-amber-700">Upload a qualifying license first to activate programs.</p>
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
      {!isLoading && programs.length === 0 && !hasNoLicenses ? (
        <Card className="p-12 text-center">
          <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No programs activated</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            Activate programs to define the services you offer and create openings.
          </p>
          <Button className="mt-6" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Activate Your First Program
          </Button>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={programs}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedProgram(row)}
        />
      )}

      {/* Add Program Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Activate Program</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {availablePrograms.length === 0 ? (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">No programs available</p>
                    <p className="text-sm text-red-700">Your current licenses don't qualify for any programs.</p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div>
                  <Label>Program Model</Label>
                  <Select
                    value={formData.program_code}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, program_code: v, qualifying_license_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrograms.map(program => {
                        const category = CATEGORY_LABELS[program.category];
                        return (
                          <SelectItem key={program.code} value={program.code}>
                            <div className="flex items-center gap-2">
                              <span>{program.name}</span>
                              <Badge className={category?.color}>{category?.label}</Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {formData.program_code && (
                  <>
                    <div>
                      <Label>Qualifying License</Label>
                      {qualifyingLicenses.length === 0 ? (
                        <Card className="p-3 bg-amber-50 border-amber-200 mt-1">
                          <p className="text-sm text-amber-700">No active licenses qualify for this program.</p>
                        </Card>
                      ) : (
                        <Select
                          value={formData.qualifying_license_id}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, qualifying_license_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select license..." />
                          </SelectTrigger>
                          <SelectContent>
                            {qualifyingLicenses.map(license => (
                              <SelectItem key={license.id} value={license.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{license.license_number}</span>
                                  <StatusBadge status={license.status} size="sm" />
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label>Custom Program Name (optional)</Label>
                      <Input
                        value={formData.custom_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, custom_name: e.target.value }))}
                        placeholder="e.g., My Community Living Program"
                      />
                    </div>

                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your program..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.program_code || !formData.qualifying_license_id || createMutation.isPending}
            >
              {createMutation.isPending ? 'Activating...' : 'Activate Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}