import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  DoorOpen,
  Building2,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const OPENING_TYPES = {
  immediate: { label: 'Immediate', color: 'bg-emerald-100 text-emerald-700' },
  upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' },
  waitlist: { label: 'Waitlist', color: 'bg-amber-100 text-amber-700' },
};

export default function Openings() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOpening, setSelectedOpening] = useState(null);

  const { data: openings = [], isLoading } = useQuery({
    queryKey: ['openings'],
    queryFn: () => base44.entities.Opening.list('-created_date', 500)
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

  const updateOpeningMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opening.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openings'] });
      setSelectedOpening(null);
    }
  });

  const filteredOpenings = useMemo(() => {
    return openings.filter(o => {
      const org = orgMap[o.organization_id];
      const site = siteMap[o.site_id];
      
      const matchesSearch = !searchTerm || 
        o.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesType = typeFilter === 'all' || o.opening_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [openings, searchTerm, statusFilter, typeFilter, orgMap, siteMap]);

  const stats = useMemo(() => ({
    active: openings.filter(o => o.status === 'active').length,
    pending: openings.filter(o => o.status === 'pending_approval').length,
    immediate: openings.filter(o => o.opening_type === 'immediate' && o.status === 'active').length,
    noncompliant: openings.filter(o => !o.is_compliant && o.status !== 'draft').length,
  }), [openings]);

  const columns = [
    {
      key: 'title',
      header: 'Opening',
      render: (value, row) => {
        const typeConfig = OPENING_TYPES[row.opening_type];
        return (
          <div>
            <p className="font-medium text-slate-900">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={typeConfig?.color}>{typeConfig?.label}</Badge>
              {!row.is_compliant && row.status !== 'draft' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Issues
                </Badge>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm">{org?.legal_name || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      key: 'site',
      header: 'Site',
      render: (_, row) => {
        const site = siteMap[row.site_id];
        return (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm">{site?.name || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{site?.city}, {site?.county}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'spots_available',
      header: 'Spots',
      render: (value) => (
        <Badge variant="outline">{value || 1} available</Badge>
      )
    },
    {
      key: 'funding_accepted',
      header: 'Funding',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {(value || []).slice(0, 2).map(f => (
            <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
          ))}
          {(value || []).length > 2 && (
            <Badge variant="secondary" className="text-xs">+{value.length - 2}</Badge>
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
      key: 'metrics',
      header: 'Metrics',
      render: (_, row) => (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {row.views_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {row.inquiries_count || 0}
          </span>
        </div>
      )
    }
  ];

  const handleApprove = () => {
    updateOpeningMutation.mutate({
      id: selectedOpening.id,
      data: { status: 'active', is_compliant: true }
    });
  };

  const handleReject = () => {
    updateOpeningMutation.mutate({
      id: selectedOpening.id,
      data: { status: 'withdrawn' }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Openings"
        description="Review and manage provider openings and availability"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-sm text-slate-500">Active Openings</p>
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
              <p className="text-sm text-slate-500">Pending Approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DoorOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.immediate}</p>
              <p className="text-sm text-slate-500">Immediate Availability</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.noncompliant}</p>
              <p className="text-sm text-slate-500">Compliance Issues</p>
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
                placeholder="Search openings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Openings Table */}
      <DataTable
        columns={columns}
        data={filteredOpenings}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedOpening(row)}
        emptyMessage="No openings found"
      />

      {/* Opening Detail Dialog */}
      {selectedOpening && (
        <Dialog open={!!selectedOpening} onOpenChange={() => setSelectedOpening(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedOpening.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOpening.status} />
                <Badge className={OPENING_TYPES[selectedOpening.opening_type]?.color}>
                  {OPENING_TYPES[selectedOpening.opening_type]?.label}
                </Badge>
                {!selectedOpening.is_compliant && selectedOpening.status !== 'draft' && (
                  <Badge variant="destructive">Compliance Issues</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Provider</p>
                  <p className="font-medium">{orgMap[selectedOpening.organization_id]?.legal_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Site</p>
                  <p className="font-medium">{siteMap[selectedOpening.site_id]?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Spots Available</p>
                  <p className="font-medium">{selectedOpening.spots_available || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Available Date</p>
                  <p className="font-medium">
                    {selectedOpening.available_date 
                      ? format(new Date(selectedOpening.available_date), 'MMM d, yyyy')
                      : 'Immediate'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Gender</p>
                  <Badge variant="outline" className="capitalize">{selectedOpening.gender_requirement}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Age Range</p>
                  <p className="font-medium">
                    {selectedOpening.age_min || 'Any'} - {selectedOpening.age_max || 'Any'}
                  </p>
                </div>
              </div>

              {selectedOpening.funding_accepted?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Funding Accepted</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedOpening.funding_accepted.map(f => (
                      <Badge key={f} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedOpening.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-sm">{selectedOpening.description}</p>
                </div>
              )}

              {selectedOpening.validation_errors?.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-2">Validation Errors</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {selectedOpening.validation_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedOpening.views_count || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {selectedOpening.inquiries_count || 0} inquiries
                </span>
              </div>
            </div>

            {selectedOpening.status === 'pending_approval' && (
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleReject}
                  disabled={updateOpeningMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={updateOpeningMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}