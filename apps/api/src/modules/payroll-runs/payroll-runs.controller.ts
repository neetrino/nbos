import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { PayrollAllocationMatrixService } from './payroll-allocation-matrix.service';
import type {
  CreatePayrollMatrixManualBonusBody,
  PatchPayrollMatrixCellBody,
  PatchPayrollMatrixLayoutBody,
  PatchPayrollMatrixPlannedBonusBody,
  PatchPayrollMatrixReassignBody,
} from './payroll-allocation-matrix.types';
import { PayrollRunsService } from './payroll-runs.service';

@ApiTags('Payroll runs')
@ApiBearerAuth()
@Controller('payroll-runs')
export class PayrollRunsController {
  constructor(
    private readonly payrollRunsService: PayrollRunsService,
    private readonly payrollAllocationMatrixService: PayrollAllocationMatrixService,
  ) {}

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

  @Get('salary-lines/:salaryLineId/month-detail')
  @ApiOperation({
    summary: 'Employee month compensation detail (salary line)',
    description:
      'Summary, bonus breakdown, expense payments, and payout phase for one employee/month salary line. Used by Finance Salary Board sheet and Wallet.',
  })
  async getSalaryLineMonthDetail(@Param('salaryLineId') salaryLineId: string) {
    return this.payrollRunsService.getSalaryLineMonthDetail(salaryLineId);
  }

  @Get(':id/allocation-matrix/validation')
  @ApiOperation({ summary: 'Validate payroll matrix before review/approval' })
  async getAllocationMatrixValidation(@Param('id') id: string) {
    return this.payrollAllocationMatrixService.getValidation(id);
  }

  @Get(':id/allocation-matrix')
  @ApiOperation({
    summary: 'Payroll allocation matrix (employees × delivery payable units)',
    description:
      'Employee-centered or order-centered matrix data with cells, layout preference, and delivery unit funding totals.',
  })
  @ApiQuery({
    name: 'viewMode',
    required: false,
    enum: ['EMPLOYEE_MATRIX', 'ORDER_MATRIX'],
  })
  async getAllocationMatrix(
    @Param('id') id: string,
    @Query('viewMode') viewMode: 'EMPLOYEE_MATRIX' | 'ORDER_MATRIX' | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.getMatrix(
      id,
      user.id,
      viewMode ?? 'EMPLOYEE_MATRIX',
    );
  }

  @Patch(':id/allocation-matrix/layout')
  @ApiOperation({ summary: 'Persist payroll matrix row/column order and pinned units' })
  async patchAllocationMatrixLayout(
    @Param('id') id: string,
    @Body() body: PatchPayrollMatrixLayoutBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.patchLayout(id, user.id, body);
  }

  @Patch(':id/allocation-matrix/cells')
  @ApiOperation({ summary: 'Update bonus release amount for a matrix cell' })
  async patchAllocationMatrixCell(
    @Param('id') id: string,
    @Body() body: PatchPayrollMatrixCellBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.patchCell(id, user.id, body);
  }

  @Post(':id/allocation-matrix/manual-bonus')
  @ApiOperation({ summary: 'Create manual bonus from a gray matrix cell' })
  async createAllocationMatrixManualBonus(
    @Param('id') id: string,
    @Body() body: CreatePayrollMatrixManualBonusBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.createManualBonus(id, user.id, body);
  }

  @Patch(':id/allocation-matrix/planned-bonus')
  @ApiOperation({ summary: 'Edit planned bonus amount/title for a matrix cell' })
  async patchAllocationMatrixPlannedBonus(
    @Param('id') id: string,
    @Body() body: PatchPayrollMatrixPlannedBonusBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.patchPlannedBonus(id, user.id, body);
  }

  @Patch(':id/allocation-matrix/reassign-recipient')
  @ApiOperation({ summary: 'Reassign bonus recipient before payment (matrix context)' })
  async patchAllocationMatrixReassignRecipient(
    @Param('id') id: string,
    @Body() body: PatchPayrollMatrixReassignBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.reassignRecipient(id, user.id, body);
  }

  @Post(':id/allocation-matrix/layout/reset')
  @ApiOperation({ summary: 'Reset matrix row/column order and pinned units for current view' })
  async resetAllocationMatrixLayout(
    @Param('id') id: string,
    @Body() body: { viewMode: 'EMPLOYEE_MATRIX' | 'ORDER_MATRIX' },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.resetLayout(id, user.id, body.viewMode);
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

  @Post()
  @ApiOperation({ summary: 'Create draft payroll run for a month (optional salary line seed)' })
  async create(
    @Body() body: { payrollMonth: string; seedLines?: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollRunsService.create(body, user.id);
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
