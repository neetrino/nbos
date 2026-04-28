import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  Decimal,
  PrismaClient,
  type Prisma,
  type PayrollRunStatusEnum,
  type TransactionClient,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isValidPayrollMonth } from './payroll-runs.constants';
import { canTransitionPayrollRun } from './payroll-run-status-transitions';

const LIST_SORT_FIELDS = new Set(['createdAt', 'payrollMonth', 'status']);
const PAYROLL_RUN_STATUSES: PayrollRunStatusEnum[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
  'CLOSED',
];

function normalizeListPage(page?: number): number {
  const n = page ?? 1;
  return n < 1 ? 1 : n;
}

function normalizeListPageSize(pageSize?: number): number {
  const n = pageSize ?? 20;
  return Math.min(500, Math.max(1, n));
}

function parsePayrollRunStatus(value: string): PayrollRunStatusEnum {
  if (!PAYROLL_RUN_STATUSES.includes(value as PayrollRunStatusEnum)) {
    throw new BadRequestException(`Invalid payroll run status: ${value}`);
  }
  return value as PayrollRunStatusEnum;
}

function sumDecimal(value: Decimal | null | undefined): Decimal {
  return value ?? new Decimal(0);
}

export interface PayrollRunListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePayrollRunBody {
  payrollMonth: string;
  /** When true (default), create salary lines from active employees using `Employee.baseSalary`. */
  seedLines?: boolean;
}

@Injectable()
export class PayrollRunsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: PayrollRunListParams) {
    const page = normalizeListPage(params.page);
    const pageSize = normalizeListPageSize(params.pageSize);
    const sortBy =
      params.sortBy && LIST_SORT_FIELDS.has(params.sortBy) ? params.sortBy : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.PayrollRunWhereInput = {};
    if (params.status) {
      where.status = parsePayrollRunStatus(params.status);
    }

    const [items, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { salaryLines: true } },
        },
      }),
      this.prisma.payrollRun.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        salaryLines: {
          orderBy: { createdAt: 'asc' },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);
    return run;
  }

  async create(body: CreatePayrollRunBody, createdById?: string | null) {
    const month = body.payrollMonth.trim();
    if (!isValidPayrollMonth(month)) {
      throw new BadRequestException('payrollMonth must be YYYY-MM');
    }

    const existing = await this.prisma.payrollRun.findUnique({ where: { payrollMonth: month } });
    if (existing) {
      throw new ConflictException(`Payroll run already exists for ${month}`);
    }

    const seedLines = body.seedLines !== false;

    const newId = await this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          payrollMonth: month,
          createdById: createdById ?? undefined,
        },
      });

      if (seedLines) {
        const employees = await tx.employee.findMany({
          where: { status: { not: 'TERMINATED' } },
          select: { id: true, baseSalary: true },
        });

        for (const emp of employees) {
          const base = emp.baseSalary ?? new Decimal(0);
          const zero = new Decimal(0);
          const totalPayable = base;
          await tx.salaryLine.create({
            data: {
              payrollRunId: run.id,
              employeeId: emp.id,
              baseSalary: base,
              bonusesTotal: zero,
              adjustmentsTotal: zero,
              deductionsTotal: zero,
              totalPayable,
              paidAmount: zero,
              remainingAmount: totalPayable,
            },
          });
        }
      }

      await this.recalculateRunTotals(tx, run.id);
      return run.id;
    });

    return this.findById(newId);
  }

  async updateStatus(id: string, nextStatus: string, meta?: { approvedById?: string | null }) {
    const status = parsePayrollRunStatus(nextStatus);
    const run = await this.prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);

    if (!canTransitionPayrollRun(run.status, status)) {
      throw new ConflictException(`Cannot transition payroll run from ${run.status} to ${status}`);
    }

    const data: Prisma.PayrollRunUpdateInput = { status };

    if (status === 'APPROVED') {
      data.approvedAt = new Date();
      if (meta?.approvedById) {
        data.approvedBy = { connect: { id: meta.approvedById } };
      }
    }

    if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    await this.prisma.payrollRun.update({ where: { id }, data });
    return this.findById(id);
  }

  private async recalculateRunTotals(tx: TransactionClient, payrollRunId: string) {
    const sums = await tx.salaryLine.aggregate({
      where: { payrollRunId },
      _sum: {
        baseSalary: true,
        bonusesTotal: true,
        adjustmentsTotal: true,
        deductionsTotal: true,
        totalPayable: true,
        paidAmount: true,
      },
    });

    await tx.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        totalBaseSalary: sumDecimal(sums._sum.baseSalary),
        totalBonuses: sumDecimal(sums._sum.bonusesTotal),
        totalAdjustments: sumDecimal(sums._sum.adjustmentsTotal),
        totalDeductions: sumDecimal(sums._sum.deductionsTotal),
        totalPayable: sumDecimal(sums._sum.totalPayable),
        totalPaid: sumDecimal(sums._sum.paidAmount),
      },
    });
  }
}
