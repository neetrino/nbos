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
import { credentialsAccessFromUser } from './credentials-access';
import { CredentialsService } from './credentials.service';
import { normalizeCredentialTab } from './credential-tab';

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
  @ApiQuery({ name: 'credentialType', required: false })
  @ApiQuery({ name: 'accessLevel', required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'needsRotation', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'tab',
    required: false,
    enum: ['all', 'my', 'personal', 'team', 'department', 'project', 'secret'],
  })
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
    @Query('credentialType') credentialType?: string,
    @Query('accessLevel') accessLevel?: string,
    @Query('ownerId') ownerId?: string,
    @Query('needsRotation') needsRotation?: string,
    @Query('search') search?: string,
    @Query('tab') tab?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const archivedFlag =
      includeArchived === '1' || includeArchived === 'true' || includeArchived === 'yes';
    const rotationFlag =
      needsRotation === '1' || needsRotation === 'true' || needsRotation === 'yes';
    const access = credentialsAccessFromUser(user);
    return this.credentialsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      projectId,
      category,
      credentialType,
      accessLevel,
      ownerId,
      needsRotation: rotationFlag,
      search,
      tab: normalizeCredentialTab(tab),
      employeeId: access.employeeId,
      departmentIds: access.departmentIds,
      viewScope: access.viewScope,
      includeArchived: archivedFlag,
    });
  }

  @Get('recent')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({
    summary: 'Recently used credentials for current user (from audit activity)',
  })
  @ApiQuery({ name: 'tab', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findRecent(
    @Query('tab') tab: string | undefined,
    @Query('search') search: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.findRecent(credentialsAccessFromUser(user), { tab, search });
  }

  @Post('export/file')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export visible credentials as encrypted file (step-up required)',
  })
  async exportCredentialsFile(
    @Body() body: { credentialIds?: string[]; fields?: string[]; stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.exportCredentialsFile(
      {
        credentialIds: Array.isArray(body.credentialIds) ? body.credentialIds : undefined,
        fields: Array.isArray(body.fields) ? body.fields : undefined,
        stepUpPassword: body.stepUpPassword,
      },
      credentialsAccessFromUser(user),
    );
  }

  @Get(':id/manual-access')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'List manual access grants for a credential' })
  async listManualAccess(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.listManualAccess(id, credentialsAccessFromUser(user));
  }

  @Put(':id/manual-access')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @ApiOperation({ summary: 'Replace manual access grants for a credential' })
  async replaceManualAccess(
    @Param('id') id: string,
    @Body()
    body: { grants: { employeeId: string; level: 'VIEW' | 'EDIT'; expiresAt?: string | null }[] },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const grants = Array.isArray(body.grants) ? body.grants : [];
    return this.credentialsService.replaceManualAccess(id, grants, credentialsAccessFromUser(user));
  }

  @Post(':id/emergency-access')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Grant temporary VIEW access via break-glass (executive roles, step-up required)',
  })
  async grantEmergencyAccess(
    @Param('id') id: string,
    @Body() body: { reason?: string; stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.grantEmergencyAccess(
      id,
      { reason: body.reason ?? '', stepUpPassword: body.stepUpPassword },
      credentialsAccessFromUser(user),
    );
  }

  @Get(':id/secret-versions')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'List archived secret versions for a credential' })
  async listSecretVersions(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.listSecretVersions(id, credentialsAccessFromUser(user));
  }

  @Post(':id/secret-versions/:versionId/reveal')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reveal a historical secret version (executive or vault-wide access + step-up)',
  })
  async revealSecretVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() body: { stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.revealSecretVersion(
      id,
      versionId,
      body.stepUpPassword,
      credentialsAccessFromUser(user),
    );
  }

  @Get(':id/audit-log')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'Audit trail for a credential (sheet)' })
  @ApiQuery({ name: 'page', required: false })
  async listAuditLog(
    @Param('id') id: string,
    @Query('page') page: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.listSheetAudit(
      id,
      credentialsAccessFromUser(user),
      page ? parseInt(page, 10) : undefined,
    );
  }

  @Get(':id')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({
    summary: 'Get credential metadata (secrets omitted; use secrets/reveal or secrets/copy)',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.findById(id, credentialsAccessFromUser(user));
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
    return this.credentialsService.revealSecretField(
      id,
      body.field,
      body.stepUpPassword,
      credentialsAccessFromUser(user),
    );
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
    return this.credentialsService.copySecretField(
      id,
      body.field,
      body.stepUpPassword,
      credentialsAccessFromUser(user),
    );
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
      credentialsAccessFromUser(user),
    );
  }

  @Post(':id/open-url')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record audited open of stored http(s) URL; returns URL for client navigation',
  })
  async openUrl(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.recordUrlOpened(id, credentialsAccessFromUser(user));
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
    return this.credentialsService.update(id, body, credentialsAccessFromUser(user));
  }

  @Delete(':id/permanent')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete an archived credential (cannot be undone)',
  })
  async permanentRemove(
    @Param('id') id: string,
    @Body() body: { stepUpPassword?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.credentialsService.permanentlyDelete(
      id,
      credentialsAccessFromUser(user),
      body.stepUpPassword,
    );
  }

  @Delete(':id')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive credential (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.credentialsService.archive(id, credentialsAccessFromUser(user));
  }

  @Post(':id/restore')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore archived credential' })
  async restore(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.credentialsService.restore(id, credentialsAccessFromUser(user));
  }
}
