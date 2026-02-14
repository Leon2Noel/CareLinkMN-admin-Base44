import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  FileCheck,
  Building2,
  ChevronRight,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function LicenseTaxonomy() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('categories');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dialogType, setDialogType] = useState('category'); // 'category' or 'type'

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['license-categories'],
    queryFn: () => base44.entities.LicenseCategory.list()
  });

  const { data: licenseTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['license-types'],
    queryFn: () => base44.entities.LicenseType.list()
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.LicenseCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-categories'] });
      setShowAddDialog(false);
      setEditingItem(null);
    }
  });

  const createTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.LicenseType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-types'] });
      setShowAddDialog(false);
      setEditingItem(null);
    }
  });

  const categoryColumns = [
    {
      key: 'code',
      header: 'Code',
      render: (value) => <Badge variant="outline" className="font-mono">{value}</Badge>
    },
    {
      key: 'name',
      header: 'Name',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'issuing_authority',
      header: 'Authority',
      render: (value) => (
        <Badge className={value === 'MDH' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'statute_reference',
      header: 'Statute',
      render: (value) => <span className="text-slate-600">{value || '-'}</span>
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value) => value ? (
        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
      ) : (
        <Badge variant="outline">Inactive</Badge>
      )
    }
  ];

  const typeColumns = [
    {
      key: 'code',
      header: 'Code',
      render: (value) => <Badge variant="outline" className="font-mono">{value}</Badge>
    },
    {
      key: 'name',
      header: 'Name',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'category_id',
      header: 'Category',
      render: (value) => {
        const cat = categories.find(c => c.id === value || c.code === value);
        return cat ? (
          <Badge variant="secondary">{cat.code}</Badge>
        ) : (
          <span className="text-slate-400">{value}</span>
        );
      }
    },
    {
      key: 'allowed_program_models',
      header: 'Allowed Programs',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {(value || []).slice(0, 3).map(p => (
            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
          ))}
          {(value || []).length > 3 && (
            <Badge variant="outline" className="text-xs">+{value.length - 3}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value) => value ? (
        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
      ) : (
        <Badge variant="outline">Inactive</Badge>
      )
    }
  ];

  const openAddDialog = (type) => {
    setDialogType(type);
    setEditingItem(null);
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="License Taxonomy"
        description="Manage license categories, types, and their program model mappings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">License Categories</TabsTrigger>
          <TabsTrigger value="types">License Types</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              License categories represent regulatory frameworks (MDH 144G, DHS 245D, etc.)
            </p>
            <Button onClick={() => openAddDialog('category')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
          <DataTable
            columns={categoryColumns}
            data={categories}
            isLoading={catLoading}
            emptyMessage="No license categories defined"
          />
        </TabsContent>

        <TabsContent value="types" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              License types are specific licenses under each category (ALF, 245D Basic, etc.)
            </p>
            <Button onClick={() => openAddDialog('type')}>
              <Plus className="w-4 h-4 mr-2" />
              Add License Type
            </Button>
          </div>
          <DataTable
            columns={typeColumns}
            data={licenseTypes}
            isLoading={typesLoading}
            emptyMessage="No license types defined"
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'category' ? 'Add License Category' : 'Add License Type'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'category' ? (
            <CategoryForm 
              onSubmit={(data) => createCategoryMutation.mutate(data)}
              isLoading={createCategoryMutation.isPending}
            />
          ) : (
            <TypeForm 
              categories={categories}
              onSubmit={(data) => createTypeMutation.mutate(data)}
              isLoading={createTypeMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ onSubmit, isLoading, initialData }) {
  const [form, setForm] = useState(initialData || {
    code: '',
    name: '',
    issuing_authority: 'DHS',
    statute_reference: '',
    description: '',
    is_active: true
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Code</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
            placeholder="DHS_245D"
          />
        </div>
        <div>
          <Label>Authority</Label>
          <Select value={form.issuing_authority} onValueChange={(v) => setForm({...form, issuing_authority: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MDH">MDH (Dept of Health)</SelectItem>
              <SelectItem value="DHS">DHS (Human Services)</SelectItem>
              <SelectItem value="DEED">DEED (Employment)</SelectItem>
              <SelectItem value="County">County</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          placeholder="DHS 245D - Home and Community-Based Services"
        />
      </div>
      <div>
        <Label>Statute Reference</Label>
        <Input
          value={form.statute_reference}
          onChange={(e) => setForm({...form, statute_reference: e.target.value})}
          placeholder="MN Statute 245D"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.is_active}
          onCheckedChange={(v) => setForm({...form, is_active: v})}
        />
        <Label>Active</Label>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(form)} disabled={isLoading || !form.code || !form.name}>
          {isLoading ? 'Saving...' : 'Save Category'}
        </Button>
      </DialogFooter>
    </div>
  );
}

function TypeForm({ categories, onSubmit, isLoading, initialData }) {
  const [form, setForm] = useState(initialData || {
    code: '',
    name: '',
    category_id: '',
    description: '',
    allowed_program_models: [],
    max_capacity: null,
    renewal_period_months: 12,
    is_active: true
  });

  const PROGRAM_OPTIONS = ['CRS', 'IHS', 'SLS', 'RESPITE', 'CRISIS', 'MEMORY_CARE', 'ASSISTED_LIVING', 'AFC', 'DAY_SERVICES', 'EMPLOYMENT'];

  const toggleProgram = (code) => {
    const current = form.allowed_program_models || [];
    const updated = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    setForm({...form, allowed_program_models: updated});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Code</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
            placeholder="245D_INTENSIVE"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={form.category_id} onValueChange={(v) => setForm({...form, category_id: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.code} - {cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          placeholder="245D Intensive Support Services"
        />
      </div>
      <div>
        <Label className="mb-2 block">Allowed Program Models</Label>
        <div className="flex flex-wrap gap-2">
          {PROGRAM_OPTIONS.map(prog => (
            <Badge
              key={prog}
              variant={form.allowed_program_models?.includes(prog) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleProgram(prog)}
            >
              {prog}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Max Capacity</Label>
          <Input
            type="number"
            value={form.max_capacity || ''}
            onChange={(e) => setForm({...form, max_capacity: e.target.value ? parseInt(e.target.value) : null})}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label>Renewal Period (months)</Label>
          <Input
            type="number"
            value={form.renewal_period_months}
            onChange={(e) => setForm({...form, renewal_period_months: parseInt(e.target.value)})}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.is_active}
          onCheckedChange={(v) => setForm({...form, is_active: v})}
        />
        <Label>Active</Label>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(form)} disabled={isLoading || !form.code || !form.name || !form.category_id}>
          {isLoading ? 'Saving...' : 'Save License Type'}
        </Button>
      </DialogFooter>
    </div>
  );
}