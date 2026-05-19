import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  DashboardControlCenterProjection,
  DashboardMetricProjection,
  DashboardNoteProjection,
  DashboardPersonalLinkProjection,
  DashboardPreferenceProjection,
  DashboardPriorityProjection,
  NavigationShellProjection,
} from './dashboard.types';
import {
  DASHBOARD_PINNED_ACTION_KEYS,
  DASHBOARD_WIDGET_KEYS,
  type DashboardPinnedActionKey,
  type DashboardWidgetKey,
} from './dashboard.constants';
import { DASHBOARD_NOTE_LIMIT, DASHBOARD_NOTE_MAX_LENGTH } from './dashboard-note.constants';
import type { CreateDashboardNoteDto } from './dto/create-dashboard-note.dto';
import type { CreatePersonalLinkDto } from './dto/create-personal-link.dto';
import type { UpdateDashboardNoteDto } from './dto/update-dashboard-note.dto';
import type { UpdateDashboardPreferenceDto } from './dto/update-dashboard-preference.dto';
import type { UpdateNavigationPreferenceDto } from './dto/update-navigation-preference.dto';
import { sanitizeHiddenSidebarModules, sanitizeSidebarModuleOrder } from './sidebar-navigation';

const PERSONAL_LINK_LIMIT = 12;
const PERSONAL_LINK_PLACEMENTS = ['SIDEBAR', 'DASHBOARD_PINNED_ACTIONS'] as const;
const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

@Injectable()
export class DashboardService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getControlCenterProjection(employeeId: string): Promise<DashboardControlCenterProjection> {
    const [metrics, preference, personalLinks, notes] = await Promise.all([
      this.getMetrics(),
      this.getOrCreatePreference(employeeId),
      this.listPersonalLinks(employeeId),
      this.listNotes(employeeId),
    ]);
    return {
      metrics,
      priorities: this.buildPriorities(metrics),
      preference,
      personalLinks,
      notes,
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
        sidebarModuleOrder: sanitizeSidebarModuleOrder(
          data.sidebarModuleOrder ?? current.sidebarModuleOrder,
        ),
        hiddenSidebarModules: sanitizeHiddenSidebarModules(
          data.hiddenSidebarModules ?? current.hiddenSidebarModules,
        ),
      },
    });
    return toPreferenceProjection(saved);
  }

  async getNavigationShell(employeeId: string): Promise<NavigationShellProjection> {
    const [preference, personalLinks] = await Promise.all([
      this.getOrCreatePreference(employeeId),
      this.listPersonalLinks(employeeId),
    ]);
    return {
      sidebarModuleOrder: preference.sidebarModuleOrder,
      hiddenSidebarModules: preference.hiddenSidebarModules,
      personalLinks,
    };
  }

  async updateNavigationPreference(
    employeeId: string,
    data: UpdateNavigationPreferenceDto,
  ): Promise<NavigationShellProjection> {
    const current = await this.getOrCreatePreference(employeeId);
    await this.prisma.dashboardPreference.update({
      where: { employeeId },
      data: {
        sidebarModuleOrder: sanitizeSidebarModuleOrder(
          data.sidebarModuleOrder ?? current.sidebarModuleOrder,
        ),
        hiddenSidebarModules: sanitizeHiddenSidebarModules(
          data.hiddenSidebarModules ?? current.hiddenSidebarModules,
        ),
      },
    });
    return this.getNavigationShell(employeeId);
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

  async listNotes(employeeId: string): Promise<DashboardNoteProjection[]> {
    const notes = await this.prisma.dashboardNote.findMany({
      where: { ownerId: employeeId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: DASHBOARD_NOTE_LIMIT,
    });
    return notes.map(toNoteProjection);
  }

  async createNote(
    employeeId: string,
    data: CreateDashboardNoteDto,
  ): Promise<DashboardNoteProjection> {
    const content = sanitizeDashboardNoteContent(data.content);
    const note = await this.prisma.$transaction(async (tx) => {
      await tx.dashboardNote.updateMany({
        where: { ownerId: employeeId },
        data: { sortOrder: { increment: 1 } },
      });
      return tx.dashboardNote.create({
        data: {
          ownerId: employeeId,
          content,
          sortOrder: 0,
        },
      });
    });
    return toNoteProjection(note);
  }

  async updateNote(
    employeeId: string,
    id: string,
    data: UpdateDashboardNoteDto,
  ): Promise<DashboardNoteProjection> {
    const content = sanitizeDashboardNoteContent(data.content);
    const result = await this.prisma.dashboardNote.updateMany({
      where: { id, ownerId: employeeId },
      data: { content },
    });
    if (result.count === 0) {
      throw new BadRequestException('Dashboard note was not found.');
    }
    const note = await this.prisma.dashboardNote.findFirst({
      where: { id, ownerId: employeeId },
    });
    if (!note) {
      throw new BadRequestException('Dashboard note was not found.');
    }
    return toNoteProjection(note);
  }

  async reorderNotes(employeeId: string, noteIds: string[]): Promise<DashboardNoteProjection[]> {
    const uniqueIds = [...new Set(noteIds)];
    if (uniqueIds.length !== noteIds.length) {
      throw new BadRequestException('Dashboard note order cannot contain duplicates.');
    }
    const existingCount = await this.prisma.dashboardNote.count({
      where: { ownerId: employeeId, id: { in: uniqueIds } },
    });
    if (existingCount !== uniqueIds.length) {
      throw new BadRequestException('Dashboard note order contains an unknown note.');
    }
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        uniqueIds.map((id, sortOrder) =>
          tx.dashboardNote.updateMany({
            where: { id, ownerId: employeeId },
            data: { sortOrder },
          }),
        ),
      );
    });
    return this.listNotes(employeeId);
  }

  async deleteNote(employeeId: string, id: string): Promise<{ deleted: boolean }> {
    const result = await this.prisma.dashboardNote.deleteMany({
      where: { id, ownerId: employeeId },
    });
    return { deleted: result.count > 0 };
  }

  private async getMetrics(): Promise<DashboardMetricProjection> {
    const { start, end } = getTodayRange();
    const [openTasks, dueTodayTasks, openDeals, pendingInvoices, openTickets, criticalTickets] =
      await Promise.all([
        this.prisma.task.count({ where: { status: { notIn: ['COMPLETED', 'ON_HOLD'] } } }),
        this.prisma.task.count({
          where: { dueDate: { gte: start, lt: end }, status: { not: 'COMPLETED' } },
        }),
        this.prisma.deal.count({ where: { status: { notIn: ['WON', 'FAILED'] } } }),
        this.prisma.invoice.count({
          where: { moneyStatus: { in: ['NEW', 'AWAITING_PAYMENT'] } },
        }),
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
    sidebarModuleOrder: [],
    hiddenSidebarModules: [],
    defaultDashboardMode: 'control_center',
  };
}

type PersonalLinkModel = Awaited<
  ReturnType<InstanceType<typeof PrismaClient>['personalLink']['create']>
>;

type DashboardNoteModel = Awaited<
  ReturnType<InstanceType<typeof PrismaClient>['dashboardNote']['create']>
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

function toNoteProjection(model: DashboardNoteModel): DashboardNoteProjection {
  return {
    id: model.id,
    content: model.content,
    sortOrder: model.sortOrder,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

function sanitizeDashboardNoteContent(value: string): string {
  const content = value.trim();
  if (!content) {
    throw new BadRequestException('Dashboard note content cannot be empty.');
  }
  if (content.length > DASHBOARD_NOTE_MAX_LENGTH) {
    throw new BadRequestException(
      `Dashboard note content cannot exceed ${DASHBOARD_NOTE_MAX_LENGTH} characters.`,
    );
  }
  return content;
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

const HIERARCHICAL_URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const BLOCKED_SIMPLE_SCHEME_PATTERN = /^(javascript|data|vbscript|mailto):/i;

function sanitizePersonalLinkUrl(value: string): string {
  let url = value.trim();
  if (!url) {
    throw new BadRequestException('Personal link URL must be an internal path or http(s) URL.');
  }

  if (url.startsWith('//') && !url.startsWith('///')) {
    url = `https:${url}`;
  }

  const isInternalPath = url.startsWith('/') && !url.startsWith('//');
  if (isInternalPath) return url;
  if (isExternalUrl(url)) return url;

  if (HIERARCHICAL_URL_SCHEME_PATTERN.test(url)) {
    throw new BadRequestException(
      'Personal link URL must use http(s) or an internal path starting with /.',
    );
  }
  if (BLOCKED_SIMPLE_SCHEME_PATTERN.test(url)) {
    throw new BadRequestException(
      'Personal link URL must use http(s) or an internal path starting with /.',
    );
  }

  return `https://${url}`;
}

function toPreferenceProjection(model: DashboardPreferenceModel): DashboardPreferenceProjection {
  return {
    pinnedActionOrder: sanitizePinnedActions(model.pinnedActionOrder),
    hiddenPinnedActions: sanitizePinnedActions(model.hiddenPinnedActions),
    visibleWidgets: sanitizeWidgets(model.visibleWidgets),
    hiddenWidgets: sanitizeWidgets(model.hiddenWidgets),
    compactWidgets: sanitizeWidgets(model.compactWidgets),
    sidebarModuleOrder: sanitizeSidebarModuleOrder(model.sidebarModuleOrder),
    hiddenSidebarModules: sanitizeHiddenSidebarModules(model.hiddenSidebarModules),
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
