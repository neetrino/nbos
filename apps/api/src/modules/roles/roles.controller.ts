import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'ADD')
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
  @RequirePermission('COMPANY', 'EDIT')
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
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update role permissions' })
  updatePermissions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: { permissions: Array<{ permissionId: string; scope: string }> },
  ) {
    return this.rolesService.updatePermissions(id, body.permissions, user.id);
  }

  @Delete(':id')
  @RequirePermission('COMPANY', 'DELETE')
  @ApiOperation({ summary: 'Delete role' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.rolesService.remove(id, user.id);
  }
}
