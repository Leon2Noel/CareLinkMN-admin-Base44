import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RoleGuard from '@/components/auth/RoleGuard';
import { DoorOpen, Edit, Trash2, Plus, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ProviderOpeningsManagerContent() {
  const [user, setUser] = useState(null);
  const [myOrg, setMyOrg] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState(null);

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

  const { data: openings = [], isLoading } = useQuery({
    queryKey: ['my-openings', myOrg?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: myOrg.id }, '-created_date', 500),
    enabled: !!myOrg
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['my-sites', myOrg?.id],
    queryFn: () => base44.entities.Site.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg
  });

  const { data: programActivations = [] } = useQuery({
    queryKey: ['my-programs', myOrg?.id],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg
  });

  const updateOpeningMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opening.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-openings']);
      setEditDialog(false);
      toast.success('Opening updated successfully');
    },
    onError: () => {
      toast.error('Failed to update opening');
    }
  });

  const handleEdit = (opening) => {
    setSelectedOpening(opening);
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!selectedOpening) return;
    
    updateOpeningMutation.mutate({
      id: selectedOpening.id,
      data: selectedOpening
    });
  };

  const handleStatusChange = (opening, newStatus) => {
    updateOpeningMutation.mutate({
      id: opening.id,
      data: { status: newStatus }
    });
  };

  const handleConfirmAvailability = (opening) => {
    updateOpeningMutation.mutate({
      id: opening.id,
      data: {
        last_confirmed_at: new Date().toISOString(),
        auto_inactivated_reason: null,
        auto_inactivated_at: null
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-slate-100 text-slate-700',
      filled: 'bg-blue-100 text-blue-700',
      expired: 'bg-red-100 text-red-700',
      draft: 'bg-amber-100 text-amber-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const activeOpenings = openings.filter(o => o.status === 'active').length;
  const needsConfirmation = openings.filter(o => {
    if (!o.last_confirmed_at) return true;
    const hoursSince = (Date.now() - new Date(o.last_confirmed_at).getTime()) / (1000 * 60 * 60);
    return hoursSince > 40; // More than 40 hours
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Openings</h1>
          <p className="text-slate-600 mt-1">Update your availability and opening details</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Opening
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Openings</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{activeOpenings}</p>
              </div>
              <DoorOpen className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Openings</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{openings.length}</p>
              </div>
              <DoorOpen className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Needs Confirmation</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{needsConfirmation}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Openings List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Openings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading openings...</div>
          ) : openings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DoorOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No openings yet</p>
              <p className="text-sm mb-4">Create your first opening to start receiving referrals</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Opening
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {openings.map((opening) => {
                const site = sites.find(s => s.id === opening.site_id);
                const hoursSinceConfirmed = opening.last_confirmed_at
                  ? (Date.now() - new Date(opening.last_confirmed_at).getTime()) / (1000 * 60 * 60)
                  : 999;

                return (
                  <div key={opening.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{opening.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {site?.name} • {site?.city}, {site?.county}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">{opening.description}</p>
                      </div>
                      <Badge className={cn('ml-4', getStatusColor(opening.status))}>
                        {opening.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <span className="ml-2 text-slate-900 font-medium">{opening.opening_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Spots:</span>
                        <span className="ml-2 text-slate-900 font-medium">{opening.spots_available}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Gender:</span>
                        <span className="ml-2 text-slate-900 font-medium">{opening.gender_requirement || 'any'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Age:</span>
                        <span className="ml-2 text-slate-900 font-medium">
                          {opening.age_min || '?'} - {opening.age_max || '?'}
                        </span>
                      </div>
                    </div>

                    {hoursSinceConfirmed > 40 && opening.status === 'active' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-800">
                            Needs confirmation to stay active
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirmAvailability(opening)}
                          className="bg-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(opening)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      {opening.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(opening, 'inactive')}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(opening, 'active')}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Activate
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(opening, 'filled')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Mark Filled
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Opening</DialogTitle>
          </DialogHeader>
          
          {selectedOpening && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
                <Input
                  value={selectedOpening.title}
                  onChange={(e) => setSelectedOpening({ ...selectedOpening, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                <Textarea
                  value={selectedOpening.description || ''}
                  onChange={(e) => setSelectedOpening({ ...selectedOpening, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Opening Type</label>
                  <Select
                    value={selectedOpening.opening_type}
                    onValueChange={(value) => setSelectedOpening({ ...selectedOpening, opening_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Spots Available</label>
                  <Input
                    type="number"
                    value={selectedOpening.spots_available}
                    onChange={(e) => setSelectedOpening({ ...selectedOpening, spots_available: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Min Age</label>
                  <Input
                    type="number"
                    value={selectedOpening.age_min || ''}
                    onChange={(e) => setSelectedOpening({ ...selectedOpening, age_min: parseInt(e.target.value) || null })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Max Age</label>
                  <Input
                    type="number"
                    value={selectedOpening.age_max || ''}
                    onChange={(e) => setSelectedOpening({ ...selectedOpening, age_max: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Gender Requirement</label>
                <Select
                  value={selectedOpening.gender_requirement}
                  onValueChange={(value) => setSelectedOpening({ ...selectedOpening, gender_requirement: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Special Considerations</label>
                <Textarea
                  value={selectedOpening.special_considerations || ''}
                  onChange={(e) => setSelectedOpening({ ...selectedOpening, special_considerations: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProviderOpeningsManager() {
  return (
    <RoleGuard allowedRoles={['provider', 'admin']}>
      <ProviderOpeningsManagerContent />
    </RoleGuard>
  );
}