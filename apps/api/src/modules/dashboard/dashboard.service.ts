import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  DashboardControlCenterProjection,
  DashboardMetricProjection,
  DashboardPersonalLinkProjection,
  DashboardPreferenceProjection,
  DashboardPriorityProjection,
} from './dashboard.types';
import {
  DASHBOARD_PINNED_ACTION_KEYS,
  DASHBOARD_WIDGET_KEYS,
  type DashboardPinnedActionKey,
  type DashboardWidgetKey,
} from './dashboard.constants';
import type { CreatePersonalLinkDto } from './dto/create-personal-link.dto';
import type { UpdateDashboardPreferenceDto } from './dto/update-dashboard-preference.dto';

const PERSONAL_LINK_LIMIT = 12;
const PERSONAL_LINK_PLACEMENTS = ['SIDEBAR', 'DASHBOARD_PINNED_ACTIONS'] as const;
const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

@Injectable()
export class DashboardService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getControlCenterProjection(employeeId: string): Promise<DashboardControlCenterProjection> {
    const [metrics, preference, personalLinks] = await Promise.all([
      this.getMetrics(),
      this.getOrCreatePreference(employeeId),
      this.listPersonalLinks(employeeId),
    ]);
    return {
      metrics,
      priorities: this.buildPriorities(metrics),
      preference,
      personalLinks,
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

  async createPersonalLink(
    employeeId: string,
    data: CreatePersonalLinkDto,
  ): Promise<DashboardPersonalLinkProjection> {
    const existingCount = await this.prisma.personalLink.count({ where: { ownerId: employeeId } });
    if (existingCount >= PERSONAL_LINK_LIMIT) {
      throw new BadRequestException(`Personal links cannot exceed ${PERSONAL_LINK_LIMIT}.`);
    }
    const url = sanitizePersonalLinkUrl(data.url);
    const link = await this.prisma.personalLink.create({
      data: {
        ownerId: employeeId,
        label: data.label.trim(),
        url,
        placement: sanitizePlacements(data.placement),
        openInNewTab: data.openInNewTab ?? isExternalUrl(url),
        sortOrder: existingCount,
      },
    });
    return toPersonalLinkProjection(link);
  }

  async listPersonalLinks(employeeId: string): Promise<DashboardPersonalLinkProjection[]> {
    const links = await this.prisma.personalLink.findMany({
      where: { ownerId: employeeId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: PERSONAL_LINK_LIMIT,
    });
    return links.map(toPersonalLinkProjection);
  }

  async deletePersonalLink(employeeId: string, id: string): Promise<{ deleted: boolean }> {
    const result = await this.prisma.personalLink.deleteMany({
      where: { id, ownerId: employeeId },
    });
    return { deleted: result.count > 0 };
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
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { role: true },
    });
    const defaults = defaultPreferenceData(employee?.role.slug ?? employee?.role.name ?? null);
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

function defaultPreferenceData(role: string | null): DashboardPreferenceProjection {
  return {
    pinnedActionOrder: getDefaultPinnedActions(role),
    hiddenPinnedActions: [],
    visibleWidgets: [...DASHBOARD_WIDGET_KEYS],
    hiddenWidgets: [],
    compactWidgets: [],
    defaultDashboardMode: 'control_center',
  };
}

type PersonalLinkModel = Awaited<
  ReturnType<InstanceType<typeof PrismaClient>['personalLink']['create']>
>;

function toPersonalLinkProjection(model: PersonalLinkModel): DashboardPersonalLinkProjection {
  return {
    id: model.id,
    label: model.label,
    url: model.url,
    placement: model.placement,
    openInNewTab: model.openInNewTab,
    isExternal: isExternalUrl(model.url),
  };
}

function getDefaultPinnedActions(role: string | null): DashboardPinnedActionKey[] {
  const normalized = (role ?? '').toUpperCase();
  if (normalized.includes('FINANCE')) {
    return ['open-invoices', 'open-expenses', 'open-payroll', 'open-calendar'];
  }
  if (normalized.includes('PM') || normalized.includes('PROJECT')) {
    return ['open-products', 'open-my-workspaces', 'open-tasks', 'open-calendar'];
  }
  if (normalized.includes('DEVELOPER')) {
    return ['open-tasks', 'open-my-workspaces', 'open-messenger', 'open-credentials'];
  }
  if (normalized.includes('SUPPORT')) {
    return ['open-support', 'new-task', 'open-messenger', 'open-calendar'];
  }
  if (normalized.includes('SELLER') || normalized.includes('SALES')) {
    return ['new-lead', 'open-deals', 'open-messenger', 'mail-inbox'];
  }
  return ['open-invoices', 'open-products', 'open-support', 'open-calendar'];
}

function sanitizePlacements(values?: string[]): string[] {
  const requested = values?.length ? values : ['SIDEBAR', 'DASHBOARD_PINNED_ACTIONS'];
  const allowed = new Set<string>(PERSONAL_LINK_PLACEMENTS);
  const sanitized = [...new Set(requested)].filter((value) => allowed.has(value));
  return sanitized.length ? sanitized : ['SIDEBAR'];
}

function isExternalUrl(url: string): boolean {
  return EXTERNAL_URL_PATTERN.test(url);
}

function sanitizePersonalLinkUrl(value: string): string {
  const url = value.trim();
  const isInternalPath = url.startsWith('/') && !url.startsWith('//');
  if (isInternalPath || isExternalUrl(url)) return url;
  throw new BadRequestException('Personal link URL must be an internal path or http(s) URL.');
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
