import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  Users,
  FileCheck,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MN_COUNTIES = [
  'Anoka', 'Becker', 'Beltrami', 'Benton', 'Big Stone', 'Blue Earth', 'Brown', 'Carlton',
  'Carver', 'Cass', 'Chippewa', 'Chisago', 'Clay', 'Clearwater', 'Cook', 'Cottonwood',
  'Crow Wing', 'Dakota', 'Dodge', 'Douglas', 'Faribault', 'Fillmore', 'Freeborn', 'Goodhue',
  'Grant', 'Hennepin', 'Houston', 'Hubbard', 'Isanti', 'Itasca', 'Jackson', 'Kanabec',
  'Kandiyohi', 'Kittson', 'Koochiching', 'Lac qui Parle', 'Lake', 'Lake of the Woods',
  'Le Sueur', 'Lincoln', 'Lyon', 'Mahnomen', 'Marshall', 'Martin', 'McLeod', 'Meeker',
  'Mille Lacs', 'Morrison', 'Mower', 'Murray', 'Nicollet', 'Nobles', 'Norman', 'Olmsted',
  'Otter Tail', 'Pennington', 'Pine', 'Pipestone', 'Polk', 'Pope', 'Ramsey', 'Red Lake',
  'Redwood', 'Renville', 'Rice', 'Rock', 'Roseau', 'Scott', 'Sherburne', 'Sibley',
  'St. Louis', 'Stearns', 'Steele', 'Stevens', 'Swift', 'Todd', 'Traverse', 'Wabasha',
  'Wadena', 'Waseca', 'Washington', 'Watonwan', 'Wilkin', 'Winona', 'Wright', 'Yellow Medicine'
];

const WAIVERS = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];
const POPULATIONS = ['Mental Health', 'Autism', 'Intellectual Disability', 'Physical Disability', 'Medical Illness', 'Chronic Illness'];
const AGE_RANGES = ['Less than 18 yrs', '18-55 years', '55 yrs and above'];

export default function ProviderRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    legal_name: '',
    dba_name: '',
    ein: '',
    address: '',
    city: '',
    state: 'MN',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    counties_served: [],
    waivers_accepted: [],
    age_ranges: [],
    populations_served: [],
    gender_accepted: 'all',
    status: 'pending_review',
    verification_status: 'unverified',
    completeness_score: 30,
    onboarding_step: 1
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Check if user is authenticated
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        // Store data and redirect to login
        localStorage.setItem('pending_org_registration', JSON.stringify(data));
        base44.auth.redirectToLogin(window.location.origin + createPageUrl('ProviderRegister'));
        return;
      }
      
      // Create organization linked to current user
      const user = await base44.auth.me();
      return await base44.entities.Organization.create({
        ...data,
        primary_contact_email: user.email,
        created_by: user.email
      });
    },
    onSuccess: (org) => {
      if (org) {
        localStorage.removeItem('pending_org_registration');
        navigate(createPageUrl('ProviderPortal') + `?org_id=${org.id}`);
      }
    }
  });

  // Load pending registration data if user just logged in
  React.useEffect(() => {
    const loadPendingData = async () => {
      const pending = localStorage.getItem('pending_org_registration');
      if (pending) {
        try {
          const data = JSON.parse(pending);
          setFormData(prev => ({ ...prev, ...data }));
        } catch (e) {
          console.error('Failed to load pending data:', e);
        }
      }
    };
    loadPendingData();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field, value) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateField(field, updated);
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const canProceedStep1 = formData.legal_name && formData.email && formData.phone;
  const canProceedStep2 = formData.counties_served.length > 0 && formData.waivers_accepted.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Provider Account</h1>
          <p className="text-slate-600">Join the CareLinkMN network and start connecting with clients</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${currentStep >= step ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {step === 1 ? 'Organization' : step === 2 ? 'Service Info' : 'Review'}
                </span>
              </div>
              {step < 3 && <div className={`h-px w-12 ${currentStep > step ? 'bg-blue-600' : 'bg-slate-300'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Organization Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Organization Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="legal_name">Legal Organization Name *</Label>
                    <Input
                      id="legal_name"
                      value={formData.legal_name}
                      onChange={(e) => updateField('legal_name', e.target.value)}
                      placeholder="Full legal business name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dba_name">DBA Name</Label>
                    <Input
                      id="dba_name"
                      value={formData.dba_name}
                      onChange={(e) => updateField('dba_name', e.target.value)}
                      placeholder="Doing business as"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ein">EIN</Label>
                    <Input
                      id="ein"
                      value={formData.ein}
                      onChange={(e) => updateField('ein', e.target.value)}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => updateField('zip_code', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Organization Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(XXX) XXX-XXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Organization Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Primary Contact</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contact_name">Name</Label>
                      <Input
                        id="contact_name"
                        value={formData.primary_contact_name}
                        onChange={(e) => updateField('primary_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.primary_contact_email}
                        onChange={(e) => updateField('primary_contact_email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Phone</Label>
                      <Input
                        id="contact_phone"
                        value={formData.primary_contact_phone}
                        onChange={(e) => updateField('primary_contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Service Information</h3>
                  <p className="text-sm text-slate-500">Tell us about the populations and areas you serve</p>
                </div>

                <div>
                  <Label className="mb-2 block">Counties Served *</Label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-slate-50">
                    {MN_COUNTIES.map(county => (
                      <Badge
                        key={county}
                        variant={formData.counties_served?.includes(county) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue('counties_served', county)}
                      >
                        {county}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Selected: {formData.counties_served?.length || 0}</p>
                </div>

                <div>
                  <Label className="mb-2 block">Waivers Accepted *</Label>
                  <div className="flex flex-wrap gap-2">
                    {WAIVERS.map(waiver => (
                      <Badge
                        key={waiver}
                        variant={formData.waivers_accepted?.includes(waiver) ? "default" : "outline"}
                        className="cursor-pointer text-sm px-4 py-2"
                        onClick={() => toggleArrayValue('waivers_accepted', waiver)}
                      >
                        {waiver}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Age Ranges Served</Label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map(age => (
                      <Badge
                        key={age}
                        variant={formData.age_ranges?.includes(age) ? "default" : "outline"}
                        className="cursor-pointer text-sm px-4 py-2"
                        onClick={() => toggleArrayValue('age_ranges', age)}
                      >
                        {age}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Populations Served</Label>
                  <div className="flex flex-wrap gap-2">
                    {POPULATIONS.map(pop => (
                      <Badge
                        key={pop}
                        variant={formData.populations_served?.includes(pop) ? "default" : "outline"}
                        className="cursor-pointer text-sm px-3 py-2"
                        onClick={() => toggleArrayValue('populations_served', pop)}
                      >
                        {pop}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="gender">Gender Accepted</Label>
                  <Select 
                    value={formData.gender_accepted} 
                    onValueChange={(v) => updateField('gender_accepted', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Review Your Information</h3>
                  <p className="text-sm text-slate-500">Please verify your details before submitting</p>
                </div>

                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Organization</p>
                      <p className="font-semibold text-slate-900">{formData.legal_name}</p>
                      {formData.dba_name && <p className="text-sm text-slate-600">DBA: {formData.dba_name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <p className="text-sm text-slate-900">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Phone</p>
                        <p className="text-sm text-slate-900">{formData.phone}</p>
                      </div>
                    </div>

                    {formData.address && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Address</p>
                        <p className="text-sm text-slate-900">
                          {formData.address}, {formData.city}, MN {formData.zip_code}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-slate-500 mb-1">Counties Served</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.counties_served?.map(c => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-1">Waivers Accepted</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.waivers_accepted?.map(w => (
                          <Badge key={w} variant="secondary" className="text-xs">{w}</Badge>
                        ))}
                      </div>
                    </div>

                    {formData.populations_served?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Populations Served</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.populations_served.map(p => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">What happens next?</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your account will be reviewed by our team (typically 1-2 business days)</li>
                        <li>• You'll receive an email when approved</li>
                        <li>• Once approved, you can upload licenses and create openings</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              {currentStep < 3 ? (
                <Button 
                  onClick={handleNext}
                  disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}