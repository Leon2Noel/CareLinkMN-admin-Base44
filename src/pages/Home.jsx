import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Search,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  MapPin,
  GitMerge
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: 'Compliance First',
      description: 'Automated license-program validation ensures regulatory compliance'
    },
    {
      icon: GitMerge,
      title: 'Smart Matching',
      description: 'AI-powered algorithm connects clients with the right providers'
    },
    {
      icon: FileCheck,
      title: 'License Verification',
      description: 'Comprehensive tracking of licenses, programs, and capabilities'
    },
    {
      icon: MapPin,
      title: 'Statewide Network',
      description: 'Connect with providers across all Minnesota counties'
    }
  ];

  const roles = [
    {
      icon: Building2,
      title: 'Provider Organizations',
      description: 'Manage licenses, programs, sites, and openings. Connect with case managers and families.',
      benefits: ['Upload licenses', 'Create openings', 'Receive referrals', 'Track compliance'],
      cta: 'Create Provider Account',
      link: createPageUrl('ProviderRegister'),
      color: 'blue'
    },
    {
      icon: Search,
      title: 'Case Managers',
      description: 'Search verified openings, submit referrals, and match clients with appropriate providers.',
      benefits: ['Search openings', 'View capabilities', 'Submit referrals', 'Track placements'],
      cta: 'Search Openings',
      link: createPageUrl('CaseManagerSearch'),
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Administrators',
      description: 'Verify licenses, approve openings, monitor compliance, and manage platform rules.',
      benefits: ['Verify licenses', 'Approve openings', 'Monitor compliance', 'Manage rules'],
      cta: 'Admin Dashboard',
      link: createPageUrl('Overview'),
      color: 'emerald'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-5" />
        <div className="max-w-7xl mx-auto px-6 py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Minnesota's Trusted Provider Network
            </div>
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              Connecting Care with Compliance
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              CareLinkMN streamlines provider compliance and client-provider matching across Minnesota's human services ecosystem.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link to={createPageUrl('ProviderRegister')}>
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={createPageUrl('CaseManagerSearch')}>
                  Search Openings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Role-based Sections */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Choose Your Portal</h2>
          <p className="text-lg text-slate-600">Select the portal that matches your role</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {roles.map((role, idx) => (
            <Card key={idx} className={`border-2 hover:shadow-xl transition-all bg-gradient-to-br ${
              role.color === 'blue' ? 'from-blue-50 to-white border-blue-200' :
              role.color === 'purple' ? 'from-purple-50 to-white border-purple-200' :
              'from-emerald-50 to-white border-emerald-200'
            }`}>
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  role.color === 'blue' ? 'bg-blue-600' :
                  role.color === 'purple' ? 'bg-purple-600' : 'bg-emerald-600'
                }`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3">{role.title}</h3>
                <p className="text-slate-600 mb-6">{role.description}</p>
                
                <ul className="space-y-2 mb-8">
                  {role.benefits.map((benefit, bidx) => (
                    <li key={bidx} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                        role.color === 'blue' ? 'text-blue-600' :
                        role.color === 'purple' ? 'text-purple-600' : 'text-emerald-600'
                      }`} />
                      {benefit}
                    </li>
                  ))}
                </ul>
                
                <Button className={`w-full ${
                  role.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  role.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-emerald-600 hover:bg-emerald-700'
                }`} asChild>
                  <Link to={role.link}>
                    {role.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join Minnesota's leading provider network for compliant, efficient care coordination.
          </p>
          <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
            <Link to={createPageUrl('ProviderRegister')}>
              Create Your Account Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}