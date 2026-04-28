import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma, type PayrollRunStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { isValidPayrollMonth } from './payroll-runs.constants';
import { canTransitionPayrollRun } from './payroll-run-status-transitions';
import { materializePayrollExpensesForApprovedRun } from './payroll-materialize-expenses';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { buildPayrollRunJournal } from './payroll-run-journal';
import {
  PAYROLL_RUN_AUDIT_ACTION_CREATED,
  PAYROLL_RUN_AUDIT_ACTION_STATUS_CHANGED,
  PAYROLL_RUN_AUDIT_ENTITY_TYPE,
} from './payroll-run-audit.constants';
import { loadPayrollRunAuditTrail } from './payroll-run-audit-trail';
import { fetchMaterializedSalaryLineCountByPayrollRunId } from './payroll-run-materialized-line-counts';

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

/** Actor for audit rows on status transitions (`PATCH …/status`). */
export interface PayrollRunStatusMeta {
  actorUserId: string;
  approvedById?: string | null;
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

    const materializedByRun = await fetchMaterializedSalaryLineCountByPayrollRunId(
      this.prisma,
      items.map((row) => row.id),
    );

    return {
      items: items.map((row) => ({
        ...row,
        materializedExpenseLineCount: materializedByRun.get(row.id) ?? 0,
      })),
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
            expense: { select: { id: true, name: true, amount: true, status: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);

    const [materializedByRun, auditTrail] = await Promise.all([
      fetchMaterializedSalaryLineCountByPayrollRunId(this.prisma, [id]),
      loadPayrollRunAuditTrail(this.prisma, PAYROLL_RUN_AUDIT_ENTITY_TYPE, id),
    ]);

    return {
      ...run,
      materializedExpenseLineCount: materializedByRun.get(id) ?? 0,
      journal: buildPayrollRunJournal(run),
      auditTrail,
    };
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

      await recalculatePayrollRunTotalsFromSalaryLines(tx, run.id);

      if (createdById) {
        await tx.auditLog.create({
          data: {
            entityType: PAYROLL_RUN_AUDIT_ENTITY_TYPE,
            entityId: run.id,
            action: PAYROLL_RUN_AUDIT_ACTION_CREATED,
            userId: createdById,
            changes: { payrollMonth: month, status: 'DRAFT' },
          },
        });
      }

      return run.id;
    });

    return this.findById(newId);
  }

  async updateStatus(id: string, nextStatus: string, meta: PayrollRunStatusMeta) {
    const status = parsePayrollRunStatus(nextStatus);
    const run = await this.prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);

    if (!canTransitionPayrollRun(run.status, status)) {
      throw new ConflictException(`Cannot transition payroll run from ${run.status} to ${status}`);
    }

    const data: Prisma.PayrollRunUpdateInput = { status };

    if (status === 'APPROVED') {
      data.approvedAt = new Date();
      if (meta.approvedById) {
        data.approvedBy = { connect: { id: meta.approvedById } };
      }
    }

    if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payrollRun.update({ where: { id }, data });
      let materializedExpenseIds: string[] | undefined;
      if (status === 'APPROVED') {
        const { createdExpenseIds } = await materializePayrollExpensesForApprovedRun(tx, {
          payrollRunId: id,
          payrollMonth: run.payrollMonth,
        });
        if (createdExpenseIds.length > 0) {
          materializedExpenseIds = createdExpenseIds;
        }
      }
      await tx.auditLog.create({
        data: {
          entityType: PAYROLL_RUN_AUDIT_ENTITY_TYPE,
          entityId: id,
          action: PAYROLL_RUN_AUDIT_ACTION_STATUS_CHANGED,
          userId: meta.actorUserId,
          changes:
            materializedExpenseIds && materializedExpenseIds.length > 0
              ? { from: run.status, to: status, materializedExpenseIds }
              : { from: run.status, to: status },
        },
      });
    });

    return this.findById(id);
  }
}
