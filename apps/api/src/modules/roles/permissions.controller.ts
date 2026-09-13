import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SETTINGS_RBAC_MODULE } from '@nbos/shared';
import { RequirePermission } from '../../common/decorators';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission(SETTINGS_RBAC_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List all permissions for matrix UI' })
  findAll() {
    return this.rolesService.findAllPermissions();
  }
}
