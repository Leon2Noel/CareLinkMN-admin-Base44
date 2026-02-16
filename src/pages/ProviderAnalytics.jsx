import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/ui/DataTable';
import { Eye, MapPin, User, Clock, TrendingUp, Search, Bell } from 'lucide-react';
import { formatDistanceToNow, parseISO, subDays } from 'date-fns';

export default function ProviderAnalytics() {
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org_id');
  const [timeRange, setTimeRange] = useState('7d');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const cutoffDate = timeRange === '7d' ? subDays(new Date(), 7) : subDays(new Date(), 30);

  const { data: views = [], isLoading } = useQuery({
    queryKey: ['provider-views', orgId, timeRange],
    queryFn: async () => {
      const allViews = await base44.entities.ProfileView.filter({ provider_org_id: orgId });
      return allViews.filter(v => parseISO(v.created_date) >= cutoffDate);
    },
    enabled: !!orgId
  });

  const { data: openings = [] } = useQuery({
    queryKey: ['provider-openings', orgId],
    queryFn: () => base44.entities.Opening.filter({ organization_id: orgId }),
    enabled: !!orgId
  });

  // Aggregate metrics
  const totalViews = views.length;
  const uniqueViewers = new Set(views.filter(v => v.viewer_user_id).map(v => v.viewer_user_id)).size;
  const profileViews = views.filter(v => v.entity_type === 'provider_profile').length;
  const openingViews = views.filter(v => v.entity_type === 'opening').length;
  const siteViews = views.filter(v => v.entity_type === 'site').length;

  const countyStats = views
    .filter(v => v.viewer_county)
    .reduce((acc, v) => {
      acc[v.viewer_county] = (acc[v.viewer_county] || 0) + 1;
      return acc;
    }, {});

  const topCounties = Object.entries(countyStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const referrerStats = views.reduce((acc, v) => {
    acc[v.referrer || 'direct'] = (acc[v.referrer || 'direct'] || 0) + 1;
    return acc;
  }, {});

  const openingViewStats = openings.map(opening => {
    const openingViewCount = views.filter(v => 
      v.entity_type === 'opening' && v.entity_id === opening.id
    ).length;
    
    return {
      ...opening,
      view_count: openingViewCount
    };
  }).sort((a, b) => b.view_count - a.view_count);

  const recentViews = views
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 50);

  const viewerColumns = [
    {
      key: 'viewer_role',
      label: 'Viewer Type',
      render: (row) => (
        <Badge variant="outline">
          {row.viewer_role === 'case_manager' ? 'Case Manager' :
           row.viewer_role === 'guardian' ? 'Guardian' :
           row.viewer_role === 'admin' ? 'Admin' : 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'viewer_county',
      label: 'County',
      render: (row) => row.viewer_county ? (
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          {row.viewer_county}
        </span>
      ) : <span className="text-slate-400">-</span>
    },
    {
      key: 'entity_type',
      label: 'Viewed',
      render: (row) => (
        <span className="capitalize">{row.entity_type.replace('_', ' ')}</span>
      )
    },
    {
      key: 'referrer',
      label: 'Source',
      render: (row) => {
        const icons = {
          search: Search,
          notification: Bell,
          referral: User,
          direct: Eye
        };
        const Icon = icons[row.referrer] || Eye;
        return (
          <span className="flex items-center gap-1 capitalize">
            <Icon className="w-3 h-3 text-slate-400" />
            {row.referrer || 'direct'}
          </span>
        );
      }
    },
    {
      key: 'created_date',
      label: 'When',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDistanceToNow(parseISO(row.created_date), { addSuffix: true })}
        </span>
      )
    }
  ];

  const openingColumns = [
    { key: 'title', label: 'Opening' },
    {
      key: 'view_count',
      label: 'Views',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">{row.view_count}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'default' : 'outline'}>
          {row.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Analytics & Engagement"
        description="Track who's viewing your openings and profile"
        actions={
          <div className="flex gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              Last 30 Days
            </Button>
          </div>
        }
      />

      {/* Overview Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Unique Viewers</p>
                <p className="text-2xl font-bold text-slate-900">{uniqueViewers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Opening Views</p>
                <p className="text-2xl font-bold text-slate-900">{openingViews}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Profile Views</p>
                <p className="text-2xl font-bold text-slate-900">{profileViews}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="openings">By Opening</TabsTrigger>
          <TabsTrigger value="who-viewed">Who Viewed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Counties</CardTitle>
              </CardHeader>
              <CardContent>
                {topCounties.length === 0 ? (
                  <p className="text-slate-500 text-sm">No county data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topCounties.map(([county, count]) => (
                      <div key={county} className="flex items-center justify-between">
                        <span className="text-sm text-slate-900">{county}</span>
                        <Badge>{count} views</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(referrerStats).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm text-slate-900 capitalize">{source}</span>
                      <Badge>{count} views</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="openings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opening Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={openingColumns}
                data={openingViewStats}
                emptyMessage="No openings to display"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="who-viewed">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Viewers</CardTitle>
              <p className="text-sm text-slate-500">Anonymized viewer activity</p>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={viewerColumns}
                data={recentViews}
                emptyMessage="No views yet"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}