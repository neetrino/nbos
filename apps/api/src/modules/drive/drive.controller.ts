import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { buildDocumentsReadAccess } from '../documents/documents-read-access.dto';
import { DriveService } from './drive.service';
import { DriveUploadSessionService } from './drive-upload-session.service';
import { DriveFolderService } from './drive-folder.service';
import { DriveFolderGrantService } from './drive-folder-grant.service';
import { DriveZipExportService } from './drive-zip-export.service';
import { DriveProjectHubService } from './drive-project-hub.service';
import { DriveCleanupCandidatesService } from './drive-cleanup-candidates.service';
import { DriveCleanupApplyService } from './drive-cleanup-apply.service';
import { DriveAccessContextService } from './drive-access-context.service';
import { ApplyDriveCleanupDto } from './apply-drive-cleanup.dto';
import { CreateDriveZipExportBodyDto } from './create-drive-zip-export.dto';
import type {
  CompleteUploadSessionDto,
  CompleteFileVersionDto,
  CreateFileAssetDto,
  CreateFileAssetGrantDto,
  CreateFileVersionUploadDto,
  CreateFileLinkDto,
  CreateUploadSessionDto,
  CreateDriveFolderDto,
  CopyFolderFileDto,
  MoveFolderFileDto,
  RenameDriveFolderDto,
  AddFolderFileDto,
} from './drive.types';

@ApiTags('Drive')
@ApiBearerAuth()
@Controller('drive')
export class DriveController {
  constructor(
    private readonly driveService: DriveService,
    private readonly driveUploadSessions: DriveUploadSessionService,
    private readonly driveFolders: DriveFolderService,
    private readonly driveFolderGrants: DriveFolderGrantService,
    private readonly driveZipExports: DriveZipExportService,
    private readonly driveProjectHub: DriveProjectHubService,
    private readonly driveCleanupCandidates: DriveCleanupCandidatesService,
    private readonly driveCleanupApply: DriveCleanupApplyService,
    private readonly driveAccessContext: DriveAccessContextService,
  ) {}

  @Get('folders')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List user-created Drive folders and files' })
  @ApiQuery({
    name: 'space',
    required: false,
    description: 'COMPANY | PERSONAL (required without entity scope)',
  })
  @ApiQuery({ name: 'parentId', required: false, description: 'Folder id or root' })
  @ApiQuery({ name: 'scopeEntityType', required: false, description: 'DEAL | PROJECT | …' })
  @ApiQuery({ name: 'scopeEntityId', required: false })
  async listFolders(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Query('space') space?: string,
    @Query('parentId') parentId?: string,
    @Query('scopeEntityType') scopeEntityType?: string,
    @Query('scopeEntityId') scopeEntityId?: string,
  ) {
    return this.driveFolders.listFolder(
      { space, parentId, scopeEntityType, scopeEntityId },
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('folders/grant-counts')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Batch count active manual grants on Drive folders' })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated folder ids' })
  async getFolderGrantCounts(@Query('ids') idsParam?: string) {
    const folderIds = (idsParam ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    return this.driveFolders.getFolderManualGrantCounts(folderIds);
  }

  @Get('files/grant-counts')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Batch count active manual grants on Drive files' })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated file asset ids' })
  async getFileGrantCounts(@Query('ids') idsParam?: string) {
    const fileIds = (idsParam ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    return this.driveFolders.getFileManualGrantCounts(fileIds);
  }

  @Get('folders/tree')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List all Drive folders in a space (flat list for tree UI)' })
  @ApiQuery({ name: 'space', required: false, description: 'COMPANY | PERSONAL' })
  @ApiQuery({ name: 'scopeEntityType', required: false })
  @ApiQuery({ name: 'scopeEntityId', required: false })
  async listFolderTree(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Query('space') space?: string,
    @Query('scopeEntityType') scopeEntityType?: string,
    @Query('scopeEntityId') scopeEntityId?: string,
  ) {
    return this.driveFolders.listFolderTree(
      space ?? '',
      user.id,
      { scopeEntityType, scopeEntityId },
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('folders')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Create a user folder in Company or Personal Drive' })
  async createFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: CreateDriveFolderDto,
  ) {
    return this.driveFolders.createFolder(
      body,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Patch('folders/:folderId')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Rename a user Drive folder' })
  async renameFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
    @Body() body: RenameDriveFolderDto,
  ) {
    return this.driveFolders.renameFolder(
      folderId,
      body,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Delete('folders/:folderId')
  @RequirePermission('DRIVE', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an empty Drive folder' })
  async deleteFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
  ) {
    await this.driveFolders.deleteFolder(
      folderId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('folders/:folderId/grants')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Grant another employee access to a Drive folder' })
  async createFolderGrant(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
    @Body() body: CreateFileAssetGrantDto,
  ) {
    return this.driveFolderGrants.createGrant(
      folderId,
      body,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('folders/:folderId/grants')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List active grants on a Drive folder' })
  async listFolderGrants(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
  ) {
    return this.driveFolderGrants.listGrants(
      folderId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Delete('folders/:folderId/grants/:grantId')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Revoke an active grant on a Drive folder' })
  async revokeFolderGrant(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
    @Param('grantId') grantId: string,
  ) {
    return this.driveFolderGrants.revokeGrant(
      folderId,
      grantId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('folders/:folderId/files/:fileId/move')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Move a file placement between user folders' })
  async moveFolderFile(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
    @Param('fileId') fileId: string,
    @Body() body: MoveFolderFileDto,
  ) {
    return this.driveFolders.moveFile(
      body.sourceFolderId ?? folderId,
      body.targetFolderId,
      fileId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('folders/:folderId/files/:fileId/copy')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Copy a file into a user folder as an independent FileAsset' })
  async copyFolderFile(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('fileId') fileId: string,
    @Body() body: CopyFolderFileDto,
  ) {
    return this.driveFolders.copyFile(
      body.targetFolderId,
      fileId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Delete('folders/:folderId/files/:fileId')
  @RequirePermission('DRIVE', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a file from a user folder without deleting the FileAsset' })
  async removeFolderFile(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
    @Param('fileId') fileId: string,
  ) {
    await this.driveFolders.removeFile(
      folderId,
      fileId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('folders/:folderId/files')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Add an existing FileAsset to a folder (new placement)' })
  async addFileToFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('folderId') folderId: string,
    @Body() body: AddFolderFileDto,
  ) {
    return this.driveFolders.addFileToFolder(
      folderId,
      body.fileAssetId.trim(),
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('project-hub/:projectId')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({
    summary: 'Project Library hub section counts (project files, deals, products, …)',
  })
  async getProjectDriveHubSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('projectId') projectId: string,
  ) {
    return this.driveProjectHub.getSummary(
      projectId.trim(),
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('files')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List DB-backed Drive file assets' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'purpose', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sourceModule', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'projectHubProjectFiles',
    required: false,
    description:
      'When true with projectId, list files linked only to the Project shell, not child contexts.',
  })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({
    name: 'sharedWithMe',
    required: false,
    description:
      'When true, list files shared with the viewer (not originated as sole owner/uploader).',
  })
  @ApiQuery({
    name: 'trash',
    required: false,
    description: 'When true, list soft-deleted files in Trash.',
  })
  async listFileAssets(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('purpose') purpose?: string,
    @Query('status') status?: string,
    @Query('sourceModule') sourceModule?: string,
    @Query('search') search?: string,
    @Query('projectHubProjectFiles') projectHubProjectFiles?: string,
    @Query('projectId') projectId?: string,
    @Query('sharedWithMe') sharedWithMe?: string,
    @Query('trash') trash?: string,
  ) {
    return this.driveService.listFileAssets(
      {
        entityType,
        entityId,
        purpose,
        status,
        sourceModule,
        search,
        projectHubProjectFiles: projectHubProjectFiles === 'true',
        projectId: projectId?.trim() || undefined,
        sharedWithMe: sharedWithMe === 'true',
        trash: trash === 'true' || trash === '1',
      },
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('files/context-summary')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Count Drive files linked to an entity, grouped by purpose' })
  @ApiQuery({ name: 'entityType', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  async getLibraryContextSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.driveService.getLibraryContextSummary(
      entityType,
      entityId,
      await this.driveAccessContext.fromRequestWithDocuments(user, request.permissionScope),
    );
  }

  @Get('files/library-link-aggregates')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({
    summary: 'Aggregate other entity links for files in a library context',
    description:
      'Counts FileLink rows grouped by entityType/entityId for files linked to the given context, excluding the context anchor link.',
  })
  @ApiQuery({ name: 'entityType', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  async getLibraryRelatedLinkAggregates(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.driveService.getLibraryRelatedLinkAggregates(
      entityType,
      entityId,
      await this.driveAccessContext.fromRequestWithDocuments(user, request.permissionScope),
    );
  }

  @Get('cleanup-summary')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Drive maintenance counters (upload sessions)' })
  async getDriveCleanupSummary() {
    return this.driveService.getDriveCleanupSummary();
  }

  @Get('cleanup/candidates')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({
    summary: 'Review cleanup candidates (no destructive action)',
    description:
      'Lists orphan files, failed/expired upload sessions, duplicate checksum groups, old export artifacts, trash retention, and aged task attachments for operator review.',
  })
  async listDriveCleanupCandidates() {
    return this.driveCleanupCandidates.listCandidates();
  }

  @Post('cleanup/apply')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({
    summary: 'Apply reviewed Drive cleanup for selected candidate ids',
    description:
      'Runs a confirmed cleanup action for one candidate category. Use ids from GET /drive/cleanup/candidates, or applyAll for failed/expired sessions and expired export artifacts (capped).',
  })
  async applyDriveCleanup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: ApplyDriveCleanupDto,
  ) {
    return this.driveCleanupApply.applyCleanup(user.id, body.kind, body.ids, body.applyAll);
  }

  @Post('cleanup/purge/:kind')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Delete failed or expired pending upload session rows' })
  async purgeDriveUploadSessions(@Param('kind') kind: string) {
    return this.driveService.purgeDriveUploadSessions(kind);
  }

  @Get('zip-exports')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List Drive ZIP export jobs for the current user' })
  async listDriveZipExports(@CurrentUser() user: CurrentUserPayload) {
    return this.driveZipExports.listZipExportJobs(user.id);
  }

  @Post('zip-exports')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({
    summary: 'Queue ZIP export for selected Drive files',
    description:
      'Creates an asynchronous job. R2-backed FileAssets are packed under `files/`; `_manifest/export-manifest.json` lists included and skipped ids. Requires REDIS_URL or DRIVE_ZIP_EXPORT_SYNC_FALLBACK=true (dev only).',
  })
  async createDriveZipExport(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: CreateDriveZipExportBodyDto,
  ) {
    return this.driveZipExports.createZipExportJob(
      user.id,
      {
        fileIds: body.fileIds,
        exportKind: body.exportKind,
        exportParams: body.exportParams,
      },
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('zip-exports/:id/cancel')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Cancel a queued Drive ZIP export job' })
  async cancelDriveZipExport(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.driveZipExports.cancelZipExportJob(id, user.id);
  }

  @Get('zip-exports/:id')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Get a Drive ZIP export job by id (requester only)' })
  async getDriveZipExport(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.driveZipExports.getZipExportJob(id, user.id);
  }

  @Get('files/:id/preview-url')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({
    summary: 'Short-lived presigned URL to view/download file bytes (R2 or external)',
    description:
      'Optional `forDocumentId`: when set, also requires Documents read access to that document and an attachment or DOCUMENT FileLink for this file (recommended for document HTML/images).',
  })
  @ApiQuery({
    name: 'forDocumentId',
    required: false,
    description: 'Native document id — tightens preview to document-scoped file access.',
  })
  async getFileAssetPreviewUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Query('forDocumentId') forDocumentId?: string,
  ) {
    const docId = forDocumentId?.trim();
    return this.driveService.getAssetViewUrl(
      id,
      docId ? { forDocumentId: docId, documentsAccess: buildDocumentsReadAccess(user) } : undefined,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('lifecycle-counts')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Counts for Archive and Trash lifecycle views' })
  async getLifecycleCounts(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
  ) {
    return this.driveService.getLifecycleCounts(
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/:id/permanent-delete')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({
    summary: 'Move an archived file to Trash (soft delete; requires no active business links)',
  })
  async permanentlyDeleteFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
  ) {
    return this.driveService.permanentlyDeleteFileAsset(
      id,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('files/:id')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Get DB-backed Drive file asset detail' })
  async getFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
  ) {
    return this.driveService.getFileAsset(
      id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('library')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List File Assets for a logical library context' })
  @ApiQuery({
    name: 'contextType',
    required: true,
    description: 'PROJECT | PRODUCT | TASK | SUPPORT | COMPANY | DOCUMENT',
  })
  @ApiQuery({ name: 'contextId', required: true })
  async listDriveLibrary(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Query('contextType') contextType?: string,
    @Query('contextId') contextId?: string,
  ) {
    return this.driveUploadSessions.listDriveLibrary(
      contextType,
      contextId,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
      buildDocumentsReadAccess(user),
    );
  }

  @Post('upload-sessions')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Create upload session and presigned PUT URL for R2' })
  async createUploadSession(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: CreateUploadSessionDto,
  ) {
    return this.driveUploadSessions.createUploadSession(
      body,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
      buildDocumentsReadAccess(user),
    );
  }

  @Post('upload-sessions/:sessionId/complete')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Complete upload session after R2 PUT — creates FileAsset + link' })
  async completeUploadSession(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('sessionId') sessionId: string,
    @Body() body: CompleteUploadSessionDto,
  ) {
    return this.driveUploadSessions.completeUploadSession(
      sessionId,
      user.id,
      body,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
      buildDocumentsReadAccess(user),
    );
  }

  @Post('upload-sessions/:sessionId/fail')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Mark a pending upload session as failed (client abort)' })
  async failUploadSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
    @Body() body: { reason?: string },
  ) {
    return this.driveUploadSessions.failUploadSession(sessionId, user.id, body.reason);
  }

  @Post('files')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Create DB-backed Drive file metadata' })
  async createFileAsset(@Body() body: CreateFileAssetDto) {
    return this.driveService.createFileAsset(body);
  }

  @Post('files/:id/links')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Link Drive file asset to another entity' })
  async linkFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Body() body: CreateFileLinkDto,
  ) {
    return this.driveService.linkFileAsset(
      id,
      body,
      await this.driveAccessContext.fromRequestWithDocuments(user, request.permissionScope),
    );
  }

  @Post('files/:id/grants')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Grant another employee view access to a Drive file (Shared with me)' })
  async createFileAssetGrant(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Body() body: CreateFileAssetGrantDto,
  ) {
    return this.driveService.createFileAssetGrant(
      id,
      body,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Get('files/:id/grants')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List active grants on a Drive file' })
  async listFileAssetGrants(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
  ) {
    return this.driveService.listFileAssetGrants(
      id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Delete('files/:id/grants/:grantId')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Revoke an active grant on a Drive file' })
  async revokeFileAssetGrant(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Param('grantId') grantId: string,
  ) {
    return this.driveService.revokeFileAssetGrant(
      id,
      grantId,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/:id/version-upload-url')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Create presigned upload URL for a new File Asset version' })
  async createVersionUploadUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Body() body: CreateFileVersionUploadDto,
  ) {
    return this.driveService.createVersionUploadUrl(
      id,
      body,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/:id/versions')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Complete new version upload for an existing File Asset' })
  async completeFileVersion(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Body() body: CompleteFileVersionDto,
  ) {
    return this.driveService.completeFileVersion(
      id,
      user.id,
      body,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Delete('files/:id/links/:linkId')
  @RequirePermission('DRIVE', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft unlink Drive file asset from an entity' })
  async unlinkFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
    @Param('linkId') linkId: string,
  ) {
    await this.driveService.unlinkFileAsset(
      id,
      linkId,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/:id/archive')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Archive Drive file asset metadata' })
  async archiveFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
  ) {
    return this.driveService.archiveFileAsset(
      id,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/:id/restore')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Restore archived Drive file asset metadata' })
  async restoreFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
  ) {
    return this.driveService.restoreFileAsset(
      id,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/archive-batch')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Archive multiple Drive file assets' })
  async archiveFileAssets(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: { ids: string[] },
  ) {
    return this.driveService.archiveFileAssets(
      body.ids ?? [],
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/restore-batch')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Restore multiple archived Drive file assets' })
  async restoreFileAssets(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: { ids: string[] },
  ) {
    return this.driveService.restoreFileAssets(
      body.ids ?? [],
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/:id/restore-from-trash')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Restore a Trash file back to Active' })
  async restoreTrashFileAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Param('id') id: string,
  ) {
    return this.driveService.restoreTrashFileAsset(
      id,
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/restore-trash-batch')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Restore multiple Trash files back to Active' })
  async restoreTrashFileAssets(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: { ids: string[] },
  ) {
    return this.driveService.restoreTrashFileAssets(
      body.ids ?? [],
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }

  @Post('files/move-to-trash-batch')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Move multiple archived files to Trash' })
  async moveFileAssetsToTrash(
    @CurrentUser() user: CurrentUserPayload,
    @Req() request: Request & { permissionScope?: string },
    @Body() body: { ids: string[] },
  ) {
    return this.driveService.moveFileAssetsToTrash(
      body.ids ?? [],
      user.id,
      await this.driveAccessContext.fromRequest(user, request.permissionScope),
    );
  }
}
