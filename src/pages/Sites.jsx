import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus,
  MapPin,
  Building2,
  Users,
  Home,
  Phone,
  ExternalLink,
  X
} from 'lucide-react';

const SITE_TYPES = {
  residential: { label: 'Residential', icon: Home, color: 'text-blue-600 bg-blue-50' },
  day_program: { label: 'Day Program', icon: Users, color: 'text-purple-600 bg-purple-50' },
  office: { label: 'Office', icon: Building2, color: 'text-slate-600 bg-slate-50' },
  community_based: { label: 'Community Based', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
};

export default function Sites() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSite, setSelectedSite] = useState(null);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-created_date', 500)
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

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      const org = orgMap[s.organization_id];
      
      const matchesSearch = !searchTerm || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.county?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || s.site_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [sites, searchTerm, typeFilter, statusFilter, orgMap]);

  const columns = [
    {
      key: 'name',
      header: 'Site',
      render: (value, row) => {
        const typeConfig = SITE_TYPES[row.site_type] || SITE_TYPES.residential;
        const Icon = typeConfig.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{row.address}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'organization',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <span className="text-sm text-slate-600">{org?.legal_name || 'Unknown'}</span>
        );
      }
    },
    {
      key: 'location',
      header: 'Location',
      render: (_, row) => (
        <div>
          <p className="text-sm">{row.city}, {row.state}</p>
          <p className="text-xs text-slate-500">{row.county} County</p>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${row.total_capacity ? (row.current_census / row.total_capacity) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-slate-600">
            {row.current_census || 0}/{row.total_capacity || 0}
          </span>
        </div>
      )
    },
    {
      key: 'site_type',
      header: 'Type',
      render: (value) => {
        const typeConfig = SITE_TYPES[value];
        return typeConfig ? (
          <Badge variant="outline">{typeConfig.label}</Badge>
        ) : value;
      }
    },
    {
      key: 'gender_restriction',
      header: 'Gender',
      render: (value) => (
        <Badge variant="secondary" className="capitalize">
          {value === 'all' ? 'All' : value}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites & Locations"
        description="Manage provider sites, capacity, and location assignments"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(SITE_TYPES).map(([key, config]) => {
          const count = sites.filter(s => s.site_type === key).length;
          const Icon = config.icon;
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-sm text-slate-500">{config.label}</p>
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
                placeholder="Search by site name, city, county, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(SITE_TYPES).map(([key, val]) => (
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
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sites Table */}
      <DataTable
        columns={columns}
        data={filteredSites}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedSite(row)}
        emptyMessage="No sites found"
      />

      {/* Site Detail Dialog */}
      {selectedSite && (
        <Dialog open={!!selectedSite} onOpenChange={() => setSelectedSite(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedSite.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium">{selectedSite.address}</p>
                  <p>{selectedSite.city}, {selectedSite.state} {selectedSite.zip_code}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">County</p>
                  <p className="font-medium">{selectedSite.county}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Capacity</p>
                  <p className="font-medium">{selectedSite.current_census || 0} / {selectedSite.total_capacity || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedSite.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Gender Restriction</p>
                  <Badge variant="secondary" className="capitalize mt-1">
                    {selectedSite.gender_restriction === 'all' ? 'All Genders' : selectedSite.gender_restriction}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Age Range</p>
                  <p className="font-medium">
                    {selectedSite.age_restriction_min || 'Any'} - {selectedSite.age_restriction_max || 'Any'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-2">Status</p>
                <StatusBadge status={selectedSite.status} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}