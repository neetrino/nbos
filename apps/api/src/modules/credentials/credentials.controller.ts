import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CredentialsService } from './credentials.service';

@ApiTags('Credentials')
@ApiBearerAuth()
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'List credentials filtered by access level and user context' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'accessLevel', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tab', required: false, enum: ['all', 'personal', 'department', 'secret'] })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('accessLevel') accessLevel?: string,
    @Query('search') search?: string,
    @Query('tab') tab?: string,
  ) {
    return this.credentialsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      category,
      accessLevel,
      search,
      tab: (tab as 'all' | 'personal' | 'department' | 'secret') || undefined,
      employeeId: user.id,
      departmentIds: user.departmentIds,
    });
  }

  @Get(':id')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'Get credential by ID with decrypted fields (audit logged)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.findById(id, user.clerkUserId);
  }

  @Post()
  @RequirePermission('CREDENTIALS', 'ADD')
  @ApiOperation({ summary: 'Create credential' })
  async create(
    @Body()
    body: {
      projectId?: string;
      departmentId?: string;
      category: string;
      provider?: string;
      name: string;
      url?: string;
      login?: string;
      password?: string;
      apiKey?: string;
      envData?: string;
      phone?: string;
      notes?: string;
      accessLevel?: string;
      allowedEmployees?: string[];
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.create({ ...body, ownerId: user.id }, user.clerkUserId);
  }

  @Put(':id')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @ApiOperation({ summary: 'Update credential' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      projectId?: string;
      departmentId?: string;
      category?: string;
      provider?: string;
      name?: string;
      url?: string;
      login?: string;
      password?: string;
      apiKey?: string;
      envData?: string;
      phone?: string;
      notes?: string;
      accessLevel?: string;
      allowedEmployees?: string[];
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.update(id, body, user.clerkUserId);
  }

  @Delete(':id')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete credential' })
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.credentialsService.delete(id, user.clerkUserId);
  }
}
