import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnitEconomicsListService } from './unit-economics-list.service';
import { UnitEconomicsOrderDetailService } from './unit-economics-order-detail.service';

@ApiTags('Unit economics')
@ApiBearerAuth()
@Controller('unit-economics')
export class UnitEconomicsController {
  constructor(
    private readonly unitEconomicsListService: UnitEconomicsListService,
    private readonly unitEconomicsOrderDetailService: UnitEconomicsOrderDetailService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List delivery unit financial state (received, expenses, bonuses, cash)',
  })
  async list() {
    return this.unitEconomicsListService.list();
  }

  @Get('orders/:orderId')
  @ApiOperation({
    summary: 'Drill-down: invoices and payments for one delivery unit',
  })
  async orderDetail(@Param('orderId') orderId: string) {
    return this.unitEconomicsOrderDetailService.getByOrderId(orderId);
  }
}
