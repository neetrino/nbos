import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  DashboardControlCenterProjection,
  DashboardMetricProjection,
  DashboardPriorityProjection,
} from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getControlCenterProjection(): Promise<DashboardControlCenterProjection> {
    const metrics = await this.getMetrics();
    return {
      metrics,
      priorities: this.buildPriorities(metrics),
      meta: {
        source: 'module-projections',
        generatedAt: new Date().toISOString(),
      },
    };
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

function getTodayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}
