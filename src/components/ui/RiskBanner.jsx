import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, XCircle, Clock, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const riskConfig = {
  critical: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-600'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-600'
  },
  expiring: {
    icon: Clock,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-600'
  }
};

export default function RiskBanner({ 
  type = 'warning',
  title,
  description,
  action,
  onAction,
  onDismiss,
  className
}) {
  const config = riskConfig[type] || riskConfig.warning;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border",
      config.bg,
      config.border,
      className
    )}>
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", config.text)}>{title}</p>
        {description && (
          <p className={cn("text-sm mt-1", config.text, "opacity-80")}>
            {description}
          </p>
        )}
        {action && (
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-3"
            onClick={onAction}
          >
            {action}
          </Button>
        )}
      </div>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6 flex-shrink-0", config.text)}
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}