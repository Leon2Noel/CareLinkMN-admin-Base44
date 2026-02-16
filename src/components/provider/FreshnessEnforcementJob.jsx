import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInHours, parseISO } from 'date-fns';

/**
 * Background job component that enforces 48-hour freshness policy
 * Runs hourly to auto-inactivate stale openings
 */
export default function FreshnessEnforcementJob() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const runEnforcement = async () => {
      try {
        // Fetch all active openings
        const activeOpenings = await base44.entities.Opening.filter({ status: 'active' });
        
        const now = new Date();
        const staleOpenings = activeOpenings.filter(opening => {
          if (!opening.last_confirmed_at) {
            // Never confirmed, inactivate if created more than 48h ago
            const createdHours = differenceInHours(now, parseISO(opening.created_date));
            return createdHours > 48;
          }
          
          const hoursAgo = differenceInHours(now, parseISO(opening.last_confirmed_at));
          return hoursAgo > 48;
        });

        // Auto-inactivate stale openings
        for (const opening of staleOpenings) {
          await base44.entities.Opening.update(opening.id, {
            status: 'inactive',
            auto_inactivated_reason: 'Stale: not confirmed in 48 hours',
            auto_inactivated_at: now.toISOString()
          });

          // Create notification for provider
          try {
            const org = await base44.entities.Organization.filter({ id: opening.organization_id }).then(r => r[0]);
            if (org && org.primary_contact_email) {
              await base44.entities.Notification.create({
                recipient_user_id: org.created_by, // Assumes org has created_by field
                type: 'opening_status',
                title: 'Opening Auto-Inactivated',
                body: `Your opening "${opening.title}" was inactivated due to no confirmation within 48 hours.`,
                link_url: `/provider/openings?id=${opening.id}`,
                entity_type: 'opening',
                entity_id: opening.id,
                severity: 'warning'
              });
            }
          } catch (notifError) {
            console.error('Failed to create notification:', notifError);
          }
        }

        if (staleOpenings.length > 0) {
          console.log(`Auto-inactivated ${staleOpenings.length} stale openings`);
          queryClient.invalidateQueries({ queryKey: ['openings'] });
          queryClient.invalidateQueries({ queryKey: ['active-openings'] });
        }
      } catch (error) {
        console.error('Freshness enforcement job failed:', error);
      }
    };

    // Run immediately
    runEnforcement();

    // Run every hour
    const interval = setInterval(runEnforcement, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return null; // This is a background job component
}