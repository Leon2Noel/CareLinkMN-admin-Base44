import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns';

export default function FreshnessIndicator({ opening, size = 'default' }) {
  if (!opening.last_confirmed_at) {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-600">
        <Clock className="w-3 h-3 mr-1" />
        Not confirmed
      </Badge>
    );
  }

  const confirmedDate = parseISO(opening.last_confirmed_at);
  const hoursAgo = differenceInHours(new Date(), confirmedDate);
  const hoursRemaining = 48 - hoursAgo;

  if (hoursRemaining <= 0) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  }

  if (hoursRemaining <= 12) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3 mr-1" />
        Expires in {hoursRemaining}h
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3 h-3 mr-1" />
      Fresh · {formatDistanceToNow(confirmedDate, { addSuffix: true })}
    </Badge>
  );
}