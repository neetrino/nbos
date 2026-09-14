import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { EmployeeEffectiveAccessService } from './employee-effective-access.service';

@ApiTags('Employee Effective Access')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeEffectiveAccessController {
  constructor(private readonly effectiveAccess: EmployeeEffectiveAccessService) {}

  @Get(':employeeId/effective-access')
  @RequirePermission('SETTINGS_RBAC', 'VIEW')
  @ApiOperation({ summary: 'Get sourced permission roles and effective employee access' })
  get(@Param('employeeId', new ParseUUIDPipe()) employeeId: string) {
    return this.effectiveAccess.get(employeeId);
  }
}
