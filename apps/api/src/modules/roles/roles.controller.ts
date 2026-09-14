import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SETTINGS_RBAC_MODULE } from '@nbos/shared';
import { RolesService } from './roles.service';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Role names populate My Company employee/invitation forms, so the list stays on COMPANY.
  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get all roles' })
  findAll(@Query('includeArchived') includeArchived?: string) {
    return this.rolesService.findAll(includeArchived === 'true');
  }

  @Get(':id')
  @RequirePermission(SETTINGS_RBAC_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermission(SETTINGS_RBAC_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create role' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      level: number;
    },
  ) {
    return this.rolesService.create(body, user.id);
  }

  @Put(':id')
  @RequirePermission(SETTINGS_RBAC_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update role' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      level?: number;
    },
  ) {
    return this.rolesService.update(id, body, user.id);
  }

  @Put(':id/permissions')
  @RequirePermission(SETTINGS_RBAC_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update role permissions' })
  updatePermissions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: { permissions: Array<{ permissionId: string; scope: string }> },
  ) {
    return this.rolesService.updatePermissions(id, body.permissions, user.id);
  }

  @Post(':id/archive')
  @RequirePermission(SETTINGS_RBAC_MODULE, 'DELETE')
  @ApiOperation({ summary: 'Archive role without dropping assignment history' })
  archive(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.rolesService.archive(id, user.id);
  }

  @Post(':id/restore')
  @RequirePermission(SETTINGS_RBAC_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Restore an archived role' })
  restore(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.rolesService.restore(id, user.id);
  }

  @Delete(':id')
  @RequirePermission(SETTINGS_RBAC_MODULE, 'DELETE')
  @ApiOperation({ summary: 'Delete role that has no assignment history' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.rolesService.remove(id, user.id);
  }
}
