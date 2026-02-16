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
  GitMerge,
  DoorOpen
} from 'lucide-react';

export default function Home() {
  const handleGetStarted = () => {
    window.location.href = createPageUrl('GetStarted');
  };

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
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg" />
            <span className="text-xl font-bold">CareLinkMN</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#case-managers" className="text-slate-700 hover:text-blue-600 transition-colors">
              For Case Managers
            </a>
            <a href="#providers" className="text-slate-700 hover:text-blue-600 transition-colors">
              For Providers
            </a>
            <a href="#families" className="text-slate-700 hover:text-blue-600 transition-colors">
              For Families
            </a>
            <a href="#how-it-works" className="text-slate-700 hover:text-blue-600 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => window.location.href = '/login'}>
              Log In
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

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
              Minnesota openings, verified and searchable by real care needs
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Search by waiver, county, program model, behavioral/medical capacity, and staffing support — without the guesswork.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link to={createPageUrl('CaseManagerSearch')}>
                  Find Openings
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={createPageUrl('ProviderOnboarding')}>
                  List Your Organization
                </Link>
              </Button>
            </div>
            <div className="mt-4">
              <a href="#how-it-works" className="text-blue-600 hover:underline text-sm">
                How it works
              </a>
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

      {/* How It Works */}
      <div id="how-it-works" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-lg text-slate-600">Five simple steps to verified, compliant care placement</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {[
              { num: '1', title: 'Provider adds licenses', icon: FileCheck },
              { num: '2', title: 'Programs unlocked', icon: CheckCircle2 },
              { num: '3', title: 'Capabilities recorded', icon: Shield },
              { num: '4', title: 'Openings published', icon: DoorOpen },
              { num: '5', title: 'Case managers match', icon: GitMerge }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex-1 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">{step.num}</div>
                  <p className="text-sm font-medium text-slate-700">{step.title}</p>
                </div>
                {idx < 4 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-slate-300 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Role-based Sections */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Built for Every Role</h2>
          <p className="text-lg text-slate-600">Tailored experiences for providers, case managers, and families</p>
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

      {/* Trust Section */}
      <div className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full mb-4">
              <CheckCircle2 className="w-5 h-5" />
              Verified Badge
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Verification Matters</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our verification system prevents misrepresentation and ensures every opening meets Minnesota's regulatory standards
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">License Validated</h3>
              <p className="text-sm text-slate-600">Every license verified against state registries</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Compliance Checked</h3>
              <p className="text-sm text-slate-600">Automatic license-program validation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Truth in Placement</h3>
              <p className="text-sm text-slate-600">Real capabilities, not marketing claims</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join Minnesota's leading provider network for compliant, efficient care coordination.
          </p>
          <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" onClick={handleGetStarted}>
            Create Your Account Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg" />
                <span className="text-white font-bold">CareLinkMN</span>
              </div>
              <p className="text-sm">
                Minnesota's trusted provider network for compliant care coordination
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Users</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Case Managers</a></li>
                <li><a href="#" className="hover:text-white">Providers</a></li>
                <li><a href="#" className="hover:text-white">Families</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 CareLinkMN. All rights reserved.</p>
            <p className="mt-2">Contact: support@carelinkmn.org</p>
          </div>
        </div>
      </footer>
    </div>
  );
}