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

const ORGANIC_SOCIAL_CHANNELS = new Set(['SMM', 'META_ADS']);
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
      where: this.buildAccountWhere(query),
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: 'asc' }, { channel: 'asc' }, { name: 'asc' }],
    });
  }

  async createAccount(data: CreateMarketingAccountDto) {
    this.assertRequired(data.name, 'name');
    return this.prisma.marketingAccount.create({
      data: this.toAccountCreateInput(data),
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async updateAccount(id: string, data: UpdateMarketingAccountDto) {
    await this.ensureAccount(id);
    return this.prisma.marketingAccount.update({
      where: { id },
      data: this.toAccountUpdateInput(data),
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getActivities(query: MarketingActivityQuery) {
    return this.prisma.marketingActivity.findMany({
      where: this.buildActivityWhere(query),
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
      data: this.toActivityCreateInput(data),
      include: { account: { select: { id: true, name: true, channel: true } } },
    });
  }

  async updateActivity(id: string, data: UpdateMarketingActivityDto) {
    await this.ensureActivity(id);
    return this.prisma.marketingActivity.update({
      where: { id },
      data: this.toActivityUpdateInput(data),
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
    const channel = this.normalizeChannel(where);
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
    return [
      ...this.toAccountOptions(accounts),
      ...this.toActivityOptions(activities),
      ...this.organic(channel),
    ];
  }

  async getAttributionReview() {
    const [leads, deals] = await Promise.all([
      this.prisma.lead.findMany({
        where: { OR: this.leadAttributionIssueWhere() },
        include: { marketingAccount: true, marketingActivity: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.deal.findMany({
        where: { OR: this.dealAttributionIssueWhere() },
        include: { marketingAccount: true, marketingActivity: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
    ]);
    return { leads, deals };
  }

  private buildAccountWhere(query: MarketingAccountQuery): Prisma.MarketingAccountWhereInput {
    const where: Prisma.MarketingAccountWhereInput = {};
    if (query.channel) where.channel = this.normalizeChannel(query.channel);
    if (query.status) where.status = query.status as Prisma.MarketingAccountWhereInput['status'];
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    return where;
  }

  private buildActivityWhere(query: MarketingActivityQuery): Prisma.MarketingActivityWhereInput {
    const where: Prisma.MarketingActivityWhereInput = {};
    if (query.channel) where.channel = this.normalizeChannel(query.channel);
    if (query.status) where.status = query.status as Prisma.MarketingActivityWhereInput['status'];
    if (query.accountId) where.accountId = query.accountId;
    if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }];
    return where;
  }

  private toAccountCreateInput(
    data: CreateMarketingAccountDto,
  ): Prisma.MarketingAccountCreateInput {
    return {
      channel: this.normalizeChannel(data.channel),
      name: data.name.trim(),
      identifier: data.identifier,
      phone: data.phone,
      status: (data.status as Prisma.MarketingAccountCreateInput['status']) ?? 'ACTIVE',
      financeExpensePlanId: data.financeExpensePlanId,
      defaultCost: data.defaultCost,
      notes: data.notes,
      ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
    };
  }

  private toAccountUpdateInput(
    data: UpdateMarketingAccountDto,
  ): Prisma.MarketingAccountUpdateInput {
    return {
      ...(data.channel && { channel: this.normalizeChannel(data.channel) }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.identifier !== undefined && { identifier: data.identifier }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.status && { status: data.status as Prisma.MarketingAccountUpdateInput['status'] }),
      ...(data.financeExpensePlanId !== undefined && {
        financeExpensePlanId: data.financeExpensePlanId,
      }),
      ...(data.defaultCost !== undefined && { defaultCost: data.defaultCost }),
      ...(data.ownerId !== undefined && {
        owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
  }

  private toActivityCreateInput(
    data: CreateMarketingActivityDto,
  ): Prisma.MarketingActivityCreateInput {
    return {
      title: data.title.trim(),
      channel: this.normalizeChannel(data.channel),
      type: data.type as Prisma.MarketingActivityCreateInput['type'],
      status: (data.status as Prisma.MarketingActivityCreateInput['status']) ?? 'IDEA',
      description: data.description,
      budget: data.budget,
      currency: data.currency ?? 'AMD',
      startDate: this.parseDate(data.startDate),
      endDate: this.parseDate(data.endDate),
      expectedPayAt: this.parseDate(data.expectedPayAt),
      expenseCardId: data.expenseCardId,
      expensePlanId: data.expensePlanId,
      notes: data.notes,
      ...(data.accountId && { account: { connect: { id: data.accountId } } }),
      ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
    };
  }

  private toActivityUpdateInput(
    data: UpdateMarketingActivityDto,
  ): Prisma.MarketingActivityUpdateInput {
    return {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.channel && { channel: this.normalizeChannel(data.channel) }),
      ...(data.type && { type: data.type as Prisma.MarketingActivityUpdateInput['type'] }),
      ...(data.status && { status: data.status as Prisma.MarketingActivityUpdateInput['status'] }),
      ...(data.accountId !== undefined && {
        account: data.accountId ? { connect: { id: data.accountId } } : { disconnect: true },
      }),
      ...(data.ownerId !== undefined && {
        owner: data.ownerId ? { connect: { id: data.ownerId } } : { disconnect: true },
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.startDate !== undefined && { startDate: this.parseDate(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: this.parseDate(data.endDate) }),
      ...(data.expectedPayAt !== undefined && {
        expectedPayAt: this.parseDate(data.expectedPayAt),
      }),
      ...(data.expenseCardId !== undefined && { expenseCardId: data.expenseCardId }),
      ...(data.expensePlanId !== undefined && { expensePlanId: data.expensePlanId }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
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

  private normalizeChannel(channel: string): Prisma.MarketingAccountCreateInput['channel'] {
    return channel.toUpperCase() as Prisma.MarketingAccountCreateInput['channel'];
  }

  private parseDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    return value ? new Date(value) : null;
  }

  private assertRequired(value: string | undefined, field: string): void {
    if (!value?.trim()) throw new BadRequestException(`${field} is required`);
  }

  private toAccountOptions(
    accounts: Array<{ id: string; name: string; channel: string; phone: string | null }>,
  ): AttributionOption[] {
    return accounts.map((account) => ({
      id: account.id,
      label: account.name,
      type: 'ACCOUNT',
      channel: account.channel,
      subtitle: account.phone ?? undefined,
    }));
  }

  private toActivityOptions(
    activities: Array<{ id: string; title: string; channel: string; status: string }>,
  ): AttributionOption[] {
    return activities.map((activity) => ({
      id: activity.id,
      label: activity.title,
      type: 'ACTIVITY',
      channel: activity.channel,
      subtitle: activity.status,
    }));
  }

  private organic(channel: string): AttributionOption[] {
    if (!ORGANIC_SOCIAL_CHANNELS.has(channel)) return [];
    return [{ id: `organic:${channel}`, label: 'Organic / Not from ad', type: 'ORGANIC', channel }];
  }

  private leadAttributionIssueWhere(): Prisma.LeadWhereInput[] {
    return [
      { source: 'MARKETING' as const, sourceDetail: null },
      {
        source: 'MARKETING' as const,
        sourceDetail: { in: ['LIST_AM', 'GOOGLE_ADS', 'META_ADS'] },
        marketingAccountId: null,
        marketingActivityId: null,
      },
      { source: 'PARTNER' as const, sourcePartnerId: null },
      { source: 'CLIENT' as const, sourceContactId: null },
    ];
  }

  private dealAttributionIssueWhere(): Prisma.DealWhereInput[] {
    return [
      { source: null },
      { source: 'MARKETING' as const, sourceDetail: null },
      {
        source: 'MARKETING' as const,
        sourceDetail: { in: ['LIST_AM', 'GOOGLE_ADS', 'META_ADS'] },
        marketingAccountId: null,
        marketingActivityId: null,
      },
      { source: 'PARTNER' as const, sourcePartnerId: null },
      { source: 'CLIENT' as const, sourceContactId: null },
    ];
  }
}
