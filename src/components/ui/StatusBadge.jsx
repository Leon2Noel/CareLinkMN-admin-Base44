import React from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Shield,
  Loader2,
  Ban
} from 'lucide-react';

const statusConfig = {
  // Verification statuses
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  unverified: {
    label: 'Unverified',
    icon: Clock,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  pending: {
    label: 'Pending',
    icon: Loader2,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    animate: true
  },
  pending_verification: {
    label: 'Pending Review',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  pending_upload: {
    label: 'Pending Upload',
    icon: Clock,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  
  // License statuses
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  revoked: {
    label: 'Revoked',
    icon: Ban,
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  expiring_soon: {
    label: 'Expiring Soon',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  
  // General statuses
  active: {
    label: 'Active',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  suspended: {
    label: 'Suspended',
    icon: Ban,
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  
  // Opening statuses
  draft: {
    label: 'Draft',
    icon: Clock,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  filled: {
    label: 'Filled',
    icon: CheckCircle2,
    className: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: XCircle,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  
  // Referral statuses
  new: {
    label: 'New',
    icon: Loader2,
    className: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  under_review: {
    label: 'Under Review',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  matched: {
    label: 'Matched',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  placed: {
    label: 'Placed',
    icon: Shield,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  
  // Subscription statuses
  trial: {
    label: 'Trial',
    icon: Clock,
    className: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  past_due: {
    label: 'Past Due',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },

  // Urgency
  routine: {
    label: 'Routine',
    icon: Clock,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  crisis: {
    label: 'Crisis',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200'
  }
};

export default function StatusBadge({ status, size = 'default', showIcon = true, className }) {
  const config = statusConfig[status] || {
    label: status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
    icon: Clock,
    className: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5",
          config.animate && "animate-spin"
        )} />
      )}
      {config.label}
    </span>
  );
}