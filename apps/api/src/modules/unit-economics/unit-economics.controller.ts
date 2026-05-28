import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnitEconomicsListService } from './unit-economics-list.service';

@ApiTags('Unit economics')
@ApiBearerAuth()
@Controller('unit-economics')
export class UnitEconomicsController {
  constructor(private readonly unitEconomicsListService: UnitEconomicsListService) {}

  @Get()
  @ApiOperation({
    summary: 'List delivery unit financial state (received, expenses, bonuses, cash)',
  })
  async list() {
    return this.unitEconomicsListService.list();
  }
}
