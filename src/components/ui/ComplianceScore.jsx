import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export default function ComplianceScore({ score, size = 'default', showLabel = true }) {
  const getScoreConfig = (score) => {
    if (score >= 80) {
      return {
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: ShieldCheck,
        label: 'Excellent'
      };
    }
    if (score >= 60) {
      return {
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: Shield,
        label: 'Needs Attention'
      };
    }
    return {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: ShieldAlert,
      label: 'At Risk'
    };
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  if (size === 'lg') {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border",
        config.bg,
        config.border
      )}>
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <Icon className={cn("w-6 h-6", config.color)} />
        </div>
        <div>
          <div className={cn("text-2xl font-bold", config.color)}>{score}%</div>
          {showLabel && (
            <div className="text-sm text-slate-600">{config.label}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
      config.bg,
      config.border
    )}>
      <Icon className={cn("w-4 h-4", config.color)} />
      <span className={cn("font-semibold", config.color)}>{score}%</span>
      {showLabel && (
        <span className="text-xs text-slate-500">{config.label}</span>
      )}
    </div>
  );
}