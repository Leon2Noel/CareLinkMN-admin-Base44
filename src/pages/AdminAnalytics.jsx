import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, Building2, DoorOpen, GitMerge, Calendar } from 'lucide-react';

function AdminAnalyticsContent() {
  // Fetch all data
  const { data: organizations = [] } = useQuery({
    queryKey: ['all-orgs'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['all-openings'],
    queryFn: () => base44.entities.Opening.list()
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['all-referrals'],
    queryFn: () => base44.entities.Referral.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeProviders = organizations.filter(o => o.status === 'active').length;
    const activeOpenings = openings.filter(o => o.status === 'active').length;
    const totalReferrals = referrals.length;
    const placedReferrals = referrals.filter(r => r.placement_status === 'placed').length;
    const placementRate = totalReferrals > 0 ? ((placedReferrals / totalReferrals) * 100).toFixed(1) : 0;

    return {
      activeProviders,
      activeOpenings,
      totalReferrals,
      placedReferrals,
      placementRate,
      totalUsers: users.length
    };
  }, [organizations, openings, referrals, users]);

  // Provider growth over time (monthly)
  const providerGrowth = useMemo(() => {
    const monthlyData = {};
    organizations.forEach(org => {
      const date = new Date(org.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    let cumulative = 0;
    return Object.keys(monthlyData).sort().slice(-6).map(month => {
      cumulative += monthlyData[month];
      return {
        month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
        providers: cumulative
      };
    });
  }, [organizations]);

  // Referral volume over time
  const referralVolume = useMemo(() => {
    const monthlyData = {};
    referrals.forEach(ref => {
      const date = new Date(ref.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    return Object.keys(monthlyData).sort().slice(-6).map(month => ({
      month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
      referrals: monthlyData[month]
    }));
  }, [referrals]);

  // Placement success by urgency
  const placementByUrgency = useMemo(() => {
    const urgencyData = { routine: 0, urgent: 0, crisis: 0 };
    const placedData = { routine: 0, urgent: 0, crisis: 0 };

    referrals.forEach(ref => {
      const urgency = ref.urgency || 'routine';
      urgencyData[urgency]++;
      if (ref.placement_status === 'placed') {
        placedData[urgency]++;
      }
    });

    return Object.keys(urgencyData).map(key => ({
      urgency: key.charAt(0).toUpperCase() + key.slice(1),
      total: urgencyData[key],
      placed: placedData[key],
      rate: urgencyData[key] > 0 ? ((placedData[key] / urgencyData[key]) * 100).toFixed(1) : 0
    }));
  }, [referrals]);

  // Referral status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts = {};
    referrals.forEach(ref => {
      statusCounts[ref.status] = (statusCounts[ref.status] || 0) + 1;
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: statusCounts[status]
    }));
  }, [referrals]);

  // User role distribution
  const roleDistribution = useMemo(() => {
    const roleCounts = {};
    users.forEach(user => {
      const role = user.primary_role || user.role || 'user';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    return Object.keys(roleCounts).map(role => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: roleCounts[role]
    }));
  }, [users]);

  const COLORS = ['#0d9488', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

  const statCards = [
    { title: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Active Providers', value: metrics.activeProviders, icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    { title: 'Active Openings', value: metrics.activeOpenings, icon: DoorOpen, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Total Referrals', value: metrics.totalReferrals, icon: GitMerge, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'Placements', value: metrics.placedReferrals, icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { title: 'Placement Rate', value: `${metrics.placementRate}%`, icon: TrendingUp, color: 'text-cyan-600', bgColor: 'bg-cyan-100' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-600 mt-1">System-wide metrics and performance insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-600">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Network Growth</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Network Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={providerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="providers" stroke="#0d9488" fill="#0d948820" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Volume (6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={referralVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="referrals" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Placement Success by Urgency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={placementByUrgency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="urgency" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#94a3b8" name="Total Referrals" />
                  <Bar dataKey="placed" fill="#10b981" name="Placed" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {placementByUrgency.map((item, idx) => (
                  <div key={idx} className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">{item.urgency}</p>
                    <p className="text-2xl font-bold text-slate-900">{item.rate}%</p>
                    <p className="text-xs text-slate-500">{item.placed}/{item.total} placed</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-teal-600">{metrics.totalUsers}</p>
                <p className="text-sm text-slate-600 mt-2">Across all roles</p>
              </CardContent>
            </Card>
            {roleDistribution.map((role, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{role.name}s</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{role.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminAnalyticsContent />
    </RoleGuard>
  );
}