import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { buildDocumentsReadAccess } from '../documents/documents-read-access.dto';
import { DriveService } from './drive.service';
import { DriveUploadSessionService } from './drive-upload-session.service';
import type {
  CompleteUploadSessionDto,
  CreateFileAssetDto,
  CreateFileLinkDto,
  CreateUploadSessionDto,
} from './drive.types';

@ApiTags('Drive')
@ApiBearerAuth()
@Controller('drive')
export class DriveController {
  constructor(
    private readonly driveService: DriveService,
    private readonly driveUploadSessions: DriveUploadSessionService,
  ) {}

  @Get('files')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List DB-backed Drive file assets' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'purpose', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sourceModule', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listFileAssets(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('purpose') purpose?: string,
    @Query('status') status?: string,
    @Query('sourceModule') sourceModule?: string,
    @Query('search') search?: string,
  ) {
    return this.driveService.listFileAssets({
      entityType,
      entityId,
      purpose,
      status,
      sourceModule,
      search,
    });
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
    @Param('id') id: string,
    @Query('forDocumentId') forDocumentId?: string,
  ) {
    const docId = forDocumentId?.trim();
    return this.driveService.getAssetViewUrl(
      id,
      docId ? { forDocumentId: docId, documentsAccess: buildDocumentsReadAccess(user) } : undefined,
    );
  }

  @Get('files/:id')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Get DB-backed Drive file asset detail' })
  async getFileAsset(@Param('id') id: string) {
    return this.driveService.getFileAsset(id);
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
    @Query('contextType') contextType: string,
    @Query('contextId') contextId: string,
  ) {
    return this.driveUploadSessions.listDriveLibrary(contextType, contextId);
  }

  @Post('upload-sessions')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Create upload session and presigned PUT URL for R2' })
  async createUploadSession(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateUploadSessionDto,
  ) {
    return this.driveUploadSessions.createUploadSession(body, user.id);
  }

  @Post('upload-sessions/:sessionId/complete')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Complete upload session after R2 PUT — creates FileAsset + link' })
  async completeUploadSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
    @Body() body: CompleteUploadSessionDto,
  ) {
    return this.driveUploadSessions.completeUploadSession(sessionId, user.id, body);
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
  async linkFileAsset(@Param('id') id: string, @Body() body: CreateFileLinkDto) {
    return this.driveService.linkFileAsset(id, body);
  }

  @Delete('files/:id/links/:linkId')
  @RequirePermission('DRIVE', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft unlink Drive file asset from an entity' })
  async unlinkFileAsset(@Param('id') id: string, @Param('linkId') linkId: string) {
    await this.driveService.unlinkFileAsset(id, linkId);
  }

  @Post('files/:id/archive')
  @RequirePermission('DRIVE', 'DELETE')
  @ApiOperation({ summary: 'Archive Drive file asset metadata' })
  async archiveFileAsset(@Param('id') id: string, @Body() body: { actorId?: string }) {
    return this.driveService.archiveFileAsset(id, body.actorId);
  }

  @Get(':projectId')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'List files in project folder' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Subfolder prefix to list' })
  async listFiles(@Param('projectId') projectId: string, @Query('prefix') prefix?: string) {
    return this.driveService.listFiles(projectId, prefix);
  }

  @Get(':projectId/structure')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Get full folder structure for a project' })
  async getStructure(@Param('projectId') projectId: string) {
    return this.driveService.getProjectStructure(projectId);
  }

  @Post(':projectId/upload-url')
  @RequirePermission('DRIVE', 'ADD')
  @ApiOperation({ summary: 'Get presigned upload URL' })
  async getUploadUrl(
    @Param('projectId') projectId: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.driveService.getUploadUrl(projectId, body.fileName, body.contentType);
  }

  @Get(':projectId/download-url')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Get presigned download URL' })
  @ApiQuery({ name: 'path', required: true, description: 'File path within the project' })
  async getDownloadUrl(@Param('projectId') projectId: string, @Query('path') filePath: string) {
    return this.driveService.getDownloadUrl(projectId, filePath);
  }

  @Delete(':projectId')
  @RequirePermission('DRIVE', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file from project storage' })
  @ApiQuery({ name: 'path', required: true, description: 'File path to delete' })
  async deleteFile(@Param('projectId') projectId: string, @Query('path') filePath: string) {
    await this.driveService.deleteFile(projectId, filePath);
  }
}
