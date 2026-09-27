import { Controller, Get, Post, Patch, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { FINANCE_SALARY_MODULE } from '../compensation-profiles/finance-pay-access';
import { PayrollAllocationMatrixService } from './payroll-allocation-matrix.service';
import type {
  CreatePayrollMatrixManualBonusBody,
  PatchPayrollMatrixCellBody,
  PatchPayrollMatrixLayoutBody,
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
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
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
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('payrollMonthFrom') payrollMonthFrom?: string,
    @Query('payrollMonthTo') payrollMonthTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.payrollRunsService.findAll(user, {
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
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
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
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('payrollMonthFrom') payrollMonthFrom?: string,
    @Query('payrollMonthTo') payrollMonthTo?: string,
  ) {
    return this.payrollRunsService.getStats(user, {
      status,
      payrollMonthFrom,
      payrollMonthTo,
    });
  }

  @Get('salary-board')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
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
    @CurrentUser() user: CurrentUserPayload,
    @Query('payrollMonthFrom') payrollMonthFrom?: string,
    @Query('payrollMonthTo') payrollMonthTo?: string,
  ) {
    return this.payrollRunsService.getSalaryBoard(user, { payrollMonthFrom, payrollMonthTo });
  }

  @Put('sales-kpi-plans')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Assign an individual monthly Sales KPI plan',
    description:
      'Stores KpiResult.planAmount for one employee and YYYY-MM. Does not copy the policy template target. Paid salary-linked plans cannot be overwritten.',
  })
  async assignSalesKpiPlan(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { employeeId: string; period: string; planAmount: number },
  ) {
    return this.payrollRunsService.assignEmployeeSalesKpiPlan(user, body);
  }

  @Get('salary-lines/:salaryLineId/month-detail')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Employee month compensation detail (salary line)',
    description:
      'Summary, bonus breakdown, expense payments, and payout phase for one employee/month salary line. Used by Finance Salary Board sheet and Wallet.',
  })
  async getSalaryLineMonthDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('salaryLineId') salaryLineId: string,
  ) {
    return this.payrollRunsService.getSalaryLineMonthDetail(user, salaryLineId);
  }

  @Get(':id/allocation-matrix/validation')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Validate payroll matrix before review/approval' })
  async getAllocationMatrixValidation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.payrollAllocationMatrixService.getValidation(id, user);
  }

  @Get(':id/employee-bonus-history/meta')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Employee bonus history shared context (no matrix)',
    description: 'Employees, month columns, and delivery units — load once per payroll run view.',
  })
  async getEmployeeBonusHistoryMeta(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.getEmployeeBonusHistoryMeta(id, user);
  }

  @Get(':id/employee-bonus-history/slice')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Employee bonus history slice (12-month amounts, no matrix)',
    description:
      'Per-employee project rows and month totals; merge focus cells from allocation matrix on the client.',
  })
  @ApiQuery({ name: 'employeeId', required: true })
  async getEmployeeBonusHistorySlice(
    @Param('id') id: string,
    @Query('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.getEmployeeBonusHistorySlice(id, user, employeeId);
  }

  @Get(':id/allocation-matrix')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
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
    return this.payrollAllocationMatrixService.getMatrix(id, user, viewMode ?? 'EMPLOYEE_MATRIX');
  }

  @Patch(':id/allocation-matrix/layout')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Persist payroll matrix row/column order and pinned units' })
  async patchAllocationMatrixLayout(
    @Param('id') id: string,
    @Body() body: PatchPayrollMatrixLayoutBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.patchLayout(id, user, body);
  }

  @Patch(':id/allocation-matrix/cells')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update bonus release amount for a matrix cell' })
  async patchAllocationMatrixCell(
    @Param('id') id: string,
    @Body() body: PatchPayrollMatrixCellBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.patchCell(id, user, body);
  }

  @Post(':id/allocation-matrix/manual-bonus')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create manual bonus from a gray matrix cell' })
  async createAllocationMatrixManualBonus(
    @Param('id') id: string,
    @Body() body: CreatePayrollMatrixManualBonusBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.createManualBonus(id, user, body);
  }

  @Post(':id/allocation-matrix/layout/reset')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Reset matrix row/column order and pinned units for current view' })
  async resetAllocationMatrixLayout(
    @Param('id') id: string,
    @Body() body: { viewMode: 'EMPLOYEE_MATRIX' | 'ORDER_MATRIX' },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollAllocationMatrixService.resetLayout(id, user, body.viewMode);
  }

  @Get(':id')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Get payroll run with salary lines',
    description:
      'Includes materializedExpenseLineCount, `journal` (milestone timestamps), and `auditTrail` (`audit_logs` for this run: create + status changes).',
  })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.payrollRunsService.findById(user, id);
  }

  @Post()
  @RequirePermission(FINANCE_SALARY_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create draft payroll run for a month (optional salary line seed)' })
  async create(
    @Body() body: { payrollMonth: string; seedLines?: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollRunsService.create(user, body);
  }

  @Patch(':id/status')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update payroll run status (NBOS workflow)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.payrollRunsService.updateStatus(user, id, body.status);
  }
}
