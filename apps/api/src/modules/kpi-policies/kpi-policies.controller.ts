import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { KpiPoliciesService } from './kpi-policies.service';
import type { CreateKpiPolicyBody, UpdateKpiPolicyBody } from './kpi-policies.types';

@ApiTags('KPI Policies')
@ApiBearerAuth()
@Controller('kpi-policies')
export class KpiPoliciesController {
  constructor(private readonly service: KpiPoliciesService) {}

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List KPI gate payout policies' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get KPI policy by id' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create KPI gate payout policy' })
  create(@Body() body: CreateKpiPolicyBody) {
    return this.service.create(body);
  }

  @Patch(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update KPI policy bands or metadata' })
  update(@Param('id') id: string, @Body() body: UpdateKpiPolicyBody) {
    return this.service.update(id, body);
  }
}
