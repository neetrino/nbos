import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { CreateInternalConversationDto } from './dto/create-internal-conversation.dto';
import { ListCoreMessagesQueryDto } from './dto/list-core-messages.query';
import { ListInternalConversationsQueryDto } from './dto/list-internal-conversations.query';
import { SendCoreMessageDto } from './dto/send-core-message.dto';
import { MessengerCoreInternalService } from './messenger-core-internal.service';

@ApiTags('Messenger Core Internal')
@ApiBearerAuth()
@Controller('messenger/core/internal')
export class MessengerCoreInternalController {
  constructor(private readonly internal: MessengerCoreInternalService) {}

  @Post('legacy-map')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({
    summary: 'Idempotent Channel/DM → Core mapping (one-way cutover, no dual-write)',
  })
  mapLegacy(@CurrentUser() _user: CurrentUserPayload) {
    return this.internal.mapLegacyInternal();
  }

  @Get('conversations')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List accessible Internal conversations (never Client zone)' })
  listConversations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListInternalConversationsQueryDto,
  ) {
    return this.internal.listConversations(user.id, query);
  }

  @Post('conversations')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Create Internal Group or Direct on Core' })
  createConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateInternalConversationDto,
  ) {
    return this.internal.createConversation(user.id, body);
  }

  @Get('conversations/:id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Open an Internal conversation; Client zone is rejected' })
  getConversation(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.internal.getConversation(id, user.id);
  }

  @Get('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'List Internal conversation messages from Core' })
  listMessages(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListCoreMessagesQueryDto,
  ) {
    return this.internal.listMessages(id, user.id, query);
  }

  @Post('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Persist an Internal Core message (not Channel/DM tables)' })
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SendCoreMessageDto,
  ) {
    return this.internal.persistMessage({
      conversationId: id,
      senderId: user.id,
      content: body.content,
      fileAssetIds: body.fileAssetIds,
      replyToMessageId: body.replyToMessageId,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Mark an Internal Core conversation read' })
  markRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.internal.markRead(id, user.id);
  }

  @Post('conversations/:id/favorite')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Toggle built-in Internal Favorites (PERSONAL Collection)' })
  toggleFavorite(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.internal.toggleFavorite(id, user.id);
  }
}
