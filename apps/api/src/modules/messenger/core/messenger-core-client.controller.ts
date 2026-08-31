import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { InviteClientReadOnlyDto } from './dto/invite-client-read-only.dto';
import { ListClientConversationsQueryDto } from './dto/list-client-conversations.query';
import { ListCoreMessagesQueryDto } from './dto/list-core-messages.query';
import { SendCoreMessageDto } from './dto/send-core-message.dto';
import { MessengerCoreClientService } from './messenger-core-client.service';

@ApiTags('Messenger Core Client')
@ApiBearerAuth()
@Controller('messenger/core/client')
export class MessengerCoreClientController {
  constructor(private readonly client: MessengerCoreClientService) {}

  @Post('meta-map')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({
    summary: 'Idempotent MetaConversation/MetaMessage → Core Client Sales (ops-only)',
  })
  mapMeta(@CurrentUser() _user: CurrentUserPayload) {
    return this.client.mapMetaSales();
  }

  @Get('conversations')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List accessible Client conversations (never Internal zone)' })
  listConversations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListClientConversationsQueryDto,
  ) {
    return this.client.listConversations(user.id, query);
  }

  @Get('conversations/:id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Open a Client conversation; Internal zone is rejected' })
  getConversation(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.client.getConversation(id, user.id);
  }

  @Get('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List Client conversation messages from Core' })
  listMessages(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListCoreMessagesQueryDto,
  ) {
    return this.client.listMessages(id, user.id, query);
  }

  @Post('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({
    summary: 'Persist a Client Core message when canSend is true (not MESSENGER.EDIT)',
  })
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SendCoreMessageDto,
  ) {
    return this.client.persistMessage({
      conversationId: id,
      senderId: user.id,
      content: body.content,
      fileAssetIds: body.fileAssetIds,
      replyToMessageId: body.replyToMessageId,
      mentionedEmployeeIds: body.mentionedEmployeeIds,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Mark a Client Core conversation read' })
  markRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.client.markRead(id, user.id);
  }

  @Post('conversations/:id/favorite')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Toggle built-in Client Favorites (PERSONAL Collection)' })
  toggleFavorite(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.client.toggleFavorite(id, user.id);
  }

  @Post('conversations/:id/participants')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Invite a read-only specialist; cannot grant SEND' })
  inviteReadOnly(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: InviteClientReadOnlyDto,
  ) {
    return this.client.inviteReadOnly(id, user.id, body.employeeId);
  }
}
