import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Plus,
  FileCheck,
  Upload,
  AlertTriangle,
  Calendar,
  Shield,
  ExternalLink
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const LICENSE_CATEGORIES = [
  { code: 'DHS_245D', name: '245D - Home and Community-Based Services', authority: 'DHS' },
  { code: 'MDH_144A', name: '144A - Home Care', authority: 'MDH' },
  { code: 'MDH_144G', name: '144G - Assisted Living', authority: 'MDH' }
];

const LICENSE_TYPES = {
  DHS_245D: [
    { code: '245D_BASIC', name: '245D Basic Services' },
    { code: '245D_INTENSIVE', name: '245D Intensive Services' },
    { code: '245D_BOTH', name: '245D Basic & Intensive' }
  ],
  MDH_144A: [
    { code: 'HC_BASIC', name: 'Basic Home Care' },
    { code: 'HC_COMPREHENSIVE', name: 'Comprehensive Home Care' },
    { code: 'HC_CLASS_A', name: 'Class A Home Care' },
    { code: 'HC_CLASS_F', name: 'Class F Home Care' }
  ],
  MDH_144G: [
    { code: 'ALF', name: 'Assisted Living Facility' },
    { code: 'ALD', name: 'Assisted Living with Dementia Care' },
    { code: 'ALFMC', name: 'ALF with Memory Care' }
  ]
};

export default function ProviderLicenses() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    license_category_code: '',
    license_type_code: '',
    license_number: '',
    effective_date: '',
    expiration_date: '',
    status: 'pending_verification',
    document_url: '',
    capacity: ''
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

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['my-licenses', org?.id],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: licenseTypes = [] } = useQuery({
    queryKey: ['license-types'],
    queryFn: () => base44.entities.LicenseType.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LicenseInstance.create({
      ...data,
      organization_id: org.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-licenses'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LicenseInstance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-licenses'] });
      setSelectedLicense(null);
    }
  });

  const resetForm = () => {
    setShowAddDialog(false);
    setFormStep(1);
    setErrors({});
    setFormData({
      license_category_code: '',
      license_type_code: '',
      license_number: '',
      effective_date: '',
      expiration_date: '',
      status: 'pending_verification',
      document_url: '',
      capacity: ''
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.license_number?.trim()) newErrors.license_number = 'License number is required';
    if (!formData.effective_date) newErrors.effective_date = 'Effective date is required';
    if (!formData.expiration_date) newErrors.expiration_date = 'Expiration date is required';
    
    if (formData.effective_date && formData.expiration_date) {
      if (new Date(formData.expiration_date) <= new Date(formData.effective_date)) {
        newErrors.expiration_date = 'Expiration date must be after effective date';
      }
    }

    if (formData.status === 'verified' && !formData.document_url) {
      newErrors.document_url = 'Document is required for verified status';
    }

    // Check for duplicate license number
    const duplicate = licenses.find(l => 
      l.license_number === formData.license_number && l.id !== selectedLicense?.id
    );
    if (duplicate) {
      newErrors.license_number = 'This license number already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const dbLicenseType = licenseTypes.find(lt => lt.code === formData.license_type_code);
      createMutation.mutate({
        ...formData,
        license_type_id: dbLicenseType?.id || '',
        issuing_authority: LICENSE_CATEGORIES.find(c => c.code === formData.license_category_code)?.authority
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, document_url: file_url }));
    }
  };

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (days <= 30) return { label: 'Expires Soon', color: 'bg-amber-100 text-amber-700' };
    if (days <= 60) return { label: 'Expiring', color: 'bg-yellow-100 text-yellow-700' };
    return null;
  };

  const columns = [
    {
      key: 'license_type_code',
      header: 'License Type',
      render: (value, row) => {
        const category = LICENSE_CATEGORIES.find(c => c.code === row.license_category_code);
        const type = LICENSE_TYPES[row.license_category_code]?.find(t => t.code === value);
        return (
          <div>
            <p className="font-medium text-slate-900">{type?.name || value}</p>
            <p className="text-xs text-slate-500">{category?.name}</p>
          </div>
        );
      }
    },
    {
      key: 'license_number',
      header: 'License #',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'issuing_authority',
      header: 'Authority',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'expiration_date',
      header: 'Expiration',
      render: (value) => {
        const status = getExpirationStatus(value);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{value ? format(new Date(value), 'MMM d, yyyy') : '-'}</span>
            {status && <Badge className={status.color}>{status.label}</Badge>}
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
      key: 'document_url',
      header: 'Document',
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> View
        </a>
      ) : (
        <span className="text-slate-400">None</span>
      )
    }
  ];

  const availableTypes = formData.license_category_code 
    ? LICENSE_TYPES[formData.license_category_code] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Licenses</h1>
          <p className="text-slate-500 mt-1">Manage your organization's licenses and certifications</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* Empty State */}
      {!isLoading && licenses.length === 0 ? (
        <Card className="p-12 text-center">
          <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No licenses yet</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            You must upload at least one license before selecting programs and creating openings.
          </p>
          <Button className="mt-6" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Your First License
          </Button>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={licenses}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedLicense(row)}
        />
      )}

      {/* Add License Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add License</DialogTitle>
          </DialogHeader>

          {formStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>License Category</Label>
                <Select
                  value={formData.license_category_code}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, license_category_code: v, license_type_code: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.code} value={cat.code}>
                        <div>
                          <p>{cat.name}</p>
                          <p className="text-xs text-slate-500">{cat.authority}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.license_category_code && (
                <div>
                  <Label>License Type</Label>
                  <Select
                    value={formData.license_type_code}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, license_type_code: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map(type => (
                        <SelectItem key={type.code} value={type.code}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button 
                  onClick={() => setFormStep(2)} 
                  disabled={!formData.license_category_code || !formData.license_type_code}
                >
                  Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg mb-4">
                <p className="text-sm font-medium">
                  {LICENSE_TYPES[formData.license_category_code]?.find(t => t.code === formData.license_type_code)?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {LICENSE_CATEGORIES.find(c => c.code === formData.license_category_code)?.name}
                </p>
              </div>

              <div>
                <Label>License Number <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="Enter license number"
                  className={errors.license_number ? 'border-red-500' : ''}
                />
                {errors.license_number && <p className="text-xs text-red-500 mt-1">{errors.license_number}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effective Date <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                    className={errors.effective_date ? 'border-red-500' : ''}
                  />
                  {errors.effective_date && <p className="text-xs text-red-500 mt-1">{errors.effective_date}</p>}
                </div>
                <div>
                  <Label>Expiration Date <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                    className={errors.expiration_date ? 'border-red-500' : ''}
                  />
                  {errors.expiration_date && <p className="text-xs text-red-500 mt-1">{errors.expiration_date}</p>}
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="verified">Active/Verified</SelectItem>
                    <SelectItem value="provisional">Provisional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Capacity (beds/clients)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || '' }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label>Upload License Document {formData.status === 'verified' && <span className="text-red-500">*</span>}</Label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="license-upload"
                  />
                  <label
                    htmlFor="license-upload"
                    className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${
                      errors.document_url ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {formData.document_url ? 'Document uploaded' : 'Click to upload PDF or image'}
                    </span>
                  </label>
                  {errors.document_url && <p className="text-xs text-red-500 mt-1">{errors.document_url}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setFormStep(1)}>Back</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Add License'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View License Dialog */}
      {selectedLicense && (
        <Dialog open={!!selectedLicense} onOpenChange={() => setSelectedLicense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>License Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">License Number</Label>
                  <p className="font-mono">{selectedLicense.license_number}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Status</Label>
                  <StatusBadge status={selectedLicense.status} />
                </div>
                <div>
                  <Label className="text-slate-500">Effective Date</Label>
                  <p>{selectedLicense.effective_date ? format(new Date(selectedLicense.effective_date), 'MMM d, yyyy') : '-'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Expiration Date</Label>
                  <p>{selectedLicense.expiration_date ? format(new Date(selectedLicense.expiration_date), 'MMM d, yyyy') : '-'}</p>
                </div>
              </div>
              {selectedLicense.document_url && (
                <div>
                  <Label className="text-slate-500">Document</Label>
                  <a 
                    href={selectedLicense.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" /> View Document
                  </a>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLicense(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}