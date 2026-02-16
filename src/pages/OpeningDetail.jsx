import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Building2,
  MapPin,
  DoorOpen,
  Users,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  Layers,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function OpeningDetail() {
  const [searchParams] = useSearchParams();
  const openingId = searchParams.get('id');

  const { data: opening, isLoading } = useQuery({
    queryKey: ['opening', openingId],
    queryFn: () => base44.entities.Opening.filter({ id: openingId }).then(r => r[0]),
    enabled: !!openingId
  });

  const { data: organization } = useQuery({
    queryKey: ['org', opening?.organization_id],
    queryFn: () => base44.entities.Organization.filter({ id: opening.organization_id }).then(r => r[0]),
    enabled: !!opening?.organization_id
  });

  const { data: site } = useQuery({
    queryKey: ['site', opening?.site_id],
    queryFn: () => base44.entities.Site.filter({ id: opening.site_id }).then(r => r[0]),
    enabled: !!opening?.site_id
  });

  const { data: program } = useQuery({
    queryKey: ['program', opening?.program_activation_id],
    queryFn: () => base44.entities.ProgramActivation.filter({ id: opening.program_activation_id }).then(r => r[0]),
    enabled: !!opening?.program_activation_id
  });

  const { data: capability } = useQuery({
    queryKey: ['capability', site?.capability_profile_id],
    queryFn: () => base44.entities.CapabilityProfile.filter({ id: site.capability_profile_id }).then(r => r[0]),
    enabled: !!site?.capability_profile_id
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">Opening Not Found</h3>
            <p className="text-slate-600 mb-6">This opening may have been removed or is no longer available</p>
            <Button asChild>
              <Link to={createPageUrl('CaseManagerSearch')}>Back to Search</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Search', href: createPageUrl('CaseManagerSearch') },
          { label: 'Opening Details' }
        ]}
        actions={
          <Button asChild>
            <Link to={createPageUrl('ReferralBuilder') + `?opening_id=${opening.id}`}>
              Create Referral
            </Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opening Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{opening.title}</CardTitle>
                    {organization?.verification_status === 'verified' && (
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-4 h-4" />
                    {organization?.legal_name}
                  </div>
                </div>
                <StatusBadge status={opening.status} size="lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">{opening.description || 'No description provided'}</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <DoorOpen className="w-3 h-3 mr-1" />
                  {opening.spots_available} {opening.spots_available === 1 ? 'spot' : 'spots'}
                </Badge>
                <Badge variant="secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  {opening.available_date ? format(new Date(opening.available_date), 'MMM d, yyyy') : 'Immediate'}
                </Badge>
                {opening.opening_type && (
                  <Badge variant="outline">{opening.opening_type.replace('_', ' ')}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Site Information */}
          {site && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Site Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-slate-900">{site.name}</p>
                  <p className="text-sm text-slate-600">{site.site_type?.replace('_', ' ')}</p>
                </div>
                <div className="text-sm text-slate-700">
                  <p>{site.address}</p>
                  <p>{site.city}, {site.state} {site.zip_code}</p>
                  <p className="text-slate-600">{site.county} County</p>
                </div>
                {site.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    {site.phone}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-slate-500">Total Capacity</p>
                    <p className="font-semibold">{site.total_capacity || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Current Census</p>
                    <p className="font-semibold">{site.current_census || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Capability Highlights */}
          {capability && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {capability.behavioral && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Behavioral Support</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(capability.behavioral).map(([key, value]) => 
                        value && value !== 'none' ? (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, ' ')}: {value}
                          </Badge>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
                
                {capability.medical && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Medical Support</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(capability.medical).map(([key, value]) => 
                        value && value !== 'none' && value !== false ? (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace(/_/g, ' ')}: {typeof value === 'boolean' ? 'Yes' : value}
                          </Badge>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
                
                {capability.staffing && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Staffing</p>
                    <div className="flex flex-wrap gap-2">
                      {capability.staffing.ratio_day && (
                        <Badge variant="secondary">Day: {capability.staffing.ratio_day}</Badge>
                      )}
                      {capability.staffing.ratio_night && (
                        <Badge variant="secondary">Night: {capability.staffing.ratio_night}</Badge>
                      )}
                      {capability.staffing.awake_overnight && (
                        <Badge variant="secondary">Awake overnight</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funding & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Funding Accepted</p>
                <div className="flex flex-wrap gap-1">
                  {opening.funding_accepted?.map(f => (
                    <Badge key={f} variant="default">{f}</Badge>
                  ))}
                </div>
              </div>
              
              {opening.gender_requirement && opening.gender_requirement !== 'any' && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Gender</p>
                  <Badge variant="outline">{opening.gender_requirement}</Badge>
                </div>
              )}
              
              {(opening.age_min || opening.age_max) && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Age Range</p>
                  <p className="text-sm text-slate-900">
                    {opening.age_min || 0} - {opening.age_max || '∞'} years
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          {organization && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {organization.primary_contact_name && (
                  <div>
                    <p className="text-xs text-slate-500">Primary Contact</p>
                    <p className="text-sm font-medium text-slate-900">{organization.primary_contact_name}</p>
                  </div>
                )}
                {organization.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${organization.email}`} className="hover:underline">
                      {organization.email}
                    </a>
                  </div>
                )}
                {organization.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${organization.phone}`} className="hover:underline">
                      {organization.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                <Link to={createPageUrl('ReferralBuilder') + `?opening_id=${opening.id}`}>
                  Create Referral
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={createPageUrl('CaseManagerSearch')}>
                  Back to Search
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}