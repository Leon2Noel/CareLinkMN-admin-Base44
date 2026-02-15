import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Lock,
  Gauge,
  Save,
  RotateCcw,
  Info,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { DEFAULT_WEIGHTS, DEFAULT_CONSTRAINTS, DEFAULT_THRESHOLDS } from '@/components/matching/MatchingAlgorithm';

export default function MatchingConfig() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('weights');
  const [hasChanges, setHasChanges] = useState(false);

  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['matching-configs'],
    queryFn: () => base44.entities.MatchingConfig.filter({ is_active: true })
  });

  // Load saved config
  useEffect(() => {
    if (configs.length > 0) {
      const weightsConfig = configs.find(c => c.config_type === 'weights');
      const constraintsConfig = configs.find(c => c.config_type === 'constraints');
      const thresholdsConfig = configs.find(c => c.config_type === 'thresholds');

      if (weightsConfig?.weights) setWeights({ ...DEFAULT_WEIGHTS, ...weightsConfig.weights });
      if (constraintsConfig?.constraints) setConstraints({ ...DEFAULT_CONSTRAINTS, ...constraintsConfig.constraints });
      if (thresholdsConfig?.thresholds) setThresholds({ ...DEFAULT_THRESHOLDS, ...thresholdsConfig.thresholds });
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const weightsConfig = configs.find(c => c.config_type === 'weights');
      const constraintsConfig = configs.find(c => c.config_type === 'constraints');
      const thresholdsConfig = configs.find(c => c.config_type === 'thresholds');

      const ops = [];

      if (weightsConfig) {
        ops.push(base44.entities.MatchingConfig.update(weightsConfig.id, { weights }));
      } else {
        ops.push(base44.entities.MatchingConfig.create({ 
          config_type: 'weights', 
          name: 'Default Weights',
          weights,
          is_active: true 
        }));
      }

      if (constraintsConfig) {
        ops.push(base44.entities.MatchingConfig.update(constraintsConfig.id, { constraints }));
      } else {
        ops.push(base44.entities.MatchingConfig.create({ 
          config_type: 'constraints', 
          name: 'Default Constraints',
          constraints,
          is_active: true 
        }));
      }

      if (thresholdsConfig) {
        ops.push(base44.entities.MatchingConfig.update(thresholdsConfig.id, { thresholds }));
      } else {
        ops.push(base44.entities.MatchingConfig.create({ 
          config_type: 'thresholds', 
          name: 'Default Thresholds',
          thresholds,
          is_active: true 
        }));
      }

      await Promise.all(ops);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matching-configs'] });
      setHasChanges(false);
    }
  });

  const handleWeightChange = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: value[0] }));
    setHasChanges(true);
  };

  const handleConstraintChange = (key, value) => {
    setConstraints(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleThresholdChange = (key, value) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setWeights(DEFAULT_WEIGHTS);
    setConstraints(DEFAULT_CONSTRAINTS);
    setThresholds(DEFAULT_THRESHOLDS);
    setHasChanges(true);
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isValidWeight = totalWeight === 100;

  const weightLabels = {
    county_match: { label: 'County Match', description: 'Weight for geographic proximity' },
    funding_match: { label: 'Funding Match', description: 'Weight for compatible funding sources' },
    gender_match: { label: 'Gender Match', description: 'Weight for gender requirements' },
    age_match: { label: 'Age Match', description: 'Weight for age range compatibility' },
    availability_match: { label: 'Availability', description: 'Weight for immediate/upcoming availability' },
    capability_match: { label: 'Capability Match', description: 'Weight for clinical capability alignment' }
  };

  const constraintLabels = {
    require_funding_match: { label: 'Require Funding Match', description: 'Opening must accept client funding source' },
    require_county_proximity: { label: 'Require County Proximity', description: 'Opening must be within max distance' },
    require_gender_match: { label: 'Require Gender Match', description: 'Opening gender requirement must match client' },
    require_age_range_match: { label: 'Require Age Range Match', description: 'Client age must be within opening range' },
    require_verified_license: { label: 'Require Verified License', description: 'Provider must have verified license' }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching Weights & Constraints"
        description="Configure the matching algorithm parameters and hard constraints"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Defaults
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={!hasChanges || saveMutation.isPending || !isValidWeight}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        }
      />

      {hasChanges && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">You have unsaved changes</span>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weights" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Weights
          </TabsTrigger>
          <TabsTrigger value="constraints" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Constraints
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Thresholds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weights" className="mt-6">
          <div className="grid gap-6">
            {/* Weight Total Indicator */}
            <Card className={`p-4 ${isValidWeight ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isValidWeight ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${isValidWeight ? 'text-emerald-800' : 'text-red-800'}`}>
                    Total Weight: {totalWeight}%
                  </span>
                </div>
                <Badge className={isValidWeight ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                  {isValidWeight ? 'Valid' : 'Must equal 100%'}
                </Badge>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Matching Factor Weights</CardTitle>
                <CardDescription>
                  Adjust how much each factor contributes to the overall match score. Total must equal 100%.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(weightLabels).map(([key, { label, description }]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">{label}</Label>
                        <p className="text-xs text-slate-500">{description}</p>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {weights[key]}%
                      </Badge>
                    </div>
                    <Slider
                      value={[weights[key]]}
                      onValueChange={(value) => handleWeightChange(key, value)}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="constraints" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hard Constraints</CardTitle>
              <CardDescription>
                These constraints must be met for an opening to be considered a match. Violations disqualify the opening entirely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(constraintLabels).map(([key, { label, description }]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <Switch
                    checked={constraints[key]}
                    onCheckedChange={(checked) => handleConstraintChange(key, checked)}
                  />
                </div>
              ))}

              {constraints.require_county_proximity && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">Maximum County Distance (miles)</Label>
                  <Input
                    type="number"
                    value={constraints.max_county_distance}
                    onChange={(e) => handleConstraintChange('max_county_distance', parseInt(e.target.value) || 0)}
                    className="w-32 mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score Thresholds</CardTitle>
              <CardDescription>
                Configure the score boundaries for match quality classification and result limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum Score</Label>
                  <p className="text-xs text-slate-500">Matches below this score are not shown</p>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[thresholds.minimum_score]}
                      onValueChange={(value) => handleThresholdChange('minimum_score', value[0])}
                      max={60}
                      step={5}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="font-mono w-16 justify-center">
                      {thresholds.minimum_score}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Good Score</Label>
                  <p className="text-xs text-slate-500">Threshold for "good" match quality</p>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[thresholds.good_score]}
                      onValueChange={(value) => handleThresholdChange('good_score', value[0])}
                      min={50}
                      max={90}
                      step={5}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="font-mono w-16 justify-center bg-blue-50 text-blue-700">
                      {thresholds.good_score}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Excellent Score</Label>
                  <p className="text-xs text-slate-500">Threshold for "excellent" match quality</p>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[thresholds.excellent_score]}
                      onValueChange={(value) => handleThresholdChange('excellent_score', value[0])}
                      min={70}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="font-mono w-16 justify-center bg-emerald-50 text-emerald-700">
                      {thresholds.excellent_score}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Maximum Results</Label>
                  <p className="text-xs text-slate-500">Maximum number of matches to return</p>
                  <Input
                    type="number"
                    value={thresholds.max_results}
                    onChange={(e) => handleThresholdChange('max_results', parseInt(e.target.value) || 1)}
                    className="w-32"
                    min={1}
                    max={50}
                  />
                </div>
              </div>

              {/* Visual representation */}
              <div className="pt-6 border-t">
                <Label className="text-sm font-medium mb-4 block">Score Quality Scale</Label>
                <div className="relative h-8 rounded-lg overflow-hidden bg-slate-100">
                  <div 
                    className="absolute h-full bg-red-400" 
                    style={{ left: 0, width: `${thresholds.minimum_score}%` }}
                  />
                  <div 
                    className="absolute h-full bg-amber-400" 
                    style={{ left: `${thresholds.minimum_score}%`, width: `${thresholds.good_score - thresholds.minimum_score}%` }}
                  />
                  <div 
                    className="absolute h-full bg-blue-400" 
                    style={{ left: `${thresholds.good_score}%`, width: `${thresholds.excellent_score - thresholds.good_score}%` }}
                  />
                  <div 
                    className="absolute h-full bg-emerald-400" 
                    style={{ left: `${thresholds.excellent_score}%`, width: `${100 - thresholds.excellent_score}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>No Match</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}