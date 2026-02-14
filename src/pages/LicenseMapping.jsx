import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Play,
  FileCheck,
  Layers
} from 'lucide-react';

// License type to program mapping rules - the "enforcement spine"
const DEFAULT_MAPPINGS = [
  // 245D Intensive allows
  { license: '245D_INTENSIVE', program: 'CRS', allowed: true, severity: 'block', message: 'CRS requires 245D Intensive license' },
  { license: '245D_INTENSIVE', program: 'IHS', allowed: true, severity: 'block', message: 'IHS allowed under 245D Intensive' },
  { license: '245D_INTENSIVE', program: 'SLS', allowed: true, severity: 'block', message: 'SLS allowed under 245D Intensive' },
  { license: '245D_INTENSIVE', program: 'RESPITE', allowed: true, severity: 'block', message: 'Respite allowed under 245D Intensive' },
  { license: '245D_INTENSIVE', program: 'CRISIS', allowed: true, severity: 'block', message: 'Crisis services require 245D Intensive' },
  { license: '245D_INTENSIVE', program: 'DAY_SERVICES', allowed: true, severity: 'block', message: 'Day services allowed under 245D Intensive' },
  { license: '245D_INTENSIVE', program: 'EMPLOYMENT', allowed: true, severity: 'block', message: 'Employment services allowed' },
  
  // 245D Basic allows (subset)
  { license: '245D_BASIC', program: 'CRS', allowed: false, severity: 'block', message: 'CRS requires 245D Intensive, not Basic' },
  { license: '245D_BASIC', program: 'IHS', allowed: false, severity: 'warn', message: 'IHS typically requires 245D Intensive; Basic may be limited' },
  { license: '245D_BASIC', program: 'SLS', allowed: true, severity: 'block', message: 'SLS allowed under 245D Basic' },
  { license: '245D_BASIC', program: 'RESPITE', allowed: true, severity: 'block', message: 'Respite allowed under 245D Basic' },
  { license: '245D_BASIC', program: 'DAY_SERVICES', allowed: true, severity: 'block', message: 'Day services allowed under 245D Basic' },
  { license: '245D_BASIC', program: 'EMPLOYMENT', allowed: true, severity: 'block', message: 'Employment services allowed' },
  
  // 144G ALF allows
  { license: 'ALF', program: 'ASSISTED_LIVING', allowed: true, severity: 'block', message: 'Assisted Living allowed under ALF' },
  { license: 'ALF', program: 'MEMORY_CARE', allowed: false, severity: 'block', message: 'Memory Care requires ALD (Dementia Care license), not standard ALF' },
  { license: 'ALF', program: 'RESPITE', allowed: true, severity: 'block', message: 'Respite allowed under ALF' },
  
  // 144G ALD (Dementia) allows
  { license: 'ALD', program: 'ASSISTED_LIVING', allowed: true, severity: 'block', message: 'Assisted Living allowed under ALD' },
  { license: 'ALD', program: 'MEMORY_CARE', allowed: true, severity: 'block', message: 'Memory Care allowed under ALD' },
  { license: 'ALD', program: 'RESPITE', allowed: true, severity: 'block', message: 'Respite allowed under ALD' },
  
  // Adult Foster Care
  { license: 'ADULT_FOSTER', program: 'AFC', allowed: true, severity: 'block', message: 'AFC requires Adult Foster Care license' },
  
  // HWS Registered
  { license: 'HWS_REGISTERED', program: 'ASSISTED_LIVING', allowed: true, severity: 'warn', message: 'Basic assisted living allowed under HWS registration' },
];

export default function LicenseMapping() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mappings');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testInput, setTestInput] = useState({ license: '', program: '' });
  const [testResult, setTestResult] = useState(null);

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['license-program-maps'],
    queryFn: () => base44.entities.LicenseProgramMap.list()
  });

  const { data: licenseTypes = [] } = useQuery({
    queryKey: ['license-types'],
    queryFn: () => base44.entities.LicenseType.list()
  });

  const { data: programModels = [] } = useQuery({
    queryKey: ['program-models'],
    queryFn: () => base44.entities.ProgramModel.list()
  });

  const createMappingMutation = useMutation({
    mutationFn: (data) => base44.entities.LicenseProgramMap.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-program-maps'] });
      setShowAddDialog(false);
    }
  });

  // Combine DB mappings with defaults (DB takes precedence)
  const allMappings = useMemo(() => {
    const dbMap = new Map(mappings.map(m => [`${m.license_type_code}-${m.program_model_code}`, m]));
    const combined = [...mappings];
    
    DEFAULT_MAPPINGS.forEach(dm => {
      const key = `${dm.license}-${dm.program}`;
      if (!dbMap.has(key)) {
        combined.push({
          id: `default-${key}`,
          license_type_code: dm.license,
          program_model_code: dm.program,
          allowed: dm.allowed,
          rule_severity: dm.severity,
          message: dm.message,
          rule_code: `LIC_PROG_${dm.license}_${dm.program}`,
          is_default: true
        });
      }
    });
    
    return combined;
  }, [mappings]);

  const columns = [
    {
      key: 'license_type_code',
      header: 'License Type',
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-slate-400" />
          <Badge variant="outline" className="font-mono">{value}</Badge>
        </div>
      )
    },
    {
      key: 'arrow',
      header: '',
      className: 'w-10',
      render: () => <ArrowRight className="w-4 h-4 text-slate-300" />
    },
    {
      key: 'program_model_code',
      header: 'Program Model',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <Badge variant="outline" className="font-mono">{value}</Badge>
        </div>
      )
    },
    {
      key: 'allowed',
      header: 'Allowed',
      render: (value) => value ? (
        <Badge className="bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Allowed
        </Badge>
      ) : (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Blocked
        </Badge>
      )
    },
    {
      key: 'rule_severity',
      header: 'Severity',
      render: (value) => (
        <Badge className={value === 'block' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
          {value === 'block' ? 'Block' : 'Warn'}
        </Badge>
      )
    },
    {
      key: 'message',
      header: 'Message',
      render: (value) => <span className="text-sm text-slate-600">{value}</span>
    },
    {
      key: 'is_default',
      header: 'Source',
      render: (_, row) => row.is_default ? (
        <Badge variant="outline">Default</Badge>
      ) : (
        <Badge className="bg-blue-100 text-blue-700">Custom</Badge>
      )
    }
  ];

  const runTest = () => {
    if (!testInput.license || !testInput.program) return;
    
    const mapping = allMappings.find(
      m => m.license_type_code === testInput.license && m.program_model_code === testInput.program
    );
    
    if (mapping) {
      setTestResult({
        allowed: mapping.allowed,
        severity: mapping.rule_severity,
        message: mapping.message,
        rule_code: mapping.rule_code
      });
    } else {
      setTestResult({
        allowed: false,
        severity: 'block',
        message: `No mapping found for ${testInput.license} → ${testInput.program}. This combination is blocked by default.`,
        rule_code: 'NO_MAPPING'
      });
    }
  };

  const LICENSE_OPTIONS = ['245D_INTENSIVE', '245D_BASIC', 'ALF', 'ALD', 'HWS_REGISTERED', 'ADULT_FOSTER', 'SNF', 'ICF'];
  const PROGRAM_OPTIONS = ['CRS', 'IHS', 'SLS', 'RESPITE', 'CRISIS', 'MEMORY_CARE', 'ASSISTED_LIVING', 'AFC', 'DAY_SERVICES', 'EMPLOYMENT'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="License-Program Mapping"
        description="Define and test which license types allow which program models"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mappings">Mapping Rules</TabsTrigger>
          <TabsTrigger value="test">Test Harness</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              These rules determine which programs a provider can activate based on their licenses
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allMappings.filter(m => m.allowed).length}</p>
                  <p className="text-sm text-slate-500">Allowed Combinations</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allMappings.filter(m => !m.allowed).length}</p>
                  <p className="text-sm text-slate-500">Blocked Combinations</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allMappings.filter(m => !m.is_default).length}</p>
                  <p className="text-sm text-slate-500">Custom Rules</p>
                </div>
              </div>
            </Card>
          </div>

          <DataTable
            columns={columns}
            data={allMappings}
            isLoading={isLoading}
            emptyMessage="No mapping rules defined"
          />
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Rule Test Harness
              </CardTitle>
              <CardDescription>
                Test license-program combinations to see validation results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>License Type</Label>
                  <Select value={testInput.license} onValueChange={(v) => setTestInput({...testInput, license: v})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_OPTIONS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Program Model</Label>
                  <Select value={testInput.program} onValueChange={(v) => setTestInput({...testInput, program: v})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select program model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_OPTIONS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={runTest} disabled={!testInput.license || !testInput.program}>
                <Play className="w-4 h-4 mr-2" />
                Run Test
              </Button>

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.allowed 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.allowed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-semibold ${testResult.allowed ? 'text-emerald-800' : 'text-red-800'}`}>
                        {testResult.allowed ? 'ALLOWED' : 'BLOCKED'}
                      </p>
                      <p className="text-sm mt-1">{testResult.message}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline" className="font-mono text-xs">{testResult.rule_code}</Badge>
                        <Badge className={testResult.severity === 'block' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {testResult.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Mapping Rule</DialogTitle>
          </DialogHeader>
          <MappingForm 
            onSubmit={(data) => createMappingMutation.mutate(data)}
            isLoading={createMappingMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MappingForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    license_type_code: '',
    program_model_code: '',
    allowed: true,
    rule_severity: 'block',
    message: '',
    rule_code: '',
    requires_verification: true,
    min_license_status: ['verified'],
    is_active: true
  });

  const LICENSE_OPTIONS = ['245D_INTENSIVE', '245D_BASIC', 'ALF', 'ALD', 'HWS_REGISTERED', 'ADULT_FOSTER', 'SNF', 'ICF'];
  const PROGRAM_OPTIONS = ['CRS', 'IHS', 'SLS', 'RESPITE', 'CRISIS', 'MEMORY_CARE', 'ASSISTED_LIVING', 'AFC', 'DAY_SERVICES', 'EMPLOYMENT'];

  const generateRuleCode = () => {
    if (form.license_type_code && form.program_model_code) {
      return `LIC_PROG_${form.license_type_code}_${form.program_model_code}`;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>License Type</Label>
          <Select value={form.license_type_code} onValueChange={(v) => setForm({...form, license_type_code: v, rule_code: `LIC_PROG_${v}_${form.program_model_code}`})}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {LICENSE_OPTIONS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Program Model</Label>
          <Select value={form.program_model_code} onValueChange={(v) => setForm({...form, program_model_code: v, rule_code: `LIC_PROG_${form.license_type_code}_${v}`})}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_OPTIONS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Switch
            checked={form.allowed}
            onCheckedChange={(v) => setForm({...form, allowed: v})}
          />
          <Label>{form.allowed ? 'Allowed' : 'Blocked'}</Label>
        </div>
        <div>
          <Label>Severity</Label>
          <Select value={form.rule_severity} onValueChange={(v) => setForm({...form, rule_severity: v})}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="block">Block (Hard Stop)</SelectItem>
              <SelectItem value="warn">Warn (Allow with Warning)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Rule Code</Label>
        <Input
          value={form.rule_code || generateRuleCode()}
          onChange={(e) => setForm({...form, rule_code: e.target.value})}
          className="font-mono mt-1"
        />
      </div>

      <div>
        <Label>Message</Label>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({...form, message: e.target.value})}
          placeholder="Human-readable explanation of this rule..."
          className="mt-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={form.requires_verification}
          onCheckedChange={(v) => setForm({...form, requires_verification: v})}
        />
        <Label>Requires license verification</Label>
      </div>

      <DialogFooter>
        <Button 
          onClick={() => onSubmit(form)} 
          disabled={isLoading || !form.license_type_code || !form.program_model_code}
        >
          {isLoading ? 'Saving...' : 'Save Rule'}
        </Button>
      </DialogFooter>
    </div>
  );
}