import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleGuard from '@/components/auth/RoleGuard';
import { Building2, FileCheck, Sparkles, Save } from 'lucide-react';
import { toast } from 'sonner';

function ProviderProfileSettingsContent() {
  const [user, setUser] = useState(null);
  const [myOrg, setMyOrg] = useState(null);
  const [orgData, setOrgData] = useState({});
  const [capabilityData, setCapabilityData] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const orgs = await base44.entities.Organization.list();
      const org = orgs.find(o => o.primary_contact_email === userData.email);
      setMyOrg(org);
      setOrgData(org || {});
    };
    loadUser();
  }, []);

  const { data: capabilityProfiles = [] } = useQuery({
    queryKey: ['my-capabilities', myOrg?.id],
    queryFn: () => base44.entities.CapabilityProfile.filter({ organization_id: myOrg.id }),
    enabled: !!myOrg,
    onSuccess: (data) => {
      if (data.length > 0) {
        setCapabilityData(data[0]);
      }
    }
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.update(myOrg.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      toast.success('Organization profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const updateCapabilityMutation = useMutation({
    mutationFn: (data) => {
      if (capabilityProfiles.length > 0) {
        return base44.entities.CapabilityProfile.update(capabilityProfiles[0].id, data);
      } else {
        return base44.entities.CapabilityProfile.create({
          ...data,
          organization_id: myOrg.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-capabilities']);
      toast.success('Capabilities updated');
    },
    onError: () => {
      toast.error('Failed to update capabilities');
    }
  });

  const handleSaveOrg = () => {
    updateOrgMutation.mutate(orgData);
  };

  const handleSaveCapabilities = () => {
    updateCapabilityMutation.mutate(capabilityData);
  };

  const counties = [
    'Anoka', 'Carver', 'Dakota', 'Hennepin', 'Ramsey', 'Scott', 'Washington',
    'Olmsted', 'St. Louis', 'Stearns', 'Wright'
  ];

  const waivers = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];

  const toggleArrayItem = (array, item) => {
    if (!array) array = [];
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-600 mt-1">Manage your organization profile and capabilities</p>
      </div>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organization">
            <Building2 className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="capabilities">
            <Sparkles className="w-4 h-4 mr-2" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="licenses">
            <FileCheck className="w-4 h-4 mr-2" />
            Licenses
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Legal Name</label>
                  <Input
                    value={orgData.legal_name || ''}
                    onChange={(e) => setOrgData({ ...orgData, legal_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">DBA Name</label>
                  <Input
                    value={orgData.dba_name || ''}
                    onChange={(e) => setOrgData({ ...orgData, dba_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Phone</label>
                  <Input
                    value={orgData.phone || ''}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                  <Input
                    value={orgData.email || ''}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Website</label>
                <Input
                  value={orgData.website || ''}
                  onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Counties Served</label>
                <div className="grid grid-cols-3 gap-2">
                  {counties.map(county => (
                    <label key={county} className="flex items-center gap-2">
                      <Checkbox
                        checked={orgData.counties_served?.includes(county)}
                        onCheckedChange={() => 
                          setOrgData({
                            ...orgData,
                            counties_served: toggleArrayItem(orgData.counties_served, county)
                          })
                        }
                      />
                      <span className="text-sm text-slate-700">{county}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Waivers Accepted</label>
                <div className="grid grid-cols-3 gap-2">
                  {waivers.map(waiver => (
                    <label key={waiver} className="flex items-center gap-2">
                      <Checkbox
                        checked={orgData.waivers_accepted?.includes(waiver)}
                        onCheckedChange={() =>
                          setOrgData({
                            ...orgData,
                            waivers_accepted: toggleArrayItem(orgData.waivers_accepted, waiver)
                          })
                        }
                      />
                      <span className="text-sm text-slate-700">{waiver}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveOrg}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities">
          <Card>
            <CardHeader>
              <CardTitle>Care Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Medical Capabilities</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.medical?.tube_feeding}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          medical: { ...capabilityData.medical, tube_feeding: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Tube Feeding</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.medical?.ventilator}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          medical: { ...capabilityData.medical, ventilator: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Ventilator Care</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.medical?.wound_care}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          medical: { ...capabilityData.medical, wound_care: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Wound Care</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.medical?.medication_management}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          medical: { ...capabilityData.medical, medication_management: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Medication Management</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Behavioral Support</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.behavioral?.aggression_management}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          behavioral: { ...capabilityData.behavioral, aggression_management: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Aggression Management</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.behavioral?.elopement_prevention}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          behavioral: { ...capabilityData.behavioral, elopement_prevention: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Elopement Prevention</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.behavioral?.self_injury_support}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          behavioral: { ...capabilityData.behavioral, self_injury_support: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Self-Injury Support</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Mobility & Accessibility</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.mobility?.wheelchair_accessible}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          mobility: { ...capabilityData.mobility, wheelchair_accessible: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Wheelchair Accessible</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={capabilityData.mobility?.lift_equipment}
                      onCheckedChange={(checked) =>
                        setCapabilityData({
                          ...capabilityData,
                          mobility: { ...capabilityData.mobility, lift_equipment: checked }
                        })
                      }
                    />
                    <span className="text-sm text-slate-700">Lift Equipment Available</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveCapabilities}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Capabilities
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle>License Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-center py-8">
                License management will be available soon. Contact support to update your licenses.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProviderProfileSettings() {
  return (
    <RoleGuard allowedRoles={['provider', 'admin']}>
      <ProviderProfileSettingsContent />
    </RoleGuard>
  );
}