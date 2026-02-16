import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  Circle,
  Building2,
  FileText,
  Sparkles,
  Upload,
  Image as ImageIcon,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const MN_COUNTIES = ['Hennepin', 'Ramsey', 'Dakota', 'Anoka', 'Washington', 'Carver', 'Scott', 'Wright', 'Stearns', 'Olmsted'];
const WAIVERS = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];
const POPULATIONS = ['DD', 'MI', 'TBI', 'Elderly', 'Physical Disability'];
const AGE_RANGES = ['0-17', '18-21', '22-64', '65+'];

const LICENSE_TYPES = [
  { code: '245D_BASIC', name: '245D Basic License', category: 'DHS' },
  { code: '245D_INTENSIVE', name: '245D Intensive Services', category: 'DHS' },
  { code: 'ALF', name: 'Assisted Living Facility', category: 'MDH' },
  { code: 'ALD', name: 'Assisted Living with Dementia', category: 'MDH' },
  { code: 'RESPITE', name: 'Respite Care', category: 'DHS' }
];

const STEPS = [
  { id: 1, name: 'Organization Info', icon: Building2 },
  { id: 2, name: 'License Details', icon: FileCheck },
  { id: 3, name: 'AI Recommendations', icon: Sparkles },
  { id: 4, name: 'Documentation', icon: Upload },
  { id: 5, name: 'Review & Submit', icon: CheckCircle2 }
];

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Organization
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
    
    // Step 2: License
    license_type: '',
    license_number: '',
    issuing_authority: '',
    effective_date: '',
    expiration_date: '',
    service_description: '',
    
    // Step 3: AI Suggestions (populated by AI)
    suggested_programs: [],
    suggested_capabilities: {},
    counties_served: [],
    waivers_accepted: [],
    age_ranges: [],
    populations_served: [],
    
    // Step 4: Documentation
    documents: []
  });

  const [uploadedDocs, setUploadedDocs] = useState([]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  // AI-powered suggestions
  const generateAISuggestions = async () => {
    setIsAiProcessing(true);
    try {
      const selectedLicense = LICENSE_TYPES.find(l => l.code === formData.license_type);
      
      const prompt = `Based on the following provider information, suggest appropriate programs and capabilities:

License Type: ${selectedLicense?.name}
License Category: ${selectedLicense?.category}
Service Description: ${formData.service_description}
Organization: ${formData.legal_name}

Please analyze and provide:
1. Recommended program models (e.g., CRS, IHS, Memory Care)
2. Suggested capability profile including behavioral and medical capacities
3. Any compliance considerations

Format your response as JSON with this structure:
{
  "programs": ["program1", "program2"],
  "capabilities": {
    "behavioral": ["capability1", "capability2"],
    "medical": ["capability1", "capability2"]
  },
  "reasoning": "explanation",
  "compliance_notes": "important considerations"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            programs: { type: "array", items: { type: "string" } },
            capabilities: {
              type: "object",
              properties: {
                behavioral: { type: "array", items: { type: "string" } },
                medical: { type: "array", items: { type: "string" } }
              }
            },
            reasoning: { type: "string" },
            compliance_notes: { type: "string" }
          }
        }
      });

      setAiSuggestions(response);
      updateField('suggested_programs', response.programs || []);
      updateField('suggested_capabilities', response.capabilities || {});
      
      toast.success('AI recommendations generated!');
    } catch (error) {
      toast.error('Failed to generate AI suggestions');
      console.error(error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Document upload
  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      toast.loading('Uploading document...', { id: 'upload' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDoc = {
        type: docType,
        name: file.name,
        url: file_url,
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      };
      
      setUploadedDocs(prev => [...prev, newDoc]);
      toast.success('Document uploaded successfully', { id: 'upload' });
    } catch (error) {
      toast.error('Failed to upload document', { id: 'upload' });
      console.error(error);
    }
  };

  // Submit mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data) => {
      const org = await base44.entities.Organization.create({
        legal_name: data.legal_name,
        dba_name: data.dba_name,
        ein: data.ein,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        phone: data.phone,
        email: data.email,
        website: data.website,
        primary_contact_name: data.primary_contact_name,
        primary_contact_email: data.primary_contact_email,
        primary_contact_phone: data.primary_contact_phone,
        counties_served: data.counties_served,
        waivers_accepted: data.waivers_accepted,
        age_ranges: data.age_ranges,
        populations_served: data.populations_served,
        onboarding_step: 2
      });
      return org;
    },
    onSuccess: (org) => {
      toast.success('Organization created successfully!');
      navigate(createPageUrl('ProviderPortal'));
    },
    onError: () => {
      toast.error('Failed to create organization');
    }
  });

  const handleSubmit = () => {
    createOrgMutation.mutate(formData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.legal_name && formData.email && formData.phone;
      case 2:
        return formData.license_type && formData.license_number;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Provider Onboarding</h1>
          <p className="text-slate-600">Complete your profile to start receiving referrals</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep ? 'text-blue-600' :
                  step.id < currentStep ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step.id === currentStep ? 'bg-blue-600 text-white' :
                  step.id < currentStep ? 'bg-emerald-600 text-white' :
                  'bg-slate-200'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <STEPS[currentStep - 1].icon className="w-5 h-5" />
              {STEPS[currentStep - 1].name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Organization Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Legal Business Name *</Label>
                    <Input
                      value={formData.legal_name}
                      onChange={(e) => updateField('legal_name', e.target.value)}
                      placeholder="ABC Services LLC"
                    />
                  </div>
                  <div>
                    <Label>DBA Name</Label>
                    <Input
                      value={formData.dba_name}
                      onChange={(e) => updateField('dba_name', e.target.value)}
                      placeholder="Doing Business As"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>EIN *</Label>
                    <Input
                      value={formData.ein}
                      onChange={(e) => updateField('ein', e.target.value)}
                      placeholder="12-3456789"
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(612) 555-0100"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contact@provider.com"
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Minneapolis"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value="MN" disabled />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => updateField('zip_code', e.target.value)}
                      placeholder="55401"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Primary Contact</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={formData.primary_contact_name}
                        onChange={(e) => updateField('primary_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.primary_contact_email}
                        onChange={(e) => updateField('primary_contact_email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: License Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>License Type *</Label>
                  <Select value={formData.license_type} onValueChange={(v) => updateField('license_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map(lt => (
                        <SelectItem key={lt.code} value={lt.code}>
                          {lt.name} ({lt.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>License Number *</Label>
                    <Input
                      value={formData.license_number}
                      onChange={(e) => updateField('license_number', e.target.value)}
                      placeholder="e.g., 12345"
                    />
                  </div>
                  <div>
                    <Label>Issuing Authority</Label>
                    <Select value={formData.issuing_authority} onValueChange={(v) => updateField('issuing_authority', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select authority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MDH">MDH</SelectItem>
                        <SelectItem value="DHS">DHS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => updateField('effective_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => updateField('expiration_date', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Service Description</Label>
                  <Textarea
                    value={formData.service_description}
                    onChange={(e) => updateField('service_description', e.target.value)}
                    placeholder="Describe the services your organization provides..."
                    rows={4}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This helps our AI recommend appropriate programs and capabilities
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: AI Recommendations */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {!aiSuggestions ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Recommendations</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Let our AI analyze your license and services to suggest relevant programs and capabilities
                    </p>
                    <Button
                      onClick={generateAISuggestions}
                      disabled={isAiProcessing}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      {isAiProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Recommendations
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">AI Analysis</h4>
                          <p className="text-sm text-slate-700">{aiSuggestions.reasoning}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Suggested Programs</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.programs?.map(program => (
                          <Badge key={program} className="bg-blue-100 text-blue-700">
                            {program}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Service Details</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Counties Served</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {MN_COUNTIES.map(county => (
                              <Badge
                                key={county}
                                variant={formData.counties_served.includes(county) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleArrayItem('counties_served', county)}
                              >
                                {county}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Waivers Accepted</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {WAIVERS.map(waiver => (
                              <Badge
                                key={waiver}
                                variant={formData.waivers_accepted.includes(waiver) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => toggleArrayItem('waivers_accepted', waiver)}
                              >
                                {waiver}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {aiSuggestions.compliance_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-900 mb-1 flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Compliance Considerations
                        </h4>
                        <p className="text-sm text-amber-800">{aiSuggestions.compliance_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Documentation */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-slate-600">Upload supporting documents for verification</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-2 border-dashed hover:border-blue-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'license')}
                        />
                        <FileCheck className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-semibold mb-1">License Document</h4>
                        <p className="text-xs text-slate-500">PDF or image file</p>
                      </label>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed hover:border-blue-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'facility_photo')}
                        />
                        <ImageIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-semibold mb-1">Facility Photos</h4>
                        <p className="text-xs text-slate-500">JPG, PNG</p>
                      </label>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed hover:border-blue-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, 'insurance')}
                        />
                        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-semibold mb-1">Insurance Certificate</h4>
                        <p className="text-xs text-slate-500">PDF file</p>
                      </label>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed hover:border-blue-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, 'staff_cert')}
                        />
                        <FileCheck className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-semibold mb-1">Staff Certifications</h4>
                        <p className="text-xs text-slate-500">PDF file</p>
                      </label>
                    </CardContent>
                  </Card>
                </div>

                {/* Uploaded Documents */}
                {uploadedDocs.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {uploadedDocs.map((doc, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{doc.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">Uploaded</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-1">Ready to Submit</h4>
                  <p className="text-sm text-blue-700">
                    Review your information below and submit to begin verification
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Organization</h4>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm">
                      <p><strong>Name:</strong> {formData.legal_name}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Phone:</strong> {formData.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">License</h4>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm">
                      <p><strong>Type:</strong> {LICENSE_TYPES.find(l => l.code === formData.license_type)?.name}</p>
                      <p><strong>Number:</strong> {formData.license_number}</p>
                      <p><strong>Authority:</strong> {formData.issuing_authority}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Service Areas</h4>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm">
                      <p><strong>Counties:</strong> {formData.counties_served.join(', ') || 'Not specified'}</p>
                      <p><strong>Waivers:</strong> {formData.waivers_accepted.join(', ') || 'Not specified'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Documents</h4>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm">
                      <p>{uploadedDocs.length} document(s) uploaded</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createOrgMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {createOrgMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}