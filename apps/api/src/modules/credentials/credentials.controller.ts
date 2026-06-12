import {
  BadRequestException,
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
import { normalizeCredentialListSort } from './credential-list-sort';
import { normalizeBulkCredentialIds } from './credential-bulk.ids';
import { parseLifecycleScopeFromQuery } from '../../common/lifecycle/entity-lifecycle-scope';

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
  @ApiQuery({ name: 'favoritesOnly', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'tab',
    required: false,
    enum: ['all', 'my', 'personal', 'team', 'department', 'project', 'secret'],
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['active', 'trash'],
    description: 'Vault list scope (default active)',
  })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    description: 'Deprecated — use scope=trash',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['recent', 'name_asc', 'created_desc'],
    description: 'List order; default recent for active vault',
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
    @Query('favoritesOnly') favoritesOnly?: string,
    @Query('folderId') folderId?: string,
    @Query('withoutFolder') withoutFolder?: string,
    @Query('search') search?: string,
    @Query('tab') tab?: string,
    @Query('scope') scope?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('sort') sort?: string,
  ) {
    const archivedFlag =
      includeArchived === '1' || includeArchived === 'true' || includeArchived === 'yes';
    const listScope = parseLifecycleScopeFromQuery(scope, archivedFlag);
    const rotationFlag =
      needsRotation === '1' || needsRotation === 'true' || needsRotation === 'yes';
    const favoritesFlag =
      favoritesOnly === '1' || favoritesOnly === 'true' || favoritesOnly === 'yes';
    const withoutFolderFlag =
      withoutFolder === '1' || withoutFolder === 'true' || withoutFolder === 'yes';
    const access = credentialsAccessFromUser(user);
    return this.credentialsService.findAll(
      {
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
        projectId,
        category,
        credentialType,
        accessLevel,
        ownerId,
        needsRotation: rotationFlag,
        favoritesOnly: favoritesFlag,
        folderId,
        withoutFolder: withoutFolderFlag,
        search,
        tab: normalizeCredentialTab(tab),
        employeeId: access.employeeId,
        departmentIds: access.departmentIds,
        viewScope: access.viewScope,
        scope: listScope,
        includeArchived: listScope === 'trash',
        sort: normalizeCredentialListSort(sort, listScope === 'trash'),
      },
      access,
    );
  }

  @Get('folders')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'List credential folders' })
  @ApiQuery({ name: 'scope', required: false })
  @ApiQuery({ name: 'parentId', required: false, description: 'Omit for all; root for top level' })
  @ApiQuery({ name: 'projectId', required: false })
  async listFolders(
    @Query('scope') scope: string | undefined,
    @Query('parentId') parentId: string | undefined,
    @Query('projectId') projectId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.listFolders(
      scope,
      parentId,
      projectId,
      credentialsAccessFromUser(user),
    );
  }

  @Get('project-shells')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'Virtual project folders with credential counts (Project tab)' })
  async listProjectShells(@CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.listProjectShells(credentialsAccessFromUser(user));
  }

  @Post('folders')
  @RequirePermission('CREDENTIALS', 'ADD')
  @ApiOperation({ summary: 'Create credential folder' })
  async createFolder(
    @Body()
    body: { name?: string; scope?: string; parentId?: string | null; projectId?: string | null },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.createFolder(body, credentialsAccessFromUser(user));
  }

  @Put('folders/:folderId')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @ApiOperation({ summary: 'Rename credential folder' })
  async updateFolder(
    @Param('folderId') folderId: string,
    @Body() body: { name?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.updateFolder(folderId, body, credentialsAccessFromUser(user));
  }

  @Delete('folders/:folderId')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete empty credential folder (Model 6)' })
  async archiveFolder(
    @Param('folderId') folderId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.credentialsService.archiveFolder(folderId, credentialsAccessFromUser(user));
  }

  @Put(':id/favorite')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'Set personal favorite state for a credential' })
  async setFavorite(
    @Param('id') id: string,
    @Body() body: { favorite?: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.setFavorite(
      id,
      Boolean(body.favorite),
      credentialsAccessFromUser(user),
    );
  }

  @Put(':id/folders')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @ApiOperation({ summary: 'Replace ordinary folder memberships for a credential' })
  async replaceFolders(
    @Param('id') id: string,
    @Body() body: { folderIds?: string[]; folderId?: string | null },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const folderIds = Array.isArray(body.folderIds)
      ? body.folderIds
      : body.folderId
        ? [body.folderId]
        : [];
    return this.credentialsService.replaceFolders(id, folderIds, credentialsAccessFromUser(user));
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
    const credentialIds = Array.isArray(body.credentialIds)
      ? normalizeBulkCredentialIds(body.credentialIds)
      : undefined;
    return this.credentialsService.exportCredentialsFile(
      {
        credentialIds,
        fields: Array.isArray(body.fields) ? body.fields : undefined,
        stepUpPassword: body.stepUpPassword,
      },
      credentialsAccessFromUser(user),
    );
  }

  @Post('bulk/archive')
  @RequirePermission('CREDENTIALS', 'DELETE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive multiple credentials (visibility-checked)' })
  async bulkArchive(
    @Body() body: { credentialIds?: string[] },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const credentialIds = normalizeBulkCredentialIds(body.credentialIds);
    return this.credentialsService.bulkArchive(credentialIds, credentialsAccessFromUser(user));
  }

  @Post('bulk/restore')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore multiple archived credentials' })
  async bulkRestore(
    @Body() body: { credentialIds?: string[] },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const credentialIds = normalizeBulkCredentialIds(body.credentialIds);
    return this.credentialsService.bulkRestore(credentialIds, credentialsAccessFromUser(user));
  }

  @Post('bulk/folders/add')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move credentials into a folder (v1: single folder membership)' })
  async bulkAddToFolder(
    @Body() body: { credentialIds?: string[]; folderId?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const credentialIds = normalizeBulkCredentialIds(body.credentialIds);
    const folderId = body.folderId?.trim();
    if (!folderId) throw new BadRequestException('folderId is required');
    return this.credentialsService.bulkAddToFolder(
      credentialIds,
      folderId,
      credentialsAccessFromUser(user),
    );
  }

  @Post('bulk/folders/remove')
  @RequirePermission('CREDENTIALS', 'EDIT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove credentials from a folder or all folders' })
  async bulkRemoveFromFolder(
    @Body() body: { credentialIds?: string[]; folderId?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const credentialIds = normalizeBulkCredentialIds(body.credentialIds);
    const folderId = body.folderId?.trim() || undefined;
    return this.credentialsService.bulkRemoveFromFolder(
      credentialIds,
      folderId,
      credentialsAccessFromUser(user),
    );
  }

  @Get('vault-session')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'Daily vault unlock status for HIGH/CRITICAL secrets' })
  async getVaultSession(@CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.getVaultSession(user.id);
  }

  @Post('vault-unlock')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock vault for HIGH/CRITICAL copy/reveal (24h TTL)' })
  async unlockVault(@Body() body: { password?: string }, @CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.unlockVault(user.id, body.password ?? '');
  }

  @Post('vault-lock')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock vault before daily unlock expires' })
  async lockVault(@CurrentUser() user: CurrentUserPayload) {
    return this.credentialsService.lockVault(user.id);
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

  @Get('providers')
  @RequirePermission('CREDENTIALS', 'VIEW')
  @ApiOperation({ summary: 'Search credential provider catalog' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async searchProviders(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @CurrentUser() _user?: CurrentUserPayload,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.credentialsService.searchProviders(q, parsedLimit);
  }

  @Post('providers')
  @RequirePermission('CREDENTIALS', 'ADD')
  @ApiOperation({ summary: 'Create credential provider (inline from sheet)' })
  async createProvider(
    @Body() body: { name: string; website?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.credentialsService.createProvider(body, user.id);
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
      providerId?: string | null;
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
      providerId?: string | null;
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
