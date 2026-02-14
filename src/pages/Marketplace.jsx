import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store,
  Briefcase,
  Building,
  ArrowLeftRight,
  Megaphone,
  Plus,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Jobs, vendor listings, reverse referrals, and promotional features"
      />

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="reverse" className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Reverse Referrals
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Job Listings</h3>
              <p className="text-sm text-slate-500">Provider job postings</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post Job
            </Button>
          </div>
          
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No Job Listings</h3>
            <p className="text-slate-500 mt-1">Job postings will appear here when providers add them</p>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Vendor Directory</h3>
              <p className="text-sm text-slate-500">Service providers and suppliers</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'MedSupply Co', category: 'Medical Equipment', location: 'Minneapolis, MN' },
              { name: 'CareStaff Solutions', category: 'Staffing Agency', location: 'St. Paul, MN' },
              { name: 'Therapy Partners', category: 'Therapy Services', location: 'Bloomington, MN' },
            ].map((vendor, i) => (
              <Card key={i} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{vendor.name}</h4>
                    <Badge variant="outline" className="mt-1">{vendor.category}</Badge>
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vendor.location}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reverse" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Reverse Referrals</h3>
              <p className="text-sm text-slate-500">Providers seeking specific client types</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post Request
            </Button>
          </div>
          
          <Card className="p-12 text-center">
            <ArrowLeftRight className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No Reverse Referrals</h3>
            <p className="text-slate-500 mt-1">Providers can post requests for specific client types</p>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Promotional Listings</h3>
              <p className="text-sm text-slate-500">Featured and promoted content</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Featured Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">Premium placement for provider listings</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Cost per week</span>
                    <span className="font-bold text-slate-900">$199</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Banner Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">Display advertising across the platform</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">CPM rate</span>
                    <span className="font-bold text-slate-900">$15</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}