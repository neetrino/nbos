import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { MessengerService } from './messenger.service';

@ApiTags('Messenger')
@ApiBearerAuth()
@Controller('messenger')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Get('channels')
  @Public()
  @ApiOperation({ summary: 'List all channels' })
  getChannels() {
    return this.messengerService.getChannels();
  }

  @Post('channels')
  @Public()
  @ApiOperation({ summary: 'Create a channel' })
  createChannel(
    @Body()
    body: {
      name: string;
      projectId: string;
      type: 'project' | 'general' | 'announcement';
    },
  ) {
    return this.messengerService.createChannel(body.name, body.projectId, body.type);
  }

  @Get('channels/:id/messages')
  @Public()
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
  @Public()
  @ApiOperation({ summary: 'Send a message to a channel' })
  sendMessage(
    @Param('id') id: string,
    @Body() body: { senderId: string; senderName: string; content: string },
  ) {
    return this.messengerService.sendMessage(id, body.senderId, body.senderName, body.content);
  }

  @Get('dm/conversations/:userId')
  @Public()
  @ApiOperation({ summary: 'List DM conversations for a user' })
  getConversations(@Param('userId') userId: string) {
    return this.messengerService.getDirectConversations(userId);
  }

  @Get('dm/:userId1/:userId2')
  @Public()
  @ApiOperation({ summary: 'Get direct messages between two users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getDirectMessages(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.messengerService.getDirectMessages(userId1, userId2, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post('dm')
  @Public()
  @ApiOperation({ summary: 'Send a direct message' })
  sendDirectMessage(
    @Body()
    body: {
      senderId: string;
      senderName: string;
      recipientId: string;
      content: string;
    },
  ) {
    return this.messengerService.sendDirectMessage(
      body.senderId,
      body.senderName,
      body.recipientId,
      body.content,
    );
  }
}
