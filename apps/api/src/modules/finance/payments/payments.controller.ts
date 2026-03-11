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
import { Public } from '../../../common/decorators';
import { PaymentsService } from './payments.service';

@ApiTags('Finance / Payments')
@ApiBearerAuth()
@Controller('finance/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all payments' })
  async findAll(
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
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post()
  @Public()
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
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment' })
  async remove(@Param('id') id: string) {
    await this.paymentsService.delete(id);
  }
}
