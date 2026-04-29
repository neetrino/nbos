import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import { PatchMailThreadDto } from './dto/patch-mail-thread.dto';
import { MailService } from './mail.service';
import { MailThreadCommandService } from './mail-thread-command.service';

type AuthedRequest = Request & { permissionScope?: string };

function isQueryFlagTrue(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  const v = value.toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

@ApiTags('Mail')
@ApiBearerAuth()
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly mailThreadCommandService: MailThreadCommandService,
  ) {}

  @Get('accounts')
  @RequirePermission('MAIL', 'VIEW')
  @ApiOperation({ summary: 'List mail accounts visible to the current employee' })
  async listAccounts(@CurrentUser() user: CurrentUserPayload, @Req() req: AuthedRequest) {
    return this.mailService.listAccounts(user.id, req.permissionScope ?? 'OWN');
  }

  @Get('threads')
  @RequirePermission('MAIL', 'VIEW')
  @ApiOperation({ summary: 'List email threads for accessible mailboxes' })
  @ApiQuery({ name: 'mailAccountId', required: false })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    description: 'If true, only threads with hasUnread',
  })
  @ApiQuery({
    name: 'needsLinkOnly',
    required: false,
    description: 'If true, only threads with needsBusinessLink',
  })
  async listThreads(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Query('mailAccountId') mailAccountId?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('needsLinkOnly') needsLinkOnly?: string,
  ) {
    return this.mailService.listThreads(user.id, req.permissionScope ?? 'OWN', {
      mailAccountId,
      unreadOnly: isQueryFlagTrue(unreadOnly),
      needsLinkOnly: isQueryFlagTrue(needsLinkOnly),
    });
  }

  @Patch('threads/:threadId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({
    summary: 'Update thread flags (MVP: needsBusinessLink only)',
  })
  async patchThread(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body() body: PatchMailThreadDto,
  ) {
    return this.mailThreadCommandService.patchThread(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      body,
    );
  }

  @Get('threads/:threadId')
  @RequirePermission('MAIL', 'VIEW')
  @ApiOperation({ summary: 'Get thread detail with messages and recipients' })
  async getThread(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ) {
    return this.mailService.getThreadDetail(user.id, req.permissionScope ?? 'OWN', threadId);
  }

  @Post('threads/:threadId/messages/:messageId/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({
    summary: 'Cancel outbound draft or queued message (DRAFT|QUEUED → CANCELLED; no provider)',
  })
  async cancelOutboundDraftOrQueued(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.mailService.cancelOutboundDraftOrQueued(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      messageId,
    );
  }

  @Post('threads/:threadId/messages/:messageId/reset-failed-to-draft')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({
    summary: 'Reset failed outbound message to DRAFT for local edit and re-queue (no provider)',
  })
  async resetFailedOutboundToDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.mailService.resetFailedOutboundToDraft(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      messageId,
    );
  }

  @Post('threads/:threadId/messages/:messageId/finalize-send-stub')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({
    summary: 'Stub finalize queued send (QUEUED → FAILED; no mail provider or worker in this MVP)',
  })
  async finalizeQueuedOutboundStub(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.mailService.finalizeQueuedOutboundStub(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      messageId,
    );
  }

  @Post('threads/:threadId/messages/:messageId/queue')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({
    summary: 'Queue outbound draft for send (DRAFT → QUEUED; no SMTP or worker yet)',
  })
  async queueOutboundDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.mailService.queueOutboundDraft(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      messageId,
    );
  }

  @Post('threads/:threadId/drafts')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Create outbound draft message in thread (no SMTP send)' })
  async createOutboundDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body() body: CreateMailOutboundDraftDto,
  ) {
    return this.mailService.createOutboundDraft(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      body,
    );
  }

  @Post('threads/:threadId/mark-read')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Mark all messages in a thread as read (NBOS state)' })
  async markThreadRead(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ) {
    return this.mailThreadCommandService.markThreadRead(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
    );
  }
}
