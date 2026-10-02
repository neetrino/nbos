import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { FINANCE_SALARY_MODULE } from '../compensation-profiles/finance-pay-access';
import { KpiPoliciesService } from './kpi-policies.service';
import type { CreateKpiPolicyBody, UpdateKpiPolicyBody } from './kpi-policies.types';

@ApiTags('KPI Policies')
@ApiBearerAuth()
@Controller('kpi-policies')
export class KpiPoliciesController {
  constructor(private readonly service: KpiPoliciesService) {}

  @Get()
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List KPI gate payout policies' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.service.list(user);
  }

  @Get(':id')
  @RequirePermission(FINANCE_SALARY_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get KPI policy by id' })
  findById(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findById(user, id);
  }

  @Post()
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create KPI gate payout policy' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateKpiPolicyBody) {
    return this.service.create(user, body);
  }

  @Patch(':id')
  @RequirePermission(FINANCE_SALARY_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update KPI policy bands or metadata' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateKpiPolicyBody,
  ) {
    return this.service.update(user, id, body);
  }
}
