import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  PrismaClient,
  type BonusReleaseStatusEnum,
  type BonusReleaseTypeEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { notifyBonusReleaseCorrected } from '../employees/employee-wallet-notify.ops';
import { NotificationService } from '../notifications/notification.service';
import { decimalFrom } from './bonus-pool-decimal';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';

const REASON_REQUIRED_TYPES: BonusReleaseTypeEnum[] = [
  'EARLY',
  'EXTRA',
  'OVER_FUNDING',
  'CORRECTION',
];

export interface CreateBonusReleaseInput {
  amount: number;
  releaseType: BonusReleaseTypeEnum;
  reason?: string;
  payrollRunId?: string;
  approvedById?: string;
  status?: BonusReleaseStatusEnum;
}

/** Finance override of an editable release amount (NBOS: adjust auto split before payroll). */
export interface PatchBonusReleaseInput {
  amount: number;
  reason: string;
  approvedById?: string;
}

type BonusEntryForRelease = {
  id: string;
  employeeId: string;
  orderId: string;
  projectId: string;
  amount: Decimal;
  order: { productId: string | null; extensionId: string | null; code: string };
};

@Injectable()
export class BonusReleaseService {
  private readonly logger = new Logger(BonusReleaseService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  async listForEntry(bonusEntryId: string) {
    const entry = await this.prisma.bonusEntry.findUnique({
      where: { id: bonusEntryId },
      select: { id: true },
    });
    if (!entry) {
      throw new NotFoundException(`Bonus entry ${bonusEntryId} not found`);
    }
    return this.prisma.bonusRelease.findMany({
      where: { bonusEntryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createForEntry(bonusEntryId: string, input: CreateBonusReleaseInput) {
    const entry = await this.loadEntryForRelease(bonusEntryId);
    this.validateAmount(input.amount);
    this.validateReasonAndApproval(input);
    await this.assertPayrollRunExists(input.payrollRunId);

    const status = input.status ?? 'APPROVED';
    if (status !== 'DRAFT') {
      await this.assertWithinEntryCap(entry, input.amount, input.releaseType);
    }

    const created = await this.prisma.bonusRelease.create({
      data: {
        bonusEntryId: entry.id,
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        productId: entry.order.productId,
        extensionId: entry.order.extensionId,
        amount: new Decimal(input.amount),
        releaseType: input.releaseType,
        reason: normalizeOptionalText(input.reason),
        payrollRunId: normalizeOptionalText(input.payrollRunId),
        approvedById: normalizeOptionalText(input.approvedById),
        status,
      },
    });

    await syncProductBonusPoolForOrder(this.prisma, entry.orderId, this.notifications);
    this.logger.log({ msg: 'bonus_release_created', id: created.id, bonusEntryId: entry.id });
    return created;
  }

  async patchForEntry(bonusEntryId: string, releaseId: string, input: PatchBonusReleaseInput) {
    const entry = await this.loadEntryForRelease(bonusEntryId);
    const release = await this.prisma.bonusRelease.findUnique({
      where: { id: releaseId },
      select: {
        id: true,
        bonusEntryId: true,
        amount: true,
        status: true,
        releaseType: true,
      },
    });
    if (!release || release.bonusEntryId !== bonusEntryId) {
      throw new NotFoundException(`Bonus release ${releaseId} not found for this entry`);
    }
    if (release.status !== 'DRAFT' && release.status !== 'APPROVED') {
      throw new BadRequestException('Only DRAFT or APPROVED releases can be adjusted');
    }
    this.validateAmount(input.amount);
    const reason = input.reason?.trim() ?? '';
    if (reason.length === 0) {
      throw new BadRequestException('reason is required when adjusting a bonus release');
    }
    const currentAmt = decimalFrom(release.amount);
    const nextAmt = new Decimal(input.amount);
    if (currentAmt.equals(nextAmt)) {
      throw new BadRequestException('amount is unchanged');
    }
    let nextType: BonusReleaseTypeEnum = release.releaseType;
    if (release.releaseType === 'AUTO') {
      nextType = 'CORRECTION';
    }
    if (nextType === 'OVER_FUNDING') {
      const a = input.approvedById?.trim() ?? '';
      if (a.length === 0) {
        throw new BadRequestException(
          'approvedById is required when adjusting an OVER_FUNDING release',
        );
      }
    }
    await this.assertWithinEntryCapOnUpdate(entry, release.id, input.amount, nextType);

    const updated = await this.prisma.bonusRelease.update({
      where: { id: releaseId },
      data: {
        amount: nextAmt,
        releaseType: nextType,
        reason,
        approvedById: normalizeOptionalText(input.approvedById),
      },
    });

    await syncProductBonusPoolForOrder(this.prisma, entry.orderId, this.notifications);
    if (nextType === 'CORRECTION') {
      await notifyBonusReleaseCorrected(this.notifications, {
        employeeId: entry.employeeId,
        releaseId,
        orderCode: entry.order.code,
        amountLabel: nextAmt.toFixed(2),
      });
    }
    this.logger.log({ msg: 'bonus_release_patched', id: releaseId, bonusEntryId: entry.id });
    return updated;
  }

  private async loadEntryForRelease(bonusEntryId: string): Promise<BonusEntryForRelease> {
    const entry = await this.prisma.bonusEntry.findUnique({
      where: { id: bonusEntryId },
      select: {
        id: true,
        employeeId: true,
        orderId: true,
        projectId: true,
        amount: true,
        order: { select: { productId: true, extensionId: true, code: true } },
      },
    });
    if (!entry) {
      throw new NotFoundException(`Bonus entry ${bonusEntryId} not found`);
    }
    return entry;
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }
  }

  private validateReasonAndApproval(input: CreateBonusReleaseInput): void {
    if (REASON_REQUIRED_TYPES.includes(input.releaseType)) {
      const r = input.reason?.trim() ?? '';
      if (r.length === 0) {
        throw new BadRequestException(`reason is required for release type ${input.releaseType}`);
      }
    }
    if (input.releaseType === 'OVER_FUNDING') {
      const a = input.approvedById?.trim() ?? '';
      if (a.length === 0) {
        throw new BadRequestException('approvedById is required for OVER_FUNDING releases');
      }
    }
  }

  private async assertPayrollRunExists(payrollRunId: string | undefined): Promise<void> {
    const id = payrollRunId?.trim();
    if (!id) return;
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!run) {
      throw new BadRequestException(`Payroll run ${id} not found`);
    }
  }

  private async assertWithinEntryCap(
    entry: BonusEntryForRelease,
    addAmount: number,
    releaseType: BonusReleaseTypeEnum,
  ): Promise<void> {
    if (releaseType === 'EXTRA' || releaseType === 'OVER_FUNDING') {
      return;
    }
    const agg = await this.prisma.bonusRelease.aggregate({
      where: {
        bonusEntryId: entry.id,
        status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
      },
      _sum: { amount: true },
    });
    const prior = decimalFrom(agg._sum.amount);
    const cap = new Decimal(entry.amount);
    if (prior.plus(addAmount).gt(cap)) {
      throw new BadRequestException(
        'Release amount exceeds remaining planned amount for this bonus entry',
      );
    }
  }

  private async assertWithinEntryCapOnUpdate(
    entry: BonusEntryForRelease,
    releaseId: string,
    newAmount: number,
    releaseType: BonusReleaseTypeEnum,
  ): Promise<void> {
    if (releaseType === 'EXTRA' || releaseType === 'OVER_FUNDING') {
      return;
    }
    const agg = await this.prisma.bonusRelease.aggregate({
      where: {
        bonusEntryId: entry.id,
        id: { not: releaseId },
        status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
      },
      _sum: { amount: true },
    });
    const priorOthers = decimalFrom(agg._sum.amount);
    const cap = new Decimal(entry.amount);
    if (priorOthers.plus(newAmount).gt(cap)) {
      throw new BadRequestException(
        'Release amount exceeds remaining planned amount for this bonus entry',
      );
    }
  }
}

function normalizeOptionalText(value: string | undefined): string | null {
  const t = value?.trim();
  return t && t.length > 0 ? t : null;
}
