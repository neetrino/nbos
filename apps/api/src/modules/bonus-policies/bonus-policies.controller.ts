import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { BonusPoliciesService } from './bonus-policies.service';

@ApiTags('Bonus Policies')
@ApiBearerAuth()
@Controller('bonus-policies')
export class BonusPoliciesController {
  constructor(private readonly service: BonusPoliciesService) {}

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List bonus policy bundles for compensation profiles' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get bonus policy by id' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
