import { ForbiddenException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { resolveCompensationPayoutPhase } from '../payroll-runs/compensation-payout-phase';
import { querySalaryLineMonthDetail } from '../payroll-runs/salary-line-month-detail';
import type { SalaryLineMonthDetailDto } from '../payroll-runs/salary-line-month-detail.types';
import { Prisma, PrismaClient, type Decimal } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { fetchWalletActivity } from './employee-wallet-activity';
import {
  plannedDecimalForEntry,
  type WalletReleaseRollup,
} from './employee-wallet-bonus-release-rollups';
import { mapBonusStatusToWalletGroup } from './employee-wallet-bonus-group';
import { loadWalletBonusLedgerContext } from './employee-wallet-ledger-context';
import { pickNextOpenPayrollSalaryLine } from './employee-wallet-next-payroll';
import {
  buildEmployeeWalletProjectBreakdown,
  type WalletPoolForBreakdown,
  walletBonusScopeLabel,
} from './employee-wallet-project-breakdown';
import { employeeWalletSalesAccrualHint } from './employee-wallet-sales-hint';
import type {
  EmployeeWalletBonusRow,
  EmployeeWalletNextPayroll,
  EmployeeWalletSalaryRow,
  EmployeeWalletSnapshot,
} from './employee-wallet-snapshot.types';

export type {
  EmployeeWalletActivityItem,
  EmployeeWalletBonusRow,
  EmployeeWalletNextPayroll,
  EmployeeWalletSalaryRow,
  EmployeeWalletSnapshot,
} from './employee-wallet-snapshot.types';

const BONUS_FETCH_LIMIT = 200;
const SALARY_LINE_FETCH_LIMIT = 48;

const walletSalaryInclude = {
  payrollRun: { select: { payrollMonth: true, status: true } },
  expense: {
    select: {
      id: true,
      expensePayments: {
        orderBy: { paymentDate: 'desc' as const },
        take: 24,
        select: { paymentDate: true, amount: true },
      },
    },
  },
} as const;

type WalletSalaryLineDb = Prisma.SalaryLineGetPayload<{ include: typeof walletSalaryInclude }>;

const walletBonusInclude = {
  project: { select: { code: true, name: true } },
  order: { select: { code: true, paymentType: true } },
} as const;

type WalletBonusEntryDb = Prisma.BonusEntryGetPayload<{ include: typeof walletBonusInclude }>;

@Injectable()
export class EmployeeWalletService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /** Read-only month detail for the signed-in employee (same DTO as Finance salary board). */
  async getSalaryLineMonthDetail(
    employeeId: string,
    salaryLineId: string,
  ): Promise<SalaryLineMonthDetailDto> {
    const line = await this.prisma.salaryLine.findUnique({
      where: { id: salaryLineId },
      select: { employeeId: true },
    });
    if (!line) {
      throw new NotFoundException(`Salary line ${salaryLineId} not found`);
    }
    if (line.employeeId !== employeeId) {
      throw new ForbiddenException('Salary line does not belong to the current employee');
    }
    return querySalaryLineMonthDetail(this.prisma, salaryLineId);
  }

  async getWallet(employeeId: string): Promise<EmployeeWalletSnapshot> {
    const employee = await this.loadEmployeeOrThrow(employeeId);
    const [bonusRows, salaryRows] = await this.loadBonusAndSalaryLines(employeeId);
    const [{ releaseRows, rollups, poolByOrder }, activity] = await Promise.all([
      loadWalletBonusLedgerContext(
        this.prisma,
        bonusRows.map((b) => ({ id: b.id, orderId: b.orderId, amount: b.amount })),
      ),
      fetchWalletActivity(this.prisma, employeeId),
    ]);
    const nextLine = pickNextOpenPayrollSalaryLine(salaryRows);
    return {
      employee: this.toEmployeeBlock(employee),
      bonuses: this.mapBonusRows(bonusRows, rollups, poolByOrder),
      nextPayroll: this.mapNextPayroll(nextLine),
      projectBreakdown: buildEmployeeWalletProjectBreakdown(
        bonusRows.map((b) => ({
          id: b.id,
          orderId: b.orderId,
          projectId: b.projectId,
          type: b.type,
          status: b.status,
          amount: b.amount,
          project: b.project,
          order: b.order,
        })),
        rollups,
        releaseRows.map((r) => ({
          bonusEntryId: r.bonusEntryId,
          releaseType: r.releaseType,
          status: r.status,
        })),
        poolByOrder,
      ),
      activity,
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
        include: walletSalaryInclude,
      }),
    ]);
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
    poolByOrder: Map<string, WalletPoolForBreakdown>,
  ): EmployeeWalletBonusRow[] {
    return bonusRows.map((b) =>
      this.mapOneBonusRow(b, rollups.get(b.id), poolByOrder.get(b.orderId)),
    );
  }

  private mapOneBonusRow(
    b: WalletBonusEntryDb,
    r: WalletReleaseRollup | undefined,
    pool: WalletPoolForBreakdown | undefined,
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
      kpiBurnedAmount: r != null && r.kpiBurnedAmount.gt(0) ? r.kpiBurnedAmount.toFixed(2) : null,
      payrollCarryOverAmount:
        r != null && r.payrollCarryOverAmount.gt(0) ? r.payrollCarryOverAmount.toFixed(2) : null,
      orderPaymentType: b.order.paymentType,
      salesAccrualHint: employeeWalletSalesAccrualHint(
        b.type,
        b.salesBonusSlot,
        b.calculationSnapshot,
      ),
      productLabel: walletBonusScopeLabel(pool, b.order.code),
      project: { code: b.project.code, name: b.project.name },
      order: { code: b.order.code },
      createdAt: b.createdAt.toISOString(),
    };
  }

  private mapNextPayroll(line: WalletSalaryLineDb | undefined): EmployeeWalletNextPayroll | null {
    if (!line) {
      return null;
    }
    const payments = line.expense?.expensePayments ?? [];
    const partialPayments = [...payments]
      .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
      .map((p) => ({
        paymentDate: p.paymentDate.toISOString(),
        amount: p.amount.toString(),
      }));
    return {
      salaryLineId: line.id,
      payrollRunId: line.payrollRunId,
      payrollMonth: line.payrollRun.payrollMonth,
      runStatus: line.payrollRun.status,
      baseSalary: line.baseSalary.toString(),
      bonusesTotal: line.bonusesTotal.toString(),
      adjustmentsTotal: line.adjustmentsTotal.toString(),
      deductionsTotal: line.deductionsTotal.toString(),
      totalPayable: line.totalPayable.toString(),
      paidAmount: line.paidAmount.toString(),
      remainingAmount: line.remainingAmount.toString(),
      lineStatus: line.status,
      expenseId: line.expense?.id ?? null,
      partialPayments,
    };
  }

  private mapSalaryRows(salaryRows: WalletSalaryLineDb[]): EmployeeWalletSalaryRow[] {
    return salaryRows.map((s) => ({
      id: s.id,
      payrollRunId: s.payrollRunId,
      payrollMonth: s.payrollRun.payrollMonth,
      payoutPhase: resolveCompensationPayoutPhase({
        payrollMonth: s.payrollRun.payrollMonth,
        runStatus: s.payrollRun.status,
        lineStatus: s.status,
      }),
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
