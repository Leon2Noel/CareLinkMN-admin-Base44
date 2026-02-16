import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, FileCheck, DoorOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function UpcomingTasks({ tasks = [] }) {
  const priorityColor = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-amber-100 text-amber-700',
    normal: 'bg-blue-100 text-blue-700'
  };

  const iconMap = {
    referral: AlertCircle,
    license: FileCheck,
    opening: DoorOpen
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, idx) => {
              const Icon = iconMap[task.type] || Clock;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${
                    task.priority === 'urgent' ? 'bg-red-100' :
                    task.priority === 'high' ? 'bg-amber-100' : 'bg-blue-100'
                  } flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${
                      task.priority === 'urgent' ? 'text-red-600' :
                      task.priority === 'high' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-slate-900">{task.title}</p>
                      <Badge className={priorityColor[task.priority] || priorityColor.normal}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                    {task.due_date && (
                      <p className="text-xs text-slate-500 mt-1">
                        Due {formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
                      </p>
                    )}
                    {task.link && (
                      <Button size="sm" variant="link" className="px-0 h-auto mt-2" asChild>
                        <Link to={task.link}>View Details →</Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}