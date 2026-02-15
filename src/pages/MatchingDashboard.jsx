import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Zap,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Gauge,
  RefreshCw,
  Settings
} from 'lucide-react';
import { format, subDays, differenceInHours } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const HEALTH_THRESHOLDS = {
  latency: { good: 100, warning: 500 },
  hitRate: { good: 70, warning: 40 },
  avgScore: { good: 70, warning: 50 }
};

export default function MatchingDashboard() {
  const [activeTab, setActiveTab] = useState('health');
  const [timeRange, setTimeRange] = useState('7d');

  const { data: matchingLogs = [], isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['matching-logs', timeRange],
    queryFn: () => base44.entities.MatchingLog.list('-created_date', 500)
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals-dashboard'],
    queryFn: () => base44.entities.Referral.list('-created_date', 200)
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['openings-dashboard'],
    queryFn: () => base44.entities.Opening.filter({ status: 'active' })
  });

  // Calculate health metrics
  const healthMetrics = useMemo(() => {
    const recentLogs = matchingLogs.filter(l => {
      const logDate = new Date(l.created_date);
      const cutoff = subDays(new Date(), timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30);
      return logDate >= cutoff;
    });

    const successLogs = recentLogs.filter(l => l.status === 'success');
    const totalQueries = recentLogs.length;
    const successQueries = successLogs.length;
    
    const avgLatency = successLogs.length > 0
      ? Math.round(successLogs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / successLogs.length)
      : 0;

    const hitRate = totalQueries > 0
      ? Math.round((recentLogs.filter(l => l.matches_found > 0).length / totalQueries) * 100)
      : 0;

    const avgScore = successLogs.length > 0
      ? Math.round(successLogs.reduce((sum, l) => sum + (l.avg_match_score || 0), 0) / successLogs.length)
      : 0;

    const errorRate = totalQueries > 0
      ? Math.round((recentLogs.filter(l => l.status === 'error').length / totalQueries) * 100)
      : 0;

    return {
      totalQueries,
      successQueries,
      avgLatency,
      hitRate,
      avgScore,
      errorRate,
      status: avgLatency < HEALTH_THRESHOLDS.latency.good && hitRate > HEALTH_THRESHOLDS.hitRate.good ? 'healthy' :
              avgLatency < HEALTH_THRESHOLDS.latency.warning && hitRate > HEALTH_THRESHOLDS.hitRate.warning ? 'degraded' : 'unhealthy'
    };
  }, [matchingLogs, timeRange]);

  // Chart data
  const latencyTrend = useMemo(() => {
    const grouped = {};
    matchingLogs.forEach(log => {
      const date = format(new Date(log.created_date), 'MMM d');
      if (!grouped[date]) grouped[date] = { date, latency: [], count: 0 };
      grouped[date].latency.push(log.latency_ms || 0);
      grouped[date].count++;
    });
    
    return Object.values(grouped).map(g => ({
      date: g.date,
      avgLatency: Math.round(g.latency.reduce((a, b) => a + b, 0) / g.latency.length),
      queries: g.count
    })).slice(-7);
  }, [matchingLogs]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { name: '0-40', range: [0, 40], count: 0, color: '#ef4444' },
      { name: '40-60', range: [40, 60], count: 0, color: '#f59e0b' },
      { name: '60-80', range: [60, 80], count: 0, color: '#3b82f6' },
      { name: '80-100', range: [80, 100], count: 0, color: '#10b981' }
    ];
    
    matchingLogs.forEach(log => {
      if (log.top_match_score) {
        const range = ranges.find(r => log.top_match_score >= r.range[0] && log.top_match_score < r.range[1]);
        if (range) range.count++;
      }
    });
    
    return ranges;
  }, [matchingLogs]);

  const queryTypeBreakdown = useMemo(() => {
    const types = { auto_match: 0, manual_search: 0, simulation: 0 };
    matchingLogs.forEach(log => {
      if (types[log.query_type] !== undefined) types[log.query_type]++;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [matchingLogs]);

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50';
      case 'degraded': return 'text-amber-600 bg-amber-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return CheckCircle2;
      case 'degraded': return AlertTriangle;
      default: return XCircle;
    }
  };

  const HealthIcon = getHealthIcon(healthMetrics.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching Engine Dashboard"
        description="Monitor matching algorithm performance, health, and metrics"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" asChild>
              <Link to={createPageUrl('MatchingConfig')}>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Link>
            </Button>
          </div>
        }
      />

      {/* Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className={`p-4 ${getHealthColor(healthMetrics.status)}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/50 rounded-xl">
              <HealthIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-80">Engine Status</p>
              <p className="text-2xl font-bold capitalize">{healthMetrics.status}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{healthMetrics.avgLatency}ms</p>
              <p className="text-sm text-slate-500">Avg Latency</p>
            </div>
            {healthMetrics.avgLatency < HEALTH_THRESHOLDS.latency.good ? (
              <TrendingDown className="w-4 h-4 text-emerald-500 ml-auto" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-500 ml-auto" />
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{healthMetrics.hitRate}%</p>
              <p className="text-sm text-slate-500">Hit Rate</p>
            </div>
          </div>
          <Progress 
            value={healthMetrics.hitRate} 
            className="mt-3 h-2" 
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{healthMetrics.avgScore}</p>
              <p className="text-sm text-slate-500">Avg Match Score</p>
            </div>
          </div>
          <Progress 
            value={healthMetrics.avgScore} 
            className="mt-3 h-2" 
          />
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['24h', '7d', '30d'].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </Button>
        ))}
      </div>

      {/* Detailed Metrics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="health">Health Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
          <TabsTrigger value="logs">Recent Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Latency Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgLatency" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Query Volume */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Query Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="queries" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Query Breakdown</h3>
              <div className="space-y-3">
                {queryTypeBreakdown.map(({ name, value }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{name.replace('_', ' ')}</span>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">System Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Queries</span>
                  <span className="font-bold">{healthMetrics.totalQueries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Successful</span>
                  <span className="font-bold text-emerald-600">{healthMetrics.successQueries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Error Rate</span>
                  <span className={`font-bold ${healthMetrics.errorRate > 5 ? 'text-red-600' : 'text-slate-900'}`}>
                    {healthMetrics.errorRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Openings</span>
                  <span className="font-bold">{openings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Pending Referrals</span>
                  <span className="font-bold">{referrals.filter(r => ['new', 'under_review'].includes(r.status)).length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Thresholds</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Latency Target</span>
                    <span>&lt; {HEALTH_THRESHOLDS.latency.good}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (HEALTH_THRESHOLDS.latency.good / Math.max(healthMetrics.avgLatency, 1)) * 100)} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hit Rate Target</span>
                    <span>&gt; {HEALTH_THRESHOLDS.hitRate.good}%</span>
                  </div>
                  <Progress 
                    value={healthMetrics.hitRate} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Avg Score Target</span>
                    <span>&gt; {HEALTH_THRESHOLDS.avgScore.good}</span>
                  </div>
                  <Progress 
                    value={healthMetrics.avgScore} 
                    className="h-2"
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Match Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score Quality Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="count"
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Searched</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Matches</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Top Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Latency</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {matchingLogs.slice(0, 20).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {format(new Date(log.created_date), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {log.query_type?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{log.openings_searched || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium">{log.matches_found || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${
                            log.top_match_score >= 80 ? 'text-emerald-600' :
                            log.top_match_score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {log.top_match_score || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{log.latency_ms}ms</td>
                        <td className="px-4 py-3">
                          <Badge className={
                            log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                            log.status === 'no_matches' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}