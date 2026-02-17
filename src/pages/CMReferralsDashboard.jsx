import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import RoleGuard from '@/components/auth/RoleGuard';
import { matchReferralToOpenings } from '@/components/matching/EnhancedMatchingAlgorithm';
import {
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  MapPin,
  Zap,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function CMReferralsDashboardContent() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [viewMatchesDialog, setViewMatchesDialog] = useState(false);
  const [matchedOpenings, setMatchedOpenings] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Fetch all referrals by case manager
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['cm-referrals'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 500);
    }
  });

  // Fetch openings for matching
  const { data: openings = [] } = useQuery({
    queryKey: ['active-openings'],
    queryFn: () => base44.entities.Opening.filter({ status: 'active' }, '-created_date', 500)
  });

  // Fetch supporting data
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.LicenseInstance.list()
  });

  const { data: capabilityProfiles = [] } = useQuery({
    queryKey: ['capability-profiles'],
    queryFn: () => base44.entities.CapabilityProfile.list()
  });

  // Update referral mutation
  const updateReferralMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cm-referrals']);
      toast.success('Referral updated successfully');
    },
    onError: () => {
      toast.error('Failed to update referral');
    }
  });

  // Get unique counties
  const uniqueCounties = [...new Set(referrals.map(r => r.client_county).filter(Boolean))].sort();

  // Filter and sort referrals
  const filteredReferrals = referrals
    .filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (countyFilter !== 'all' && r.client_county !== countyFilter) return false;
      if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          r.client_initials?.toLowerCase().includes(query) ||
          r.client_county?.toLowerCase().includes(query) ||
          r.funding_source?.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'created_date') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === 'match_score') {
        return (b.match_confidence_score || 0) - (a.match_confidence_score || 0);
      }
      return 0;
    });

  // Handle view matches
  const handleViewMatches = async (referral) => {
    setSelectedReferral(referral);
    setMatchLoading(true);
    setViewMatchesDialog(true);

    try {
      const matchResults = matchReferralToOpenings(
        referral,
        openings,
        organizations,
        sites,
        licenses,
        capabilityProfiles
      );
      
      setMatchedOpenings(matchResults.results || []);
    } catch (error) {
      console.error('Matching error:', error);
      toast.error('Failed to find matches');
    } finally {
      setMatchLoading(false);
    }
  };

  // Handle status updates
  const handleMarkAsPlaced = (referral) => {
    updateReferralMutation.mutate({
      id: referral.id,
      data: {
        status: 'placed',
        placement_status: 'placed',
        placement_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleWithdraw = (referral) => {
    updateReferralMutation.mutate({
      id: referral.id,
      data: { status: 'withdrawn' }
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      matched: 'bg-purple-100 text-purple-700',
      accepted: 'bg-green-100 text-green-700',
      declined: 'bg-red-100 text-red-700',
      placed: 'bg-emerald-100 text-emerald-700',
      withdrawn: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    const colors = {
      routine: 'text-slate-600',
      urgent: 'text-orange-600',
      crisis: 'text-red-600'
    };
    return colors[urgency] || 'text-slate-600';
  };

  // Active filters count
  const activeFiltersCount = [statusFilter, countyFilter, urgencyFilter].filter(f => f !== 'all').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Referrals</h1>
          <p className="text-slate-600 mt-1">
            Track and manage all your client referrals
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Referrals</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{referrals.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {referrals.filter(r => ['new', 'under_review', 'matched'].includes(r.status)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Placed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {referrals.filter(r => r.placement_status === 'placed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Match Score</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {referrals.length > 0
                    ? Math.round(
                        referrals
                          .filter(r => r.match_confidence_score)
                          .reduce((sum, r) => sum + r.match_confidence_score, 0) /
                          referrals.filter(r => r.match_confidence_score).length || 0
                      )
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by initials, county, or funding..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            {/* County Filter */}
            <Select value={countyFilter} onValueChange={setCountyFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {uniqueCounties.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Urgency Filter */}
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="crisis">Crisis</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_date">Newest First</SelectItem>
                <SelectItem value="match_score">Match Score</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setCountyFilter('all');
                  setUrgencyFilter('all');
                  setSearchQuery('');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredReferrals.length} Referral{filteredReferrals.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading referrals...</div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No referrals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr className="text-left text-sm text-slate-600">
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Age/Gender</th>
                    <th className="pb-3 font-medium">County</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Urgency</th>
                    <th className="pb-3 font-medium">Matches</th>
                    <th className="pb-3 font-medium">Match Score</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <div className="font-medium text-slate-900">
                          {referral.client_initials || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {referral.funding_source}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {referral.client_age || '?'} / {referral.client_gender || '?'}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {referral.client_county}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge className={cn('text-xs', getStatusColor(referral.status))}>
                          {referral.status?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <span className={cn('text-sm font-medium', getUrgencyColor(referral.urgency))}>
                          {referral.urgency}
                        </span>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMatches(referral)}
                          className="text-teal-600 hover:text-teal-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                      <td className="py-4">
                        {referral.match_confidence_score ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full',
                                  referral.match_confidence_score >= 80 ? 'bg-emerald-500' :
                                  referral.match_confidence_score >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                )}
                                style={{ width: `${referral.match_confidence_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {referral.match_confidence_score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not matched</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {new Date(referral.created_date).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {referral.status !== 'placed' && referral.status !== 'withdrawn' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPlaced(referral)}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Place
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleWithdraw(referral)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Matches Dialog */}
      <Dialog open={viewMatchesDialog} onOpenChange={setViewMatchesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Matched Openings</DialogTitle>
            <DialogDescription>
              {selectedReferral && (
                <>
                  Client: {selectedReferral.client_initials} • {selectedReferral.client_county} •{' '}
                  {selectedReferral.client_age}yo {selectedReferral.client_gender}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {matchLoading ? (
            <div className="text-center py-8">
              <Zap className="w-8 h-8 mx-auto mb-3 text-teal-600 animate-pulse" />
              <p className="text-slate-600">Finding matches...</p>
            </div>
          ) : matchedOpenings.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600">No matches found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedOpenings.map((match, idx) => (
                <Card key={match.opening_id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          <span className="text-teal-600">#{idx + 1}</span>
                          {match.organization?.legal_name || 'Unknown Provider'}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {match.site?.name} • {match.site?.city}, {match.site?.county}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{match.score}%</div>
                        <Badge
                          className={cn(
                            match.quality === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                            match.quality === 'good' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          )}
                        >
                          {match.quality} match
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-slate-700">{match.match_explanation}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(match.score_breakdown).map(([factor, score]) => (
                        score > 0 && (
                          <div key={factor} className="flex items-center gap-1">
                            <div className="w-12 bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-teal-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, score * 10)}%` }}
                              />
                            </div>
                            <span className="text-slate-600">{factor.replace('_', ' ')}</span>
                          </div>
                        )
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        <span className="font-medium">{match.opening.spots_available}</span> spot(s) available
                      </div>
                      <Button size="sm" variant="outline">
                        Contact Provider
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CMReferralsDashboard() {
  return (
    <RoleGuard allowedRoles={['cm', 'case_manager', 'admin']}>
      <CMReferralsDashboardContent />
    </RoleGuard>
  );
}