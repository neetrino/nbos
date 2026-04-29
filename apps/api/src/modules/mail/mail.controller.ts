import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import { MailService } from './mail.service';

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
  constructor(private readonly mailService: MailService) {}

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
  async listThreads(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Query('mailAccountId') mailAccountId?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.mailService.listThreads(user.id, req.permissionScope ?? 'OWN', {
      mailAccountId,
      unreadOnly: isQueryFlagTrue(unreadOnly),
    });
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
    return this.mailService.markThreadRead(user.id, req.permissionScope ?? 'OWN', threadId);
  }
}
