import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Wallet,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const FUNDING_SOURCES = [
  { code: 'CADI', name: 'CADI Waiver', description: 'Community Access for Disability Inclusion' },
  { code: 'DD', name: 'DD Waiver', description: 'Developmental Disabilities' },
  { code: 'BI', name: 'BI Waiver', description: 'Brain Injury' },
  { code: 'EW', name: 'EW Waiver', description: 'Elderly Waiver' },
  { code: 'AC', name: 'AC Waiver', description: 'Alternative Care' },
  { code: 'CAC', name: 'CAC Waiver', description: 'Community Alternative Care' },
  { code: 'MA_FFS', name: 'MA Fee-for-Service', description: 'Medical Assistance FFS' },
  { code: 'MA_MCO', name: 'MA Managed Care', description: 'Medical Assistance MCO' },
  { code: 'VRS', name: 'VRS', description: 'Vocational Rehabilitation Services' },
  { code: 'Private_Pay', name: 'Private Pay', description: 'Self-pay / Insurance' },
  { code: 'County_Contract', name: 'County Contract', description: 'Direct county contract' },
];

export default function Funding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fundingFilter, setFundingFilter] = useState('all');

  const { data: fundingAcceptances = [], isLoading } = useQuery({
    queryKey: ['funding-acceptances'],
    queryFn: () => base44.entities.FundingAcceptance.list('-created_date', 500)
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations-lookup'],
    queryFn: () => base44.entities.Organization.list()
  });

  const orgMap = useMemo(() => organizations.reduce((acc, o) => ({ ...acc, [o.id]: o }), {}), [organizations]);

  // Group by funding source
  const fundingBySource = useMemo(() => {
    const grouped = {};
    FUNDING_SOURCES.forEach(f => {
      grouped[f.code] = {
        ...f,
        count: fundingAcceptances.filter(fa => fa.funding_source === f.code && fa.is_accepted).length,
        expiring: fundingAcceptances.filter(fa => {
          if (fa.funding_source !== f.code || !fa.contract_expiry) return false;
          const daysUntil = differenceInDays(new Date(fa.contract_expiry), new Date());
          return daysUntil >= 0 && daysUntil <= 30;
        }).length
      };
    });
    return grouped;
  }, [fundingAcceptances]);

  const filteredAcceptances = useMemo(() => {
    return fundingAcceptances.filter(fa => {
      const org = orgMap[fa.organization_id];
      
      const matchesSearch = !searchTerm || 
        org?.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fa.contract_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFunding = fundingFilter === 'all' || fa.funding_source === fundingFilter;
      
      return matchesSearch && matchesFunding;
    });
  }, [fundingAcceptances, searchTerm, fundingFilter, orgMap]);

  const columns = [
    {
      key: 'organization',
      header: 'Provider',
      render: (_, row) => {
        const org = orgMap[row.organization_id];
        return (
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{org?.legal_name || 'Unknown'}</span>
          </div>
        );
      }
    },
    {
      key: 'funding_source',
      header: 'Funding Source',
      render: (value) => {
        const source = FUNDING_SOURCES.find(f => f.code === value);
        return (
          <div>
            <Badge variant="outline" className="font-mono">{value}</Badge>
            {source && <p className="text-xs text-slate-500 mt-1">{source.name}</p>}
          </div>
        );
      }
    },
    {
      key: 'is_accepted',
      header: 'Status',
      render: (value) => value ? (
        <Badge className="bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      ) : (
        <Badge variant="outline">
          <XCircle className="w-3 h-3 mr-1" />
          Not Accepted
        </Badge>
      )
    },
    {
      key: 'contract_number',
      header: 'Contract #',
      render: (value) => value ? (
        <span className="font-mono text-sm">{value}</span>
      ) : (
        <span className="text-slate-400">-</span>
      )
    },
    {
      key: 'contract_expiry',
      header: 'Expiration',
      render: (value) => {
        if (!value) return <span className="text-slate-400">-</span>;
        const daysUntil = differenceInDays(new Date(value), new Date());
        const isExpiring = daysUntil >= 0 && daysUntil <= 30;
        const isExpired = daysUntil < 0;
        return (
          <div className="flex items-center gap-2">
            <span className={isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : ''}>
              {format(new Date(value), 'MMM d, yyyy')}
            </span>
            {isExpired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
            {isExpiring && <Badge className="bg-amber-100 text-amber-700 text-xs">Soon</Badge>}
          </div>
        );
      }
    },
    {
      key: 'rate_negotiated',
      header: 'Rate',
      render: (value) => value ? (
        <span className="font-medium">${value.toFixed(2)}</span>
      ) : (
        <span className="text-slate-400">Standard</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funding Acceptance"
        description="Manage funding source acceptance and contract status across providers"
      />

      {/* Funding Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {FUNDING_SOURCES.slice(0, 6).map(source => {
          const data = fundingBySource[source.code];
          return (
            <Card key={source.code} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="font-mono">{source.code}</Badge>
                {data.expiring > 0 && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.count}</p>
              <p className="text-xs text-slate-500">providers</p>
              {data.expiring > 0 && (
                <p className="text-xs text-amber-600 mt-1">{data.expiring} expiring</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by provider or contract number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={fundingFilter} onValueChange={setFundingFilter}>
              <SelectTrigger className="w-[180px]">
                <Wallet className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Funding Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {FUNDING_SOURCES.map(f => (
                  <SelectItem key={f.code} value={f.code}>{f.code} - {f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Funding Table */}
      <DataTable
        columns={columns}
        data={filteredAcceptances}
        isLoading={isLoading}
        emptyMessage="No funding acceptances found"
      />

      {/* Funding Source Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funding Source Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUNDING_SOURCES.map(source => (
              <div key={source.code} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">{source.code}</Badge>
                  <span className="font-medium text-slate-900">{source.name}</span>
                </div>
                <p className="text-sm text-slate-500">{source.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}