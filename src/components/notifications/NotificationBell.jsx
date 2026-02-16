import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Bell, MessageSquare, DoorOpen, FileCheck, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: async () => {
      const all = await base44.entities.Notification.list('-created_date', 10);
      return all.filter(n => !n.is_read);
    },
    refetchInterval: 30000 // Poll every 30s
  });

  const unreadCount = notifications.length;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'referral_status': return FileCheck;
      case 'opening_match': return DoorOpen;
      case 'message': return MessageSquare;
      default: return Bell;
    }
  };

  const handleNotificationClick = (notification) => {
    markReadMutation.mutate(notification.id);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-xs text-slate-500">{unreadCount} unread</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-4 cursor-pointer"
                  asChild
                >
                  <Link
                    to={notification.link_url || createPageUrl('Notifications')}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.severity === 'urgent' ? 'bg-red-100' :
                        notification.severity === 'warning' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          notification.severity === 'urgent' ? 'text-red-600' :
                          notification.severity === 'warning' ? 'text-amber-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900">{notification.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notification.body}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('Notifications')} className="w-full text-center py-2 text-blue-600 hover:text-blue-700">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}