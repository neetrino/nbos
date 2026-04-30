import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  DashboardControlCenterProjection,
  DashboardMetricProjection,
  DashboardPreferenceProjection,
  DashboardPriorityProjection,
} from './dashboard.types';
import {
  DASHBOARD_PINNED_ACTION_KEYS,
  DASHBOARD_WIDGET_KEYS,
  type DashboardPinnedActionKey,
  type DashboardWidgetKey,
} from './dashboard.constants';
import type { UpdateDashboardPreferenceDto } from './dto/update-dashboard-preference.dto';

@Injectable()
export class DashboardService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getControlCenterProjection(employeeId: string): Promise<DashboardControlCenterProjection> {
    const [metrics, preference] = await Promise.all([
      this.getMetrics(),
      this.getOrCreatePreference(employeeId),
    ]);
    return {
      metrics,
      priorities: this.buildPriorities(metrics),
      preference,
      meta: {
        source: 'module-projections',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async updatePreference(
    employeeId: string,
    data: UpdateDashboardPreferenceDto,
  ): Promise<DashboardPreferenceProjection> {
    const current = await this.getOrCreatePreference(employeeId);
    const saved = await this.prisma.dashboardPreference.update({
      where: { employeeId },
      data: {
        pinnedActionOrder: sanitizePinnedActions(
          data.pinnedActionOrder ?? current.pinnedActionOrder,
        ),
        hiddenPinnedActions: sanitizePinnedActions(
          data.hiddenPinnedActions ?? current.hiddenPinnedActions,
        ),
        visibleWidgets: sanitizeWidgets(data.visibleWidgets ?? current.visibleWidgets),
        hiddenWidgets: sanitizeWidgets(data.hiddenWidgets ?? current.hiddenWidgets),
        compactWidgets: sanitizeWidgets(data.compactWidgets ?? current.compactWidgets),
      },
    });
    return toPreferenceProjection(saved);
  }

  private async getMetrics(): Promise<DashboardMetricProjection> {
    const { start, end } = getTodayRange();
    const [openTasks, dueTodayTasks, openDeals, pendingInvoices, openTickets, criticalTickets] =
      await Promise.all([
        this.prisma.task.count({ where: { status: { notIn: ['DONE', 'CANCELLED'] } } }),
        this.prisma.task.count({
          where: { dueDate: { gte: start, lt: end }, status: { not: 'DONE' } },
        }),
        this.prisma.deal.count({ where: { status: { notIn: ['WON', 'FAILED'] } } }),
        this.prisma.invoice.count({ where: { status: { in: ['CREATE_INVOICE', 'WAITING'] } } }),
        this.prisma.supportTicket.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
        this.prisma.supportTicket.count({
          where: { priority: 'P1', status: { notIn: ['RESOLVED', 'CLOSED'] } },
        }),
      ]);
    return { dueTodayTasks, openTasks, openDeals, pendingInvoices, openTickets, criticalTickets };
  }

  private buildPriorities(metrics: DashboardMetricProjection): DashboardPriorityProjection[] {
    return [
      this.card(
        metrics.criticalTickets,
        'critical support ticket',
        'Support',
        '/support',
        'critical',
      ),
      this.card(metrics.dueTodayTasks, 'task due today', 'Tasks', '/tasks', 'high'),
      this.card(metrics.pendingInvoices, 'pending invoice', 'Finance', '/finance/invoices', 'high'),
    ].filter((item): item is DashboardPriorityProjection => item !== null);
  }

  private async getOrCreatePreference(employeeId: string): Promise<DashboardPreferenceProjection> {
    const defaults = defaultPreferenceData();
    const saved = await this.prisma.dashboardPreference.upsert({
      where: { employeeId },
      create: { employeeId, ...defaults },
      update: {},
    });
    return toPreferenceProjection(saved);
  }

  private card(
    count: number,
    singular: string,
    source: string,
    href: string,
    severity: DashboardPriorityProjection['severity'],
  ): DashboardPriorityProjection | null {
    if (count === 0) return null;
    const title = `${count} ${singular}${count === 1 ? '' : 's'}`;
    return { title, source, href, severity, context: `${source} has work waiting for action.` };
  }
}

type DashboardPreferenceModel = Awaited<
  ReturnType<InstanceType<typeof PrismaClient>['dashboardPreference']['upsert']>
>;

function defaultPreferenceData(): DashboardPreferenceProjection {
  return {
    pinnedActionOrder: [...DASHBOARD_PINNED_ACTION_KEYS],
    hiddenPinnedActions: [],
    visibleWidgets: [...DASHBOARD_WIDGET_KEYS],
    hiddenWidgets: [],
    compactWidgets: [],
    defaultDashboardMode: 'control_center',
  };
}

function toPreferenceProjection(model: DashboardPreferenceModel): DashboardPreferenceProjection {
  return {
    pinnedActionOrder: sanitizePinnedActions(model.pinnedActionOrder),
    hiddenPinnedActions: sanitizePinnedActions(model.hiddenPinnedActions),
    visibleWidgets: sanitizeWidgets(model.visibleWidgets),
    hiddenWidgets: sanitizeWidgets(model.hiddenWidgets),
    compactWidgets: sanitizeWidgets(model.compactWidgets),
    defaultDashboardMode: model.defaultDashboardMode,
  };
}

function sanitizePinnedActions(values: string[]): DashboardPinnedActionKey[] {
  return sanitizeKeys(values, DASHBOARD_PINNED_ACTION_KEYS);
}

function sanitizeWidgets(values: string[]): DashboardWidgetKey[] {
  return sanitizeKeys(values, DASHBOARD_WIDGET_KEYS);
}

function sanitizeKeys<const T extends readonly string[]>(
  values: string[],
  allowed: T,
): Array<T[number]> {
  const allowedSet = new Set<string>(allowed);
  const uniqueValues = new Set(values);
  return [...uniqueValues].filter((value): value is T[number] => allowedSet.has(value));
}

function getTodayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}
