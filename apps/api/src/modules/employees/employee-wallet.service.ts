import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient, type BonusStatusEnum, type Decimal } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  buildWalletReleaseRollups,
  plannedDecimalForEntry,
  type WalletReleaseRollup,
} from './employee-wallet-bonus-release-rollups';
import {
  mapBonusStatusToWalletGroup,
  type WalletBonusPipelineGroup,
} from './employee-wallet-bonus-group';
import { employeeWalletSalesAccrualHint } from './employee-wallet-sales-hint';

const BONUS_FETCH_LIMIT = 200;
const SALARY_LINE_FETCH_LIMIT = 48;

const walletBonusInclude = {
  project: { select: { code: true, name: true } },
  order: { select: { code: true, paymentType: true } },
} as const;

type WalletBonusEntryDb = Prisma.BonusEntryGetPayload<{ include: typeof walletBonusInclude }>;

export interface EmployeeWalletBonusRow {
  id: string;
  type: string;
  status: BonusStatusEnum;
  walletGroup: WalletBonusPipelineGroup;
  /** Planned accrual on the bonus entry (NBOS). */
  amount: string;
  percent: string;
  /** Sum of release amounts in APPROVED / INCLUDED_IN_PAYROLL / PAID. */
  releasedAmount: string;
  /** Sum of release amounts in PAID. */
  paidAmount: string;
  /** Planned minus paid releases, floored at zero. */
  remainingAmount: string;
  /** Payroll month when a release is on a run (latest qualifying). */
  payrollMonth: string | null;
  orderPaymentType: string | null;
  salesAccrualHint: string | null;
  project: { code: string; name: string };
  order: { code: string };
  createdAt: string;
}

export interface EmployeeWalletSalaryRow {
  id: string;
  payrollRunId: string;
  payrollMonth: string;
  runStatus: string;
  baseSalary: string;
  bonusesTotal: string;
  totalPayable: string;
  paidAmount: string;
  remainingAmount: string;
  lineStatus: string;
  expenseId: string | null;
}

export interface EmployeeWalletSnapshot {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    level: string | null;
    baseSalary: string | null;
    roleName: string;
  };
  bonuses: EmployeeWalletBonusRow[];
  salaryHistory: EmployeeWalletSalaryRow[];
}

@Injectable()
export class EmployeeWalletService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getWallet(employeeId: string): Promise<EmployeeWalletSnapshot> {
    const employee = await this.loadEmployeeOrThrow(employeeId);
    const [bonusRows, salaryRows] = await this.loadBonusAndSalaryLines(employeeId);
    const rollups = await this.buildRollupsForBonusEntries(bonusRows);
    return {
      employee: this.toEmployeeBlock(employee),
      bonuses: this.mapBonusRows(bonusRows, rollups),
      salaryHistory: this.mapSalaryRows(salaryRows),
    };
  }

  private async loadEmployeeOrThrow(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        level: true,
        baseSalary: true,
        role: { select: { name: true } },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    return employee;
  }

  private async loadBonusAndSalaryLines(employeeId: string) {
    return Promise.all([
      this.prisma.bonusEntry.findMany({
        where: { employeeId },
        take: BONUS_FETCH_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: walletBonusInclude,
      }),
      this.prisma.salaryLine.findMany({
        where: { employeeId },
        take: SALARY_LINE_FETCH_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: {
          payrollRun: { select: { payrollMonth: true, status: true } },
          expense: { select: { id: true } },
        },
      }),
    ]);
  }

  private async buildRollupsForBonusEntries(bonusRows: WalletBonusEntryDb[]) {
    const plannedByEntryId = new Map(
      bonusRows.map((b) => [b.id, plannedDecimalForEntry(b.amount)] as const),
    );
    const entryIds = bonusRows.map((b) => b.id);
    if (entryIds.length === 0) {
      return buildWalletReleaseRollups(plannedByEntryId, []);
    }
    const releaseRows = await this.prisma.bonusRelease.findMany({
      where: { bonusEntryId: { in: entryIds } },
      select: {
        bonusEntryId: true,
        amount: true,
        status: true,
        updatedAt: true,
        payrollRun: { select: { payrollMonth: true } },
      },
    });
    return buildWalletReleaseRollups(plannedByEntryId, releaseRows);
  }

  private toEmployeeBlock(employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    level: string | null;
    baseSalary: Decimal | null;
    role: { name: string };
  }) {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      level: employee.level,
      baseSalary: employee.baseSalary?.toString() ?? null,
      roleName: employee.role.name,
    };
  }

  private mapBonusRows(
    bonusRows: WalletBonusEntryDb[],
    rollups: Map<string, WalletReleaseRollup>,
  ): EmployeeWalletBonusRow[] {
    return bonusRows.map((b) => this.mapOneBonusRow(b, rollups.get(b.id)));
  }

  private mapOneBonusRow(
    b: WalletBonusEntryDb,
    r: WalletReleaseRollup | undefined,
  ): EmployeeWalletBonusRow {
    return {
      id: b.id,
      type: b.type,
      status: b.status,
      walletGroup: mapBonusStatusToWalletGroup(b.status),
      amount: b.amount.toString(),
      percent: b.percent.toString(),
      releasedAmount: r?.releasedAmount.toFixed(2) ?? '0.00',
      paidAmount: r?.paidAmount.toFixed(2) ?? '0.00',
      remainingAmount: r?.remainingAmount.toFixed(2) ?? plannedDecimalForEntry(b.amount).toFixed(2),
      payrollMonth: r?.payrollMonth ?? null,
      orderPaymentType: b.order.paymentType,
      salesAccrualHint: employeeWalletSalesAccrualHint(
        b.type,
        b.salesBonusSlot,
        b.calculationSnapshot,
      ),
      project: { code: b.project.code, name: b.project.name },
      order: { code: b.order.code },
      createdAt: b.createdAt.toISOString(),
    };
  }

  private mapSalaryRows(
    salaryRows: Prisma.SalaryLineGetPayload<{
      include: {
        payrollRun: { select: { payrollMonth: true; status: true } };
        expense: { select: { id: true } };
      };
    }>[],
  ): EmployeeWalletSalaryRow[] {
    return salaryRows.map((s) => ({
      id: s.id,
      payrollRunId: s.payrollRunId,
      payrollMonth: s.payrollRun.payrollMonth,
      runStatus: s.payrollRun.status,
      baseSalary: s.baseSalary.toString(),
      bonusesTotal: s.bonusesTotal.toString(),
      totalPayable: s.totalPayable.toString(),
      paidAmount: s.paidAmount.toString(),
      remainingAmount: s.remainingAmount.toString(),
      lineStatus: s.status,
      expenseId: s.expense?.id ?? null,
    }));
  }
}
