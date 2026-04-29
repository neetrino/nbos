import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { DocumentsService } from './documents.service';
import type { CreateDocumentDto, CreateDocumentTagDto, UpdateDocumentDto } from './documents.types';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('sections')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List document sections (ensures default sections exist)' })
  async listSections() {
    return this.documentsService.listSections();
  }

  @Get('tags')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List document tags' })
  async listTags() {
    return this.documentsService.listTags();
  }

  @Post('tags')
  @RequirePermission('DOCUMENTS', 'EDIT')
  @ApiOperation({ summary: 'Create a document tag' })
  async createTag(@Body() body: CreateDocumentTagDto) {
    return this.documentsService.createTag(body);
  }

  @Get()
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List documents' })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeArchived', required: false })
  async listDocuments(
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.documentsService.listDocuments({
      sectionId,
      status,
      search,
      includeArchived: includeArchived === 'true' || includeArchived === '1',
    });
  }

  @Get(':id')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'Get document by id' })
  async getDocument(@Param('id') id: string) {
    return this.documentsService.getDocument(id);
  }

  @Post()
  @RequirePermission('DOCUMENTS', 'ADD')
  @ApiOperation({ summary: 'Create draft document' })
  async createDocument(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateDocumentDto) {
    return this.documentsService.createDocument(body, user.id);
  }

  @Patch(':id')
  @RequirePermission('DOCUMENTS', 'EDIT')
  @ApiOperation({ summary: 'Update document metadata or content' })
  async updateDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(id, body, user.id);
  }

  @Post(':id/archive')
  @RequirePermission('DOCUMENTS', 'DELETE')
  @ApiOperation({ summary: 'Archive document' })
  async archiveDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.documentsService.archiveDocument(id, user.id);
  }
}
