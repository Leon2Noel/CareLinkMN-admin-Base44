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
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle2,
  Activity
} from 'lucide-react';

function HospitalOverviewContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Fetch hospital's discharge referrals
  const { data: hospitalReferrals = [] } = useQuery({
    queryKey: ['hospital-referrals'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 50);
    }
  });

  // Fetch active openings for crisis placements
  const { data: crisisOpenings = [] } = useQuery({
    queryKey: ['crisis-openings'],
    queryFn: () => base44.entities.Opening.filter({ opening_type: 'immediate', status: 'active' }, '-created_date', 20)
  });

  const urgentReferrals = hospitalReferrals.filter(r => 
    r.urgency === 'crisis' || r.urgency === 'urgent'
  );

  const pendingDischarges = hospitalReferrals.filter(r => 
    ['new', 'under_review', 'matched'].includes(r.status)
  );

  const completedPlacements = hospitalReferrals.filter(r => 
    r.placement_status === 'placed'
  );

  const stats = [
    {
      title: 'Pending Discharges',
      value: pendingDischarges.length,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      title: 'Crisis Referrals',
      value: urgentReferrals.length,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Available Crisis Beds',
      value: crisisOpenings.length,
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      title: 'Completed Placements',
      value: completedPlacements.length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ];

  const quickActions = [
    {
      title: 'Search Crisis Openings',
      description: 'Find immediate placement options',
      icon: Search,
      color: 'red',
      link: createPageUrl('CaseManagerSearch')
    },
    {
      title: 'Submit Discharge Referral',
      description: 'Refer patient for placement',
      icon: FileText,
      color: 'blue',
      link: createPageUrl('ReferralBuilder')
    },
    {
      title: 'Track Referrals',
      description: 'Monitor all discharge referrals',
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
          Hospital Discharge Planning
        </h1>
        <p className="text-slate-600 mt-1">
          Welcome, {user?.full_name || 'Discharge Coordinator'}
        </p>
      </div>

      {/* Critical Alert */}
      {urgentReferrals.filter(r => r.status !== 'placed').length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {urgentReferrals.filter(r => r.status !== 'placed').length} crisis referrals need immediate attention
                </p>
                <p className="text-sm text-slate-600">
                  Patients requiring urgent discharge placement
                </p>
              </div>
              <Button size="sm" variant="destructive" asChild>
                <Link to={createPageUrl('ReferralTracking')}>Review Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  action.color === 'red' ? 'bg-red-100' :
                  action.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <action.icon className={`w-6 h-6 ${
                    action.color === 'red' ? 'text-red-600' :
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

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Discharge Referrals</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl('ReferralTracking')}>View All</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hospitalReferrals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No discharge referrals yet</p>
              <Button className="mt-3" size="sm" asChild>
                <Link to={createPageUrl('ReferralBuilder')}>Submit First Referral</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {hospitalReferrals.slice(0, 8).map((referral) => (
                <div key={referral.id} className={`p-4 rounded-lg border ${
                  referral.urgency === 'crisis' ? 'border-red-200 bg-red-50' :
                  referral.urgency === 'urgent' ? 'border-amber-200 bg-amber-50' :
                  'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-slate-900">
                          {referral.client_initials || 'Patient'}
                        </p>
                        <Badge variant={referral.urgency === 'crisis' ? 'destructive' : 'default'}>
                          {referral.urgency}
                        </Badge>
                        <Badge variant="outline">
                          {referral.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">County</p>
                          <p className="font-medium">{referral.client_county}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Funding</p>
                          <p className="font-medium">{referral.funding_source}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Submitted</p>
                          <p className="font-medium">
                            {new Date(referral.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HospitalOverview() {
  return (
    <RoleGuard allowedRoles={['hospital', 'admin']}>
      <HospitalOverviewContent />
    </RoleGuard>
  );
}