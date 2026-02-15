import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  Sparkles,
  AlertTriangle,
  Heart,
  Users,
  Building,
  Brain,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SEVERITY_OPTIONS = [
  { value: 'none', label: 'None / Not Supported' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' }
];

const RISK_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' }
];

const MED_ADMIN_OPTIONS = [
  { value: 'self', label: 'Self-Administration Only' },
  { value: 'reminder', label: 'Reminder/Cueing' },
  { value: 'full_admin', label: 'Full Administration' }
];

const WOUND_CARE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'basic', label: 'Basic Wound Care' },
  { value: 'advanced', label: 'Advanced Wound Care' }
];

const DIABETIC_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'monitoring', label: 'Monitoring Only' },
  { value: 'insulin', label: 'Insulin Administration' }
];

const SEIZURE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'intervention', label: 'Active Intervention' }
];

const MOBILITY_OPTIONS = [
  { value: 'independent', label: 'Independent' },
  { value: 'minimal', label: 'Minimal Assistance' },
  { value: 'moderate', label: 'Moderate Assistance' },
  { value: 'total', label: 'Total Assistance' }
];

export default function ProviderCapabilities() {
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const defaultCapabilities = {
    behavioral: {
      aggression_physical: 'none',
      aggression_verbal: 'none',
      self_injury: 'none',
      property_destruction: 'none',
      elopement_risk: 'none',
      sexual_behaviors: 'none',
      substance_use: false,
      pica: false
    },
    medical: {
      tube_feeding: false,
      ventilator: false,
      tracheostomy: false,
      dialysis: false,
      oxygen: false,
      wound_care: 'none',
      medication_administration: 'self',
      diabetic_care: 'none',
      seizure_management: 'none',
      mobility_assistance: 'independent'
    },
    staffing: {
      ratio_day: '',
      ratio_night: '',
      awake_overnight: false,
      rn_on_staff: false,
      lpn_on_staff: false,
      behavioral_specialist: false,
      one_to_one_available: false
    },
    environment: {
      wheelchair_accessible: false,
      single_story: false,
      secured_unit: false,
      private_rooms: false,
      shared_rooms: false,
      sensory_room: false,
      outdoor_space: false
    }
  };

  const [formData, setFormData] = useState(defaultCapabilities);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => base44.entities.Organization.filter({ created_by: user?.email }),
    enabled: !!user?.email
  });

  const org = organizations[0];

  const { data: programs = [] } = useQuery({
    queryKey: ['my-programs', org?.id],
    queryFn: () => base44.entities.ProgramActivation.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['my-capabilities', org?.id],
    queryFn: () => base44.entities.CapabilityProfile.filter({ organization_id: org?.id }),
    enabled: !!org?.id
  });

  // Load existing capability when program selected
  useEffect(() => {
    if (selectedProgramId) {
      const existing = capabilities.find(c => c.program_activation_id === selectedProgramId);
      if (existing) {
        setFormData({
          behavioral: { ...defaultCapabilities.behavioral, ...existing.behavioral },
          medical: { ...defaultCapabilities.medical, ...existing.medical },
          staffing: { ...defaultCapabilities.staffing, ...existing.staffing },
          environment: { ...defaultCapabilities.environment, ...existing.environment }
        });
      } else {
        setFormData(defaultCapabilities);
      }
      setHasChanges(false);
    }
  }, [selectedProgramId, capabilities]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = capabilities.find(c => c.program_activation_id === selectedProgramId);
      if (existing) {
        return base44.entities.CapabilityProfile.update(existing.id, data);
      } else {
        return base44.entities.CapabilityProfile.create({
          ...data,
          organization_id: org.id,
          program_activation_id: selectedProgramId,
          profile_type: 'program_default'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-capabilities'] });
      setHasChanges(false);
    }
  });

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  // Validation warnings
  const warnings = useMemo(() => {
    const items = [];
    
    if (formData.behavioral.elopement_risk !== 'none' && !formData.environment.secured_unit) {
      items.push('Elopement risk supported without secured unit');
    }
    
    return items;
  }, [formData]);

  if (programs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capabilities</h1>
          <p className="text-slate-500 mt-1">Define what your programs can support</p>
        </div>
        
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No programs to configure</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            Capabilities must be completed before creating openings. Activate a program first.
          </p>
          <Button className="mt-6" asChild>
            <Link to={createPageUrl('ProviderPrograms')}>
              Activate Program <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capabilities</h1>
          <p className="text-slate-500 mt-1">Define what your programs can support</p>
        </div>
        <Button onClick={handleSave} disabled={!selectedProgramId || !hasChanges || saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Program Selector */}
      <Card className="p-4">
        <Label>Select Program to Configure</Label>
        <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
          <SelectTrigger className="w-full md:w-96 mt-1">
            <SelectValue placeholder="Choose a program..." />
          </SelectTrigger>
          <SelectContent>
            {programs.map(program => {
              const hasCapability = capabilities.some(c => c.program_activation_id === program.id);
              return (
                <SelectItem key={program.id} value={program.id}>
                  <div className="flex items-center gap-2">
                    <span>{program.custom_name || program.program_code}</span>
                    {hasCapability && <Badge className="bg-emerald-100 text-emerald-700">Configured</Badge>}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && selectedProgramId && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Configuration Warnings</p>
              <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Capability Form */}
      {selectedProgramId && (
        <Tabs defaultValue="behavioral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="behavioral" className="flex items-center gap-2">
              <Brain className="w-4 h-4" /> Behavioral
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <Heart className="w-4 h-4" /> Medical
            </TabsTrigger>
            <TabsTrigger value="staffing" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Staffing
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2">
              <Building className="w-4 h-4" /> Environment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="behavioral">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Behavioral Capacity</CardTitle>
                <CardDescription>Define the behavioral support levels you can provide</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Physical Aggression</Label>
                  <Select
                    value={formData.behavioral.aggression_physical}
                    onValueChange={(v) => updateField('behavioral', 'aggression_physical', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Verbal Aggression</Label>
                  <Select
                    value={formData.behavioral.aggression_verbal}
                    onValueChange={(v) => updateField('behavioral', 'aggression_verbal', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Self-Injurious Behavior (SIB)</Label>
                  <Select
                    value={formData.behavioral.self_injury}
                    onValueChange={(v) => updateField('behavioral', 'self_injury', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Property Destruction</Label>
                  <Select
                    value={formData.behavioral.property_destruction}
                    onValueChange={(v) => updateField('behavioral', 'property_destruction', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Elopement Risk Supported</Label>
                  <Select
                    value={formData.behavioral.elopement_risk}
                    onValueChange={(v) => updateField('behavioral', 'elopement_risk', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RISK_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sexual Behaviors</Label>
                  <Select
                    value={formData.behavioral.sexual_behaviors}
                    onValueChange={(v) => updateField('behavioral', 'sexual_behaviors', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label>Substance Use History</Label>
                  <Switch
                    checked={formData.behavioral.substance_use}
                    onCheckedChange={(v) => updateField('behavioral', 'substance_use', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label>PICA</Label>
                  <Switch
                    checked={formData.behavioral.pica}
                    onCheckedChange={(v) => updateField('behavioral', 'pica', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical Capacity</CardTitle>
                <CardDescription>Define the medical support you can provide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'tube_feeding', label: 'Tube Feeding' },
                    { key: 'ventilator', label: 'Ventilator' },
                    { key: 'tracheostomy', label: 'Tracheostomy' },
                    { key: 'dialysis', label: 'Dialysis' },
                    { key: 'oxygen', label: 'Oxygen' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch
                        checked={formData.medical[item.key]}
                        onCheckedChange={(v) => updateField('medical', item.key, v)}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Medication Administration</Label>
                    <Select
                      value={formData.medical.medication_administration}
                      onValueChange={(v) => updateField('medical', 'medication_administration', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MED_ADMIN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Wound Care</Label>
                    <Select
                      value={formData.medical.wound_care}
                      onValueChange={(v) => updateField('medical', 'wound_care', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WOUND_CARE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Diabetic Care</Label>
                    <Select
                      value={formData.medical.diabetic_care}
                      onValueChange={(v) => updateField('medical', 'diabetic_care', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIABETIC_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Seizure Management</Label>
                    <Select
                      value={formData.medical.seizure_management}
                      onValueChange={(v) => updateField('medical', 'seizure_management', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEIZURE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mobility Assistance</Label>
                    <Select
                      value={formData.medical.mobility_assistance}
                      onValueChange={(v) => updateField('medical', 'mobility_assistance', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MOBILITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staffing">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Staffing Model</CardTitle>
                <CardDescription>Define your staffing ratios and capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Day Staffing Ratio</Label>
                    <Input
                      value={formData.staffing.ratio_day}
                      onChange={(e) => updateField('staffing', 'ratio_day', e.target.value)}
                      placeholder="e.g., 1:4"
                    />
                  </div>
                  <div>
                    <Label>Night Staffing Ratio</Label>
                    <Input
                      value={formData.staffing.ratio_night}
                      onChange={(e) => updateField('staffing', 'ratio_night', e.target.value)}
                      placeholder="e.g., 1:8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'awake_overnight', label: 'Awake Overnight Staff' },
                    { key: 'rn_on_staff', label: 'RN On Staff' },
                    { key: 'lpn_on_staff', label: 'LPN On Staff' },
                    { key: 'behavioral_specialist', label: 'Behavioral Specialist' },
                    { key: 'one_to_one_available', label: '1:1 Staffing Available' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch
                        checked={formData.staffing[item.key]}
                        onCheckedChange={(v) => updateField('staffing', item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Environment</CardTitle>
                <CardDescription>Define your physical environment capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
                    { key: 'single_story', label: 'Single Story' },
                    { key: 'secured_unit', label: 'Secured Unit' },
                    { key: 'private_rooms', label: 'Private Rooms' },
                    { key: 'shared_rooms', label: 'Shared Rooms' },
                    { key: 'sensory_room', label: 'Sensory Room' },
                    { key: 'outdoor_space', label: 'Outdoor Space' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch
                        checked={formData.environment[item.key]}
                        onCheckedChange={(v) => updateField('environment', item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}