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
  CreateDocumentSectionDto,
  ExportDocumentQuery,
  CreateDocumentTagDto,
  UpdateDocumentDto,
  UpdateDocumentSectionDto,
} from './documents.types';

// Literal sub-path guards — keep these above parameterised GET :id
const FAVORITES_PATH = 'favorites';
const RECENT_PATH = 'recent';

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

  @Post('sections')
  @RequirePermission('DOCUMENTS', 'MANAGE_SECTIONS')
  @ApiOperation({ summary: 'Create a document section (folder)' })
  async createDocumentSection(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateDocumentSectionDto,
  ) {
    return this.documentsService.createDocumentSection(body, user.id);
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

  @Get(FAVORITES_PATH)
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List documents favorited by the current user' })
  async listFavorites(@CurrentUser() user: CurrentUserPayload) {
    return this.documentsService.listFavorites(user.id, buildDocumentsReadAccess(user));
  }

  @Post(':id/favorite')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Star / favorite a document' })
  async favoriteDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.documentsService.favoriteDocument(id, user.id, buildDocumentsReadAccess(user));
  }

  @Delete(':id/favorite')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unstar / unfavorite a document' })
  async unfavoriteDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.documentsService.unfavoriteDocument(id, user.id);
  }

  @Get(RECENT_PATH)
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List documents recently interacted with by the current user' })
  async listRecent(@CurrentUser() user: CurrentUserPayload) {
    return this.documentsService.listRecent(user.id, buildDocumentsReadAccess(user));
  }

  @Get()
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List documents' })
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by document type, e.g. NATIVE' })
  @ApiQuery({ name: 'libraryKey', required: false, description: 'Drive library category key' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: 'CRM entity type (DEAL | LEAD | PROJECT | …)',
  })
  @ApiQuery({ name: 'entityId', required: false, description: 'CRM entity ID matching entityType' })
  @ApiQuery({ name: 'driveFolderId', required: false, description: 'Real DriveFolder ID' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeArchived', required: false })
  async listDocuments(
    @CurrentUser() user: CurrentUserPayload,
    @Query('sectionId') sectionId?: string,
    @Query('type') type?: string,
    @Query('libraryKey') libraryKey?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('driveFolderId') driveFolderId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.documentsService.listDocuments(
      {
        sectionId,
        type,
        libraryKey,
        entityType,
        entityId,
        driveFolderId,
        status,
        search,
        includeArchived: includeArchived === 'true' || includeArchived === '1',
      },
      buildDocumentsReadAccess(user),
    );
  }

  @Get(':id/activity')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'List document activity (cursor pagination)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listDocumentActivity(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const parsed =
      limitRaw === undefined || limitRaw === '' ? undefined : Number.parseInt(limitRaw, 10);
    const limit = Number.isFinite(parsed) ? parsed : undefined;
    return this.documentsService.listDocumentActivity(
      id,
      { cursor: cursor?.trim() || undefined, limit },
      buildDocumentsDetailAccess(user),
    );
  }

  @Get(':id')
  @RequirePermission('DOCUMENTS', 'VIEW')
  @ApiOperation({ summary: 'Get document by id' })
  async getDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.documentsService.getDocument(id, buildDocumentsDetailAccess(user));
  }

  @Get(':id/export')
  @RequirePermission('DOCUMENTS', 'EXPORT')
  @ApiOperation({ summary: 'Export document content (json/html/txt)' })
  @ApiQuery({ name: 'format', required: false, description: 'json | html | txt (default json)' })
  async exportDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query() query: ExportDocumentQuery,
  ) {
    return this.documentsService.exportDocument(
      id,
      query,
      user.id,
      buildDocumentsDetailAccess(user),
    );
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

  @Post(':id/restore')
  @RequirePermission('DOCUMENTS', 'DELETE')
  @ApiOperation({
    summary: 'Restore archived document',
    description: 'Sets status to PUBLISHED if the document was published before; otherwise DRAFT.',
  })
  async restoreDocument(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.documentsService.restoreDocument(id, user.id, buildDocumentsDetailAccess(user));
  }
}
