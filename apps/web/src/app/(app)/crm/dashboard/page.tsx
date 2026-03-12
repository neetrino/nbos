'use client';

import { useState, useEffect } from 'react';
import {
  UserPlus,
  TrendingUp,
  Handshake,
  DollarSign,
  ArrowUpRight,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared';
import { PageHeader } from '@/components/shared';
import { leadsApi, type LeadStats } from '@/lib/api/leads';
import { dealsApi } from '@/lib/api/deals';
import { LEAD_SOURCES, getLeadStage } from '@/features/crm/constants/leadPipeline';
import { getDealStage, formatAmount, DEAL_STAGES } from '@/features/crm/constants/dealPipeline';

interface KpiData {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
}

export default function CrmDashboardPage() {
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [dealStats, setDealStats] = useState<{
    total: number;
    byStatus: Array<{ status: string; _count: number }>;
    totalAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ls, ds] = await Promise.all([leadsApi.getStats(), dealsApi.getStats()]);
        setLeadStats(ls);
        setDealStats(ds);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis: KpiData[] = [
    {
      label: 'Total Leads',
      value: leadStats?.total.toString() ?? '—',
      change: `${leadStats?.byStatus.find((s) => s.status === 'NEW')?._count ?? 0} new`,
      icon: UserPlus,
      iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      label: 'SQL Converted',
      value: leadStats?.byStatus.find((s) => s.status === 'SQL')?._count.toString() ?? '0',
      change: 'Qualified leads',
      icon: TrendingUp,
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      label: 'Active Deals',
      value:
        dealStats?.byStatus
          .filter((s) => s.status !== 'FAILED' && s.status !== 'WON')
          .reduce((sum, s) => sum + s._count, 0)
          .toString() ?? '—',
      change: `${dealStats?.byStatus.find((s) => s.status === 'WON')?._count ?? 0} won`,
      icon: Handshake,
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      label: 'Pipeline Value',
      value: formatAmount(dealStats?.totalAmount ?? null),
      change: `${dealStats?.total ?? 0} total deals`,
      icon: DollarSign,
      iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    },
  ];

  return (
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
      <PageHeader title="Sales Overview" description="Leads, deals, and conversion analytics" />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-xl p-3 ${kpi.iconClass}`}>
                    <kpi.icon size={20} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">{kpi.label}</p>
                    <p className="text-foreground mt-0.5 text-2xl font-bold">{kpi.value}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{kpi.change}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads by Source</CardTitle>
              </CardHeader>
              <CardContent>
                {leadStats?.bySource.length ? (
                  <div className="space-y-3">
                    {leadStats.bySource
                      .sort((a, b) => b._count - a._count)
                      .map((item) => {
                        const source = LEAD_SOURCES.find((s) => s.value === item.source);
                        const pct = Math.round((item._count / (leadStats.total || 1)) * 100);
                        return (
                          <div key={item.source} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {source?.icon} {source?.label ?? item.source}
                              </span>
                              <span className="text-muted-foreground">
                                {item._count} ({pct}%)
                              </span>
                            </div>
                            <div className="bg-secondary h-2 overflow-hidden rounded-full">
                              <div
                                className="bg-accent h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No lead data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deal Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {dealStats?.byStatus.length ? (
                  <div className="space-y-2">
                    {DEAL_STAGES.filter((s) => !('terminal' in s)).map((stage) => {
                      const stat = dealStats.byStatus.find((s) => s.status === stage.key);
                      const count = stat?._count ?? 0;
                      const maxCount = Math.max(...dealStats.byStatus.map((s) => s._count), 1);
                      const pct = Math.round((count / maxCount) * 100);

                      return (
                        <div key={stage.key} className="flex items-center gap-3">
                          <div className="text-foreground w-[140px] truncate text-xs font-medium">
                            {stage.label}
                          </div>
                          <div className="flex-1">
                            <div className="bg-secondary h-6 overflow-hidden rounded">
                              <div
                                className={`h-full rounded ${stage.color} flex items-center px-2 text-[10px] font-bold text-white transition-all`}
                                style={{ width: `${Math.max(pct, 8)}%` }}
                              >
                                {count}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="border-border mt-3 flex gap-4 border-t pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={14} className="text-green-600" />
                        <span className="font-medium text-green-600">
                          Won: {dealStats.byStatus.find((s) => s.status === 'WON')?._count ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowUpRight size={14} className="text-destructive" />
                        <span className="text-destructive font-medium">
                          Failed:{' '}
                          {dealStats.byStatus.find((s) => s.status === 'FAILED')?._count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No deal data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Stages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leadStats?.byStatus
                    .sort((a, b) => b._count - a._count)
                    .map((item) => {
                      const stage = getLeadStage(item.status);
                      return (
                        <div
                          key={item.status}
                          className="bg-secondary/50 flex items-center justify-between rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            {stage && (
                              <StatusBadge
                                label={stage.label}
                                variant={stage.variant}
                                dot
                                dotColor={stage.color}
                              />
                            )}
                          </div>
                          <span className="text-sm font-semibold">{item._count}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy size={16} className="text-accent" />
                  Deal Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <p className="text-muted-foreground text-xs">Total Deals</p>
                      <p className="mt-1 text-2xl font-bold">{dealStats?.total ?? 0}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <p className="text-muted-foreground text-xs">Pipeline Value</p>
                      <p className="text-accent mt-1 text-lg font-bold">
                        {formatAmount(dealStats?.totalAmount ?? null)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                      <p className="text-xs text-green-600">Won</p>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        {dealStats?.byStatus.find((s) => s.status === 'WON')?._count ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                      <p className="text-destructive text-xs">Failed</p>
                      <p className="text-destructive mt-1 text-2xl font-bold">
                        {dealStats?.byStatus.find((s) => s.status === 'FAILED')?._count ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
