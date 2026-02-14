import React from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const verificationConfig = {
  verified: {
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Verified',
    description: 'This has been verified by CareLinkMN staff'
  },
  pending_review: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending Review',
    description: 'Awaiting verification by compliance team'
  },
  pending_verification: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending Verification',
    description: 'Awaiting verification by compliance team'
  },
  unverified: {
    icon: Shield,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Unverified',
    description: 'Not yet submitted for verification'
  },
  expired: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Expired',
    description: 'Verification has expired'
  },
  rejected: {
    icon: ShieldX,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Rejected',
    description: 'Verification was rejected'
  }
};

export default function VerificationBadge({ 
  status, 
  size = 'default',
  showLabel = true,
  showTooltip = true 
}) {
  const config = verificationConfig[status] || verificationConfig.unverified;
  const Icon = config.icon;

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.bg,
        config.border,
        config.color
      )}
    >
      <Icon className={cn(
        size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"
      )} />
      {showLabel && config.label}
    </span>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}