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
  Heart,
  Search,
  MessageCircle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Phone,
  Mail
} from 'lucide-react';

function FamilyOverviewContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Fetch family/guardian's referrals
  const { data: myReferrals = [] } = useQuery({
    queryKey: ['family-referrals'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 20);
    }
  });

  const activeReferrals = myReferrals.filter(r => 
    ['new', 'under_review', 'matched'].includes(r.status)
  );

  const placedReferrals = myReferrals.filter(r => 
    r.placement_status === 'placed'
  );

  const stats = [
    {
      title: 'Active Referrals',
      value: activeReferrals.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Placements',
      value: placedReferrals.length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Pending Review',
      value: myReferrals.filter(r => r.status === 'under_review').length,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  const resources = [
    {
      title: 'Minnesota DHS Resources',
      description: 'State resources for families',
      icon: Info,
      link: '#'
    },
    {
      title: 'Support Groups',
      description: 'Connect with other families',
      icon: Heart,
      link: '#'
    },
    {
      title: 'Contact Your Case Manager',
      description: 'Get personalized assistance',
      icon: Phone,
      link: '#'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {user?.full_name || 'Family Member'}
        </h1>
        <p className="text-slate-600 mt-1">
          Track your care placement journey and access support resources
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Getting Started Card */}
      {myReferrals.length === 0 && (
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Welcome to CareLinkMN
                </h3>
                <p className="text-slate-600 mb-4">
                  Your case manager will help you find the right care placement. They'll submit referrals on your behalf and keep you updated on progress.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link to={createPageUrl('CaseManagerSearch')}>
                      <Search className="w-4 h-4 mr-2" />
                      Browse Providers
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>My Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {myReferrals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No referrals yet</p>
              <p className="text-sm mt-1">Your case manager will submit referrals on your behalf</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReferrals.map((referral) => (
                <div key={referral.id} className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-slate-900">
                          {referral.client_county} County Placement
                        </h4>
                        <Badge variant={
                          referral.status === 'matched' ? 'secondary' :
                          referral.status === 'accepted' ? 'default' : 'outline'
                        }>
                          {referral.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Funding Source</p>
                          <p className="font-medium text-slate-900">{referral.funding_source}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Urgency</p>
                          <p className="font-medium text-slate-900 capitalize">{referral.urgency}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Submitted</p>
                          <p className="font-medium text-slate-900">
                            {new Date(referral.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        {referral.desired_start_date && (
                          <div>
                            <p className="text-slate-600">Desired Start</p>
                            <p className="font-medium text-slate-900">
                              {new Date(referral.desired_start_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {referral.match_confidence_score && (
                        <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-200">
                          <p className="text-sm text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Match found with {referral.match_confidence_score}% confidence
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.link}
                className="p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-teal-100 transition-colors">
                  <resource.icon className="w-5 h-5 text-slate-600 group-hover:text-teal-600" />
                </div>
                <h4 className="font-medium text-slate-900 mb-1">{resource.title}</h4>
                <p className="text-sm text-slate-600">{resource.description}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Need Help?</h3>
              <p className="text-slate-600 text-sm">
                Contact our support team at <a href="mailto:support@carelinkmn.org" className="text-blue-600 hover:underline">support@carelinkmn.org</a> or call (555) 123-4567
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FamilyOverview() {
  return (
    <RoleGuard allowedRoles={['family', 'guardian', 'admin']}>
      <FamilyOverviewContent />
    </RoleGuard>
  );
}