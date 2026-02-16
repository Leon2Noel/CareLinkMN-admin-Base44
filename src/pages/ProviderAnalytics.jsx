import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  DoorOpen,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  Calendar,
  Building2
} from 'lucide-react';
import { format, subDays, differenceInHours, differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function ProviderAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [programFilter, setProgramFilter] = useState('all');
  const [diagnosisFilter, setDiagnosisFilter] = useState('all');
  const [referralSourceFilter, setReferralSourceFilter] = useState('all');

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Get provider organization
        const orgs = await base44.entities.Organization.filter({ created_by: userData.email });
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
        }
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const startDate = useMemo(() => {
    return subDays(new Date(), parseInt(dateRange));
  }, [dateRange]);

  const { data: openings = [] } = useQuery({
    queryKey: ['provider-openings', organization?.id],
    queryFn: () => base44.entities.Opening.filter({ organization_id: organization.id }),
    enabled: !!organization,
    initialData: []
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['provider-referrals', organization?.id],
    queryFn: () => base44.entities.Referral.filter({ organization_id: organization.id }),
    enabled: !!organization,
    initialData: []
  });

  const { data: profileViews = [] } = useQuery({
    queryKey: ['profile-views', organization?.id, startDate],
    queryFn: async () => {
      const views = await base44.entities.ProfileView.filter({ provider_org_id: organization.id });
      return views.filter(v => new Date(v.created_date) >= startDate);
    },
    enabled: !!organization,
    initialData: []
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.ProgramActivation.list(),
    initialData: []
  });

  // Apply filters to referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      if (programFilter !== 'all') {
        const opening = openings.find(o => o.id === r.opening_id);
        if (!opening || opening.program_activation_id !== programFilter) return false;
      }
      if (diagnosisFilter !== 'all' && !r.diagnosis_summary?.toLowerCase().includes(diagnosisFilter.toLowerCase())) {
        return false;
      }
      if (referralSourceFilter !== 'all' && r.referral_source !== referralSourceFilter) {
        return false;
      }
      return true;
    });
  }, [referrals, programFilter, diagnosisFilter, referralSourceFilter, openings]);

  // Get unique diagnoses for filter
  const uniqueDiagnoses = useMemo(() => {
    const diagnoses = new Set();
    referrals.forEach(r => {
      if (r.diagnosis_summary) {
        const words = r.diagnosis_summary.toLowerCase().split(/[\s,]+/);
        words.forEach(w => diagnoses.add(w));
      }
    });
    return Array.from(diagnoses).slice(0, 10);
  }, [referrals]);

  // Referral Source Effectiveness
  const referralSourceData = useMemo(() => {
    const sources = {};
    filteredReferrals.forEach(r => {
      const source = r.referral_source || 'unknown';
      if (!sources[source]) {
        sources[source] = { total: 0, accepted: 0, placed: 0 };
      }
      sources[source].total++;
      if (r.status === 'accepted') sources[source].accepted++;
      if (r.placement_status === 'placed') sources[source].placed++;
    });

    return Object.entries(sources).map(([source, data]) => ({
      source: source.replace('_', ' '),
      total: data.total,
      acceptanceRate: ((data.accepted / data.total) * 100).toFixed(1),
      placementRate: ((data.placed / data.total) * 100).toFixed(1)
    }));
  }, [filteredReferrals]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const rangeOpenings = openings.filter(o => new Date(o.created_date) >= startDate);
    const rangeReferrals = filteredReferrals.filter(r => new Date(r.created_date) >= startDate);

    // Fill Rate
    const filledOpenings = rangeOpenings.filter(o => o.status === 'filled').length;
    const fillRate = rangeOpenings.length > 0 ? (filledOpenings / rangeOpenings.length * 100).toFixed(1) : 0;

    // Average Response Time (in hours)
    const respondedReferrals = rangeReferrals.filter(r => r.provider_response_date);
    const totalResponseTime = respondedReferrals.reduce((sum, r) => {
      return sum + differenceInHours(parseISO(r.provider_response_date), parseISO(r.created_date));
    }, 0);
    const avgResponseTime = respondedReferrals.length > 0 
      ? (totalResponseTime / respondedReferrals.length).toFixed(1) 
      : 0;

    // Referral Acceptance Rate
    const acceptedReferrals = rangeReferrals.filter(r => r.status === 'accepted').length;
    const acceptanceRate = rangeReferrals.length > 0 
      ? (acceptedReferrals / rangeReferrals.length * 100).toFixed(1) 
      : 0;

    // Profile Views
    const totalViews = profileViews.length;

    // Outcome Metrics
    const placedReferrals = rangeReferrals.filter(r => r.placement_status === 'placed').length;
    const placementRate = rangeReferrals.length > 0 
      ? (placedReferrals / rangeReferrals.length * 100).toFixed(1) 
      : 0;

    const satisfactionRatings = rangeReferrals
      .filter(r => r.outcome_satisfaction)
      .map(r => r.outcome_satisfaction);
    const avgSatisfaction = satisfactionRatings.length > 0
      ? (satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length).toFixed(1)
      : 0;

    return {
      fillRate,
      avgResponseTime,
      acceptanceRate,
      totalViews,
      activeOpenings: openings.filter(o => o.status === 'active').length,
      totalReferrals: rangeReferrals.length,
      placementRate,
      placedReferrals,
      avgSatisfaction,
      satisfactionCount: satisfactionRatings.length
    };
  }, [openings, filteredReferrals, profileViews, startDate]);

  // Opening Status Distribution
  const openingStatusData = useMemo(() => {
    const statusCounts = openings.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count
    }));
  }, [openings]);

  // Referral Timeline (last 30 days)
  const referralTimelineData = useMemo(() => {
    const days = [];
    for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM d');
      
      const dayReferrals = filteredReferrals.filter(r => {
        const refDate = new Date(r.created_date);
        return format(refDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });

      days.push({
        date: dateStr,
        received: dayReferrals.length,
        accepted: dayReferrals.filter(r => r.status === 'accepted').length,
        declined: dayReferrals.filter(r => r.status === 'declined').length
      });
    }
    return days;
  }, [filteredReferrals, dateRange]);

  // Views by Role
  const viewsByRoleData = useMemo(() => {
    const roleCounts = profileViews.reduce((acc, v) => {
      const role = v.viewer_role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(roleCounts).map(([role, count]) => ({
      name: role.replace('_', ' '),
      value: count
    }));
  }, [profileViews]);

  // Response Time Distribution
  const responseTimeData = useMemo(() => {
    const bins = { '0-4h': 0, '4-8h': 0, '8-24h': 0, '24-48h': 0, '48h+': 0 };
    
    filteredReferrals.filter(r => r.provider_response_date).forEach(r => {
      const hours = differenceInHours(parseISO(r.provider_response_date), parseISO(r.created_date));
      if (hours < 4) bins['0-4h']++;
      else if (hours < 8) bins['4-8h']++;
      else if (hours < 24) bins['8-24h']++;
      else if (hours < 48) bins['24-48h']++;
      else bins['48h+']++;
    });

    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [filteredReferrals]);

  // Placement Outcomes Data
  const placementOutcomesData = useMemo(() => {
    const outcomes = {
      placed: filteredReferrals.filter(r => r.placement_status === 'placed').length,
      not_placed: filteredReferrals.filter(r => r.placement_status === 'not_placed').length,
      pending: filteredReferrals.filter(r => !r.placement_status || r.placement_status === 'pending').length
    };

    return [
      { name: 'Placed', value: outcomes.placed },
      { name: 'Not Placed', value: outcomes.not_placed },
      { name: 'Pending', value: outcomes.pending }
    ].filter(item => item.value > 0);
  }, [filteredReferrals]);

  const generateReport = () => {
    const reportData = [
      ['CareLinkMN Provider Analytics Report'],
      [`Organization: ${organization.legal_name}`],
      [`Date Range: Last ${dateRange} days`],
      [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
      [`Filters: Program=${programFilter}, Diagnosis=${diagnosisFilter}, Source=${referralSourceFilter}`],
      [''],
      ['KEY METRICS'],
      ['Metric', 'Value'],
      ['Fill Rate', `${metrics.fillRate}%`],
      ['Avg Response Time', `${metrics.avgResponseTime}h`],
      ['Acceptance Rate', `${metrics.acceptanceRate}%`],
      ['Placement Rate', `${metrics.placementRate}%`],
      ['Avg Satisfaction', metrics.avgSatisfaction],
      ['Profile Views', metrics.totalViews],
      ['Active Openings', metrics.activeOpenings],
      ['Total Referrals', metrics.totalReferrals],
      [''],
      ['REFERRAL SOURCE EFFECTIVENESS'],
      ['Source', 'Total', 'Acceptance Rate', 'Placement Rate'],
      ...referralSourceData.map(s => [s.source, s.total, `${s.acceptanceRate}%`, `${s.placementRate}%`]),
      [''],
      ['DETAILED REFERRAL DATA'],
      ['Date', 'Source', 'Status', 'Placement Status', 'Response Time (hrs)'],
      ...filteredReferrals.map(r => [
        format(new Date(r.created_date), 'yyyy-MM-dd'),
        r.referral_source,
        r.status,
        r.placement_status || 'pending',
        r.provider_response_date ? differenceInHours(parseISO(r.provider_response_date), parseISO(r.created_date)) : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description={`Performance insights for ${organization.legal_name}`}
        actions={
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={generateReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.program_model_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Diagnoses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Diagnoses</SelectItem>
                  {uniqueDiagnoses.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={referralSourceFilter} onValueChange={setReferralSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="case_manager">Case Manager</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(programFilter !== 'all' || diagnosisFilter !== 'all' || referralSourceFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setProgramFilter('all');
                  setDiagnosisFilter('all');
                  setReferralSourceFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Opening Fill Rate"
          value={`${metrics.fillRate}%`}
          icon={DoorOpen}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle={`${openings.filter(o => o.status === 'filled').length} filled`}
        />
        <StatCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime}h`}
          icon={Clock}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="To referral inquiries"
        />
        <StatCard
          title="Acceptance Rate"
          value={`${metrics.acceptanceRate}%`}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle={`${referrals.filter(r => r.status === 'accepted').length} accepted`}
        />
        <StatCard
          title="Placement Rate"
          value={`${metrics.placementRate}%`}
          icon={TrendingUp}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          subtitle={`${metrics.placedReferrals} placed`}
        />
        <StatCard
          title="Avg Satisfaction"
          value={metrics.avgSatisfaction > 0 ? `${metrics.avgSatisfaction}/5` : 'N/A'}
          icon={BarChart3}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle={`${metrics.satisfactionCount} ratings`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referral Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={referralTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="received" stroke="#3b82f6" name="Received" strokeWidth={2} />
                <Line type="monotone" dataKey="accepted" stroke="#10b981" name="Accepted" strokeWidth={2} />
                <Line type="monotone" dataKey="declined" stroke="#ef4444" name="Declined" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Opening Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Opening Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={openingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {openingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Placement Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Client Placement Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={placementOutcomesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {placementOutcomesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Referral Source Effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Source Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={referralSourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total Referrals" radius={[8, 8, 0, 0]} />
                <Bar dataKey="acceptanceRate" fill="#10b981" name="Acceptance %" radius={[8, 8, 0, 0]} />
                <Bar dataKey="placementRate" fill="#8b5cf6" name="Placement %" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Views by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Views by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewsByRoleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Openings Management</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Openings</span>
                  <span className="font-medium">{openings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Active</span>
                  <span className="font-medium text-emerald-600">{metrics.activeOpenings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Filled</span>
                  <span className="font-medium text-blue-600">
                    {openings.filter(o => o.status === 'filled').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Average Time to Fill</span>
                  <span className="font-medium">
                    {openings.filter(o => o.status === 'filled').length > 0
                      ? Math.round(
                          openings
                            .filter(o => o.status === 'filled')
                            .reduce((sum, o) => sum + differenceInDays(new Date(), new Date(o.created_date)), 0) /
                            openings.filter(o => o.status === 'filled').length
                        )
                      : 0}{' '}
                    days
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Referral Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Referrals</span>
                  <span className="font-medium">{metrics.totalReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Accepted</span>
                  <span className="font-medium text-emerald-600">
                    {filteredReferrals.filter(r => r.status === 'accepted').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Placed</span>
                  <span className="font-medium text-indigo-600">
                    {metrics.placedReferrals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Placement Rate</span>
                  <span className="font-medium">{metrics.placementRate}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Engagement Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Profile Views</span>
                  <span className="font-medium">{metrics.totalViews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Opening Views</span>
                  <span className="font-medium">
                    {openings.reduce((sum, o) => sum + (o.views_count || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Inquiries</span>
                  <span className="font-medium">
                    {openings.reduce((sum, o) => sum + (o.inquiries_count || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Conversion Rate</span>
                  <span className="font-medium">
                    {openings.reduce((sum, o) => sum + (o.views_count || 0), 0) > 0
                      ? (
                          (openings.reduce((sum, o) => sum + (o.inquiries_count || 0), 0) /
                            openings.reduce((sum, o) => sum + (o.views_count || 0), 0)) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}