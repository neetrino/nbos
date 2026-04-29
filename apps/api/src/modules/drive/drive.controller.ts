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
import { RequirePermission } from '../../common/decorators';
import { DriveService } from './drive.service';
import type { CreateFileAssetDto, CreateFileLinkDto } from './drive.types';

@ApiTags('Drive')
@ApiBearerAuth()
@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

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

  @Get('files/:id')
  @RequirePermission('DRIVE', 'VIEW')
  @ApiOperation({ summary: 'Get DB-backed Drive file asset detail' })
  async getFileAsset(@Param('id') id: string) {
    return this.driveService.getFileAsset(id);
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
