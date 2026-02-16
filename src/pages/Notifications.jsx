import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, MessageSquare, DoorOpen, FileCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function Notifications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const all = await base44.entities.Notification.list('-created_date', 100);
      if (filter === 'unread') return all.filter(n => !n.is_read);
      if (filter === 'all') return all;
      return all.filter(n => n.type === filter);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="referral_status">Referrals</TabsTrigger>
          <TabsTrigger value="opening_match">Openings</TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              Loading notifications...
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No notifications found</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <Card
                key={notification.id}
                className={`transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notification.severity === 'urgent' ? 'bg-red-100' :
                      notification.severity === 'warning' ? 'bg-amber-100' :
                      'bg-blue-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        notification.severity === 'urgent' ? 'text-red-600' :
                        notification.severity === 'warning' ? 'text-amber-600' :
                        'text-blue-600'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{notification.body}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge className="bg-blue-600">New</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {notification.link_url && (
                          <Button
                            size="sm"
                            asChild
                            onClick={() => markReadMutation.mutate(notification.id)}
                          >
                            <Link to={notification.link_url}>
                              View Details
                            </Link>
                          </Button>
                        )}
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markReadMutation.mutate(notification.id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}