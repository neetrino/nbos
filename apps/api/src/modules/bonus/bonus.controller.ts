import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { BonusReleaseStatusEnum, BonusReleaseTypeEnum } from '@nbos/database';
import { BonusService } from './bonus.service';
import { BonusReleaseService } from './bonus-release.service';
import {
  SalesBonusPolicyService,
  type UpdateSalesBonusPolicyDto,
} from './sales-bonus-policy.service';

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
  @ApiOperation({
    summary: 'List sales bonus policy rows (Seller / Assistant by From + payment model)',
  })
  async listSalesBonusPolicies() {
    return this.salesBonusPolicyService.listAll();
  }

  @Patch('sales-policies/:id')
  @ApiOperation({ summary: 'Update percentages or active flag on a sales bonus policy row' })
  async patchSalesBonusPolicy(@Param('id') id: string, @Body() body: UpdateSalesBonusPolicyDto) {
    return this.salesBonusPolicyService.update(id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bonus entries with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
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
    return this.bonusService.findAll({
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
  @ApiOperation({ summary: 'Get bonus statistics' })
  async getStats() {
    return this.bonusService.getStats();
  }

  @Get('products/pools')
  @ApiOperation({
    summary:
      'Product / extension / order bonus roll-ups from bonus entries (NBOS Product Bonus Pool view; read-only aggregate)',
  })
  async getProductPools() {
    return this.bonusService.getProductPools();
  }

  @Get('products/pools/lines')
  @ApiOperation({
    summary:
      'Per-employee bonus breakdown for a product/extension/order pool (planned, released, paid, suggested release)',
  })
  @ApiQuery({ name: 'poolKey', required: true, description: 'e.g. product:{id}, extension:{id}' })
  async getProductPoolLines(@Query('poolKey') poolKey?: string) {
    const key = poolKey?.trim();
    if (!key) {
      throw new BadRequestException('poolKey query parameter is required');
    }
    return this.bonusService.getProductPoolEmployeeLines(key);
  }

  @Get('products/pools/timeline')
  @ApiOperation({
    summary: 'Funding timeline for a pool — client payments in and bonus releases out',
  })
  @ApiQuery({ name: 'poolKey', required: true })
  async getProductPoolTimeline(@Query('poolKey') poolKey?: string) {
    const key = poolKey?.trim();
    if (!key) {
      throw new BadRequestException('poolKey query parameter is required');
    }
    return this.bonusService.getProductPoolTimeline(key);
  }

  @Get('entries/:entryId/releases')
  @ApiOperation({ summary: 'List bonus releases for a bonus entry (NBOS Bonus Release ledger)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async listBonusReleases(
    @Param('entryId') entryId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.bonusReleaseService.listForEntry(entryId, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post('entries/:entryId/releases')
  @ApiOperation({ summary: 'Create a bonus release row and refresh product bonus pool totals' })
  async createBonusRelease(
    @Param('entryId') entryId: string,
    @Body()
    body: {
      amount: number;
      releaseType: string;
      reason?: string;
      payrollRunId?: string;
      approvedById?: string;
      status?: string;
    },
  ) {
    return this.bonusReleaseService.createForEntry(entryId, {
      amount: body.amount,
      releaseType: body.releaseType as BonusReleaseTypeEnum,
      reason: body.reason,
      payrollRunId: body.payrollRunId,
      approvedById: body.approvedById,
      status: body.status as BonusReleaseStatusEnum | undefined,
    });
  }

  @Patch('entries/:entryId/releases/:releaseId')
  @ApiOperation({
    summary:
      'Adjust an APPROVED/DRAFT release amount (e.g. override proportional AUTO split); refreshes pool',
  })
  async patchBonusRelease(
    @Param('entryId') entryId: string,
    @Param('releaseId') releaseId: string,
    @Body()
    body: {
      amount: number;
      reason: string;
      approvedById?: string;
    },
  ) {
    return this.bonusReleaseService.patchForEntry(entryId, releaseId, {
      amount: body.amount,
      reason: body.reason,
      approvedById: body.approvedById,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bonus entry by ID' })
  async findOne(@Param('id') id: string) {
    return this.bonusService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create bonus entry' })
  async create(
    @Body()
    body: {
      employeeId: string;
      orderId: string;
      projectId: string;
      type: string;
      amount: number;
      percent: number;
      status?: string;
      kpiGatePassed?: boolean;
      payoutMonth?: string;
    },
  ) {
    return this.bonusService.create(body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update bonus entry status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bonusService.updateStatus(id, status);
  }
}
