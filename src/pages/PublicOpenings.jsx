import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Filter,
  X,
  ArrowRight
} from 'lucide-react';
import { differenceInHours, parseISO } from 'date-fns';

const MN_COUNTIES = [
  'Anoka', 'Hennepin', 'Ramsey', 'Dakota', 'Washington', 'St. Louis', 
  'Olmsted', 'Scott', 'Carver', 'Wright', 'Stearns'
];

const WAIVERS = ['CADI', 'DD', 'BI', 'EW', 'AC', 'CAC'];

export default function PublicOpenings() {
  const [filters, setFilters] = useState({
    county: '',
    waiver: '',
    gender: 'any'
  });

  const { data: openings = [], isLoading } = useQuery({
    queryKey: ['public-openings', filters],
    queryFn: async () => {
      let results = await base44.entities.Opening.filter({ 
        status: 'active',
        visibility: 'public'
      });
      
      // Filter out stale openings (not confirmed in 48h)
      results = results.filter(opening => {
        if (!opening.last_confirmed_at) return false;
        const hoursAgo = differenceInHours(new Date(), parseISO(opening.last_confirmed_at));
        return hoursAgo <= 48;
      });
      
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

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ county: '', waiver: '', gender: 'any' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'any');

  const getOrganization = (orgId) => organizations.find(o => o.id === orgId);
  const getSite = (siteId) => sites.find(s => s.id === siteId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DoorOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Available Openings</h1>
          </div>
          <Button asChild>
            <Link to={createPageUrl('GetStarted')}>
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Openings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">County</label>
                <Select value={filters.county} onValueChange={(v) => updateFilter('county', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All counties</SelectItem>
                    {MN_COUNTIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Waiver Type</label>
                <Select value={filters.waiver} onValueChange={(v) => updateFilter('waiver', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All waivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All waivers</SelectItem>
                    {WAIVERS.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <Select value={filters.gender} onValueChange={(v) => updateFilter('gender', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-slate-600">
            {isLoading ? 'Loading...' : `${openings.length} opening${openings.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading openings...</p>
          </div>
        ) : openings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">No openings found</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {openings.map(opening => {
              const org = getOrganization(opening.organization_id);
              const site = getSite(opening.site_id);

              return (
                <Card key={opening.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          {opening.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {org?.legal_name || 'Unknown Provider'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {site?.city}, {site?.county} County
                          </div>
                        </div>
                        <p className="text-slate-600 mb-4">{opening.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {opening.spots_available} {opening.spots_available === 1 ? 'spot' : 'spots'} available
                          </Badge>
                          {opening.funding_accepted?.map(f => (
                            <Badge key={f} variant="secondary">{f}</Badge>
                          ))}
                          <Badge variant="outline">
                            {opening.gender_requirement === 'any' ? 'All Genders' : opening.gender_requirement}
                          </Badge>
                          {opening.age_min && opening.age_max && (
                            <Badge variant="outline">
                              Ages {opening.age_min}-{opening.age_max}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button asChild>
                        <Link to={createPageUrl('OpeningDetail') + `?id=${opening.id}`}>
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
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
  );
}