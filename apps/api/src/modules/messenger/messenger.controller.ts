import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CreateMessengerChannelDto } from './dto/create-messenger-channel.dto';
import { MarkMessengerDmReadDto } from './dto/mark-messenger-dm-read.dto';
import {
  EnsureMessengerConversationDto,
  SendMessengerConversationMessageDto,
} from './dto/messenger-unified.dto';
import { SendMessengerChannelMessageDto } from './dto/send-messenger-channel-message.dto';
import { SendMessengerDmDto } from './dto/send-messenger-dm.dto';
import { messengerUserDisplayName } from './messenger-user-display-name';
import { clampMessengerListPageSize, parseMessengerBeforeCursor } from './messenger-list-page-size';
import { MessengerService } from './messenger.service';
import { MessengerUnifiedService } from './messenger-unified.service';
import type { MessengerInternalTab } from './unified/messenger-unified.types';
import type { EnsureConversationInput } from './unified/messenger-conversation-ensure.ops';

const INTERNAL_TABS = new Set<MessengerInternalTab>(['all', 'deal', 'project', 'dev', 'tasks']);

function parseInternalTab(raw: string | undefined): MessengerInternalTab {
  const tab = (raw ?? 'all').trim().toLowerCase() as MessengerInternalTab;
  if (!INTERNAL_TABS.has(tab)) {
    throw new BadRequestException('Invalid tab. Expected all|deal|project|dev|tasks');
  }
  return tab;
}

@ApiTags('Messenger')
@ApiBearerAuth()
@Controller('messenger')
export class MessengerController {
  constructor(
    private readonly messengerService: MessengerService,
    private readonly messengerUnifiedService: MessengerUnifiedService,
  ) {}

  // ─── Unified Internal Messenger (L1 / L2 / conversation) ───

  @Get('internal/entities')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'L1 business entities for Internal Messenger tab' })
  @ApiQuery({ name: 'tab', required: false, description: 'all|deal|project|dev|tasks' })
  @ApiQuery({ name: 'search', required: false })
  listInternalEntities(
    @CurrentUser() user: CurrentUserPayload,
    @Query('tab') tabRaw?: string,
    @Query('search') search?: string,
  ) {
    return this.messengerUnifiedService.listL1Entities(
      user.id,
      parseInternalTab(tabRaw),
      search,
    );
  }

  @Get('internal/conversations')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'L2 conversations for selected L1 entity' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'projectTree', required: false })
  @ApiQuery({ name: 'includeInternalGroups', required: false })
  listInternalConversations(
    @CurrentUser() user: CurrentUserPayload,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('projectTree') projectTree?: string,
    @Query('includeInternalGroups') includeInternalGroups?: string,
  ) {
    const normalizedType = normalizeEntityType(entityType);
    return this.messengerUnifiedService.listL2Conversations(user.id, {
      entityType: normalizedType,
      entityId: entityId?.trim() || undefined,
      projectTree: projectTree === '1' || projectTree === 'true',
      includeInternalGroups:
        includeInternalGroups === '1' || includeInternalGroups === 'true',
    });
  }

  @Post('conversations/ensure')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Ensure canonical conversation for entity or DIRECT pair' })
  ensureConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: EnsureMessengerConversationDto,
  ) {
    const input = toEnsureInput(body);
    return this.messengerUnifiedService.ensureConversation(user.id, input);
  }

  @Get('conversations/:id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Get unified conversation detail' })
  getConversation(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.messengerUnifiedService.getConversation(user.id, id);
  }

  @Get('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Get unified conversation message history' })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getConversationMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('before') beforeRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const before = parseMessengerBeforeCursor(beforeRaw);
    const pageSize = clampMessengerListPageSize(pageSizeRaw);
    return this.messengerUnifiedService.getMessages(user.id, id, { before, pageSize });
  }

  @Post('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Send message to unified conversation' })
  sendConversationMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SendMessengerConversationMessageDto,
  ) {
    return this.messengerUnifiedService.sendMessage(user.id, id, body.content, body.fileAssetIds);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Mark unified conversation read' })
  markConversationRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.messengerUnifiedService.markRead(user.id, id);
  }

  @Get('internal/search')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Search unified Internal Messenger messages' })
  @ApiQuery({ name: 'q', required: true })
  searchInternal(@CurrentUser() user: CurrentUserPayload, @Query('q') q: string) {
    return this.messengerUnifiedService.search(user.id, q ?? '');
  }

  // ─── Legacy channel / DM (kept for dual-compat during cutover) ───

  @Get('channels')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List all channels with unread counts for current user' })
  getChannels(@CurrentUser() user: CurrentUserPayload) {
    return this.messengerService.getChannels(user.id);
  }

  @Get('search')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Search internal messenger messages' })
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentUser() user: CurrentUserPayload, @Query('q') q: string) {
    return this.messengerService.search(user.id, q ?? '');
  }

  @Post('channels')
  @RequirePermission('MESSENGER', 'ADD')
  @ApiOperation({ summary: 'Create a channel' })
  createChannel(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateMessengerChannelDto) {
    return this.messengerService.createChannel(body.name, body.projectId, body.type, user.id);
  }

  @Post('channels/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Mark channel read up to latest message for current user' })
  markChannelRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.messengerService.markChannelRead(id, user.id);
  }

  @Get('channels/:id/messages')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Get messages in a channel (includes last-own read receipt hints for the viewer)',
  })
  @ApiQuery({
    name: 'before',
    required: false,
    description:
      'ISO-8601 cursor: return messages strictly older than this (exclusive). Omit for latest window.',
  })
  @ApiQuery({ name: 'pageSize', required: false })
  getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('before') beforeRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    const before = parseMessengerBeforeCursor(beforeRaw);
    const pageSize = clampMessengerListPageSize(pageSizeRaw);
    return this.messengerService.getMessages(id, user.id, { before, pageSize });
  }

  @Post('channels/:id/messages')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Send a message to a channel (sender from session)' })
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SendMessengerChannelMessageDto,
  ) {
    return this.messengerService.sendMessage(
      id,
      user.id,
      messengerUserDisplayName(user),
      body.content,
      body.fileAssetIds,
    );
  }

  @Get('dm/conversations')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List DM conversations for the current user' })
  getConversations(@CurrentUser() user: CurrentUserPayload) {
    return this.messengerService.getDirectConversations(user.id);
  }

  @Post('dm/mark-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Mark DM with recipient read up to latest for current user' })
  markDmRead(@CurrentUser() user: CurrentUserPayload, @Body() body: MarkMessengerDmReadDto) {
    if (body.recipientId === user.id) {
      throw new ForbiddenException('Invalid recipient');
    }
    return this.messengerService.markDirectConversationRead(user.id, body.recipientId);
  }

  @Get('dm/:userId1/:userId2')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Get direct messages (includes peerLastReadAt for DM read receipts on your sends)',
  })
  @ApiQuery({
    name: 'before',
    required: false,
    description:
      'ISO-8601 cursor: messages strictly older than this (exclusive). Omit for latest window.',
  })
  @ApiQuery({ name: 'pageSize', required: false })
  getDirectMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
    @Query('before') beforeRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ) {
    if (user.id !== userId1 && user.id !== userId2) {
      throw new ForbiddenException('You may only read your own direct messages');
    }
    const peerId = user.id === userId1 ? userId2 : userId1;
    const before = parseMessengerBeforeCursor(beforeRaw);
    const pageSize = clampMessengerListPageSize(pageSizeRaw);
    return this.messengerService.getDirectMessages(user.id, peerId, { before, pageSize });
  }

  @Post('dm')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Send a direct message (sender from session)' })
  sendDirectMessage(@CurrentUser() user: CurrentUserPayload, @Body() body: SendMessengerDmDto) {
    if (body.recipientId === user.id) {
      throw new ForbiddenException('Cannot send a direct message to yourself');
    }
    return this.messengerService.sendDirectMessage(
      user.id,
      messengerUserDisplayName(user),
      body.recipientId,
      body.content,
      body.fileAssetIds,
    );
  }
}

function normalizeEntityType(
  raw: string | undefined,
): 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'DIRECT_BUCKET' | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toUpperCase();
  if (v === 'PROJECT' || v === 'PRODUCT' || v === 'DEAL' || v === 'TASK' || v === 'DIRECT_BUCKET') {
    return v;
  }
  throw new BadRequestException('Invalid entityType');
}

function toEnsureInput(body: EnsureMessengerConversationDto): EnsureConversationInput {
  if (body.type === 'DIRECT') {
    if (!body.peerEmployeeId) {
      throw new BadRequestException('peerEmployeeId is required for DIRECT');
    }
    return {
      type: 'DIRECT',
      peerEmployeeId: body.peerEmployeeId,
      createdById: '', // overwritten by service with session id
    };
  }
  if (!body.entityId) {
    throw new BadRequestException('entityId is required for entity conversations');
  }
  return {
    type: body.type,
    entityId: body.entityId,
    createdById: null,
  };
}
