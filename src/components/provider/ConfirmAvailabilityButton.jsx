import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmAvailabilityButton({ opening, size = 'default', variant = 'default' }) {
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        last_confirmed_at: new Date().toISOString()
      };
      
      // If opening was auto-inactivated, reactivate it
      if (opening.status === 'inactive' && opening.auto_inactivated_reason) {
        updates.status = 'active';
        updates.auto_inactivated_reason = null;
        updates.auto_inactivated_at = null;
      }
      
      return base44.entities.Opening.update(opening.id, updates);
    },
    onSuccess: () => {
      toast.success('Opening availability confirmed');
      queryClient.invalidateQueries({ queryKey: ['openings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-openings'] });
    },
    onError: () => {
      toast.error('Failed to confirm availability');
    }
  });

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => confirmMutation.mutate()}
      disabled={confirmMutation.isPending}
    >
      {confirmMutation.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Confirming...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Available
        </>
      )}
    </Button>
  );
}