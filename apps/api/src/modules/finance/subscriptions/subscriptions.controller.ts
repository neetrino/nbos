import { Controller, Get, Post, Put, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { financeSubscriptionAccessFromUser } from '../finance-module-access';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Finance / Subscriptions')
@ApiBearerAuth()
@Controller('finance/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @RequirePermission('FINANCE_SUBSCRIPTIONS', 'VIEW')
  @ApiOperation({ summary: 'Get all subscriptions' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.subscriptionsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      partnerId,
      status,
      type,
      search,
      dateFrom,
      dateTo,
      access: financeSubscriptionAccessFromUser(user),
    });
  }

  @Get('stats')
  @RequirePermission('FINANCE_SUBSCRIPTIONS', 'VIEW')
  @ApiOperation({ summary: 'Get subscription statistics' })
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('partnerId') partnerId?: string,
  ) {
    return this.subscriptionsService.getStats({
      dateFrom,
      dateTo,
      partnerId,
      access: financeSubscriptionAccessFromUser(user),
    });
  }

  @Get('grid')
  @RequirePermission('FINANCE_SUBSCRIPTIONS', 'VIEW')
  @ApiOperation({
    summary: 'Subscription coverage grid for a calendar year (Invoice Card coverage + money state)',
  })
  async getGrid(
    @CurrentUser() user: CurrentUserPayload,
    @Query('year') year?: string,
    @Query('projectId') projectId?: string,
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const safeYear = Number.isFinite(y) ? y : new Date().getFullYear();
    return this.subscriptionsService.getGrid({
      year: safeYear,
      projectId,
      partnerId,
      status,
      type,
      search,
      access: financeSubscriptionAccessFromUser(user),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription' })
  async create(
    @Body()
    body: {
      projectId: string;
      type: string;
      baseMonthlyAmount?: number;
      amount?: number;
      billingDay: number;
      billingFrequency?: string;
      taxStatus?: string;
      billingStartDate?: string;
      startDate?: string;
      notificationsEnabled?: boolean;
      endDate?: string;
      partnerId?: string;
    },
  ) {
    return this.subscriptionsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      type?: string;
      baseMonthlyAmount?: number;
      amount?: number;
      billingDay?: number;
      billingFrequency?: string;
      taxStatus?: string;
      billingStartDate?: string;
      startDate?: string;
      notificationsEnabled?: boolean;
      endDate?: string;
      partnerId?: string | null;
    },
  ) {
    return this.subscriptionsService.update(id, body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update subscription status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.subscriptionsService.updateStatus(id, body.status);
  }
}
