import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import {
  CreateMarketingAccountDto,
  CreateMarketingActivityDto,
  UpdateMarketingAccountDto,
  UpdateMarketingActivityDto,
} from './marketing.types';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

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
  @ApiOperation({ summary: 'Create marketing account' })
  async createAccount(@Body() body: CreateMarketingAccountDto) {
    return this.marketingService.createAccount(body);
  }

  @Patch('accounts/:id')
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

  @Post('activities')
  @ApiOperation({ summary: 'Create marketing activity' })
  async createActivity(@Body() body: CreateMarketingActivityDto) {
    return this.marketingService.createActivity(body);
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: 'Update marketing activity' })
  async updateActivity(@Param('id') id: string, @Body() body: UpdateMarketingActivityDto) {
    return this.marketingService.updateActivity(id, body);
  }

  @Get('attribution-options')
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
