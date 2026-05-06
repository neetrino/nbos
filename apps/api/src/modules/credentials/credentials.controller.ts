import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    description: 'List archived credentials only',
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('category') category?: string,
    @Query('accessLevel') accessLevel?: string,
    @Query('search') search?: string,
    @Query('tab') tab?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const archivedFlag =
      includeArchived === '1' || includeArchived === 'true' || includeArchived === 'yes';
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
      includeArchived: archivedFlag,
    });
  }

  @Get(':id')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({
    summary: 'Get credential metadata (secrets omitted; use secrets/reveal or secrets/copy)',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.findById(id, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Post(':id/secrets/reveal')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reveal one encrypted secret field (audited as secret_revealed)' })
  async revealSecret(
    @Param('id') id: string,
    @Body() body: { field: string; stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.revealSecretField(id, body.field, body.stepUpPassword, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Post(':id/secrets/copy')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return one decrypted secret for client clipboard (audited as secret_copied)',
  })
  async copySecret(
    @Param('id') id: string,
    @Body() body: { field: string; stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.copySecretField(id, body.field, body.stepUpPassword, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Post('export')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Export visible credentials metadata + selected decrypted secret fields (step-up required)',
  })
  async exportCredentials(
    @Body() body: { credentialIds?: string[]; fields?: string[]; stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.exportCredentials(
      {
        credentialIds: Array.isArray(body.credentialIds) ? body.credentialIds : undefined,
        fields: Array.isArray(body.fields) ? body.fields : undefined,
        stepUpPassword: body.stepUpPassword,
      },
      {
        employeeId: user.id,
        departmentIds: user.departmentIds ?? [],
      },
    );
  }

  @Post(':id/open-url')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record audited open of stored http(s) URL; returns URL for client navigation',
  })
  async openUrl(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.recordUrlOpened(id, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Post()
  @RequirePermission('CREDENTIALS', 'ADD')
  @ApiOperation({ summary: 'Create credential' })
  async create(
    @Body()
    body: {
      projectId?: string;
      productId?: string;
      domainId?: string;
      clientServiceRecordId?: string;
      departmentId?: string;
      category: string;
      credentialType?: string;
      criticality?: string;
      environment?: string;
      provider?: string;
      name: string;
      url?: string;
      login?: string;
      password?: string;
      apiKey?: string;
      envData?: string;
      phone?: string;
      notes?: string;
      publicNotes?: string;
      secureNotes?: string;
      lastRotatedAt?: string;
      nextRotationAt?: string;
      rotationOwnerId?: string;
      accessLevel?: string;
      allowedEmployees?: string[];
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.create({ ...body, ownerId: user.id }, user.id);
  }

  @Put(':id')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @ApiOperation({ summary: 'Update credential' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      projectId?: string;
      productId?: string;
      domainId?: string;
      clientServiceRecordId?: string;
      departmentId?: string;
      category?: string;
      credentialType?: string;
      criticality?: string;
      environment?: string;
      provider?: string;
      name?: string;
      url?: string;
      login?: string;
      password?: string;
      apiKey?: string;
      envData?: string;
      phone?: string;
      notes?: string;
      publicNotes?: string;
      secureNotes?: string;
      lastRotatedAt?: string | null;
      nextRotationAt?: string | null;
      rotationOwnerId?: string | null;
      accessLevel?: string;
      allowedEmployees?: string[];
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.update(id, body, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Delete(':id/permanent')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete an archived credential (cannot be undone)',
  })
  async permanentRemove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.credentialsService.permanentlyDelete(id, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Delete(':id')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive credential (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.credentialsService.archive(id, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }

  @Post(':id/restore')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore archived credential' })
  async restore(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.credentialsService.restore(id, {
      employeeId: user.id,
      departmentIds: user.departmentIds ?? [],
    });
  }
}
