import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  actorContextFromUserId,
  FINANCE_CLIENT_SERVICES_MODULE,
  FINANCE_EXPENSE_PLANS_MODULE,
} from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { financeClientServiceAccessFromUser } from '../finance/finance-module-access';
import {
  assertCallerHasPermission,
  hasCallerPermission,
} from '../../common/authorization/caller-permission';
import { ClientServiceFlowsService } from './client-service-flows.service';
import { clientServiceNestedVisibilityFromUser } from './client-service-nested-visibility';
import { ClientServicesService } from './client-services.service';
import { ClientServicesRenewalInvoiceService } from './client-services-renewal-invoice.service';
import { DomainRegistryService } from './registry/domain-registry.service';
import type {
  CreateClientServiceExpenseBody,
  CreateClientServiceExpensePlanBody,
  CreateClientServiceInvoiceBody,
  CreateClientServiceTaskBody,
} from './client-service-flows.types';
import type {
  ClientServiceRecordBody,
  ClientServiceWriteOptions,
  UpdateClientServiceRecordBody,
} from './client-services.types';

const FINANCE_INVOICES_MODULE = 'FINANCE_INVOICES';
const FINANCE_EXPENSES_MODULE = 'FINANCE_EXPENSES';
const TASKS_MODULE = 'TASKS';
const logger = new Logger('ClientServicesController');

/**
 * FINANCE_CLIENT_SERVICES action map: reads → VIEW; POST create → ADD; update/cancel/registry
 * check/cross-entity actions → EDIT; DELETE → DELETE. Cross-entity POSTs also assert the
 * target module (PermissionGuard arrays are OR, so AND is enforced in the handler).
 */
@ApiTags('Client services')
@ApiBearerAuth()
@Controller('client-services')
export class ClientServicesController {
  constructor(
    private readonly clientServicesService: ClientServicesService,
    private readonly clientServiceFlowsService: ClientServiceFlowsService,
    private readonly domainRegistryService: DomainRegistryService,
    private readonly renewalInvoiceService: ClientServicesRenewalInvoiceService,
  ) {}

  @Get()
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'VIEW')
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
    @CurrentUser() user: CurrentUserPayload,
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
      access: financeClientServiceAccessFromUser(user),
    });
  }

  @Get('board')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Load client service kanban board (columns + first page per column)' })
  @ApiQuery({ name: 'view', required: true, enum: ['status', 'months'] })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getBoard(
    @CurrentUser() user: CurrentUserPayload,
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
      access: financeClientServiceAccessFromUser(user),
    });
  }

  @Get('stats')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get client service scope statistics' })
  @ApiQuery({ name: 'year', required: false })
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
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
      access: financeClientServiceAccessFromUser(user),
    });
  }

  @Get(':id')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get client service record by id' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.clientServicesService.findById(id, writeOptions(user));
  }

  @Post(':id/actions/create-invoice')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create an invoice card linked to a client-paid service' })
  async createInvoice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CreateClientServiceInvoiceBody = {},
  ) {
    assertCallerHasPermission(user, FINANCE_INVOICES_MODULE, 'ADD');
    return this.clientServiceFlowsService.createInvoice(id, body, writeOptions(user));
  }

  @Post(':id/actions/create-expense-plan')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create an expense plan linked to this client service' })
  async createExpensePlan(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CreateClientServiceExpensePlanBody = {},
  ) {
    assertCallerHasPermission(user, FINANCE_EXPENSE_PLANS_MODULE, 'ADD');
    return this.clientServiceFlowsService.createExpensePlan(id, body, writeOptions(user));
  }

  @Post(':id/actions/create-expense')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create an expense card linked to this client service' })
  async createExpense(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CreateClientServiceExpenseBody = {},
  ) {
    assertCallerHasPermission(user, FINANCE_EXPENSES_MODULE, 'EDIT');
    return this.clientServiceFlowsService.createExpense(id, body, writeOptions(user));
  }

  @Post(':id/actions/create-task')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create a task linked to this client service' })
  async createTask(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CreateClientServiceTaskBody,
  ) {
    assertCallerHasPermission(user, TASKS_MODULE, 'ADD');
    return this.clientServiceFlowsService.createTask(id, body, writeOptions(user));
  }

  @Post(':id/actions/check-registry')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Look up domain expiry via WHOIS/RDAP and refresh renewal date' })
  async checkRegistry(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.clientServicesService.assertAccessible(id, writeOptions(user));
    const result = await this.domainRegistryService.checkService(
      id,
      actorContextFromUserId(user.id),
      { force: true, allowEarlier: true },
    );
    if (result.outcome !== 'corrected') return result;
    // Gate the invoice side effect, not the endpoint: registry check is a CS EDIT action.
    if (!hasCallerPermission(user.permissions, FINANCE_INVOICES_MODULE, 'ADD')) {
      logger.log(
        `Skipped renewal invoice after registry correction for ${id}: caller lacks FINANCE_INVOICES ADD`,
      );
      return result;
    }
    await this.renewalInvoiceService.runDueRenewalInvoices({ serviceId: id });
    return result;
  }

  @Post()
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create client service record' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() body: ClientServiceRecordBody) {
    return this.clientServicesService.create(body, writeOptions(user));
  }

  @Put(':id')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update client service record' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateClientServiceRecordBody,
  ) {
    return this.clientServicesService.update(id, body, writeOptions(user));
  }

  @Post(':id/cancel')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Cancel client service record (terminal status)' })
  async cancel(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.clientServicesService.cancel(id, writeOptions(user));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'DELETE')
  @ApiOperation({ summary: 'Hard delete blocked — use POST :id/cancel' })
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.clientServicesService.delete(id, writeOptions(user));
  }
}

function writeOptions(user: CurrentUserPayload): ClientServiceWriteOptions {
  return {
    access: financeClientServiceAccessFromUser(user),
    nested: clientServiceNestedVisibilityFromUser(user),
  };
}
