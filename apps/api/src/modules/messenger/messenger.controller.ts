import { Controller, Get, Post, Param, Query, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CreateMessengerChannelDto } from './dto/create-messenger-channel.dto';
import { SendMessengerChannelMessageDto } from './dto/send-messenger-channel-message.dto';
import { SendMessengerDmDto } from './dto/send-messenger-dm.dto';
import { messengerUserDisplayName } from './messenger-user-display-name';
import { MessengerService } from './messenger.service';

@ApiTags('Messenger')
@ApiBearerAuth()
@Controller('messenger')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Get('channels')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List all channels' })
  getChannels() {
    return this.messengerService.getChannels();
  }

  @Post('channels')
  @RequirePermission('MESSENGER', 'ADD')
  @ApiOperation({ summary: 'Create a channel' })
  createChannel(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateMessengerChannelDto) {
    return this.messengerService.createChannel(body.name, body.projectId, body.type, user.id);
  }

  @Get('channels/:id/messages')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Get messages in a channel' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.messengerService.getMessages(id, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
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
    );
  }

  @Get('dm/conversations')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List DM conversations for the current user' })
  getConversations(@CurrentUser() user: CurrentUserPayload) {
    return this.messengerService.getDirectConversations(user.id);
  }

  @Get('dm/:userId1/:userId2')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Get direct messages between two users (one must be you)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getDirectMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (user.id !== userId1 && user.id !== userId2) {
      throw new ForbiddenException('You may only read your own direct messages');
    }
    return this.messengerService.getDirectMessages(userId1, userId2, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
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
    );
  }
}
