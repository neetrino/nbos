import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { financePaymentAccessFromUser } from '../finance-module-access';
import { PaymentsService } from './payments.service';

@ApiTags('Finance / Payments')
@ApiBearerAuth()
@Controller('finance/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission('FINANCE_PAYMENTS', 'VIEW')
  @ApiOperation({ summary: 'Get all payments' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      invoiceId,
      search,
      dateFrom,
      dateTo,
      access: financePaymentAccessFromUser(user),
    });
  }

  @Get('stats')
  @RequirePermission('FINANCE_PAYMENTS', 'VIEW')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.getStats({
      dateFrom,
      dateTo,
      access: financePaymentAccessFromUser(user),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  async create(
    @Body()
    body: {
      invoiceId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      confirmedBy?: string;
      notes?: string;
    },
  ) {
    return this.paymentsService.create(body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment' })
  async remove(@Param('id') id: string) {
    await this.paymentsService.delete(id);
  }
}
