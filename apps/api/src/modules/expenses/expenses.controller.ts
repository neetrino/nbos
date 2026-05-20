import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all expenses with filters',
    description:
      'Each item may include linkedPayrollRun (payroll salary line) and linkedExpensePlan (Plan→Card).',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Capped server-side (max 500).' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({
    name: 'expensePlanId',
    required: false,
    description: 'Filter expenses linked to this expense plan (`expenses.expense_plan_id`).',
  })
  @ApiQuery({ name: 'frequency', required: false })
  @ApiQuery({
    name: 'backlogReason',
    required: false,
    description: 'Filter by backlog reason (ExpenseBacklogReasonEnum).',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({
    name: 'activeBoard',
    required: false,
    description:
      'When true and status is omitted: exclude PAID and BACKLOG (NBOS Expense Board list scope).',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('expensePlanId') expensePlanId?: string,
    @Query('backlogReason') backlogReason?: string,
    @Query('frequency') frequency?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('activeBoard') activeBoard?: string,
  ) {
    return this.expensesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      type,
      category,
      status,
      projectId,
      expensePlanId,
      backlogReason,
      frequency,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      activeBoard: activeBoard === 'true',
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get expense statistics' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({
    name: 'expensePlanId',
    required: false,
    description: 'Align stats with list filtered by this expense plan.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Align stats with filtered list (e.g. backlog).',
  })
  @ApiQuery({
    name: 'activeBoard',
    required: false,
    description: 'When true and status is omitted: align stats with active-board list scope.',
  })
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('projectId') projectId?: string,
    @Query('expensePlanId') expensePlanId?: string,
    @Query('status') status?: string,
    @Query('activeBoard') activeBoard?: string,
  ) {
    return this.expensesService.getStats({
      dateFrom,
      dateTo,
      projectId,
      expensePlanId,
      status,
      activeBoard: activeBoard === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get expense by ID',
    description:
      'Ledger JSON may include linkedPayrollRun (payroll) and linkedExpensePlan (expense plan link).',
  })
  async findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a partial or full payment against an expense' })
  async addPayment(
    @Param('id') id: string,
    @Body()
    body: {
      amount: number;
      paymentDate: string;
      notes?: string;
    },
  ) {
    return this.expensesService.addPayment(id, body);
  }

  @Delete(':expenseId/payments/:paymentId')
  @ApiOperation({ summary: 'Remove a recorded payment line from an expense' })
  async removePayment(
    @Param('expenseId') expenseId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.expensesService.deletePayment(expenseId, paymentId);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  async create(
    @Body()
    body: {
      name: string;
      type: string;
      category: string;
      amount: number;
      frequency?: string;
      dueDate?: string;
      status?: string;
      projectId?: string;
      isPassThrough?: boolean;
      taxStatus?: string;
      backlogReason?: string | null;
      notes?: string;
      expensePlanId?: string;
    },
  ) {
    return this.expensesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      type?: string;
      category?: string;
      amount?: number;
      frequency?: string;
      dueDate?: string;
      status?: string;
      projectId?: string;
      isPassThrough?: boolean;
      taxStatus?: string;
      backlogReason?: string | null;
      notes?: string;
    },
  ) {
    return this.expensesService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete expense' })
  async remove(@Param('id') id: string) {
    await this.expensesService.delete(id);
  }
}
