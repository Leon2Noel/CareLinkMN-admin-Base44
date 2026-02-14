import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompletenessMeter({ 
  score, 
  items = [], 
  showChecklist = true,
  size = 'default' 
}) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("space-y-3", size === 'sm' && "space-y-2")}>
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-bold",
          getScoreColor(score),
          size === 'sm' ? "text-lg" : "text-2xl"
        )}>
          {score}%
        </span>
        <span className={cn(
          "text-slate-500",
          size === 'sm' ? "text-xs" : "text-sm"
        )}>
          {score >= 100 ? 'Complete!' : score >= 80 ? 'Almost there' : 'In progress'}
        </span>
      </div>

      <Progress 
        value={score} 
        className={cn("h-2", size === 'sm' && "h-1.5")}
        indicatorClassName={getProgressColor(score)}
      />

      {showChecklist && items.length > 0 && (
        <div className="space-y-2 pt-2">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={cn(
                "flex items-center gap-2",
                size === 'sm' ? "text-xs" : "text-sm"
              )}
            >
              {item.complete ? (
                <CheckCircle2 className={cn(
                  "text-emerald-500 flex-shrink-0",
                  size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"
                )} />
              ) : item.required ? (
                <AlertCircle className={cn(
                  "text-red-500 flex-shrink-0",
                  size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"
                )} />
              ) : (
                <Circle className={cn(
                  "text-slate-300 flex-shrink-0",
                  size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"
                )} />
              )}
              <span className={cn(
                item.complete ? "text-slate-500 line-through" : "text-slate-700"
              )}>
                {item.label}
              </span>
              {item.required && !item.complete && (
                <span className="text-red-500 text-xs">Required</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}