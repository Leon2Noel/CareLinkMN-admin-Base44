import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Copy, Users, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  {
    type: 'Case Manager',
    email: 'casemanager@demo.com',
    password: 'Demo2024!',
    role: 'user',
    description: 'Case manager searching for placements'
  },
  {
    type: 'Provider Admin',
    email: 'provider@demo.com',
    password: 'Demo2024!',
    role: 'user',
    description: 'Provider organization managing openings'
  },
  {
    type: 'Guardian',
    email: 'guardian@demo.com',
    password: 'Demo2024!',
    role: 'user',
    description: 'Family member/guardian seeking services'
  },
  {
    type: 'System Admin',
    email: 'admin@demo.com',
    password: 'Admin2024!',
    role: 'admin',
    description: 'Platform administrator'
  }
];

export default function DemoSetup() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState(null);

  const setupMutation = useMutation({
    mutationFn: async () => {
      // Create demo provider organization
      const org = await base44.entities.Organization.create({
        legal_name: 'Sunshine Care Services',
        dba_name: 'Sunshine Care',
        ein: '12-3456789',
        address: '123 Main Street',
        city: 'Minneapolis',
        state: 'MN',
        zip_code: '55401',
        phone: '(612) 555-0100',
        email: 'provider@demo.com',
        website: 'https://sunshinecare.example.com',
        primary_contact_name: 'John Provider',
        primary_contact_email: 'provider@demo.com',
        primary_contact_phone: '(612) 555-0100',
        counties_served: ['Hennepin', 'Ramsey', 'Dakota'],
        waivers_accepted: ['CADI', 'DD', 'BI'],
        age_ranges: ['18-21', '22-64', '65+'],
        populations_served: ['DD', 'Elderly', 'Physical Disability'],
        status: 'active',
        verification_status: 'verified',
        onboarding_step: 9
      });

      // Create license
      const license = await base44.entities.LicenseInstance.create({
        organization_id: org.id,
        license_type_code: '245D_BASIC',
        license_number: 'MN-245D-12345',
        issuing_authority: 'DHS',
        effective_date: '2024-01-01',
        expiration_date: '2026-12-31',
        status: 'verified'
      });

      // Create program activation
      const program = await base44.entities.ProgramActivation.create({
        organization_id: org.id,
        program_model_id: 'prog_001',
        program_code: 'CRS',
        qualifying_license_id: license.id,
        status: 'active',
        effective_date: '2024-01-01'
      });

      // Create site
      const site = await base44.entities.Site.create({
        organization_id: org.id,
        name: 'Sunshine Main Campus',
        site_type: 'residential',
        address: '456 Care Avenue',
        city: 'Minneapolis',
        county: 'Hennepin',
        state: 'MN',
        zip_code: '55403',
        phone: '(612) 555-0101',
        total_capacity: 8,
        current_census: 5,
        gender_restriction: 'all',
        status: 'active'
      });

      // Create active opening
      const opening = await base44.entities.Opening.create({
        organization_id: org.id,
        site_id: site.id,
        program_activation_id: program.id,
        title: 'Community Residential Setting - Immediate Opening',
        description: 'Welcoming home environment with 24/7 support for adults with developmental disabilities',
        opening_type: 'immediate',
        spots_available: 2,
        gender_requirement: 'any',
        age_min: 18,
        age_max: 65,
        funding_accepted: ['CADI', 'DD', 'MA'],
        status: 'active',
        last_confirmed_at: new Date().toISOString(),
        visibility: 'case_managers_only',
        is_compliant: true
      });

      // Create subscription (premium for demo)
      await base44.entities.Subscription.create({
        organization_id: org.id,
        plan: 'professional',
        status: 'active',
        priority_boost_factor: 1.10,
        current_period_start: '2024-01-01',
        current_period_end: '2024-12-31',
        gating_requirements_met: true
      });

      // Create message quota
      const currentMonth = new Date().toISOString().slice(0, 7);
      await base44.entities.ProviderMessageQuota.create({
        provider_org_id: org.id,
        month: currentMonth,
        initiated_count: 2,
        limit: 10
      });

      return org.id;
    },
    onSuccess: (orgId) => {
      setCreatedOrgId(orgId);
      setSetupComplete(true);
      toast.success('Demo data created successfully!');
    },
    onError: () => {
      toast.error('Failed to create demo data');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Demo Account Setup"
        description="Create sample data and test accounts for CareLinkMN"
      />

      {!setupComplete ? (
        <Card>
          <CardHeader>
            <CardTitle>Initialize Demo Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What will be created:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Demo provider organization (Sunshine Care Services)</li>
                <li>• Verified license and program activation</li>
                <li>• Active service site with capacity</li>
                <li>• Fresh opening ready for referrals</li>
                <li>• Premium subscription with message quota</li>
              </ul>
            </div>

            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              size="lg"
              className="w-full"
            >
              {setupMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Demo Data...
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5 mr-2" />
                  Create Demo Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">Demo data created successfully!</p>
                <p className="text-sm text-emerald-700">Provider Org ID: {createdOrgId}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Demo User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">Manual Account Creation Required</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Use the credentials below to register accounts through the normal sign-up flow.
                      The provider account should be linked to org ID: {createdOrgId}
                    </p>
                  </div>
                </div>
              </div>

              {DEMO_ACCOUNTS.map((account, idx) => (
                <Card key={idx} className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{account.type}</h4>
                          <Badge variant={account.role === 'admin' ? 'default' : 'outline'}>
                            {account.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{account.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-mono">{account.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(account.email)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                        <div>
                          <p className="text-xs text-slate-500">Password</p>
                          <p className="text-sm font-mono">{account.password}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(account.password)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-slate-700">
                <li>1. Register each account using the credentials above</li>
                <li>2. For the provider account, link to organization ID: <code className="bg-slate-100 px-2 py-1 rounded">{createdOrgId}</code></li>
                <li>3. Case manager can search for openings and create referrals</li>
                <li>4. Provider can manage openings and confirm availability</li>
                <li>5. Test messaging between case managers and providers</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}