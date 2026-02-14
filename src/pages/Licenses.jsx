import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus,
  Filter,
  Download,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  Calendar,
  Building2,
  Shield
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

// Minnesota License Categories and Types
const LICENSE_CATEGORIES = [
  { code: 'MDH_144G', name: 'MDH 144G - Housing with Services', authority: 'MDH' },
  { code: 'MDH_144A', name: 'MDH 144A - Nursing Homes', authority: 'MDH' },
  { code: 'DHS_245D', name: 'DHS 245D - Home and Community-Based Services', authority: 'DHS' },
  { code: 'DHS_245A', name: 'DHS 245A - Human Services Licensing', authority: 'DHS' },
];

const LICENSE_TYPES = {
  'MDH_144G': [
    { code: 'HWS_REGISTERED', name: 'Housing with Services - Registered', programs: ['ASSISTED_LIVING'] },
    { code: 'ALF', name: 'Assisted Living Facility', programs: ['ASSISTED_LIVING', 'MEMORY_CARE'] },
    { code: 'ALD', name: 'Assisted Living with Dementia Care', programs: ['ASSISTED_LIVING', 'MEMORY_CARE', 'DEMENTIA_CARE'] },
  ],
  'MDH_144A': [
    { code: 'SNF', name: 'Skilled Nursing Facility', programs: ['SNF', 'MEMORY_CARE', 'REHAB'] },
    { code: 'ICF', name: 'Intermediate Care Facility', programs: ['ICF'] },
  ],
  'DHS_245D': [
    { code: '245D_BASIC', name: '245D Basic Support Services', programs: ['SLS', 'RESPITE', 'IN_HOME'] },
    { code: '245D_INTENSIVE', name: '245D Intensive Support Services', programs: ['CRS', 'IHS', 'CRISIS'] },
  ],
  'DHS_245A': [
    { code: 'ADULT_FOSTER', name: 'Adult Foster Care', programs: ['AFC'] },
    { code: 'CHILD_FOSTER', name: 'Child Foster Care', programs: ['CFC'] },
  ],
};

export default function Licenses() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['all-licenses'],
    queryFn: () => base44.entities.LicenseInstance.list('-created_date', 500)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const orgMap = useMemo(() => {
    return organizations.reduce((acc, org) => {
      acc[org.id] = org;
      return acc;
    }, {});
  }, [organizations]);

  const updateLicenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LicenseInstance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-licenses'] });
      setShowVerifyDialog(false);
      setSelectedLicense(null);
      setVerificationNotes('');
    }
  });

  const filteredLicenses = useMemo(() => {
    return licenses.filter(l => {
      const org = orgMap[l.organization_id];
      const matchesSearch = !searchTerm || 
        l.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || l.license_category_code === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [licenses, searchTerm, statusFilter, categoryFilter, orgMap]);

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;
    const daysUntil = differenceInDays(new Date(expirationDate), new Date());
    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 30) return 'expiring_soon';
    return null;
  };

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
      key: 'license_type_code',
      header: 'License Type',
      render: (value, row) => {
        const category = LICENSE_CATEGORIES.find(c => c.code === row.license_category_code);
        const types = LICENSE_TYPES[row.license_category_code] || [];
        const type = types.find(t => t.code === value);
        return (
          <div>
            <p className="font-medium text-slate-900">{type?.name || value}</p>
            <p className="text-xs text-slate-500">{category?.name || row.license_category_code}</p>
          </div>
        );
      }
    },
    {
      key: 'license_number',
      header: 'License #',
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'expiration_date',
      header: 'Expiration',
      render: (value) => {
        if (!value) return <span className="text-slate-400">-</span>;
        const expirationStatus = getExpirationStatus(value);
        return (
          <div className="flex items-center gap-2">
            <span className={expirationStatus === 'expired' ? 'text-red-600' : expirationStatus === 'expiring_soon' ? 'text-amber-600' : ''}>
              {format(new Date(value), 'MMM d, yyyy')}
            </span>
            {expirationStatus === 'expired' && (
              <Badge variant="destructive" className="text-xs">Expired</Badge>
            )}
            {expirationStatus === 'expiring_soon' && (
              <Badge className="bg-amber-100 text-amber-700 text-xs">Soon</Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'issuing_authority',
      header: 'Authority',
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (_, row) => (
        <div className="flex gap-1">
          {row.document_url && (
            <Button variant="ghost" size="icon" asChild>
              <a href={row.document_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          {row.status === 'pending_verification' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedLicense(row);
                setShowVerifyDialog(true);
              }}
            >
              Review
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleVerify = (approved) => {
    updateLicenseMutation.mutate({
      id: selectedLicense.id,
      data: {
        status: approved ? 'verified' : 'rejected',
        verification_notes: verificationNotes,
        verified_at: new Date().toISOString()
      }
    });
  };

  // Stats
  const stats = useMemo(() => {
    const verified = licenses.filter(l => l.status === 'verified').length;
    const pending = licenses.filter(l => l.status === 'pending_verification').length;
    const expiring = licenses.filter(l => {
      if (!l.expiration_date || l.status !== 'verified') return false;
      const daysUntil = differenceInDays(new Date(l.expiration_date), new Date());
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;
    const expired = licenses.filter(l => {
      if (!l.expiration_date) return false;
      return new Date(l.expiration_date) < new Date();
    }).length;
    return { verified, pending, expiring, expired };
  }, [licenses]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="License Registry"
        description="Verify and manage provider licenses across all regulatory categories"
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.verified}</p>
              <p className="text-sm text-slate-500">Verified</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
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
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.expiring}</p>
              <p className="text-sm text-slate-500">Expiring Soon</p>
            </div>
          </div>
        </Card>
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by license number or provider name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending_verification">Pending Review</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {LICENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.code} value={cat.code}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Licenses Table */}
      <DataTable
        columns={columns}
        data={filteredLicenses}
        isLoading={isLoading}
        emptyMessage="No licenses found"
      />

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review License</DialogTitle>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">License Number</p>
                  <p className="font-mono font-medium">{selectedLicense.license_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Issuing Authority</p>
                  <p className="font-medium">{selectedLicense.issuing_authority}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Effective Date</p>
                  <p>{selectedLicense.effective_date ? format(new Date(selectedLicense.effective_date), 'MMM d, yyyy') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Expiration Date</p>
                  <p>{selectedLicense.expiration_date ? format(new Date(selectedLicense.expiration_date), 'MMM d, yyyy') : '-'}</p>
                </div>
              </div>

              {selectedLicense.document_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Document</p>
                  <Button variant="outline" asChild className="w-full">
                    <a href={selectedLicense.document_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View License Document
                    </a>
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Verification Notes</Label>
                <Textarea
                  id="notes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleVerify(false)}
              disabled={updateLicenseMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              onClick={() => handleVerify(true)}
              disabled={updateLicenseMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verify License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}