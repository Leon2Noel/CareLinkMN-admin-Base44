import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Search,
  User,
  MapPin,
  DollarSign,
  Building2,
  Bed,
  ChevronRight,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3
} from 'lucide-react';
import { matchReferralToOpenings, generateMatchExplanation, identifyRiskFlags, DEFAULT_WEIGHTS, DEFAULT_CONSTRAINTS, DEFAULT_THRESHOLDS } from '@/components/matching/MatchingAlgorithm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MN_COUNTIES = [
  'Hennepin', 'Ramsey', 'Dakota', 'Anoka', 'Washington', 'Scott', 'Carver',
  'Wright', 'Sherburne', 'Stearns', 'Olmsted', 'St. Louis', 'Blue Earth',
  'Rice', 'Winona', 'Mower', 'Freeborn', 'Steele', 'Goodhue', 'Wabasha'
];

const FUNDING_SOURCES = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC', 'MA_FFS', 'MA_MCO', 'Private_Pay'];

export default function MatchingSimulation() {
  const [simulationInput, setSimulationInput] = useState({
    client_initials: 'JD',
    client_age: 35,
    client_gender: 'male',
    client_county: 'Hennepin',
    funding_source: 'CADI',
    urgency: 'routine',
    behavioral_summary: '',
    medical_summary: '',
    support_needs: ''
  });

  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: openings = [] } = useQuery({
    queryKey: ['openings-simulation'],
    queryFn: () => base44.entities.Opening.list()
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-simulation'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites-simulation'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses-simulation'],
    queryFn: () => base44.entities.LicenseInstance.list()
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['capabilities-simulation'],
    queryFn: () => base44.entities.CapabilityProfile.list()
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['matching-configs'],
    queryFn: () => base44.entities.MatchingConfig.filter({ is_active: true })
  });

  // Load saved config
  const config = useMemo(() => {
    const weightsConfig = configs.find(c => c.config_type === 'weights');
    const constraintsConfig = configs.find(c => c.config_type === 'constraints');
    const thresholdsConfig = configs.find(c => c.config_type === 'thresholds');

    return {
      weights: weightsConfig?.weights || DEFAULT_WEIGHTS,
      constraints: constraintsConfig?.constraints || DEFAULT_CONSTRAINTS,
      thresholds: thresholdsConfig?.thresholds || DEFAULT_THRESHOLDS
    };
  }, [configs]);

  const logMutation = useMutation({
    mutationFn: (logData) => base44.entities.MatchingLog.create(logData)
  });

  const runSimulation = () => {
    setIsRunning(true);

    // Small delay to show loading state
    setTimeout(() => {
      const matchResults = matchReferralToOpenings(
        simulationInput,
        openings,
        organizations,
        sites,
        licenses,
        capabilities,
        config
      );

      // Add explanations and risk flags
      matchResults.results = matchResults.results.map(r => ({
        ...r,
        explanation: generateMatchExplanation(r.score_breakdown, r.score),
        risk_flags: identifyRiskFlags(simulationInput, r)
      }));

      setResults(matchResults);
      setIsRunning(false);

      // Log the simulation
      logMutation.mutate({
        query_type: 'simulation',
        openings_searched: matchResults.meta.openings_searched,
        matches_found: matchResults.meta.matches_found,
        top_match_score: matchResults.meta.top_match_score,
        avg_match_score: matchResults.meta.avg_match_score,
        latency_ms: matchResults.meta.latency_ms,
        config_snapshot: config,
        filters_applied: simulationInput,
        status: matchResults.results.length > 0 ? 'success' : 'no_matches'
      });
    }, 500);
  };

  const handleInputChange = (field, value) => {
    setSimulationInput(prev => ({ ...prev, [field]: value }));
    setResults(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getQualityBadge = (quality) => {
    switch (quality) {
      case 'excellent': return <Badge className="bg-emerald-100 text-emerald-700">Excellent</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-700">Good</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700">Fair</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Manager Search Simulation"
        description="Test the matching engine with sample client profiles to validate algorithm behavior"
        actions={
          <Button variant="outline" asChild>
            <Link to={createPageUrl('MatchingConfig')}>
              Configure Weights
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Client Profile
            </CardTitle>
            <CardDescription>Enter client details to simulate a search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Initials</Label>
                <Input
                  value={simulationInput.client_initials}
                  onChange={(e) => handleInputChange('client_initials', e.target.value)}
                  placeholder="JD"
                />
              </div>
              <div>
                <Label className="text-xs">Age</Label>
                <Input
                  type="number"
                  value={simulationInput.client_age}
                  onChange={(e) => handleInputChange('client_age', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Gender</Label>
              <Select value={simulationInput.client_gender} onValueChange={(v) => handleInputChange('client_gender', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">County</Label>
              <Select value={simulationInput.client_county} onValueChange={(v) => handleInputChange('client_county', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MN_COUNTIES.map(county => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Funding Source</Label>
              <Select value={simulationInput.funding_source} onValueChange={(v) => handleInputChange('funding_source', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_SOURCES.map(fs => (
                    <SelectItem key={fs} value={fs}>{fs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Urgency</Label>
              <Select value={simulationInput.urgency} onValueChange={(v) => handleInputChange('urgency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="crisis">Crisis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Behavioral Summary</Label>
              <Textarea
                value={simulationInput.behavioral_summary}
                onChange={(e) => handleInputChange('behavioral_summary', e.target.value)}
                placeholder="e.g., History of verbal aggression, elopement risk"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-xs">Medical Summary</Label>
              <Textarea
                value={simulationInput.medical_summary}
                onChange={(e) => handleInputChange('medical_summary', e.target.value)}
                placeholder="e.g., Seizure disorder, requires medication management"
                rows={2}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={runSimulation}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          {results && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-lg font-bold">{results.meta.openings_searched}</p>
                    <p className="text-xs text-slate-500">Searched</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-lg font-bold">{results.meta.matches_found}</p>
                    <p className="text-xs text-slate-500">Matches</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-lg font-bold">{results.meta.top_match_score || '-'}</p>
                    <p className="text-xs text-slate-500">Top Score</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-lg font-bold">{results.meta.latency_ms}ms</p>
                    <p className="text-xs text-slate-500">Latency</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Match Results */}
          {results && results.results.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Match Results</h3>
              {results.results.map((match, idx) => (
                <Card key={match.opening_id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          match.quality === 'excellent' ? 'bg-emerald-100' :
                          match.quality === 'good' ? 'bg-blue-100' : 'bg-amber-100'
                        }`}>
                          <span className="font-bold text-lg">#{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{match.opening?.title || 'Opening'}</h4>
                            {getQualityBadge(match.quality)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {match.organization?.legal_name || 'Provider'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {match.site?.county || 'Unknown'} County
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-3 h-3" />
                              {match.opening?.spots_available || 0} spots
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
                          {match.score}
                        </p>
                        <p className="text-xs text-slate-500">Match Score</p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-slate-500 mb-2">SCORE BREAKDOWN</p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {Object.entries(match.score_breakdown).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <p className="text-xs text-slate-500 capitalize">{key.replace('_', ' ')}</p>
                            <p className={`font-semibold ${value > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              +{Math.round(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation & Flags */}
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <p className="text-sm text-slate-600">{match.explanation}</p>
                      {match.risk_flags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {match.risk_flags.map((flag, i) => (
                            <Badge key={i} variant="outline" className="text-xs text-amber-700 border-amber-300">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : results ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No Matches Found</h3>
              <p className="text-slate-500 mt-1">
                No openings matched the search criteria. Try adjusting the client profile or constraints.
              </p>
            </Card>
          ) : (
            <Card className="p-12 text-center border-dashed">
              <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Ready to Simulate</h3>
              <p className="text-slate-500 mt-1">
                Configure a client profile and click "Run Simulation" to test the matching engine
              </p>
            </Card>
          )}

          {/* Config Used */}
          {results && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuration Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Weights</p>
                    <div className="space-y-1">
                      {Object.entries(results.meta.config_used.weights).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-600 capitalize">{k.replace('_', ' ')}</span>
                          <span className="font-mono">{v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Constraints</p>
                    <div className="space-y-1">
                      {Object.entries(results.meta.config_used.constraints)
                        .filter(([k]) => typeof results.meta.config_used.constraints[k] === 'boolean')
                        .map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2">
                            {v ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <span className="w-3 h-3 rounded-full bg-slate-200" />
                            )}
                            <span className="text-slate-600 capitalize text-xs">{k.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Thresholds</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Minimum</span>
                        <span className="font-mono">{results.meta.config_used.thresholds.minimum_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Good</span>
                        <span className="font-mono">{results.meta.config_used.thresholds.good_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Excellent</span>
                        <span className="font-mono">{results.meta.config_used.thresholds.excellent_score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}