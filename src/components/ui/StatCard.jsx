import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  className
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 p-6 transition-all hover:shadow-md",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          
          {typeof change !== 'undefined' && (
            <div className="flex items-center gap-1.5 mt-2">
              {isPositive && <TrendingUp className="w-4 h-4 text-emerald-600" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-red-600" />}
              <span className={cn(
                "text-sm font-medium",
                isPositive && "text-emerald-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-slate-600"
              )}>
                {isPositive && '+'}{change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-slate-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn("p-3 rounded-xl", iconBg)}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}