import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('Finance / Orders')
@ApiBearerAuth()
@Controller('finance/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.ordersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      projectId,
      search,
      dateFrom,
      dateTo,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  async getStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.ordersService.getStats({ dateFrom, dateTo });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order' })
  async create(
    @Body()
    body: {
      projectId: string;
      dealId?: string;
      productId?: string;
      extensionId?: string;
      type: string;
      paymentType: string;
      totalAmount: number;
      currency?: string;
      taxStatus?: string;
      partnerId?: string;
      partnerPercent?: number;
    },
  ) {
    return this.ordersService.create(body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order' })
  async remove(@Param('id') id: string) {
    await this.ordersService.delete(id);
  }
}
