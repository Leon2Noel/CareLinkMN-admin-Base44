import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Building2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const MN_COUNTIES = [
  'Aitkin', 'Anoka', 'Becker', 'Beltrami', 'Benton', 'Big Stone', 'Blue Earth', 'Brown',
  'Carlton', 'Carver', 'Cass', 'Chippewa', 'Chisago', 'Clay', 'Clearwater', 'Cook',
  'Cottonwood', 'Crow Wing', 'Dakota', 'Dodge', 'Douglas', 'Faribault', 'Fillmore',
  'Freeborn', 'Goodhue', 'Grant', 'Hennepin', 'Houston', 'Hubbard', 'Isanti', 'Itasca',
  'Jackson', 'Kanabec', 'Kandiyohi', 'Kittson', 'Koochiching', 'Lac qui Parle', 'Lake',
  'Lake of the Woods', 'Le Sueur', 'Lincoln', 'Lyon', 'Mahnomen', 'Marshall', 'Martin',
  'McLeod', 'Meeker', 'Mille Lacs', 'Morrison', 'Mower', 'Murray', 'Nicollet', 'Nobles',
  'Norman', 'Olmsted', 'Otter Tail', 'Pennington', 'Pine', 'Pipestone', 'Polk', 'Pope',
  'Ramsey', 'Red Lake', 'Redwood', 'Renville', 'Rice', 'Rock', 'Roseau', 'Scott',
  'Sherburne', 'Sibley', 'St. Louis', 'Stearns', 'Steele', 'Stevens', 'Swift', 'Todd',
  'Traverse', 'Wabasha', 'Wadena', 'Waseca', 'Washington', 'Watonwan', 'Wilkin', 'Winona',
  'Wright', 'Yellow Medicine'
];

const WAIVERS = [
  { code: 'CADI', label: 'CADI - Community Alternative Care' },
  { code: 'DD', label: 'DD - Developmental Disabilities' },
  { code: 'BI', label: 'BI - Brain Injury' },
  { code: 'EW', label: 'EW - Elderly Waiver' },
  { code: 'AC', label: 'AC - Alternative Care' },
  { code: 'CAC', label: 'CAC - Community Access for Disability Inclusion' },
  { code: 'MA_FFS', label: 'MA Fee-for-Service' },
  { code: 'MA_MCO', label: 'MA Managed Care' },
  { code: 'Private_Pay', label: 'Private Pay' }
];

const AGE_BANDS = [
  { value: '0-17', label: 'Children (0-17)' },
  { value: '18-21', label: 'Transition Age (18-21)' },
  { value: '22-64', label: 'Adults (22-64)' },
  { value: '65+', label: 'Seniors (65+)' }
];

const POPULATIONS = [
  { code: 'IDD', label: 'Intellectual/Developmental Disabilities' },
  { code: 'MI', label: 'Mental Illness' },
  { code: 'TBI', label: 'Traumatic Brain Injury' },
  { code: 'Autism', label: 'Autism Spectrum Disorder' },
  { code: 'SUD', label: 'Substance Use Disorder' },
  { code: 'Physical', label: 'Physical Disability' },
  { code: 'Elderly', label: 'Elderly/Aging' }
];

export default function ProviderIdentity() {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => base44.entities.Organization.filter({ created_by: user?.email }),
    enabled: !!user?.email
  });

  const org = organizations[0];

  const [formData, setFormData] = useState({
    legal_name: '',
    dba_name: '',
    ein: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    address: '',
    city: '',
    state: 'MN',
    zip_code: '',
    counties_served: [],
    waivers_accepted: [],
    age_ranges: [],
    populations_served: [],
    gender_accepted: 'all'
  });

  useEffect(() => {
    if (org) {
      setFormData({
        legal_name: org.legal_name || '',
        dba_name: org.dba_name || '',
        ein: org.ein || '',
        primary_contact_name: org.primary_contact_name || '',
        primary_contact_email: org.primary_contact_email || '',
        primary_contact_phone: org.primary_contact_phone || '',
        address: org.address || '',
        city: org.city || '',
        state: org.state || 'MN',
        zip_code: org.zip_code || '',
        counties_served: org.counties_served || [],
        waivers_accepted: org.waivers_accepted || [],
        age_ranges: org.age_ranges || [],
        populations_served: org.populations_served || [],
        gender_accepted: org.gender_accepted || 'all'
      });
    } else if (!isLoading && organizations.length === 0) {
      setShowOnboarding(true);
    }
  }, [org, isLoading, organizations]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (org) {
        return base44.entities.Organization.update(org.id, data);
      } else {
        return base44.entities.Organization.create({
          ...data,
          status: 'pending_review',
          verification_status: 'unverified'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
      setShowOnboarding(false);
    }
  });

  const validate = () => {
    const newErrors = {};

    if (!formData.legal_name?.trim()) newErrors.legal_name = 'Legal name is required';
    if (!formData.ein?.trim()) newErrors.ein = 'EIN is required';
    if (!formData.primary_contact_email?.trim()) {
      newErrors.primary_contact_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
      newErrors.primary_contact_email = 'Invalid email format';
    }
    if (!formData.primary_contact_phone?.trim()) newErrors.primary_contact_phone = 'Phone is required';
    if (!formData.counties_served?.length) newErrors.counties_served = 'Select at least one county';
    if (!formData.waivers_accepted?.length) newErrors.waivers_accepted = 'Select at least one waiver/funding type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  const handleMultiSelect = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(v => v !== value)
    }));
  };

  const completionStatus = {
    basic: !!(formData.legal_name && formData.ein),
    contact: !!(formData.primary_contact_email && formData.primary_contact_phone),
    service: !!(formData.counties_served?.length && formData.waivers_accepted?.length)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organization Identity</h1>
          <p className="text-slate-500 mt-1">Complete your organization profile to enable services</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Welcome to CareLinkMN!</p>
              <p className="text-sm text-blue-700 mt-1">
                Start by completing your organization identity. This information is required before you can upload licenses and create openings.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress */}
      <div className="flex gap-3">
        <Badge className={completionStatus.basic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
          {completionStatus.basic ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
          Basic Info
        </Badge>
        <Badge className={completionStatus.contact ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
          {completionStatus.contact ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
          Contact
        </Badge>
        <Badge className={completionStatus.service ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
          {completionStatus.service ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
          Service Area
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Legal Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.legal_name}
                onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                placeholder="Organization legal name"
                className={errors.legal_name ? 'border-red-500' : ''}
              />
              {errors.legal_name && <p className="text-xs text-red-500 mt-1">{errors.legal_name}</p>}
            </div>

            <div>
              <Label>DBA Name (optional)</Label>
              <Input
                value={formData.dba_name}
                onChange={(e) => setFormData(prev => ({ ...prev, dba_name: e.target.value }))}
                placeholder="Doing business as"
              />
            </div>

            <div>
              <Label>EIN <span className="text-red-500">*</span></Label>
              <Input
                value={formData.ein}
                onChange={(e) => setFormData(prev => ({ ...prev, ein: e.target.value }))}
                placeholder="XX-XXXXXXX"
                className={errors.ein ? 'border-red-500' : ''}
              />
              {errors.ein && <p className="text-xs text-red-500 mt-1">{errors.ein}</p>}
            </div>

            <div>
              <Label>Gender Served</Label>
              <Select
                value={formData.gender_accepted}
                onValueChange={(v) => setFormData(prev => ({ ...prev, gender_accepted: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders (Co-ed)</SelectItem>
                  <SelectItem value="male">Male Only</SelectItem>
                  <SelectItem value="female">Female Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Primary Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.primary_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>

            <div>
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={formData.primary_contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                placeholder="email@example.com"
                className={errors.primary_contact_email ? 'border-red-500' : ''}
              />
              {errors.primary_contact_email && <p className="text-xs text-red-500 mt-1">{errors.primary_contact_email}</p>}
            </div>

            <div>
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_phone: e.target.value }))}
                placeholder="(555) 555-5555"
                className={errors.primary_contact_phone ? 'border-red-500' : ''}
              />
              {errors.primary_contact_phone && <p className="text-xs text-red-500 mt-1">{errors.primary_contact_phone}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Street Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St"
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Minneapolis"
              />
            </div>

            <div>
              <Label>ZIP Code</Label>
              <Input
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="55401"
              />
            </div>
          </CardContent>
        </Card>

        {/* Counties Served */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Counties Served <span className="text-red-500">*</span></CardTitle>
            <CardDescription>Select all Minnesota counties where you provide services</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.counties_served && (
              <p className="text-sm text-red-500 mb-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.counties_served}
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {MN_COUNTIES.map(county => (
                <label key={county} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={formData.counties_served?.includes(county)}
                    onCheckedChange={(checked) => handleMultiSelect('counties_served', county, checked)}
                  />
                  {county}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Waivers Accepted */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Waivers & Funding Accepted <span className="text-red-500">*</span></CardTitle>
            <CardDescription>Select all waiver and funding types you accept</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.waivers_accepted && (
              <p className="text-sm text-red-500 mb-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.waivers_accepted}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {WAIVERS.map(waiver => (
                <label key={waiver.code} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <Checkbox
                    checked={formData.waivers_accepted?.includes(waiver.code)}
                    onCheckedChange={(checked) => handleMultiSelect('waivers_accepted', waiver.code, checked)}
                  />
                  {waiver.label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Age Bands */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age Bands Served</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {AGE_BANDS.map(band => (
                <label key={band.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-slate-50 border">
                  <Checkbox
                    checked={formData.age_ranges?.includes(band.value)}
                    onCheckedChange={(checked) => handleMultiSelect('age_ranges', band.value, checked)}
                  />
                  {band.label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Populations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Populations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {POPULATIONS.map(pop => (
                <label key={pop.code} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <Checkbox
                    checked={formData.populations_served?.includes(pop.code)}
                    onCheckedChange={(checked) => handleMultiSelect('populations_served', pop.code, checked)}
                  />
                  {pop.label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}