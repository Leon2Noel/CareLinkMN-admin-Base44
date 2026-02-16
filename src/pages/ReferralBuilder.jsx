import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { matchReferralToOpenings } from '@/components/matching/MatchingAlgorithm';
import {
  CheckCircle2,
  ArrowRight,
  Users,
  Calendar,
  FileText,
  GitMerge,
  AlertCircle
} from 'lucide-react';

const MN_COUNTIES = ['Anoka', 'Hennepin', 'Ramsey', 'Dakota', 'Washington', 'St. Louis'];
const WAIVERS = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];
const URGENCY_LEVELS = ['routine', 'urgent', 'crisis'];

export default function ReferralBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const preselectedOpeningId = searchParams.get('opening_id');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    referral_source: 'case_manager',
    referrer_name: '',
    referrer_email: '',
    referrer_phone: '',
    client_initials: '',
    client_age: '',
    client_gender: '',
    client_county: '',
    funding_source: '',
    diagnosis_summary: '',
    behavioral_summary: '',
    medical_summary: '',
    support_needs: '',
    urgency: 'routine',
    desired_start_date: '',
    opening_id: preselectedOpeningId || '',
    organization_id: '',
    site_id: ''
  });

  const [matches, setMatches] = useState([]);
  const [selectedOpenings, setSelectedOpenings] = useState(preselectedOpeningId ? [preselectedOpeningId] : []);

  const { data: openings = [] } = useQuery({
    queryKey: ['active-openings'],
    queryFn: () => base44.entities.Opening.filter({ status: 'active' })
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const referral = await base44.entities.Referral.create(data);
      return referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      navigate(createPageUrl('CaseManagerSearch'));
    }
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateMatches = async () => {
    const result = await matchReferralToOpenings(formData, openings, sites);
    setMatches(result.results);
  };

  const toggleOpening = (openingId) => {
    setSelectedOpenings(prev =>
      prev.includes(openingId)
        ? prev.filter(id => id !== openingId)
        : [...prev, openingId]
    );
  };

  const handleSubmit = () => {
    const bestMatch = matches[0];
    const submitData = {
      ...formData,
      opening_id: selectedOpenings[0] || null,
      organization_id: bestMatch?.opening_id ? openings.find(o => o.id === bestMatch.opening_id)?.organization_id : null,
      site_id: bestMatch?.opening_id ? openings.find(o => o.id === bestMatch.opening_id)?.site_id : null,
      match_confidence_score: bestMatch?.score || 0,
      match_explanation: bestMatch?.explanation || '',
      status: 'new'
    };
    
    createMutation.mutate(submitData);
  };

  const canProceedStep1 = formData.client_county && formData.funding_source;
  const canProceedStep3 = selectedOpenings.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <PageHeader
        title="Create Referral"
        description="Submit a client referral and match with appropriate openings"
        breadcrumbs={[
          { label: 'Search', href: createPageUrl('CaseManagerSearch') },
          { label: 'New Referral' }
        ]}
      />

      {/* Progress */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {s === 1 ? 'Client' : s === 2 ? 'Timeline' : s === 3 ? 'Matches' : 'Submit'}
              </span>
            </div>
            {s < 4 && <div className={`h-px w-12 ${step > s ? 'bg-blue-600' : 'bg-slate-300'}`} />}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Client Needs */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Client Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_county">County *</Label>
                  <Select value={formData.client_county} onValueChange={(v) => updateField('client_county', v)}>
                    <SelectTrigger id="client_county">
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {MN_COUNTIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="funding">Funding Source *</Label>
                  <Select value={formData.funding_source} onValueChange={(v) => updateField('funding_source', v)}>
                    <SelectTrigger id="funding">
                      <SelectValue placeholder="Select waiver" />
                    </SelectTrigger>
                    <SelectContent>
                      {WAIVERS.map(w => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="client_age">Age</Label>
                  <Input
                    id="client_age"
                    type="number"
                    value={formData.client_age}
                    onChange={(e) => updateField('client_age', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.client_gender} onValueChange={(v) => updateField('client_gender', v)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="initials">Client Initials</Label>
                  <Input
                    id="initials"
                    value={formData.client_initials}
                    onChange={(e) => updateField('client_initials', e.target.value)}
                    placeholder="e.g., J.D."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosis">Diagnosis Summary</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis_summary}
                  onChange={(e) => updateField('diagnosis_summary', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="behavioral">Behavioral Summary</Label>
                <Textarea
                  id="behavioral"
                  value={formData.behavioral_summary}
                  onChange={(e) => updateField('behavioral_summary', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="medical">Medical Summary</Label>
                <Textarea
                  id="medical"
                  value={formData.medical_summary}
                  onChange={(e) => updateField('medical_summary', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Timeline */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Timeline & Contact</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(v) => updateField('urgency', v)}>
                    <SelectTrigger id="urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCY_LEVELS.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date">Desired Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.desired_start_date}
                    onChange={(e) => updateField('desired_start_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ref_name">Your Name</Label>
                  <Input
                    id="ref_name"
                    value={formData.referrer_name}
                    onChange={(e) => updateField('referrer_name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ref_email">Your Email</Label>
                  <Input
                    id="ref_email"
                    type="email"
                    value={formData.referrer_email}
                    onChange={(e) => updateField('referrer_email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ref_phone">Your Phone</Label>
                  <Input
                    id="ref_phone"
                    value={formData.referrer_phone}
                    onChange={(e) => updateField('referrer_phone', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="support">Support Needs</Label>
                <Textarea
                  id="support"
                  value={formData.support_needs}
                  onChange={(e) => updateField('support_needs', e.target.value)}
                  rows={4}
                  placeholder="Describe any special support needs or accommodations..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Generate Matches */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Suggested Matches</h3>
                </div>
                <Button onClick={handleGenerateMatches} variant="outline" size="sm">
                  Generate Matches
                </Button>
              </div>

              {matches.length === 0 ? (
                <Card className="bg-slate-50">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">Click "Generate Matches" to find suitable openings</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match) => {
                    const opening = openings.find(o => o.id === match.opening_id);
                    const org = organizations.find(o => o.id === opening?.organization_id);
                    const site = sites.find(s => s.id === opening?.site_id);
                    
                    return (
                      <Card
                        key={match.opening_id}
                        className={`cursor-pointer transition-all ${
                          selectedOpenings.includes(match.opening_id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:border-slate-300'
                        }`}
                        onClick={() => toggleOpening(match.opening_id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{opening?.title}</h4>
                                <Badge variant={match.score >= 70 ? 'default' : 'secondary'}>
                                  {match.score}% match
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{org?.legal_name}</p>
                              <p className="text-xs text-slate-500">{site?.city}, {site?.county} County</p>
                              <p className="text-xs text-slate-600 mt-2">{match.explanation}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedOpenings.includes(match.opening_id)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-slate-300'
                            }`}>
                              {selectedOpenings.includes(match.opening_id) && (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Review & Submit</h3>
              </div>

              <Card className="bg-slate-50">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Client</p>
                    <p className="font-medium">{formData.client_initials || 'N/A'} • Age {formData.client_age} • {formData.client_gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Location & Funding</p>
                    <p className="text-sm">{formData.client_county} County • {formData.funding_source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Selected Openings</p>
                    <p className="text-sm">{selectedOpenings.length} opening(s) selected</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Urgency</p>
                    <Badge>{formData.urgency}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !canProceedStep1 : step === 3 ? !canProceedStep3 : false}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !canProceedStep3}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Referral'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}