import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { SchedulerService } from './scheduler.service';

@ApiTags('Scheduler')
@ApiBearerAuth()
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('billing')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger monthly billing (external cron)' })
  async runBilling() {
    return this.schedulerService.runBilling();
  }

  @Post('expenses')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger monthly expenses generation (external cron)' })
  async runExpenses() {
    return this.schedulerService.runExpenses();
  }

  @Post('overdue-invoices')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark overdue invoices (external cron)' })
  async markOverdueInvoices() {
    return this.schedulerService.markOverdueInvoices();
  }
}
