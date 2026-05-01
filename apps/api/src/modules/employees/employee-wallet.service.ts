import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type BonusStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  mapBonusStatusToWalletGroup,
  type WalletBonusPipelineGroup,
} from './employee-wallet-bonus-group';

const BONUS_FETCH_LIMIT = 200;
const SALARY_LINE_FETCH_LIMIT = 48;

export interface EmployeeWalletBonusRow {
  id: string;
  type: string;
  status: BonusStatusEnum;
  walletGroup: WalletBonusPipelineGroup;
  amount: string;
  percent: string;
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

    const [bonusRows, salaryRows] = await Promise.all([
      this.prisma.bonusEntry.findMany({
        where: { employeeId },
        take: BONUS_FETCH_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { code: true, name: true } },
          order: { select: { code: true } },
        },
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

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        level: employee.level,
        baseSalary: employee.baseSalary?.toString() ?? null,
        roleName: employee.role.name,
      },
      bonuses: bonusRows.map((b) => ({
        id: b.id,
        type: b.type,
        status: b.status,
        walletGroup: mapBonusStatusToWalletGroup(b.status),
        amount: b.amount.toString(),
        percent: b.percent.toString(),
        project: { code: b.project.code, name: b.project.name },
        order: { code: b.order.code },
        createdAt: b.createdAt.toISOString(),
      })),
      salaryHistory: salaryRows.map((s) => ({
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
      })),
    };
  }
}
