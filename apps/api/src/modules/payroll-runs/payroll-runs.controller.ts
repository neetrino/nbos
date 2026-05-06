import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { PayrollRunsService, type PatchPayrollRunBody } from './payroll-runs.service';

@ApiTags('Payroll runs')
@ApiBearerAuth()
@Controller('payroll-runs')
export class PayrollRunsController {
  constructor(private readonly payrollRunsService: PayrollRunsService) {}

  @Get()
  @ApiOperation({
    summary: 'List payroll runs (paged)',
    description:
      'Each item includes materializedExpenseLineCount: salary lines with expense_id set (materialized cards).',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter runs by NBOS status (DRAFT, REVIEW, APPROVED, PAYING, CLOSED).',
  })
  @ApiQuery({
    name: 'payrollMonthFrom',
    required: false,
    description: 'Inclusive lower bound YYYY-MM (string order matches calendar).',
  })
  @ApiQuery({
    name: 'payrollMonthTo',
    required: false,
    description: 'Inclusive upper bound YYYY-MM.',
  })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('payrollMonthFrom') payrollMonthFrom?: string,
    @Query('payrollMonthTo') payrollMonthTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.payrollRunsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      payrollMonthFrom,
      payrollMonthTo,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Aggregate payroll run totals for list filters',
    description:
      'Uses the same filters as GET /payroll-runs (status, payrollMonthFrom, payrollMonthTo). Totals sum run-level decimals across all matching rows (not paginated). totals.totalRemaining is sum(totalPayable) − sum(totalPaid) for that scope (Decimal). byStatus rows include totalPayable, totalPaid, totalRemaining per status (sorted DRAFT→CLOSED).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter runs by NBOS status (DRAFT, REVIEW, APPROVED, PAYING, CLOSED).',
  })
  @ApiQuery({ name: 'payrollMonthFrom', required: false })
  @ApiQuery({ name: 'payrollMonthTo', required: false })
  async getStats(
    @Query('status') status?: string,
    @Query('payrollMonthFrom') payrollMonthFrom?: string,
    @Query('payrollMonthTo') payrollMonthTo?: string,
  ) {
    return this.payrollRunsService.getStats({
      status,
      payrollMonthFrom,
      payrollMonthTo,
    });
  }

  @Get('salary-board')
  @ApiOperation({
    summary: 'Salary Board grid (employees × payroll months)',
    description:
      'Returns active (non-terminated) employees as rows, calendar months in range as columns, and salary line cells when a payroll run exists for that month. Column headers link to payroll run detail; cells include `salaryLineId` for deep links. Default range: last 12 UTC months ending in the current month (or `payrollMonthTo` when provided). Max span: 36 months.',
  })
  @ApiQuery({
    name: 'payrollMonthFrom',
    required: false,
    description: 'Inclusive YYYY-MM lower bound.',
  })
  @ApiQuery({
    name: 'payrollMonthTo',
    required: false,
    description: 'Inclusive YYYY-MM upper bound.',
  })
  async getSalaryBoard(
    @Query('payrollMonthFrom') payrollMonthFrom?: string,
    @Query('payrollMonthTo') payrollMonthTo?: string,
  ) {
    return this.payrollRunsService.getSalaryBoard({ payrollMonthFrom, payrollMonthTo });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payroll run with salary lines',
    description:
      'Includes materializedExpenseLineCount, `journal` (milestone timestamps), and `auditTrail` (`audit_logs` for this run: create + status changes).',
  })
  async findOne(@Param('id') id: string) {
    return this.payrollRunsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Patch payroll run (sales KPI inputs for seller payout gate)',
    description:
      'Updates `kpiSalesPlanAmount` / `kpiSalesActualAmount` (NBOS § KPI to payout). Only while DRAFT/REVIEW and with no bonus releases attached.',
  })
  async patchPayrollRun(@Param('id') id: string, @Body() body: PatchPayrollRunBody) {
    return this.payrollRunsService.patchPayrollRun(id, body);
  }

  @Post()
  @ApiOperation({ summary: 'Create draft payroll run for a month (optional salary line seed)' })
  async create(
    @Body() body: { payrollMonth: string; seedLines?: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollRunsService.create(body, user.id);
  }

  @Post(':id/bonus-releases/attach')
  @ApiOperation({
    summary: 'Attach approved bonus releases to salary lines (DRAFT/REVIEW run only)',
    description:
      'Each release must be APPROVED; optional `payrollRunId` on the release must match this run when set. Updates `SalaryLine.bonusesTotal` and sets release status to INCLUDED_IN_PAYROLL.',
  })
  async attachBonusReleases(@Param('id') id: string, @Body() body: { releaseIds: string[] }) {
    return this.payrollRunsService.attachBonusReleases(id, body);
  }

  @Post(':id/bonus-releases/detach')
  @ApiOperation({
    summary: 'Detach INCLUDED_IN_PAYROLL bonus releases from salary lines (DRAFT/REVIEW run only)',
    description:
      'Subtracts amounts from `SalaryLine.bonusesTotal`, sets each release back to APPROVED, and clears `payrollRunId`.',
  })
  async detachBonusReleases(@Param('id') id: string, @Body() body: { releaseIds: string[] }) {
    return this.payrollRunsService.detachBonusReleases(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update payroll run status (NBOS workflow)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollRunsService.updateStatus(id, body.status, {
      actorUserId: user.id,
      approvedById: user.id,
    });
  }
}
