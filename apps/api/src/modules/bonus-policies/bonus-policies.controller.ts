import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { BonusPoliciesService } from './bonus-policies.service';
import type { CreateBonusPolicyBody, UpdateBonusPolicyBody } from './bonus-policies.types';

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

  @Post()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create bonus policy bundle' })
  create(@Body() body: CreateBonusPolicyBody) {
    return this.service.create(body);
  }

  @Patch(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update bonus policy name, status, or notes' })
  update(@Param('id') id: string, @Body() body: UpdateBonusPolicyBody) {
    return this.service.update(id, body);
  }
}
