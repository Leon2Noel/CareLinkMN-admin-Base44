import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  MapPin,
  DoorOpen,
  TrendingUp,
  CheckCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIAssistant() {
  const [clientNotes, setClientNotes] = useState('');
  const [clientCounty, setClientCounty] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [matches, setMatches] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: openings = [] } = useQuery({
    queryKey: ['active-openings'],
    queryFn: () => base44.entities.Opening.filter({ status: 'active' }),
    initialData: []
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
    initialData: []
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
    initialData: []
  });

  const findMatchesMutation = useMutation({
    mutationFn: async (params) => {
      // Use AI to analyze client needs and match with openings
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a care placement AI assistant. Analyze the following client needs and suggest the best matching openings.

Client Information:
- County: ${params.clientCounty}
- Funding Source: ${params.fundingSource}
- Client Notes: ${params.clientNotes}

Available Openings:
${params.openings.map((o, i) => `
${i + 1}. Opening ID: ${o.id}
   - Title: ${o.title}
   - Organization: ${params.orgMap[o.organization_id]?.legal_name || 'Unknown'}
   - Site: ${params.siteMap[o.site_id]?.name || 'Unknown'}
   - County: ${params.siteMap[o.site_id]?.county || 'Unknown'}
   - Type: ${o.opening_type}
   - Spots: ${o.spots_available}
   - Gender: ${o.gender_requirement}
   - Age Range: ${o.age_min || 'any'} - ${o.age_max || 'any'}
   - Funding: ${o.funding_accepted?.join(', ') || 'Not specified'}
   - Description: ${o.description || 'No description'}
`).join('\n')}

For each suitable opening, provide:
1. Opening ID
2. Confidence Score (0-100)
3. Match Reasoning (why it's a good fit)
4. Key Strengths (2-3 bullet points)
5. Considerations (any potential concerns)

Return ONLY the top 5 best matches, ordered by confidence score (highest first).`,
        response_json_schema: {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  opening_id: { type: 'string' },
                  confidence_score: { type: 'number' },
                  match_reasoning: { type: 'string' },
                  key_strengths: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  considerations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      });

      return response.matches;
    }
  });

  const handleAnalyze = async () => {
    if (!clientNotes || !clientCounty || !fundingSource) {
      alert('Please provide client county, funding source, and notes');
      return;
    }

    setIsAnalyzing(true);
    
    const orgMap = organizations.reduce((acc, org) => {
      acc[org.id] = org;
      return acc;
    }, {});

    const siteMap = sites.reduce((acc, site) => {
      acc[site.id] = site;
      return acc;
    }, {});

    try {
      const result = await findMatchesMutation.mutateAsync({
        clientNotes,
        clientCounty,
        fundingSource,
        openings,
        orgMap,
        siteMap
      });

      // Enrich matches with full opening data
      const enrichedMatches = result.map(match => ({
        ...match,
        opening: openings.find(o => o.id === match.opening_id),
        organization: orgMap[openings.find(o => o.id === match.opening_id)?.organization_id],
        site: siteMap[openings.find(o => o.id === match.opening_id)?.site_id]
      }));

      setMatches(enrichedMatches);
    } catch (error) {
      console.error('Failed to analyze:', error);
      alert('Failed to analyze client needs. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Fair Match';
    return 'Possible Match';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Placement Assistant"
        description="Analyze client needs and find the best matching openings with AI-powered recommendations"
        icon={Sparkles}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="county">Client County *</Label>
                <Input
                  id="county"
                  placeholder="e.g., Hennepin"
                  value={clientCounty}
                  onChange={(e) => setClientCounty(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="funding">Funding Source *</Label>
                <Input
                  id="funding"
                  placeholder="e.g., CADI, DD, BI"
                  value={fundingSource}
                  onChange={(e) => setFundingSource(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Client Needs & Notes *</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe client's diagnosis, behavioral needs, medical requirements, support needs, age, gender, urgency, etc."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Be detailed - better information leads to better matches
                </p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !clientNotes || !clientCounty || !fundingSource}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Matches
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>How it works:</strong> Our AI analyzes your client's needs and compares them against all active openings, considering location, funding, capacity, and support requirements.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {matches.length === 0 && !isAnalyzing && (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Enter client information and click "Find Matches" to get AI-powered recommendations</p>
              </div>
            </Card>
          )}

          {isAnalyzing && (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-purple-600 animate-spin" />
                <p className="text-slate-600">Analyzing {openings.length} openings...</p>
                <p className="text-sm text-slate-500 mt-2">This may take 10-15 seconds</p>
              </div>
            </Card>
          )}

          {matches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Top {matches.length} Matches
                </h3>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  AI-Powered
                </Badge>
              </div>

              {matches.map((match, idx) => (
                <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-slate-900">
                            {match.opening?.title}
                          </h4>
                          <Badge className={getConfidenceColor(match.confidence_score)}>
                            {match.confidence_score}% {getConfidenceLabel(match.confidence_score)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {match.organization?.legal_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {match.site?.name} ({match.site?.county})
                          </span>
                          <span className="flex items-center gap-1">
                            <DoorOpen className="w-4 h-4" />
                            {match.opening?.spots_available} spots
                          </span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        #{idx + 1}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-900 mb-2">
                          Why this match?
                        </h5>
                        <p className="text-sm text-slate-700">{match.match_reasoning}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Key Strengths
                          </h5>
                          <ul className="space-y-1">
                            {match.key_strengths.map((strength, sidx) => (
                              <li key={sidx} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-emerald-600 mt-1">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {match.considerations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Considerations
                            </h5>
                            <ul className="space-y-1">
                              {match.considerations.map((consideration, cidx) => (
                                <li key={cidx} className="text-sm text-slate-700 flex items-start gap-2">
                                  <span className="text-amber-600 mt-1">•</span>
                                  <span>{consideration}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Type: {match.opening?.opening_type}</span>
                          <span>Gender: {match.opening?.gender_requirement}</span>
                          {match.opening?.funding_accepted && (
                            <span>Funding: {match.opening.funding_accepted.join(', ')}</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={createPageUrl('OpeningDetail') + `?id=${match.opening?.id}`}>
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}