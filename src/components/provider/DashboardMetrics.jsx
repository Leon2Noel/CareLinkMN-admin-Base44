import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle, Clock, DoorOpen, MessageSquare } from 'lucide-react';

export default function DashboardMetrics({ metrics }) {
  const cards = [
    {
      title: 'Active Openings',
      value: metrics.activeOpenings || 0,
      icon: DoorOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: metrics.openingsTrend
    },
    {
      title: 'Pending Referrals',
      value: metrics.pendingReferrals || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      trend: null
    },
    {
      title: 'Acceptance Rate',
      value: `${metrics.acceptanceRate || 0}%`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: metrics.acceptanceRateTrend
    },
    {
      title: 'Messages This Month',
      value: `${metrics.messagesUsed || 0}/${metrics.messagesLimit || 0}`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtext: metrics.messagesLimit > 0 ? 'Premium' : 'Basic Plan'
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                {card.subtext && (
                  <p className="text-xs text-slate-500 mt-1">{card.subtext}</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            {card.trend !== undefined && card.trend !== null && (
              <div className="mt-3 flex items-center text-xs">
                {card.trend >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                    <span className="text-emerald-600">+{card.trend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                    <span className="text-red-600">{card.trend}%</span>
                  </>
                )}
                <span className="text-slate-500 ml-1">vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}