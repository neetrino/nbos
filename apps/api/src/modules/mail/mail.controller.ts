import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { MailService } from './mail.service';

type AuthedRequest = Request & { permissionScope?: string };

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
  async listThreads(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Query('mailAccountId') mailAccountId?: string,
  ) {
    return this.mailService.listThreads(user.id, req.permissionScope ?? 'OWN', mailAccountId);
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
}
