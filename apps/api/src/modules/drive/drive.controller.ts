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
import { Public } from '../../common/decorators';
import { DriveService } from './drive.service';

@ApiTags('Drive')
@ApiBearerAuth()
@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get(':projectId')
  @Public()
  @ApiOperation({ summary: 'List files in project folder' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Subfolder prefix to list' })
  async listFiles(@Param('projectId') projectId: string, @Query('prefix') prefix?: string) {
    return this.driveService.listFiles(projectId, prefix);
  }

  @Get(':projectId/structure')
  @Public()
  @ApiOperation({ summary: 'Get full folder structure for a project' })
  async getStructure(@Param('projectId') projectId: string) {
    return this.driveService.getProjectStructure(projectId);
  }

  @Post(':projectId/upload-url')
  @Public()
  @ApiOperation({ summary: 'Get presigned upload URL' })
  async getUploadUrl(
    @Param('projectId') projectId: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.driveService.getUploadUrl(projectId, body.fileName, body.contentType);
  }

  @Get(':projectId/download-url')
  @Public()
  @ApiOperation({ summary: 'Get presigned download URL' })
  @ApiQuery({ name: 'path', required: true, description: 'File path within the project' })
  async getDownloadUrl(@Param('projectId') projectId: string, @Query('path') filePath: string) {
    return this.driveService.getDownloadUrl(projectId, filePath);
  }

  @Delete(':projectId')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file from project storage' })
  @ApiQuery({ name: 'path', required: true, description: 'File path to delete' })
  async deleteFile(@Param('projectId') projectId: string, @Query('path') filePath: string) {
    await this.driveService.deleteFile(projectId, filePath);
  }
}
