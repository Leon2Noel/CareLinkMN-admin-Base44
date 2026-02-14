import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search, 
  Users,
  UserPlus,
  Shield,
  Building2,
  Mail,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  admin: { label: 'Platform Admin', color: 'bg-purple-100 text-purple-700', description: 'Full platform access' },
  compliance_reviewer: { label: 'Compliance Reviewer', color: 'bg-blue-100 text-blue-700', description: 'License verification and compliance' },
  provider_admin: { label: 'Provider Admin', color: 'bg-emerald-100 text-emerald-700', description: 'Manage organization settings' },
  case_manager: { label: 'Case Manager', color: 'bg-amber-100 text-amber-700', description: 'Search and match openings' },
  user: { label: 'User', color: 'bg-slate-100 text-slate-700', description: 'Basic access' },
};

export default function UsersRoles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 500)
  });

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    providers: users.filter(u => u.role === 'provider_admin' || u.role === 'user').length,
    caseManagers: users.filter(u => u.role === 'case_manager').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !searchTerm || 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const columns = [
    {
      key: 'full_name',
      header: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <span className="text-white font-medium">
              {value?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{value || 'Unknown'}</p>
            <p className="text-sm text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (value) => {
        const config = ROLE_CONFIG[value] || ROLE_CONFIG.user;
        return (
          <div>
            <Badge className={config.color}>{config.label}</Badge>
            <p className="text-xs text-slate-500 mt-1">{config.description}</p>
          </div>
        );
      }
    },
    {
      key: 'created_date',
      header: 'Joined',
      render: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage user accounts and role-based access control"
        actions={
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
              <p className="text-sm text-slate-500">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.providers}</p>
              <p className="text-sm text-slate-500">Provider Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.caseManagers}</p>
              <p className="text-sm text-slate-500">Case Managers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Role Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
              <div key={key} className="p-4 border rounded-lg">
                <Badge className={config.color}>{config.label}</Badge>
                <p className="text-sm text-slate-600 mt-2">{config.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="No users found"
      />
    </div>
  );
}