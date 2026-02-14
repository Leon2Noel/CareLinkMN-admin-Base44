import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CreditCard,
  Building2,
  Star,
  Zap,
  Crown,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const PLAN_CONFIG = {
  basic: { icon: Star, color: 'text-slate-600 bg-slate-50', label: 'Basic', price: 99 },
  professional: { icon: Zap, color: 'text-blue-600 bg-blue-50', label: 'Professional', price: 299 },
  enterprise: { icon: Crown, color: 'text-purple-600 bg-purple-50', label: 'Enterprise', price: 599 },
};

const PLAN_FEATURES = {
  basic: ['Up to 3 sites', 'Up to 10 openings', 'Email support', 'Basic analytics'],
  professional: ['Up to 10 sites', 'Up to 50 openings', 'Priority support', 'Advanced analytics', 'API access'],
  enterprise: ['Unlimited sites', 'Unlimited openings', '24/7 support', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee'],
};

export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 500)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const orgMap = useMemo(() => organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [organizations]);

  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    pastDue: subscriptions.filter(s => s.status === 'past_due').length,
    mrr: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (PLAN_CONFIG[s.plan]?.price || 0), 0)
  }), [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const org = orgMap[s.organization_id];
      
      const matchesSearch = !searchTerm || 
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlan = planFilter === 'all' || s.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [subscriptions, searchTerm, planFilter, statusFilter, orgMap]);

  const columns = [
    {
      key: 'organization',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{org?.legal_name || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (value) => {
        const config = PLAN_CONFIG[value];
        if (!config) return value;
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
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'billing_cycle',
      header: 'Billing',
      render: (value) => (
        <Badge variant="outline" className="capitalize">{value}</Badge>
      )
    },
    {
      key: 'current_period_end',
      header: 'Next Billing',
      render: (value, row) => {
        if (row.status === 'trial' && row.trial_ends_at) {
          const daysLeft = differenceInDays(new Date(row.trial_ends_at), new Date());
          return (
            <div>
              <p className="font-medium">{format(new Date(row.trial_ends_at), 'MMM d, yyyy')}</p>
              <p className="text-xs text-amber-600">{daysLeft} days left in trial</p>
            </div>
          );
        }
        if (!value) return <span className="text-slate-400">-</span>;
        return format(new Date(value), 'MMM d, yyyy');
      }
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value, row) => {
        const planPrice = PLAN_CONFIG[row.plan]?.price;
        return (
          <span className="font-medium">
            ${value || planPrice || 0}/{row.billing_cycle === 'annual' ? 'yr' : 'mo'}
          </span>
        );
      }
    },
    {
      key: 'gating',
      header: 'Gating',
      render: (_, row) => row.gating_requirements_met ? (
        <Badge className="bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Met
        </Badge>
      ) : (
        <Badge className="bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Incomplete
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Manage provider subscriptions, billing, and plan requirements"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.trial}</p>
              <p className="text-sm text-slate-500">Trial</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pastDue}</p>
              <p className="text-sm text-slate-500">Past Due</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div>
            <p className="text-sm text-emerald-100">Monthly Revenue</p>
            <p className="text-3xl font-bold">${stats.mrr.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLAN_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const features = PLAN_FEATURES[key];
          const count = subscriptions.filter(s => s.plan === key && s.status === 'active').length;
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader className={`${config.color} border-b`}>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {config.label}
                </CardTitle>
                <p className="text-2xl font-bold">${config.price}<span className="text-sm font-normal">/mo</span></p>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500 mb-4">{count} active subscribers</p>
                <ul className="space-y-2">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by provider name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <DataTable
        columns={columns}
        data={filteredSubscriptions}
        isLoading={isLoading}
        emptyMessage="No subscriptions found"
      />
    </div>
  );
}