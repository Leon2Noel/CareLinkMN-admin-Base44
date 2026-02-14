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
import { Progress } from '@/components/ui/progress';
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
  GitMerge,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building2,
  Zap,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const URGENCY_CONFIG = {
  routine: { label: 'Routine', color: 'bg-slate-100 text-slate-700', icon: Clock },
  urgent: { label: 'Urgent', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  crisis: { label: 'Crisis', color: 'bg-red-100 text-red-700', icon: Zap },
};

export default function Matching() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedReferral, setSelectedReferral] = useState(null);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 200)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['openings-lookup'],
    queryFn: () => base44.entities.Opening.list()
  });

  const orgMap = useMemo(() => organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [organizations]);
  const openingMap = useMemo(() => openings.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [openings]);

  const updateReferralMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setSelectedReferral(null);
    }
  });

  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      const matchesSearch = !searchTerm || 
        r.client_initials?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_county?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
      
      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [referrals, searchTerm, statusFilter, urgencyFilter]);

  const stats = useMemo(() => ({
    new: referrals.filter(r => r.status === 'new').length,
    underReview: referrals.filter(r => r.status === 'under_review').length,
    matched: referrals.filter(r => r.status === 'matched').length,
    crisis: referrals.filter(r => r.urgency === 'crisis' && !['placed', 'declined', 'withdrawn'].includes(r.status)).length,
  }), [referrals]);

  const columns = [
    {
      key: 'client',
      header: 'Client',
      render: (_, row) => {
        const urgencyConfig = URGENCY_CONFIG[row.urgency];
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{row.client_initials || 'N/A'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">{row.client_age}yo, {row.client_gender}</span>
                <Badge className={urgencyConfig?.color}>{urgencyConfig?.label}</Badge>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'referrer',
      header: 'Referrer',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium">{row.referrer_name}</p>
          <p className="text-xs text-slate-500 capitalize">{row.referral_source?.replace('_', ' ')}</p>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{row.client_county} County</span>
        </div>
      )
    },
    {
      key: 'funding_source',
      header: 'Funding',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'match_confidence',
      header: 'Match Score',
      render: (_, row) => {
        if (!row.match_confidence_score) return <span className="text-slate-400">-</span>;
        return (
          <div className="flex items-center gap-2">
            <Progress value={row.match_confidence_score} className="w-16 h-2" />
            <span className={`text-sm font-medium ${
              row.match_confidence_score >= 80 ? 'text-emerald-600' :
              row.match_confidence_score >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {row.match_confidence_score}%
            </span>
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
      key: 'created_date',
      header: 'Received',
      render: (value) => (
        <span className="text-sm text-slate-500">
          {value ? format(new Date(value), 'MMM d, HH:mm') : '-'}
        </span>
      )
    }
  ];

  const handleStatusUpdate = (newStatus) => {
    updateReferralMutation.mutate({
      id: selectedReferral.id,
      data: { status: newStatus }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching Engine"
        description="Review referrals and match clients to appropriate provider openings"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <GitMerge className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.new}</p>
              <p className="text-sm text-slate-500">New Referrals</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.underReview}</p>
              <p className="text-sm text-slate-500">Under Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.matched}</p>
              <p className="text-sm text-slate-500">Matched</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.crisis}</p>
              <p className="text-sm text-slate-500">Crisis Cases</p>
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
                placeholder="Search by client initials, referrer, or county..."
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="crisis">Crisis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <DataTable
        columns={columns}
        data={filteredReferrals}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedReferral(row)}
        emptyMessage="No referrals found"
      />

      {/* Referral Detail Dialog */}
      {selectedReferral && (
        <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                Referral Details
                <StatusBadge status={selectedReferral.status} />
                <Badge className={URGENCY_CONFIG[selectedReferral.urgency]?.color}>
                  {URGENCY_CONFIG[selectedReferral.urgency]?.label}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Client Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Initials</p>
                    <p className="font-medium">{selectedReferral.client_initials}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Age</p>
                    <p className="font-medium">{selectedReferral.client_age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Gender</p>
                    <p className="font-medium capitalize">{selectedReferral.client_gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">County</p>
                    <p className="font-medium">{selectedReferral.client_county}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Funding</p>
                    <Badge variant="outline">{selectedReferral.funding_source}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Desired Start</p>
                    <p className="font-medium">
                      {selectedReferral.desired_start_date 
                        ? format(new Date(selectedReferral.desired_start_date), 'MMM d, yyyy')
                        : 'ASAP'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Clinical Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedReferral.diagnosis_summary && (
                    <div>
                      <p className="text-sm text-slate-500">Diagnosis</p>
                      <p className="text-sm">{selectedReferral.diagnosis_summary}</p>
                    </div>
                  )}
                  {selectedReferral.behavioral_summary && (
                    <div>
                      <p className="text-sm text-slate-500">Behavioral Needs</p>
                      <p className="text-sm">{selectedReferral.behavioral_summary}</p>
                    </div>
                  )}
                  {selectedReferral.medical_summary && (
                    <div>
                      <p className="text-sm text-slate-500">Medical Needs</p>
                      <p className="text-sm">{selectedReferral.medical_summary}</p>
                    </div>
                  )}
                  {selectedReferral.support_needs && (
                    <div>
                      <p className="text-sm text-slate-500">Support Needs</p>
                      <p className="text-sm">{selectedReferral.support_needs}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referrer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Referrer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium">{selectedReferral.referrer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Source</p>
                    <p className="font-medium capitalize">{selectedReferral.referral_source?.replace('_', ' ')}</p>
                  </div>
                  {selectedReferral.referrer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${selectedReferral.referrer_email}`} className="text-blue-600 hover:underline">
                        {selectedReferral.referrer_email}
                      </a>
                    </div>
                  )}
                  {selectedReferral.referrer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedReferral.referrer_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Match Info */}
              {selectedReferral.match_confidence_score && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Match Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">Confidence Score</span>
                      <Progress value={selectedReferral.match_confidence_score} className="flex-1 h-3" />
                      <span className={`font-bold ${
                        selectedReferral.match_confidence_score >= 80 ? 'text-emerald-600' :
                        selectedReferral.match_confidence_score >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {selectedReferral.match_confidence_score}%
                      </span>
                    </div>
                    {selectedReferral.match_explanation && (
                      <div>
                        <p className="text-sm text-slate-500">Explanation</p>
                        <p className="text-sm">{selectedReferral.match_explanation}</p>
                      </div>
                    )}
                    {selectedReferral.risk_flags?.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm font-medium text-amber-800 mb-2">Risk Flags</p>
                        <ul className="list-disc list-inside text-sm text-amber-700">
                          {selectedReferral.risk_flags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              {selectedReferral.status === 'new' && (
                <Button onClick={() => handleStatusUpdate('under_review')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Start Review
                </Button>
              )}
              {selectedReferral.status === 'under_review' && (
                <>
                  <Button variant="outline" onClick={() => handleStatusUpdate('declined')}>
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Cannot Match
                  </Button>
                  <Button onClick={() => handleStatusUpdate('matched')} className="bg-emerald-600 hover:bg-emerald-700">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Confirm Match
                  </Button>
                </>
              )}
              {selectedReferral.status === 'matched' && (
                <Button onClick={() => handleStatusUpdate('placed')} className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Placed
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}