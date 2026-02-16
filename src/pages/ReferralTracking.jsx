import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  GitMerge,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Building2,
  Gauge
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReferralTracking() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReferral, setSelectedReferral] = useState(null);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['my-referrals', statusFilter],
    queryFn: async () => {
      let results = await base44.entities.Referral.list('-created_date', 100);
      if (statusFilter !== 'all') {
        results = results.filter(r => r.status === statusFilter);
      }
      return results;
    }
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['openings'],
    queryFn: () => base44.entities.Opening.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const getOrg = (id) => organizations.find(o => o.id === id);
  const getOpening = (id) => openings.find(o => o.id === id);
  const getSite = (id) => sites.find(s => s.id === id);

  // Stats
  const stats = {
    total: referrals.length,
    new: referrals.filter(r => r.status === 'new').length,
    under_review: referrals.filter(r => r.status === 'under_review').length,
    accepted: referrals.filter(r => r.status === 'accepted').length,
    placed: referrals.filter(r => r.status === 'placed').length,
    avgMatchScore: referrals.length > 0
      ? Math.round(referrals.reduce((sum, r) => sum + (r.match_confidence_score || 0), 0) / referrals.length)
      : 0
  };

  const columns = [
    {
      key: 'client_initials',
      header: 'Client',
      render: (value, row) => (
        <div>
          <p className="font-medium text-slate-900">{value || 'N/A'}</p>
          <p className="text-xs text-slate-500">
            Age {row.client_age} • {row.client_gender || 'N/A'}
          </p>
        </div>
      )
    },
    {
      key: 'organization_id',
      header: 'Provider',
      render: (value, row) => {
        const org = getOrg(value);
        const site = getSite(row.site_id);
        return (
          <div>
            <p className="text-sm text-slate-900">{org?.legal_name || 'Unknown'}</p>
            {site && (
              <p className="text-xs text-slate-500">{site.city}, {site.county}</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'funding_source',
      header: 'Funding',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'match_confidence_score',
      header: 'Match Score',
      render: (value) => {
        if (!value) return <span className="text-slate-400">N/A</span>;
        return (
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-md text-sm font-medium ${
              value >= 80 ? 'bg-emerald-100 text-emerald-700' :
              value >= 60 ? 'bg-blue-100 text-blue-700' :
              value >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {value}%
            </div>
          </div>
        );
      }
    },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (value) => (
        <Badge variant={
          value === 'crisis' ? 'destructive' :
          value === 'urgent' ? 'default' : 'secondary'
        }>
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'created_date',
      header: 'Submitted',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <PageHeader
        title="Referral Tracking"
        description="Monitor and manage your submitted client referrals"
        actions={
          <Button asChild>
            <Link to={createPageUrl('ReferralBuilder')}>
              <Plus className="w-4 h-4 mr-2" />
              New Referral
            </Link>
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4 text-center">
          <GitMerge className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total Referrals</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.new}</p>
          <p className="text-xs text-slate-500">New</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.under_review}</p>
          <p className="text-xs text-slate-500">Under Review</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.accepted}</p>
          <p className="text-xs text-slate-500">Accepted</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.placed}</p>
          <p className="text-xs text-slate-500">Placed</p>
        </Card>
        <Card className="p-4 text-center">
          <Gauge className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.avgMatchScore}%</p>
          <p className="text-xs text-slate-500">Avg Match</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Referrals Table */}
      <DataTable
        columns={columns}
        data={referrals}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedReferral(row)}
        emptyMessage="No referrals submitted yet"
      />

      {/* Referral Detail Dialog */}
      <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-6">
              {/* Match Score */}
              {selectedReferral.match_confidence_score && (
                <Card className={`${
                  selectedReferral.match_confidence_score >= 80 ? 'bg-emerald-50 border-emerald-200' :
                  selectedReferral.match_confidence_score >= 60 ? 'bg-blue-50 border-blue-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                      selectedReferral.match_confidence_score >= 80 ? 'bg-emerald-600 text-white' :
                      selectedReferral.match_confidence_score >= 60 ? 'bg-blue-600 text-white' :
                      'bg-amber-600 text-white'
                    }`}>
                      {selectedReferral.match_confidence_score}%
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Match Confidence</p>
                      <p className="text-sm text-slate-600">{selectedReferral.match_explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Client Information
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Initials</p>
                    <p className="font-medium">{selectedReferral.client_initials || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Age</p>
                    <p className="font-medium">{selectedReferral.client_age}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gender</p>
                    <p className="font-medium">{selectedReferral.client_gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">County</p>
                    <p className="font-medium">{selectedReferral.client_county}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Funding</p>
                    <Badge>{selectedReferral.funding_source}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Urgency</p>
                    <Badge variant={selectedReferral.urgency === 'crisis' ? 'destructive' : 'default'}>
                      {selectedReferral.urgency}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Provider Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Matched Provider
                </h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium text-slate-900 mb-1">
                    {getOrg(selectedReferral.organization_id)?.legal_name}
                  </p>
                  {getSite(selectedReferral.site_id) && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getSite(selectedReferral.site_id).city}, {getSite(selectedReferral.site_id).county} County
                    </p>
                  )}
                </div>
              </div>

              {/* Summaries */}
              {(selectedReferral.diagnosis_summary || selectedReferral.behavioral_summary || selectedReferral.medical_summary) && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Clinical Summary</h3>
                  <div className="space-y-3">
                    {selectedReferral.diagnosis_summary && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Diagnosis</p>
                        <p className="text-sm text-slate-700">{selectedReferral.diagnosis_summary}</p>
                      </div>
                    )}
                    {selectedReferral.behavioral_summary && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Behavioral</p>
                        <p className="text-sm text-slate-700">{selectedReferral.behavioral_summary}</p>
                      </div>
                    )}
                    {selectedReferral.medical_summary && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Medical</p>
                        <p className="text-sm text-slate-700">{selectedReferral.medical_summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Status</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedReferral.status} size="lg" />
                  <span className="text-sm text-slate-600">
                    Submitted {format(new Date(selectedReferral.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}