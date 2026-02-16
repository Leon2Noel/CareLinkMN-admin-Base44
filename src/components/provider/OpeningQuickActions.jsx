import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, CheckCircle, XCircle, Pause, Play, Edit, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import FreshnessIndicator from './FreshnessIndicator';
import ConfirmAvailabilityButton from './ConfirmAvailabilityButton';

export default function OpeningQuickActions({ openings = [] }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Opening.update(id, { status }),
    onSuccess: () => {
      toast.success('Opening status updated');
      queryClient.invalidateQueries({ queryKey: ['openings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-metrics'] });
    }
  });

  const handleStatusChange = (opening, newStatus) => {
    updateStatusMutation.mutate({ id: opening.id, status: newStatus });
  };

  const activeOpenings = openings.filter(o => 
    o.status === 'active' || o.status === 'pending_approval'
  ).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Manage Openings</CardTitle>
        <Button size="sm" variant="outline" asChild>
          <Link to={createPageUrl('Openings')}>View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {activeOpenings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No active openings</p>
            <Button className="mt-4" asChild>
              <Link to={createPageUrl('Openings')}>Create Opening</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOpenings.map((opening) => (
              <div
                key={opening.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {opening.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <StatusBadge status={opening.status} size="sm" />
                    <FreshnessIndicator opening={opening} />
                    <span className="text-xs text-slate-500">
                      {opening.spots_available} spot{opening.spots_available !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {opening.status === 'active' && (
                  <ConfirmAvailabilityButton opening={opening} size="sm" variant="ghost" />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`${createPageUrl('OpeningDetail')}?id=${opening.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </Link>
                    </DropdownMenuItem>
                    
                    {opening.status === 'active' && (
                      <>
                        <DropdownMenuItem onClick={() => handleStatusChange(opening, 'filled')}>
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                          Mark as Filled
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(opening, 'withdrawn')}>
                          <Pause className="w-4 h-4 mr-2 text-amber-600" />
                          Pause Opening
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {opening.status === 'withdrawn' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(opening, 'active')}>
                        <Play className="w-4 h-4 mr-2 text-blue-600" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    
                    {opening.status === 'filled' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(opening, 'active')}>
                        <Play className="w-4 h-4 mr-2 text-blue-600" />
                        Reopen
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(opening, 'withdrawn')}
                      className="text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Opening
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}