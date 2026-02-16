import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Search, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function GetStarted() {
  const roles = [
    {
      id: 'provider',
      icon: Building2,
      title: "I'm a Provider",
      description: "List your licensed programs, sites, and openings",
      benefits: [
        "License-to-program compliance automation",
        "Create verified, searchable openings",
        "Receive qualified referrals directly"
      ],
      color: "blue",
      link: createPageUrl('Register') + '?role=provider'
    },
    {
      id: 'cm',
      icon: Search,
      title: "I'm a Case Manager",
      description: "Search openings and submit client referrals",
      benefits: [
        "Search by waiver, county, and capabilities",
        "View verified provider information",
        "Submit and track referrals"
      ],
      color: "purple",
      link: createPageUrl('Register') + '?role=cm'
    },
    {
      id: 'family',
      icon: Users,
      title: "I'm a Family/Guardian",
      description: "Find appropriate care for your loved one",
      benefits: [
        "Guided intake process",
        "Simplified search by care needs",
        "Connect with verified providers"
      ],
      color: "emerald",
      link: createPageUrl('Register') + '?role=family'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Get Started with CareLinkMN
          </h1>
          <p className="text-lg text-slate-600">
            Choose your role to create your account and get access
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className={`hover:shadow-2xl transition-all border-2 ${
                role.color === 'blue' ? 'hover:border-blue-300' :
                role.color === 'purple' ? 'hover:border-purple-300' :
                'hover:border-emerald-300'
              }`}
            >
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  role.color === 'blue' ? 'bg-blue-600' :
                  role.color === 'purple' ? 'bg-purple-600' :
                  'bg-emerald-600'
                }`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  {role.title}
                </h2>
                <p className="text-slate-600 mb-6">
                  {role.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {role.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        role.color === 'blue' ? 'text-blue-600' :
                        role.color === 'purple' ? 'text-purple-600' :
                        'text-emerald-600'
                      }`} />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    role.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    role.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  asChild
                >
                  <Link to={role.link}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Links */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">Already have an account?</p>
          <Button variant="outline" size="lg" asChild>
            <Link to={createPageUrl('Login')}>
              Log In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}