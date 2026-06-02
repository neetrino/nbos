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
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { financeInvoiceAccessFromUser } from './finance-invoice-access';
import { InvoicesService } from './invoices.service';

@ApiTags('Finance / Invoices')
@ApiBearerAuth()
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermission('FINANCE_INVOICES', 'VIEW')
  @ApiOperation({ summary: 'Get all invoices' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('moneyStatus') moneyStatus?: string,
    @Query('type') type?: string,
    @Query('projectId') projectId?: string,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.invoicesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      moneyStatus,
      type,
      projectId,
      subscriptionId,
      search,
      dateFrom,
      dateTo,
      access: financeInvoiceAccessFromUser(user),
    });
  }

  @Get('stats')
  @RequirePermission('FINANCE_INVOICES', 'VIEW')
  @ApiOperation({ summary: 'Get invoice statistics' })
  async getStats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    return this.invoicesService.getStats({
      dateFrom,
      dateTo,
      subscriptionId,
      access: financeInvoiceAccessFromUser(user),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  async create(
    @Body()
    body: {
      orderId?: string;
      subscriptionId?: string;
      projectId?: string;
      companyId?: string;
      clientServiceRecordId?: string;
      amount: number;
      type?: string;
      dueDate?: string;
    },
  ) {
    return this.invoicesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice amount, tax status, and manual context links' })
  async updateGeneral(
    @Param('id') id: string,
    @Body()
    body: {
      amount?: number;
      taxStatus?: string;
      companyId?: string | null;
      projectId?: string | null;
    },
  ) {
    return this.invoicesService.updateGeneral(id, body);
  }

  @Patch(':id/money-status')
  @ApiOperation({ summary: 'Update invoice money status (canonical card layer)' })
  async updateMoneyStatus(@Param('id') id: string, @Body() body: { moneyStatus: string }) {
    return this.invoicesService.updateMoneyStatus(id, body.moneyStatus);
  }

  @Post(':id/official-request/send')
  @ApiOperation({ summary: 'Send official invoice request to accountant (Tax)' })
  async sendOfficialInvoiceRequest(@Param('id') id: string) {
    return this.invoicesService.sendOfficialInvoiceRequest(id);
  }

  @Post(':id/official-request/cancel')
  @ApiOperation({ summary: 'Cancel previous official invoice request' })
  async cancelOfficialInvoiceRequest(@Param('id') id: string) {
    return this.invoicesService.cancelOfficialInvoiceRequest(id);
  }

  @Patch(':id/official-request')
  @ApiOperation({ summary: 'Record government invoice id on invoice card' })
  async updateOfficialInvoiceGovId(
    @Param('id') id: string,
    @Body() body: { govInvoiceId?: string | null },
  ) {
    return this.invoicesService.updateOfficialInvoiceGovId(id, body.govInvoiceId ?? null);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete invoice' })
  async remove(@Param('id') id: string) {
    await this.invoicesService.delete(id);
  }
}
