import React from 'react';
import { cn } from '@/lib/utils';

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className
}) {
  return (
    <div className={cn("mb-8", className)}>
      {breadcrumbs && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-700 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className={idx === breadcrumbs.length - 1 ? "text-slate-900 font-medium" : ""}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-500 mt-1">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}