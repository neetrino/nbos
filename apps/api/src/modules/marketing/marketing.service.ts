import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { ExpensesService } from '../expenses/expenses.service';
import {
  AttributionOption,
  CreateMarketingAccountDto,
  CreateMarketingActivityDto,
  LaunchMarketingActivityDto,
  MarketingAccountQuery,
  MarketingActivityQuery,
  UpdateMarketingAccountDto,
  UpdateMarketingActivityDto,
} from './marketing.types';
import { getMarketingDashboardSummary } from './marketing-dashboard-summary';
import {
  buildAccountWhere,
  buildActivityWhere,
  dealAttributionIssueWhere,
  leadAttributionIssueWhere,
  normalizeChannel,
  organic,
  toAccountCreateInput,
  toAccountOptions,
  toAccountUpdateInput,
  toActivityCreateInput,
  toActivityOptions,
  toActivityUpdateInput,
} from './marketing-service-helpers';

const ACCOUNT_REQUIRED_CHANNELS = new Set(['LIST_AM']);
const PAID_ACTIVITY_TYPES = new Set(['AD_CAMPAIGN', 'LIST_AM_PROMOTION', 'OFFLINE_ACTIVITY']);

interface LaunchBlocker {
  field: string;
  message: string;
}

@Injectable()
export class MarketingService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly expensesService: ExpensesService,
  ) {}

  async getAccounts(query: MarketingAccountQuery) {
    return this.prisma.marketingAccount.findMany({
      where: buildAccountWhere(query),
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: 'asc' }, { channel: 'asc' }, { name: 'asc' }],
    });
  }

  async createAccount(data: CreateMarketingAccountDto) {
    this.assertRequired(data.name, 'name');
    return this.prisma.marketingAccount.create({
      data: toAccountCreateInput(data),
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async updateAccount(id: string, data: UpdateMarketingAccountDto) {
    await this.ensureAccount(id);
    return this.prisma.marketingAccount.update({
      where: { id },
      data: toAccountUpdateInput(data),
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getActivities(query: MarketingActivityQuery) {
    return this.prisma.marketingActivity.findMany({
      where: buildActivityWhere(query),
      include: {
        account: { select: { id: true, name: true, channel: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async createActivity(data: CreateMarketingActivityDto) {
    this.assertRequired(data.title, 'title');
    return this.prisma.marketingActivity.create({
      data: toActivityCreateInput(data),
      include: { account: { select: { id: true, name: true, channel: true } } },
    });
  }

  async updateActivity(id: string, data: UpdateMarketingActivityDto) {
    await this.ensureActivity(id);
    return this.prisma.marketingActivity.update({
      where: { id },
      data: toActivityUpdateInput(data),
      include: { account: { select: { id: true, name: true, channel: true } } },
    });
  }

  async launchActivity(id: string, data: LaunchMarketingActivityDto) {
    const activity = await this.getActivityForLaunch(id);
    const merged = this.mergeLaunchData(activity, data);
    this.assertLaunchable(merged);

    const expenseCardId =
      this.needsExpense(merged) && !activity.expenseCardId
        ? (await this.createExpenseProposal(merged)).id
        : activity.expenseCardId;

    return this.prisma.marketingActivity.update({
      where: { id },
      data: {
        status: 'LAUNCHED',
        startDate: new Date(merged.startDate),
        endDate: merged.endDate ? new Date(merged.endDate) : null,
        budget: merged.budget,
        expectedPayAt: merged.expectedPayAt ? new Date(merged.expectedPayAt) : null,
        expenseCardId,
        notes: this.mergeNoExpenseReason(activity.notes, merged.noExpenseReason),
        ...(merged.accountId !== activity.accountId && {
          account: merged.accountId ? { connect: { id: merged.accountId } } : { disconnect: true },
        }),
      },
      include: { account: { select: { id: true, name: true, channel: true } } },
    });
  }

  async getAttributionOptions(where: string): Promise<AttributionOption[]> {
    const channel = normalizeChannel(where);
    const [accounts, activities] = await Promise.all([
      this.prisma.marketingAccount.findMany({
        where: { channel, status: 'ACTIVE' as Prisma.MarketingAccountWhereInput['status'] },
        orderBy: { name: 'asc' },
      }),
      this.prisma.marketingActivity.findMany({
        where: { channel, status: 'LAUNCHED' as Prisma.MarketingActivityWhereInput['status'] },
        orderBy: { title: 'asc' },
      }),
    ]);
    return [...toAccountOptions(accounts), ...toActivityOptions(activities), ...organic(channel)];
  }

  async getAttributionReview() {
    const [leads, deals] = await Promise.all([
      this.prisma.lead.findMany({
        where: { OR: leadAttributionIssueWhere() },
        include: { marketingAccount: true, marketingActivity: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.deal.findMany({
        where: { OR: dealAttributionIssueWhere() },
        include: { marketingAccount: true, marketingActivity: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
    ]);
    return { leads, deals };
  }

  async getDashboardSummary() {
    return getMarketingDashboardSummary(this.prisma);
  }

  private async ensureAccount(id: string): Promise<void> {
    if (!(await this.prisma.marketingAccount.findUnique({ where: { id } }))) {
      throw new NotFoundException(`Marketing account ${id} not found`);
    }
  }

  private async ensureActivity(id: string): Promise<void> {
    if (!(await this.prisma.marketingActivity.findUnique({ where: { id } }))) {
      throw new NotFoundException(`Marketing activity ${id} not found`);
    }
  }

  private async getActivityForLaunch(id: string) {
    const activity = await this.prisma.marketingActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException(`Marketing activity ${id} not found`);
    return activity;
  }

  private mergeLaunchData(
    activity: Awaited<ReturnType<MarketingService['getActivityForLaunch']>>,
    data: LaunchMarketingActivityDto,
  ) {
    return {
      id: activity.id,
      title: activity.title,
      channel: activity.channel,
      type: activity.type,
      currency: activity.currency,
      startDate: data.startDate ?? activity.startDate?.toISOString(),
      endDate: data.endDate ?? activity.endDate?.toISOString() ?? null,
      budget: data.budget ?? this.toNumber(activity.budget),
      expectedPayAt: data.expectedPayAt ?? activity.expectedPayAt?.toISOString() ?? null,
      accountId: data.accountId ?? activity.accountId,
      noExpenseReason: data.noExpenseReason,
    };
  }

  private assertLaunchable(activity: ReturnType<MarketingService['mergeLaunchData']>): void {
    const blockers: LaunchBlocker[] = [];
    if (!activity.title.trim()) blockers.push(this.blocker('title', 'Title is required.'));
    if (!activity.channel) blockers.push(this.blocker('channel', 'Channel is required.'));
    if (!activity.startDate) blockers.push(this.blocker('startDate', 'Start date is required.'));
    if (ACCOUNT_REQUIRED_CHANNELS.has(activity.channel) && !activity.accountId) {
      blockers.push(this.blocker('accountId', 'Account is required for this channel.'));
    }
    this.assertSpendGate(activity, blockers);
    if (blockers.length > 0) {
      throw new BadRequestException({
        message: 'Marketing activity cannot be launched.',
        errors: blockers,
      });
    }
  }

  private assertSpendGate(
    activity: ReturnType<MarketingService['mergeLaunchData']>,
    blockers: LaunchBlocker[],
  ): void {
    if (!this.isPaidActivity(activity)) return;
    if (!activity.budget || activity.budget <= 0) {
      blockers.push(this.blocker('budget', 'Budget is required for paid activity.'));
    }
    if (!activity.expectedPayAt && !activity.noExpenseReason?.trim()) {
      blockers.push(
        this.blocker('expectedPayAt', 'Expected payment date or no-expense reason is required.'),
      );
    }
  }

  private async createExpenseProposal(activity: ReturnType<MarketingService['mergeLaunchData']>) {
    return this.expensesService.create({
      name: `Marketing: ${activity.title}`,
      type: 'PLANNED',
      category: 'MARKETING',
      amount: activity.budget ?? 0,
      frequency: 'ONE_TIME',
      dueDate: activity.expectedPayAt ?? activity.startDate,
      status: 'THIS_MONTH',
      notes: `Proposed from Marketing Activity ${activity.id}. Finance owns payment status.`,
    });
  }

  private needsExpense(activity: ReturnType<MarketingService['mergeLaunchData']>): boolean {
    return this.isPaidActivity(activity) && Boolean(activity.expectedPayAt);
  }

  private isPaidActivity(activity: { type: string; budget: number | null }): boolean {
    return (
      PAID_ACTIVITY_TYPES.has(activity.type) || Boolean(activity.budget && activity.budget > 0)
    );
  }

  private toNumber(value: { toNumber(): number } | number | null): number | null {
    if (value === null) return null;
    return typeof value === 'number' ? value : value.toNumber();
  }

  private blocker(field: string, message: string): LaunchBlocker {
    return { field, message };
  }

  private mergeNoExpenseReason(notes: string | null, reason?: string | null): string | null {
    if (!reason?.trim()) return notes;
    const line = `No expense reason: ${reason.trim()}`;
    return notes ? `${notes}\n${line}` : line;
  }

  private assertRequired(value: string | undefined, field: string): void {
    if (!value?.trim()) throw new BadRequestException(`${field} is required`);
  }
}
