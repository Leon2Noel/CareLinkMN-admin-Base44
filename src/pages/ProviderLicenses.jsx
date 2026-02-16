import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileCheck, Upload } from 'lucide-react';
import { format } from 'date-fns';

const LICENSE_CATEGORIES = [
  { code: 'MDH_144G', name: 'MDH 144G - Adult Foster Care', authority: 'MDH' },
  { code: 'DHS_245D', name: 'DHS 245D - Residential Services', authority: 'DHS' }
];

const LICENSE_TYPES = [
  { code: 'ALF', name: 'Assisted Living Facility', category: 'MDH_144G' },
  { code: 'ALD', name: 'Assisted Living with Dementia', category: 'MDH_144G' },
  { code: '245D_BASIC', name: '245D Basic', category: 'DHS_245D' },
  { code: '245D_INTENSIVE', name: '245D Intensive', category: 'DHS_245D' }
];

export default function ProviderLicenses() {
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org_id');
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({
    organization_id: orgId,
    license_category_code: '',
    license_type_code: '',
    license_number: '',
    issuing_authority: 'MDH',
    effective_date: '',
    expiration_date: '',
    capacity: '',
    status: 'pending_upload'
  });

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['provider-licenses', orgId],
    queryFn: () => base44.entities.LicenseInstance.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LicenseInstance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-licenses', orgId] });
      setShowAddDialog(false);
      setNewLicense({
        organization_id: orgId,
        license_category_code: '',
        license_type_code: '',
        license_number: '',
        issuing_authority: 'MDH',
        effective_date: '',
        expiration_date: '',
        capacity: '',
        status: 'pending_upload'
      });
    }
  });

  const handleCreate = () => {
    const selectedType = LICENSE_TYPES.find(t => t.code === newLicense.license_type_code);
    const category = LICENSE_CATEGORIES.find(c => c.code === selectedType?.category);
    
    createMutation.mutate({
      ...newLicense,
      license_category_code: selectedType?.category,
      issuing_authority: category?.authority,
      capacity: newLicense.capacity ? Number(newLicense.capacity) : null
    });
  };

  const columns = [
    {
      key: 'license_number',
      header: 'License Number',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'license_type_code',
      header: 'Type',
      render: (value) => {
        const type = LICENSE_TYPES.find(t => t.code === value);
        return type?.name || value;
      }
    },
    {
      key: 'issuing_authority',
      header: 'Authority'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'effective_date',
      header: 'Effective',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    },
    {
      key: 'expiration_date',
      header: 'Expires',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (value) => value || '-'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <PageHeader
        title="My Licenses"
        description="Manage your organization's licenses and certifications"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add License
          </Button>
        }
      />

      {licenses.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No Licenses Yet</h3>
            <p className="text-slate-600 mb-6">Add your first license to start offering programs</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add License
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={licenses}
          isLoading={isLoading}
          emptyMessage="No licenses found"
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="license_type">License Type *</Label>
              <Select
                value={newLicense.license_type_code}
                onValueChange={(v) => setNewLicense(prev => ({ ...prev, license_type_code: v }))}
              >
                <SelectTrigger id="license_type">
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map(type => (
                    <SelectItem key={type.code} value={type.code}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_number">License Number *</Label>
                <Input
                  id="license_number"
                  value={newLicense.license_number}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, license_number: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newLicense.capacity}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, capacity: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={newLicense.effective_date}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, effective_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={newLicense.expiration_date}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newLicense.license_type_code || !newLicense.license_number || createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding...' : 'Add License'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}