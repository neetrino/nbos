import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { buildDocumentsDetailAccess, buildDocumentsReadAccess } from './documents-read-access.dto';
import { DocumentsService } from './documents.service';
import type {
  AddDocumentAttachmentDto,
  CreateDocumentDto,
  CreateDocumentTagDto,
  UpdateDocumentDto,
  UpdateDocumentSectionDto,
} from './documents.types';

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

  @Patch('sections/:sectionId')
  @RequirePermission('DOCUMENTS', 'MANAGE_SECTIONS')
  @ApiOperation({ summary: 'Update document section (e.g. default list visibility scope)' })
  async updateDocumentSection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sectionId') sectionId: string,
    @Body() body: UpdateDocumentSectionDto,
  ) {
    return this.documentsService.updateDocumentSection(sectionId, body, user.id);
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
    @CurrentUser() user: CurrentUserPayload,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.documentsService.listDocuments(
      {
        sectionId,
        status,
        search,
        includeArchived: includeArchived === 'true' || includeArchived === '1',
      },
      buildDocumentsReadAccess(user),
    );
  }

  @Get(':id')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'Get document by id' })
  async getDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.documentsService.getDocument(id, buildDocumentsDetailAccess(user));
  }

  @Post()
  @RequirePermission('DOCUMENTS', 'ADD')
  @ApiOperation({ summary: 'Create draft document' })
  async createDocument(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateDocumentDto) {
    return this.documentsService.createDocument(body, user.id, buildDocumentsDetailAccess(user));
  }

  @Patch(':id')
  @RequirePermission('DOCUMENTS', 'EDIT')
  @ApiOperation({ summary: 'Update document metadata or content' })
  async updateDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(
      id,
      body,
      user.id,
      buildDocumentsDetailAccess(user),
    );
  }

  @Post(':id/attachments')
  @RequirePermission('DOCUMENTS', 'EDIT')
  @ApiOperation({
    summary: 'Register a Drive File Asset as a document attachment',
    description:
      'Requires an active FileLink with entityType DOCUMENT and entityId equal to this document (e.g. after upload session).',
  })
  async addDocumentAttachment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: AddDocumentAttachmentDto,
  ) {
    return this.documentsService.addDocumentAttachment(
      id,
      body,
      user.id,
      buildDocumentsDetailAccess(user),
    );
  }

  @Delete(':id/attachments/:attachmentId')
  @RequirePermission('DOCUMENTS', 'EDIT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a DocumentAttachment row (does not delete the File Asset)' })
  async removeDocumentAttachment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.documentsService.removeDocumentAttachment(
      id,
      attachmentId,
      user.id,
      buildDocumentsDetailAccess(user),
    );
  }

  @Post(':id/archive')
  @RequirePermission('DOCUMENTS', 'DELETE')
  @ApiOperation({ summary: 'Archive document' })
  async archiveDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.documentsService.archiveDocument(id, user.id, buildDocumentsDetailAccess(user));
  }
}
