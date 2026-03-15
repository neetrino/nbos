import { Controller, Get, Post, Put, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Finance / Subscriptions')
@ApiBearerAuth()
@Controller('finance/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.subscriptionsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      status,
      type,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  async getStats() {
    return this.subscriptionsService.getStats();
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
      amount: number;
      billingDay: number;
      taxStatus?: string;
      startDate: string;
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
      amount?: number;
      billingDay?: number;
      taxStatus?: string;
      startDate?: string;
      endDate?: string;
      partnerId?: string;
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
