import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RoleGuard from '@/components/auth/RoleGuard';
import { CheckCircle2, XCircle, MessageCircle, Eye, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ProviderReferralsViewContent() {
  const [user, setUser] = useState(null);
  const [myOrg, setMyOrg] = useState(null);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseAction, setResponseAction] = useState('');
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const orgs = await base44.entities.Organization.list();
      const org = orgs.find(o => o.primary_contact_email === userData.email);
      setMyOrg(org);
    };
    loadUser();
  }, []);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['my-referrals', myOrg?.id],
    queryFn: () => base44.entities.Referral.filter({ organization_id: myOrg.id }, '-created_date', 500),
    enabled: !!myOrg
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['my-openings', myOrg?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg
  });

  const updateReferralMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-referrals']);
      setResponseDialog(false);
      setViewDialog(false);
      toast.success('Referral updated successfully');
    },
    onError: () => {
      toast.error('Failed to update referral');
    }
  });

  const handleViewDetails = (referral) => {
    setSelectedReferral(referral);
    setViewDialog(true);
  };

  const handleRespond = (referral, action) => {
    setSelectedReferral(referral);
    setResponseAction(action);
    setResponseText('');
    setResponseDialog(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedReferral) return;

    const statusMap = {
      accept: 'accepted',
      decline: 'declined',
      request_info: 'under_review'
    };

    updateReferralMutation.mutate({
      id: selectedReferral.id,
      data: {
        status: statusMap[responseAction],
        provider_response: responseText,
        provider_response_date: new Date().toISOString()
      }
    });
  };

  const filteredReferrals = referrals.filter(r => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return ['new', 'under_review'].includes(r.status);
    return r.status === statusFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      matched: 'bg-purple-100 text-purple-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      declined: 'bg-red-100 text-red-700',
      placed: 'bg-green-100 text-green-700',
      withdrawn: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      routine: 'text-slate-600',
      urgent: 'text-orange-600',
      crisis: 'text-red-600'
    };
    return colors[urgency] || 'text-slate-600';
  };

  const pendingCount = referrals.filter(r => ['new', 'under_review'].includes(r.status)).length;
  const acceptedCount = referrals.filter(r => r.status === 'accepted').length;
  const placedCount = referrals.filter(r => r.placement_status === 'placed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Referral Matches</h1>
        <p className="text-slate-600 mt-1">Review and respond to client referrals matched to your openings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Referrals</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{referrals.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Response</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{pendingCount}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Accepted</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{acceptedCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Placements</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{placedCount}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Filter:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Referrals</SelectItem>
                <SelectItem value="pending">Pending Response</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredReferrals.length} Referral{filteredReferrals.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading referrals...</div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No referrals found</p>
              <p className="text-sm">Referrals will appear here when case managers match clients to your openings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReferrals.map((referral) => {
                const opening = openings.find(o => o.id === referral.opening_id);

                return (
                  <div key={referral.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">
                            Client: {referral.client_initials || 'N/A'}
                          </h3>
                          <Badge className={cn('text-xs', getStatusColor(referral.status))}>
                            {referral.status?.replace('_', ' ')}
                          </Badge>
                          <span className={cn('text-sm font-medium', getUrgencyColor(referral.urgency))}>
                            {referral.urgency}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Age/Gender:</span>
                            <span className="ml-2 text-slate-900">
                              {referral.client_age || '?'} / {referral.client_gender || '?'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">County:</span>
                            <span className="ml-2 text-slate-900">{referral.client_county}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Funding:</span>
                            <span className="ml-2 text-slate-900">{referral.funding_source}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Match Score:</span>
                            <span className="ml-2 text-slate-900 font-medium">
                              {referral.match_confidence_score || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {referral.match_explanation && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-3 text-sm text-slate-700">
                        {referral.match_explanation}
                      </div>
                    )}

                    {opening && (
                      <div className="text-xs text-slate-500 mb-3">
                        Matched to: <span className="font-medium text-slate-700">{opening.title}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(referral)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>

                      {['new', 'under_review'].includes(referral.status) && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleRespond(referral, 'accept')}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespond(referral, 'request_info')}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Request Info
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRespond(referral, 'decline')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          
          {selectedReferral && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Client Initials</label>
                  <p className="text-slate-900 mt-1">{selectedReferral.client_initials || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Age / Gender</label>
                  <p className="text-slate-900 mt-1">
                    {selectedReferral.client_age || '?'} / {selectedReferral.client_gender || '?'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">County</label>
                  <p className="text-slate-900 mt-1">{selectedReferral.client_county}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Funding Source</label>
                  <p className="text-slate-900 mt-1">{selectedReferral.funding_source}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Diagnosis Summary</label>
                <p className="text-slate-900 mt-1">{selectedReferral.diagnosis_summary || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Behavioral Summary</label>
                <p className="text-slate-900 mt-1">{selectedReferral.behavioral_summary || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Medical Summary</label>
                <p className="text-slate-900 mt-1">{selectedReferral.medical_summary || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Support Needs</label>
                <p className="text-slate-900 mt-1">{selectedReferral.support_needs || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Match Score</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 bg-slate-200 rounded-full h-3">
                    <div
                      className={cn(
                        'h-3 rounded-full',
                        selectedReferral.match_confidence_score >= 80 ? 'bg-emerald-500' :
                        selectedReferral.match_confidence_score >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${selectedReferral.match_confidence_score || 0}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {selectedReferral.match_confidence_score || 0}%
                  </span>
                </div>
                {selectedReferral.match_explanation && (
                  <p className="text-sm text-slate-600 mt-2">{selectedReferral.match_explanation}</p>
                )}
              </div>

              {selectedReferral.provider_response && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Your Response</label>
                  <p className="text-slate-900 mt-1">{selectedReferral.provider_response}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === 'accept' ? 'Accept Referral' :
               responseAction === 'decline' ? 'Decline Referral' : 'Request More Information'}
            </DialogTitle>
            <DialogDescription>
              {responseAction === 'accept' ? 'Confirm that you can accommodate this client' :
               responseAction === 'decline' ? 'Let the case manager know why this isn\'t a good fit' :
               'Ask the case manager for additional information'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Message {responseAction === 'accept' ? '(optional)' : '(required)'}
              </label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={
                  responseAction === 'accept' ? 'Add any notes or next steps...' :
                  responseAction === 'decline' ? 'Please explain why this referral isn\'t suitable...' :
                  'What additional information do you need?'
                }
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResponseDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={responseAction !== 'accept' && !responseText.trim()}
                className={cn(
                  responseAction === 'accept' && 'bg-emerald-600 hover:bg-emerald-700',
                  responseAction === 'decline' && 'bg-red-600 hover:bg-red-700'
                )}
              >
                {responseAction === 'accept' ? 'Accept Referral' :
                 responseAction === 'decline' ? 'Decline Referral' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProviderReferralsView() {
  return (
    <RoleGuard allowedRoles={['provider', 'admin']}>
      <ProviderReferralsViewContent />
    </RoleGuard>
  );
}