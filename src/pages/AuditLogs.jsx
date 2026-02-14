import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { 
  Search, 
  Download,
  User,
  Calendar,
  Eye,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';

const ACTION_CONFIG = {
  create: { icon: Plus, color: 'bg-emerald-100 text-emerald-700', label: 'Created' },
  update: { icon: Pencil, color: 'bg-blue-100 text-blue-700', label: 'Updated' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-700', label: 'Deleted' },
  verify: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Verified' },
  approve: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  reject: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
  suspend: { icon: Shield, color: 'bg-amber-100 text-amber-700', label: 'Suspended' },
  restore: { icon: Shield, color: 'bg-emerald-100 text-emerald-700', label: 'Restored' },
  export: { icon: FileDown, color: 'bg-purple-100 text-purple-700', label: 'Exported' },
  view: { icon: Eye, color: 'bg-slate-100 text-slate-700', label: 'Viewed' },
};

const ENTITY_TYPES = [
  'Organization', 'LicenseInstance', 'ProgramActivation', 'Site', 'Opening', 'Referral', 'CapabilityProfile', 'FundingAcceptance'
];

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500)
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
      
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, searchTerm, actionFilter, entityFilter]);

  const columns = [
    {
      key: 'created_date',
      header: 'Timestamp',
      render: (value) => (
        <div>
          <p className="font-medium text-slate-900">{format(new Date(value), 'MMM d, yyyy')}</p>
          <p className="text-xs text-slate-500">{format(new Date(value), 'HH:mm:ss')}</p>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (value) => {
        const config = ACTION_CONFIG[value] || { icon: Eye, color: 'bg-slate-100 text-slate-700', label: value };
        const Icon = config.icon;
        return (
          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'entity_type',
      header: 'Entity',
      render: (value, row) => (
        <div>
          <p className="font-medium text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 font-mono">{row.entity_id?.slice(0, 8)}...</p>
        </div>
      )
    },
    {
      key: 'actor_email',
      header: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium">{value}</p>
            {row.actor_role && <p className="text-xs text-slate-500 capitalize">{row.actor_role}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (value) => (
        <span className="text-sm text-slate-600 truncate max-w-[200px] block">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(row)}>
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ];

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Actor', 'Role', 'Notes', 'IP Address'],
      ...filteredLogs.map(log => [
        log.created_date,
        log.action,
        log.entity_type,
        log.entity_id,
        log.actor_email,
        log.actor_role,
        log.notes,
        log.ip_address
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of all system changes and user actions"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by user email, entity ID, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.keys(ACTION_CONFIG).map(action => (
                  <SelectItem key={action} value={action} className="capitalize">{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITY_TYPES.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        emptyMessage="No audit logs found"
      />

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_date), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Action</p>
                  <Badge className={ACTION_CONFIG[selectedLog.action]?.color}>
                    {ACTION_CONFIG[selectedLog.action]?.label || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity ID</p>
                  <p className="font-mono text-sm">{selectedLog.entity_id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Actor</p>
                  <p className="font-medium">{selectedLog.actor_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-medium capitalize">{selectedLog.actor_role || '-'}</p>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm text-slate-500">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">User Agent</p>
                    <p className="text-sm text-slate-600 truncate">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>

              {selectedLog.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Notes</p>
                  <p className="text-sm p-3 bg-slate-50 rounded-lg">{selectedLog.notes}</p>
                </div>
              )}

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Changes</p>
                  <div className="bg-slate-50 rounded-lg p-4 overflow-auto max-h-64">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}