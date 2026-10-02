import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { FINANCE_BONUSES_MODULE } from '../compensation-profiles/finance-pay-access';
import { BonusPoliciesService } from './bonus-policies.service';
import type { CreateBonusPolicyBody, UpdateBonusPolicyBody } from './bonus-policies.types';

@ApiTags('Bonus Policies')
@ApiBearerAuth()
@Controller('bonus-policies')
export class BonusPoliciesController {
  constructor(private readonly service: BonusPoliciesService) {}

  @Get()
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List bonus policy bundles for compensation profiles' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.service.list(user);
  }

  @Get(':id')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get bonus policy by id' })
  findById(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findById(user, id);
  }

  @Post()
  @RequirePermission(FINANCE_BONUSES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create bonus policy bundle' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateBonusPolicyBody) {
    return this.service.create(user, body);
  }

  @Patch(':id')
  @RequirePermission(FINANCE_BONUSES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update bonus policy name, status, or notes' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateBonusPolicyBody,
  ) {
    return this.service.update(user, id, body);
  }
}
