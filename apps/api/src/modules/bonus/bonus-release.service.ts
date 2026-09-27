import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Decimal,
  PrismaClient,
  type BonusReleaseStatusEnum,
  type BonusReleaseTypeEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  FINANCE_SALARY_MODULE,
  assertCompanyWideFinanceAccess,
  bindAuthenticatedApprover,
  type FinancePayActor,
} from '../compensation-profiles/finance-pay-access';
import {
  assertBonusEmployeeAccess,
  resolveBonusReadAccess,
  resolveBonusWriteAccess,
} from './bonus-access';
import { notifyBonusReleaseCorrected } from '../employees/employee-wallet-notify.ops';
import { NotificationService } from '../notifications/notification.service';
import { decimalFrom } from './bonus-pool-decimal';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';
import { BONUS_RELEASE_COUNTING_STATUSES } from './product-bonus-pool.constants';
import { resolveDirectBonusReleaseCreateStatus } from './bonus-release-create-status';
import { assertBonusReleaseWithinEntryCap } from './bonus-release-entry-cap';

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
  type: string;
  amount: Decimal;
  payableAmount: Decimal | null;
  order: { productId: string | null; extensionId: string | null; code: string };
};

@Injectable()
export class BonusReleaseService {
  private readonly logger = new Logger(BonusReleaseService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Paginated release ledger for a bonus entry (newest first).
   * Page/size are clamped to protect the API from abuse.
   */
  async listForEntry(
    actor: FinancePayActor,
    bonusEntryId: string,
    opts?: { page?: number; pageSize?: number },
  ): Promise<{
    items: Awaited<ReturnType<PrismaClient['bonusRelease']['findMany']>>;
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const entry = await this.prisma.bonusEntry.findUnique({
      where: { id: bonusEntryId },
      select: { id: true, employeeId: true },
    });
    if (!entry) {
      throw new NotFoundException(`Bonus entry ${bonusEntryId} not found`);
    }
    const accessible = await resolveBonusReadAccess(this.prisma, actor);
    assertBonusEmployeeAccess(entry.employeeId, accessible);

    const rawPage = opts?.page;
    const rawSize = opts?.pageSize;
    const page =
      typeof rawPage === 'number' && Number.isFinite(rawPage) && rawPage >= 1
        ? Math.min(10_000, Math.floor(rawPage))
        : 1;
    const pageSize =
      typeof rawSize === 'number' && Number.isFinite(rawSize) && rawSize >= 1
        ? Math.min(100, Math.floor(rawSize))
        : 50;

    const where = { bonusEntryId };

    const [items, total] = await Promise.all([
      this.prisma.bonusRelease.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bonusRelease.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async createForEntry(
    actor: FinancePayActor,
    bonusEntryId: string,
    input: CreateBonusReleaseInput,
  ) {
    const entry = await this.loadEntryForRelease(bonusEntryId);
    const accessible = await resolveBonusWriteAccess(this.prisma, actor, 'ADD');
    assertBonusEmployeeAccess(entry.employeeId, accessible);
    input = {
      ...input,
      approvedById: bindAuthenticatedApprover(actor.id, input.approvedById),
    };
    this.validateAmount(input.amount);
    this.validateReasonAndApproval(input);
    this.assertPayrollRunAttachAccess(actor, input.payrollRunId);
    await this.assertPayrollRunExists(input.payrollRunId);

    const status = resolveDirectBonusReleaseCreateStatus(input.status);
    if (entry.type === 'SALES' || status !== 'DRAFT') {
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

  async patchForEntry(
    actor: FinancePayActor,
    bonusEntryId: string,
    releaseId: string,
    input: PatchBonusReleaseInput,
  ) {
    const entry = await this.loadEntryForRelease(bonusEntryId);
    const accessible = await resolveBonusWriteAccess(this.prisma, actor, 'EDIT');
    assertBonusEmployeeAccess(entry.employeeId, accessible);
    input = {
      ...input,
      approvedById: bindAuthenticatedApprover(actor.id, input.approvedById),
    };
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
        type: true,
        amount: true,
        payableAmount: true,
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

  private assertPayrollRunAttachAccess(
    actor: FinancePayActor,
    payrollRunId: string | undefined,
  ): void {
    if (!payrollRunId?.trim()) return;
    assertCompanyWideFinanceAccess(actor, FINANCE_SALARY_MODULE, 'EDIT');
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
    const agg = await this.prisma.bonusRelease.aggregate({
      where: {
        bonusEntryId: entry.id,
        status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
      },
      _sum: { amount: true },
    });
    assertBonusReleaseWithinEntryCap({
      entry,
      priorCounting: decimalFrom(agg._sum.amount),
      addAmount: new Decimal(addAmount),
      releaseType,
    });
  }

  private async assertWithinEntryCapOnUpdate(
    entry: BonusEntryForRelease,
    releaseId: string,
    newAmount: number,
    releaseType: BonusReleaseTypeEnum,
  ): Promise<void> {
    const agg = await this.prisma.bonusRelease.aggregate({
      where: {
        bonusEntryId: entry.id,
        id: { not: releaseId },
        status: { in: [...BONUS_RELEASE_COUNTING_STATUSES] },
      },
      _sum: { amount: true },
    });
    assertBonusReleaseWithinEntryCap({
      entry,
      priorCounting: decimalFrom(agg._sum.amount),
      addAmount: new Decimal(newAmount),
      releaseType,
    });
  }
}

function normalizeOptionalText(value: string | undefined): string | null {
  const t = value?.trim();
  return t && t.length > 0 ? t : null;
}
