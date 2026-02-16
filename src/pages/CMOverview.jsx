import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RoleGuard from '@/components/auth/RoleGuard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Search,
  Users,
  MapPin,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  DoorOpen
} from 'lucide-react';

function CMOverviewContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Fetch case manager's recent referrals
  const { data: myReferrals = [] } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 10);
    }
  });

  // Fetch active openings count
  const { data: activeOpenings = [] } = useQuery({
    queryKey: ['active-openings'],
    queryFn: () => base44.entities.Opening.filter({ status: 'active' }, '-created_date', 100)
  });

  // Fetch recent matches (last 7 days)
  const recentMatches = myReferrals.filter(r => 
    r.status === 'matched' && 
    new Date(r.updated_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const pendingReferrals = myReferrals.filter(r => 
    ['new', 'under_review'].includes(r.status)
  );

  const placedClients = myReferrals.filter(r => 
    r.placement_status === 'placed'
  );

  const stats = [
    {
      title: 'Active Openings',
      value: activeOpenings.length,
      icon: DoorOpen,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'My Referrals',
      value: myReferrals.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pending Review',
      value: pendingReferrals.length,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      title: 'Placements (All Time)',
      value: placedClients.length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ];

  const quickActions = [
    {
      title: 'Search Openings',
      description: 'Find verified providers by need',
      icon: Search,
      color: 'teal',
      link: createPageUrl('CaseManagerSearch')
    },
    {
      title: 'Create Referral',
      description: 'Submit a new client referral',
      icon: FileText,
      color: 'blue',
      link: createPageUrl('ReferralBuilder')
    },
    {
      title: 'Track Referrals',
      description: 'View all your referrals',
      icon: TrendingUp,
      color: 'purple',
      link: createPageUrl('ReferralTracking')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.full_name || 'Case Manager'}
        </h1>
        <p className="text-slate-600 mt-1">
          Your case management dashboard for connecting clients with care
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <Link to={action.link} className="block">
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                  action.color === 'teal' ? 'bg-teal-100' :
                  action.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <action.icon className={`w-6 h-6 ${
                    action.color === 'teal' ? 'text-teal-600' :
                    action.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-600">{action.description}</p>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-3 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Referrals</span>
              <Button variant="ghost" size="sm" asChild>
                <Link to={createPageUrl('ReferralTracking')}>View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myReferrals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No referrals yet</p>
                <Button className="mt-3" size="sm" asChild>
                  <Link to={createPageUrl('ReferralBuilder')}>Create First Referral</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myReferrals.slice(0, 5).map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {referral.client_initials || 'Client'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {referral.client_county} • {referral.funding_source}
                      </p>
                    </div>
                    <Badge variant={
                      referral.status === 'new' ? 'default' :
                      referral.status === 'matched' ? 'secondary' : 'outline'
                    }>
                      {referral.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent matches</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div key={match.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {match.client_initials}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Match confidence: {match.match_confidence_score}%
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {pendingReferrals.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-slate-900">
                  {pendingReferrals.length} referral{pendingReferrals.length > 1 ? 's' : ''} pending review
                </p>
                <p className="text-sm text-slate-600">
                  Check status or follow up with providers
                </p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto" asChild>
                <Link to={createPageUrl('ReferralTracking')}>Review</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CMOverview() {
  return (
    <RoleGuard allowedRoles={['cm', 'case_manager', 'admin']}>
      <CMOverviewContent />
    </RoleGuard>
  );
}