import React, { useMemo, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, FileText, CheckCircle2, Clock, Target } from 'lucide-react';

function CMAnalyticsContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Fetch case manager's referrals
  const { data: myReferrals = [] } = useQuery({
    queryKey: ['my-referrals-analytics'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Referral.filter({ referrer_email: user.email });
    }
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalReferrals = myReferrals.length;
    const placedReferrals = myReferrals.filter(r => r.placement_status === 'placed').length;
    const pendingReferrals = myReferrals.filter(r => ['new', 'under_review'].includes(r.status)).length;
    const matchedReferrals = myReferrals.filter(r => r.status === 'matched').length;
    const placementRate = totalReferrals > 0 ? ((placedReferrals / totalReferrals) * 100).toFixed(1) : 0;
    const avgMatchScore = myReferrals.filter(r => r.match_confidence_score).reduce((sum, r) => sum + r.match_confidence_score, 0) / myReferrals.filter(r => r.match_confidence_score).length || 0;

    return {
      totalReferrals,
      placedReferrals,
      pendingReferrals,
      matchedReferrals,
      placementRate,
      avgMatchScore: avgMatchScore.toFixed(1)
    };
  }, [myReferrals]);

  // Referrals over time (last 6 months)
  const referralTimeline = useMemo(() => {
    const monthlyData = {};
    myReferrals.forEach(ref => {
      const date = new Date(ref.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    return Object.keys(monthlyData).sort().slice(-6).map(month => ({
      month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
      count: monthlyData[month]
    }));
  }, [myReferrals]);

  // Status distribution
  const statusData = useMemo(() => {
    const statusCounts = {};
    myReferrals.forEach(ref => {
      statusCounts[ref.status] = (statusCounts[ref.status] || 0) + 1;
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: statusCounts[status]
    }));
  }, [myReferrals]);

  // Placement outcomes by urgency
  const urgencyOutcomes = useMemo(() => {
    const urgencyData = { routine: { total: 0, placed: 0 }, urgent: { total: 0, placed: 0 }, crisis: { total: 0, placed: 0 } };

    myReferrals.forEach(ref => {
      const urgency = ref.urgency || 'routine';
      urgencyData[urgency].total++;
      if (ref.placement_status === 'placed') {
        urgencyData[urgency].placed++;
      }
    });

    return Object.keys(urgencyData).map(key => ({
      urgency: key.charAt(0).toUpperCase() + key.slice(1),
      total: urgencyData[key].total,
      placed: urgencyData[key].placed,
      rate: urgencyData[key].total > 0 ? ((urgencyData[key].placed / urgencyData[key].total) * 100).toFixed(1) : 0
    }));
  }, [myReferrals]);

  // County distribution
  const countyData = useMemo(() => {
    const countyCounts = {};
    myReferrals.forEach(ref => {
      const county = ref.client_county || 'Unknown';
      countyCounts[county] = (countyCounts[county] || 0) + 1;
    });

    return Object.keys(countyCounts)
      .map(county => ({ county, count: countyCounts[county] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [myReferrals]);

  const COLORS = ['#0d9488', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

  const statCards = [
    { title: 'Total Referrals', value: metrics.totalReferrals, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Placements', value: metrics.placedReferrals, icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { title: 'Pending', value: metrics.pendingReferrals, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'Placement Rate', value: `${metrics.placementRate}%`, icon: Target, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    { title: 'Avg Match Score', value: `${metrics.avgMatchScore}%`, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Analytics</h1>
        <p className="text-slate-600 mt-1">Your referral performance and placement outcomes</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Referrals Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={referralTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
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

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Placement Success by Urgency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={urgencyOutcomes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="urgency" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#94a3b8" name="Total" />
                  <Bar dataKey="placed" fill="#10b981" name="Placed" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {urgencyOutcomes.map((item, idx) => (
                  <div key={idx} className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">{item.urgency}</p>
                    <p className="text-3xl font-bold text-slate-900">{item.rate}%</p>
                    <p className="text-xs text-slate-500 mt-1">{item.placed}/{item.total} placed</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Counties (Referrals)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="county" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CMAnalytics() {
  return (
    <RoleGuard allowedRoles={['cm', 'case_manager', 'admin']}>
      <CMAnalyticsContent />
    </RoleGuard>
  );
}