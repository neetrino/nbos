import { Body, Controller, Delete, Get, Param, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import type { PlatformResourceFamily } from '@nbos/shared';
import { RoleAccessPolicyService } from './role-access-policy.service';
import { EmployeeAccessOverrideService } from './employee-access-override.service';

@ApiTags('Platform Access')
@ApiBearerAuth()
@Controller('platform-access')
export class AccessPoliciesController {
  constructor(
    private readonly rolePolicies: RoleAccessPolicyService,
    private readonly employeeOverrides: EmployeeAccessOverrideService,
  ) {}

  @Get('roles/:roleId/policies')
  @ApiOperation({ summary: 'List role access level policies (with defaults)' })
  listRolePolicies(@Param('roleId') roleId: string) {
    return this.rolePolicies.listByRole(roleId);
  }

  @Put('roles/:roleId/policies')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Upsert role access level policies' })
  upsertRolePolicies(
    @CurrentUser() user: CurrentUserPayload,
    @Param('roleId') roleId: string,
    @Body()
    body: {
      policies: Array<{
        resourceFamily: PlatformResourceFamily;
        defaultLevel: 'VIEW' | 'EDIT';
        scopeMode: 'NONE' | 'ALL' | 'ASSIGNED';
      }>;
    },
  ) {
    return this.rolePolicies.upsertForRole(roleId, body, user.id);
  }

  @Get('employees/:employeeId/overrides')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List personal access level overrides for an employee' })
  listEmployeeOverrides(@Param('employeeId') employeeId: string) {
    return this.employeeOverrides.listByEmployee(employeeId);
  }

  @Put('employees/:employeeId/overrides')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Upsert personal access level override' })
  upsertEmployeeOverride(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
    @Body()
    body: {
      resourceFamily: PlatformResourceFamily;
      level: 'VIEW' | 'EDIT';
      scopeMode?: 'NONE' | 'ALL' | 'ASSIGNED' | null;
      reason?: string | null;
      effectiveFrom?: string | null;
      effectiveTo?: string | null;
    },
  ) {
    return this.employeeOverrides.upsert(employeeId, body, user.id);
  }

  @Delete('employees/:employeeId/overrides/:resourceFamily')
  @RequirePermission('COMPANY', 'EDIT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove personal access level override' })
  async removeEmployeeOverride(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId') employeeId: string,
    @Param('resourceFamily') resourceFamily: PlatformResourceFamily,
  ) {
    await this.employeeOverrides.remove(employeeId, resourceFamily, user.id);
  }
}
