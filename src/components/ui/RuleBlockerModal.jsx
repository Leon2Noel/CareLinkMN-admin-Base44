import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, ArrowRight, ExternalLink } from 'lucide-react';

export default function RuleBlockerModal({ 
  open, 
  onOpenChange, 
  violations = [],
  entityType,
  entityId 
}) {
  if (!violations || violations.length === 0) return null;

  const hasBlocks = violations.some(v => v.severity === 'block');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            {hasBlocks ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            {hasBlocks ? 'Submission Blocked' : 'Warnings Detected'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {hasBlocks 
              ? 'The following rule violations must be resolved before continuing:'
              : 'The following issues were detected. You may proceed but please review:'
            }
          </p>

          <div className="space-y-3">
            {violations.map((violation, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border ${
                  violation.severity === 'block' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        className={violation.severity === 'block' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {violation.severity === 'block' ? 'Block' : 'Warning'}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {violation.rule_code}
                      </Badge>
                    </div>
                    <p className={`text-sm font-medium ${
                      violation.severity === 'block' ? 'text-red-800' : 'text-amber-800'
                    }`}>
                      {violation.message}
                    </p>
                    {violation.fields?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Affected fields: {violation.fields.join(', ')}
                      </p>
                    )}
                  </div>
                  {violation.fix_link && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={violation.fix_link}>
                        Fix <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          {hasBlocks ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close & Fix Issues
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Review Issues
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700">
                Proceed Anyway
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}