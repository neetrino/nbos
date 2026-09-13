import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MARKETING_MODULE } from '@nbos/shared';
import { RequirePermission } from '../../common/decorators';
import { MarketingService } from './marketing.service';
import {
  CreateMarketingAccountDto,
  CreateMarketingActivityDto,
  LaunchMarketingActivityDto,
  UpdateMarketingAccountDto,
  UpdateMarketingActivityDto,
  UpdateMarketingCrmWhereOptionDto,
} from './marketing.types';

/**
 * Marketing reads and writes require the `MARKETING` module. The class-level requirement is
 * the floor, so a new handler fails closed instead of inheriting the previously unguarded
 * state. Two dictionary reads are overridden to `CRM_LEADS VIEW` because CRM lead and deal
 * forms depend on them.
 */
@ApiTags('Marketing')
@ApiBearerAuth()
@RequirePermission(MARKETING_MODULE, 'VIEW')
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('crm-where-options')
  @RequirePermission('CRM_LEADS', 'VIEW')
  @ApiOperation({ summary: 'CRM Marketing Where options (active only, or all for settings)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getCrmWhereOptions(@Query('includeInactive') includeInactive?: string) {
    const all = includeInactive === 'true' || includeInactive === '1';
    return this.marketingService.getCrmWhereOptions(all);
  }

  @Patch('crm-where-options/:channel')
  @RequirePermission(MARKETING_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update CRM Marketing Where label, sort order, or active flag' })
  async updateCrmWhereOption(
    @Param('channel') channel: string,
    @Body() body: UpdateMarketingCrmWhereOptionDto,
  ) {
    return this.marketingService.updateCrmWhereOption(channel, body);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get marketing accounts' })
  @ApiQuery({ name: 'channel', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAccounts(
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.marketingService.getAccounts({ channel, status, search });
  }

  @Post('accounts')
  @RequirePermission(MARKETING_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create marketing account' })
  async createAccount(@Body() body: CreateMarketingAccountDto) {
    return this.marketingService.createAccount(body);
  }

  @Patch('accounts/:id')
  @RequirePermission(MARKETING_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update marketing account' })
  async updateAccount(@Param('id') id: string, @Body() body: UpdateMarketingAccountDto) {
    return this.marketingService.updateAccount(id, body);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get marketing activities' })
  @ApiQuery({ name: 'channel', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'accountId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getActivities(
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
    @Query('search') search?: string,
  ) {
    return this.marketingService.getActivities({ channel, status, accountId, search });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get read-only marketing performance dashboard summary' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getDashboardSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.marketingService.getDashboardSummary({ dateFrom, dateTo });
  }

  @Post('activities')
  @RequirePermission(MARKETING_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create marketing activity' })
  async createActivity(@Body() body: CreateMarketingActivityDto) {
    return this.marketingService.createActivity(body);
  }

  @Patch('activities/:id')
  @RequirePermission(MARKETING_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update marketing activity' })
  async updateActivity(@Param('id') id: string, @Body() body: UpdateMarketingActivityDto) {
    return this.marketingService.updateActivity(id, body);
  }

  @Post('activities/:id/launch')
  @RequirePermission(MARKETING_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Launch marketing activity and propose finance expense when needed' })
  async launchActivity(@Param('id') id: string, @Body() body: LaunchMarketingActivityDto) {
    return this.marketingService.launchActivity(id, body);
  }

  @Get('attribution-options')
  @RequirePermission('CRM_LEADS', 'VIEW')
  @ApiOperation({ summary: 'Get dynamic Which one options for CRM attribution' })
  @ApiQuery({ name: 'where', required: true, type: String })
  async getAttributionOptions(@Query('where') where: string) {
    return this.marketingService.getAttributionOptions(where);
  }

  @Get('attribution-review')
  @ApiOperation({ summary: 'Get leads and deals with incomplete attribution' })
  async getAttributionReview() {
    return this.marketingService.getAttributionReview();
  }
}
