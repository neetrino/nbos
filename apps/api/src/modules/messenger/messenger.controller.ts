import {
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
import { SendMessengerChannelMessageDto } from './dto/send-messenger-channel-message.dto';
import { SendMessengerDmDto } from './dto/send-messenger-dm.dto';
import { messengerUserDisplayName } from './messenger-user-display-name';
import { clampMessengerListPageSize, parseMessengerBeforeCursor } from './messenger-list-page-size';
import { MessengerService } from './messenger.service';

@ApiTags('Messenger')
@ApiBearerAuth()
@Controller('messenger')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

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
