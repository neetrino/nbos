import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { BonusReleaseStatusEnum, BonusReleaseTypeEnum } from '@nbos/database';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import {
  FINANCE_BONUSES_MODULE,
  bindAuthenticatedApprover,
} from '../compensation-profiles/finance-pay-access';
import { requirePoolKeyQuery } from './bonus-access';
import { BonusService } from './bonus.service';
import { BonusReleaseService } from './bonus-release.service';
import {
  SalesBonusPolicyService,
  type UpdateSalesBonusPolicyDto,
} from './sales-bonus-policy.service';
import type {
  CreateBonusEntryBody,
  CreateBonusReleaseBody,
  PatchBonusPayableAdjustmentBody,
  PatchBonusPlannedAmountBody,
  PatchBonusReleaseBody,
} from './bonus.http';

@ApiTags('Bonus')
@ApiBearerAuth()
@Controller('bonus')
export class BonusController {
  constructor(
    private readonly bonusService: BonusService,
    private readonly bonusReleaseService: BonusReleaseService,
    private readonly salesBonusPolicyService: SalesBonusPolicyService,
  ) {}

  @Get('sales-policies')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'List sales bonus policy rows (Seller / Assistant by From + payment model)',
  })
  async listSalesBonusPolicies(@CurrentUser() user: CurrentUserPayload) {
    return this.salesBonusPolicyService.listAll(user);
  }

  @Patch('sales-policies/:id')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update percentages or active flag on a sales bonus policy row' })
  async patchSalesBonusPolicy(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateSalesBonusPolicyDto,
  ) {
    return this.salesBonusPolicyService.update(user, id, body);
  }

  @Get()
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get all bonus entries with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('employeeId') employeeId?: string,
    @Query('orderId') orderId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.bonusService.findAll(user, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      employeeId,
      orderId,
      projectId,
      status,
      type,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get bonus statistics' })
  async getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.bonusService.getStats(user);
  }

  @Get('products/pools')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({
    summary:
      'Product / extension / order bonus roll-ups from bonus entries (NBOS Product Bonus Pool view; read-only aggregate)',
  })
  async getProductPools(@CurrentUser() user: CurrentUserPayload) {
    return this.bonusService.getProductPools(user);
  }

  @Get('products/pools/lines')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({
    summary:
      'Per-employee bonus breakdown for a product/extension/order pool (planned, released, paid, suggested release)',
  })
  @ApiQuery({ name: 'poolKey', required: true, description: 'e.g. product:{id}, extension:{id}' })
  async getProductPoolLines(
    @CurrentUser() user: CurrentUserPayload,
    @Query('poolKey') poolKey?: string,
  ) {
    return this.bonusService.getProductPoolEmployeeLines(user, requirePoolKeyQuery(poolKey));
  }

  @Get('products/pools/timeline')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Funding timeline for a pool — client payments in and bonus releases out',
  })
  @ApiQuery({ name: 'poolKey', required: true })
  async getProductPoolTimeline(
    @CurrentUser() user: CurrentUserPayload,
    @Query('poolKey') poolKey?: string,
  ) {
    return this.bonusService.getProductPoolTimeline(user, requirePoolKeyQuery(poolKey));
  }

  @Get('products/pools/lines/batch')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Employee breakdown for multiple pools (comma-separated poolKeys)' })
  @ApiQuery({
    name: 'poolKeys',
    required: true,
    description: 'Comma-separated pool keys, max 30',
  })
  async getProductPoolLinesBatch(
    @CurrentUser() user: CurrentUserPayload,
    @Query('poolKeys') poolKeys?: string,
  ) {
    return this.bonusService.getProductPoolEmployeeLinesBatch(user, poolKeys ?? '');
  }

  @Post('products/pools/auto-release')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({
    summary:
      'Run proportional delivery AUTO releases for all orders in a pool (DONE + funded; NBOS)',
  })
  @ApiQuery({ name: 'poolKey', required: true })
  async postProductPoolAutoRelease(
    @CurrentUser() user: CurrentUserPayload,
    @Query('poolKey') poolKey?: string,
  ) {
    return this.bonusService.triggerProductPoolAutoRelease(user, requirePoolKeyQuery(poolKey));
  }

  @Post('products/pools/sync')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Recompute product bonus pool ledger from live client payments for all pool orders',
  })
  @ApiQuery({ name: 'poolKey', required: true })
  async postProductPoolSync(
    @CurrentUser() user: CurrentUserPayload,
    @Query('poolKey') poolKey?: string,
  ) {
    return this.bonusService.syncProductPoolLedger(user, requirePoolKeyQuery(poolKey));
  }

  @Get('entries/:entryId/releases')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List bonus releases for a bonus entry (NBOS Bonus Release ledger)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async listBonusReleases(
    @CurrentUser() user: CurrentUserPayload,
    @Param('entryId') entryId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.bonusReleaseService.listForEntry(user, entryId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post('entries/:entryId/releases')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create a bonus release row and refresh product bonus pool totals' })
  async createBonusRelease(
    @CurrentUser() user: CurrentUserPayload,
    @Param('entryId') entryId: string,
    @Body() body: CreateBonusReleaseBody,
  ) {
    return this.bonusReleaseService.createForEntry(user, entryId, {
      amount: body.amount,
      releaseType: body.releaseType as BonusReleaseTypeEnum,
      reason: body.reason,
      payrollRunId: body.payrollRunId,
      approvedById: bindAuthenticatedApprover(user.id, body.approvedById),
      status: body.status as BonusReleaseStatusEnum | undefined,
    });
  }

  @Patch('entries/:entryId/releases/:releaseId')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({
    summary:
      'Adjust an APPROVED/DRAFT release amount (e.g. override proportional AUTO split); refreshes pool',
  })
  async patchBonusRelease(
    @CurrentUser() user: CurrentUserPayload,
    @Param('entryId') entryId: string,
    @Param('releaseId') releaseId: string,
    @Body() body: PatchBonusReleaseBody,
  ) {
    return this.bonusReleaseService.patchForEntry(user, entryId, releaseId, {
      amount: body.amount,
      reason: body.reason,
      approvedById: bindAuthenticatedApprover(user.id, body.approvedById),
    });
  }

  @Patch('entries/:entryId/planned-amount')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Edit planned bonus amount on entry (preserves originalAmount; audit trail)',
  })
  async patchEntryPlannedAmount(
    @Param('entryId') entryId: string,
    @Body() body: PatchBonusPlannedAmountBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.bonusService.patchPlannedAmount(user, entryId, body);
  }

  @Patch('entries/:entryId/payable-adjustment')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Set manual payable adjustment (+/− delta on top of KPI auto payable)',
  })
  async patchEntryPayableAdjustment(
    @Param('entryId') entryId: string,
    @Body() body: PatchBonusPayableAdjustmentBody,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.bonusService.patchPayableAdjustment(user, entryId, body);
  }

  @Get(':id')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get bonus entry by ID' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.bonusService.findById(user, id);
  }

  @Post()
  @RequirePermission(FINANCE_BONUSES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create bonus entry' })
  async create(@Body() body: CreateBonusEntryBody, @CurrentUser() user: CurrentUserPayload) {
    return this.bonusService.create(user, body);
  }

  @Patch(':id/status')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update bonus entry status' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.bonusService.updateStatus(user, id, status);
  }
}
