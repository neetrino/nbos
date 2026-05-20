import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import {
  CompensationProfilesService,
  type CreateCompensationProfileBody,
} from './compensation-profiles.service';

@ApiTags('Compensation Profiles')
@ApiBearerAuth()
@Controller()
export class CompensationProfilesController {
  constructor(private readonly service: CompensationProfilesService) {}

  @Get('employees/:employeeId/compensation-profiles')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List compensation profile versions for an employee' })
  listForEmployee(@Param('employeeId') employeeId: string) {
    return this.service.listForEmployee(employeeId);
  }

  @Post('employees/:employeeId/compensation-profiles')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create a draft compensation profile version' })
  createDraft(
    @Param('employeeId') employeeId: string,
    @Body() body: CreateCompensationProfileBody,
  ) {
    return this.service.createDraft(employeeId, body);
  }

  @Post('compensation-profiles/:id/activate')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Activate profile and archive prior active versions' })
  activate(@Param('id') id: string, @Body() body: { approvedById?: string }) {
    return this.service.activate(id, { approvedById: body.approvedById ?? null });
  }

  @Get('compensation-profiles/:id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get compensation profile by id' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
