import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { PayrollRunsService } from './payroll-runs.service';

@ApiTags('Payroll runs')
@ApiBearerAuth()
@Controller('payroll-runs')
export class PayrollRunsController {
  constructor(private readonly payrollRunsService: PayrollRunsService) {}

  @Get()
  @ApiOperation({ summary: 'List payroll runs (paged)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.payrollRunsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payroll run with salary lines',
    description:
      'Includes `journal`: read-only milestones from createdAt / approvedAt / closedAt (no intermediate status history until audit logging).',
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
      approvedById: user.id,
    });
  }
}
