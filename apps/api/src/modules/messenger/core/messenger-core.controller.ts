import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { CreateCoreConversationDto } from './dto/create-core-conversation.dto';
import { CreateCoreLinkDto } from './dto/create-core-link.dto';
import { CreateCoreReferenceDto } from './dto/create-core-reference.dto';
import { GrantCoreAccessOverrideDto } from './dto/grant-core-override.dto';
import { InviteCoreParticipantDto } from './dto/invite-core-participant.dto';
import { SendCoreMessageDto } from './dto/send-core-message.dto';
import { MessengerCoreService } from './messenger-core.service';

@ApiTags('Messenger Core')
@ApiBearerAuth()
@Controller('messenger/core')
export class MessengerCoreController {
  constructor(private readonly core: MessengerCoreService) {}

  @Post('conversations')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Create a canonical Messaging Core conversation' })
  createConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateCoreConversationDto,
  ) {
    return this.core.createConversation({
      zone: body.zone,
      type: body.type,
      title: body.title,
      createdById: user.id,
      peerEmployeeId: body.peerEmployeeId,
      participantIds: body.participantIds,
    });
  }

  @Get('conversations/:id')
  @RequirePermission('MESSENGER', 'VIEW')
  @ApiOperation({ summary: 'Read a canonical Messaging Core conversation' })
  getConversation(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.core.getConversation(id, user.id);
  }

  @Post('conversations/:id/messages')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({
    summary: 'Persist an Internal Core message (does not send to external providers)',
  })
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SendCoreMessageDto,
  ) {
    return this.core.persistAndBroadcast({
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
  @ApiOperation({ summary: 'Mark a Core conversation read for the current employee' })
  markRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.core.markRead(id, user.id);
  }

  @Post('conversations/:id/links')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Add a ConversationLink (does not grant ACL)' })
  addLink(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateCoreLinkDto,
  ) {
    return this.core.addLink(id, user.id, {
      entityType: body.entityType,
      entityId: body.entityId,
      relationType: body.relationType,
    });
  }

  @Post('messages/references')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Create a MessageReference to a canonical source message' })
  addReference(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateCoreReferenceDto) {
    if (body.purpose === 'FORWARD' && !body.targetMessageId && !body.referencedByMessageId) {
      throw new ForbiddenException('Forward references require a holder message');
    }
    return this.core.addReference(user.id, body);
  }

  @Post('conversations/:id/participants')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Invite an employee; READ_ONLY does not grant SEND' })
  inviteParticipant(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: InviteCoreParticipantDto,
  ) {
    return this.core.inviteParticipant(id, user.id, body.employeeId, body.role ?? 'READ_ONLY');
  }

  @Delete('conversations/:id/participants/:employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Revoke conversation membership' })
  revokeParticipant(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.core.revokeParticipant(id, user.id, employeeId);
  }

  @Post('conversations/:id/access-overrides')
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Explicit management override (VIEW never becomes Client SEND)' })
  grantAccessOverride(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: GrantCoreAccessOverrideDto,
  ) {
    return this.core.grantAccessOverride(id, user.id, body.employeeId, body.level, body.reason);
  }

  @Delete('conversations/:id/access-overrides/:employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('MESSENGER', 'EDIT')
  @ApiOperation({ summary: 'Revoke a management override' })
  revokeAccessOverride(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.core.revokeAccessOverride(id, user.id, employeeId);
  }
}
