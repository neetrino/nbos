import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClientServiceFlowsService } from './client-service-flows.service';
import { ClientServicesService } from './client-services.service';
import type {
  CreateClientServiceExpenseBody,
  CreateClientServiceExpensePlanBody,
  CreateClientServiceInvoiceBody,
  CreateClientServiceTaskBody,
} from './client-service-flows.types';
import type {
  ClientServiceRecordBody,
  UpdateClientServiceRecordBody,
} from './client-services.types';

@ApiTags('Client services')
@ApiBearerAuth()
@Controller('client-services')
export class ClientServicesController {
  constructor(
    private readonly clientServicesService: ClientServicesService,
    private readonly clientServiceFlowsService: ClientServiceFlowsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List client service records (paged)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'billingModel', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'renewalFrom', required: false })
  @ApiQuery({ name: 'renewalTo', required: false })
  @ApiQuery({ name: 'stage', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('billingModel') billingModel?: string,
    @Query('search') search?: string,
    @Query('renewalFrom') renewalFrom?: string,
    @Query('renewalTo') renewalTo?: string,
    @Query('stage') stage?: string,
  ) {
    return this.clientServicesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      productId,
      type,
      status,
      billingModel,
      search,
      renewalFrom,
      renewalTo,
      stage,
    });
  }

  @Get('board')
  @ApiOperation({ summary: 'Load client service kanban board (columns + first page per column)' })
  @ApiQuery({ name: 'view', required: true, enum: ['status', 'months'] })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getBoard(
    @Query('view') view: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('billingModel') billingModel?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
  ) {
    return this.clientServicesService.getBoard({
      view: view as 'status' | 'months',
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      productId,
      type,
      status,
      billingModel,
      search,
      year: year ? parseInt(year, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get client service scope statistics' })
  @ApiQuery({ name: 'year', required: false })
  async getStats(
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('billingModel') billingModel?: string,
    @Query('year') year?: string,
  ) {
    return this.clientServicesService.getStats({
      projectId,
      productId,
      type,
      status,
      billingModel,
      year: year ? parseInt(year, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client service record by id' })
  async findOne(@Param('id') id: string) {
    return this.clientServicesService.findById(id);
  }

  @Post(':id/actions/create-invoice')
  @ApiOperation({ summary: 'Create an invoice card linked to a client-paid service' })
  async createInvoice(@Param('id') id: string, @Body() body: CreateClientServiceInvoiceBody = {}) {
    return this.clientServiceFlowsService.createInvoice(id, body);
  }

  @Post(':id/actions/create-expense-plan')
  @ApiOperation({ summary: 'Create an expense plan linked to this client service' })
  async createExpensePlan(
    @Param('id') id: string,
    @Body() body: CreateClientServiceExpensePlanBody = {},
  ) {
    return this.clientServiceFlowsService.createExpensePlan(id, body);
  }

  @Post(':id/actions/create-expense')
  @ApiOperation({ summary: 'Create an expense card linked to this client service' })
  async createExpense(@Param('id') id: string, @Body() body: CreateClientServiceExpenseBody = {}) {
    return this.clientServiceFlowsService.createExpense(id, body);
  }

  @Post(':id/actions/create-task')
  @ApiOperation({ summary: 'Create a task linked to this client service' })
  async createTask(@Param('id') id: string, @Body() body: CreateClientServiceTaskBody) {
    return this.clientServiceFlowsService.createTask(id, body);
  }

  @Post()
  @ApiOperation({ summary: 'Create client service record' })
  async create(@Body() body: ClientServiceRecordBody) {
    return this.clientServicesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client service record' })
  async update(@Param('id') id: string, @Body() body: UpdateClientServiceRecordBody) {
    return this.clientServicesService.update(id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel client service record (terminal status)' })
  async cancel(@Param('id') id: string) {
    return this.clientServicesService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete blocked — use POST :id/cancel' })
  async remove(@Param('id') id: string) {
    await this.clientServicesService.delete(id);
  }
}
