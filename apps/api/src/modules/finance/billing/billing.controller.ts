import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('run-monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger monthly billing (subscription invoices)' })
  async runMonthlyBilling() {
    return this.billingService.runMonthlyBilling();
  }

  @Post('run-expenses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger monthly planned expenses generation' })
  async runMonthlyExpenses() {
    return this.billingService.runMonthlyExpenses();
  }
}
