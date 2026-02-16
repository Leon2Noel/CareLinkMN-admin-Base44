import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MapPin,
  Building2,
  DoorOpen,
  CheckCircle2,
  Filter,
  X,
  AlertCircle
} from 'lucide-react';

const MN_COUNTIES = [
  'Anoka', 'Hennepin', 'Ramsey', 'Dakota', 'Washington', 'St. Louis', 
  'Olmsted', 'Scott', 'Carver', 'Wright', 'Stearns'
];

const WAIVERS = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];
const AGE_RANGES = ['Less than 18 yrs', '18-55 years', '55 yrs and above'];
const PROGRAM_TYPES = ['CRS', 'IHS', 'RESPITE', 'MEMORY_CARE', 'SUPPORTED_LIVING'];

export default function CaseManagerSearch() {
  const [filters, setFilters] = useState({
    county: '',
    waiver: '',
    age_range: '',
    program_type: '',
    gender: 'any'
  });

  const { data: openings = [], isLoading } = useQuery({
    queryKey: ['cm-openings', filters],
    queryFn: async () => {
      let results = await base44.entities.Opening.filter({ status: 'active' });
      
      // Filter by county if specified
      if (filters.county) {
        const sites = await base44.entities.Site.filter({ 
          county: filters.county,
          status: 'active'
        });
        const siteIds = sites.map(s => s.id);
        results = results.filter(o => siteIds.includes(o.site_id));
      }
      
      // Filter by waiver
      if (filters.waiver) {
        results = results.filter(o => 
          o.funding_accepted?.includes(filters.waiver)
        );
      }
      
      // Filter by age range
      if (filters.age_range) {
        results = results.filter(o => {
          const ageMap = {
            'Less than 18 yrs': [0, 17],
            '18-55 years': [18, 55],
            '55 yrs and above': [55, 120]
          };
          const [min, max] = ageMap[filters.age_range];
          return (!o.age_min || o.age_min <= min) && (!o.age_max || o.age_max >= max);
        });
      }
      
      // Filter by gender
      if (filters.gender !== 'any') {
        results = results.filter(o => 
          o.gender_requirement === 'any' || o.gender_requirement === filters.gender
        );
      }
      
      return results;
    }
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['program-activations'],
    queryFn: () => base44.entities.ProgramActivation.list()
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      county: '',
      waiver: '',
      age_range: '',
      program_type: '',
      gender: 'any'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'any');

  const getOrganization = (orgId) => organizations.find(o => o.id === orgId);
  const getSite = (siteId) => sites.find(s => s.id === siteId);
  const getProgram = (programId) => programs.find(p => p.id === programId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <PageHeader
        title="Search Openings"
        description="Find verified provider openings that match your client's needs"
        breadcrumbs={[
          { label: 'Home', href: createPageUrl('Home') },
          { label: 'Case Manager Portal' }
        ]}
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="county">County *</Label>
                <Select value={filters.county} onValueChange={(v) => updateFilter('county', v)}>
                  <SelectTrigger id="county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Counties</SelectItem>
                    {MN_COUNTIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="waiver">Waiver Type</Label>
                <Select value={filters.waiver} onValueChange={(v) => updateFilter('waiver', v)}>
                  <SelectTrigger id="waiver">
                    <SelectValue placeholder="Any waiver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any Waiver</SelectItem>
                    {WAIVERS.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="age_range">Age Range</Label>
                <Select value={filters.age_range} onValueChange={(v) => updateFilter('age_range', v)}>
                  <SelectTrigger id="age_range">
                    <SelectValue placeholder="Any age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Any Age</SelectItem>
                    {AGE_RANGES.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={filters.gender} onValueChange={(v) => updateFilter('gender', v)}>
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              {isLoading ? 'Searching...' : `${openings.length} opening${openings.length !== 1 ? 's' : ''} found`}
            </p>
            <Button asChild>
              <Link to={createPageUrl('ReferralBuilder')}>
                Create Referral
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : openings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No openings match your filters</h3>
                <p className="text-slate-600 mb-6">Try adjusting your search criteria</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {openings.map(opening => {
                const org = getOrganization(opening.organization_id);
                const site = getSite(opening.site_id);
                const program = getProgram(opening.program_activation_id);
                
                return (
                  <Card key={opening.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {opening.title}
                            </h3>
                            {org?.verification_status === 'verified' && (
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building2 className="w-4 h-4" />
                            {org?.legal_name || 'Unknown Provider'}
                          </div>
                        </div>
                        <StatusBadge status={opening.status} />
                      </div>

                      {site && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          {site.name} • {site.city}, {site.county} County
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        {opening.funding_accepted?.map(f => (
                          <Badge key={f} variant="outline">{f}</Badge>
                        ))}
                        {opening.gender_requirement !== 'any' && (
                          <Badge variant="outline">{opening.gender_requirement}</Badge>
                        )}
                        {opening.spots_available > 1 && (
                          <Badge variant="secondary">{opening.spots_available} spots</Badge>
                        )}
                      </div>

                      {opening.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {opening.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <DoorOpen className="w-4 h-4" />
                          Available: {opening.available_date || 'Immediate'}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={createPageUrl('OpeningDetail') + `?id=${opening.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}