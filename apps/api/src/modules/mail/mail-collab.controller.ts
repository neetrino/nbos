import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MailAccountAccessRole } from '@nbos/database';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { AssignThreadDto } from './dto/assign-thread.dto';
import { BulkThreadActionDto } from './dto/bulk-thread-action.dto';
import { ComposeMailDto, ReplyMailDto } from './dto/compose-mail.dto';
import { ShareMailAccountDto, UpdateMailAccountAccessDto } from './dto/share-mail-account.dto';
import { MailAccountAccessService } from './mail-account-access.service';
import { MailComposeService } from './mail-compose.service';
import { MailThreadAssignmentService } from './mail-thread-assignment.service';
import { MailThreadCommandService } from './mail-thread-command.service';

type AuthedRequest = Request & { permissionScope?: string };

@ApiTags('Mail')
@ApiBearerAuth()
@Controller('mail')
export class MailCollabController {
  constructor(
    private readonly accessService: MailAccountAccessService,
    private readonly assignmentService: MailThreadAssignmentService,
    private readonly composeService: MailComposeService,
    private readonly threadCommandService: MailThreadCommandService,
  ) {}

  @Get('accounts/:accountId/access')
  @RequirePermission('MAIL', 'VIEW')
  @ApiOperation({ summary: 'List mailbox access entries (owner + shared users)' })
  listAccess(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
  ) {
    return this.accessService.listAccess(user.id, req.permissionScope ?? 'OWN', accountId);
  }

  @Post('accounts/:accountId/access')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Grant mailbox access to an NBOS user (owner/admin only)' })
  grantAccess(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
    @Body() body: ShareMailAccountDto,
  ) {
    return this.accessService.grantAccess(
      user.id,
      req.permissionScope ?? 'OWN',
      accountId,
      body.employeeId,
      MailAccountAccessRole[body.role],
    );
  }

  @Patch('accounts/:accountId/access/:employeeId')
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Change a user\u2019s mailbox access role (owner/admin only)' })
  updateAccess(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
    @Param('employeeId') targetEmployeeId: string,
    @Body() body: UpdateMailAccountAccessDto,
  ) {
    return this.accessService.updateRole(
      user.id,
      req.permissionScope ?? 'OWN',
      accountId,
      targetEmployeeId,
      MailAccountAccessRole[body.role],
    );
  }

  @Delete('accounts/:accountId/access/:employeeId')
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Revoke a user\u2019s mailbox access (owner/admin only)' })
  removeAccess(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
    @Param('employeeId') targetEmployeeId: string,
  ) {
    return this.accessService.removeAccess(
      user.id,
      req.permissionScope ?? 'OWN',
      accountId,
      targetEmployeeId,
    );
  }

  @Post('threads/:threadId/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Assign a thread to a user who has mailbox access' })
  assignThread(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body() body: AssignThreadDto,
  ) {
    return this.assignmentService.assignThread(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      body.employeeId,
    );
  }

  @Post('threads/:threadId/unassign')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Clear a thread assignment' })
  unassignThread(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ) {
    return this.assignmentService.unassignThread(user.id, req.permissionScope ?? 'OWN', threadId);
  }

  @Post('threads/:threadId/mark-unread')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Mark a thread unread (NBOS user state)' })
  markUnread(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ) {
    return this.threadCommandService.markThreadUnread(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
    );
  }

  @Post('threads/bulk-mark-read')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'VIEW')
  @ApiOperation({ summary: 'Bulk mark threads as read (NBOS + provider)' })
  bulkMarkRead(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Body() body: BulkThreadActionDto,
  ) {
    return this.threadCommandService.bulkMarkThreadsRead(
      user.id,
      req.permissionScope ?? 'OWN',
      body.threadIds,
    );
  }

  @Post('threads/bulk-mark-unread')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Bulk mark threads unread (NBOS user state)' })
  bulkMarkUnread(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Body() body: BulkThreadActionDto,
  ) {
    return this.threadCommandService.bulkMarkThreadsUnread(
      user.id,
      req.permissionScope ?? 'OWN',
      body.threadIds,
    );
  }

  @Post('threads/:threadId/mark-spam')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Mark a thread as spam (NBOS user state)' })
  markSpam(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
  ) {
    return this.threadCommandService.markThreadSpam(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
    );
  }

  @Post('compose')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Compose and send a new email from a mailbox (sender/admin/owner)' })
  compose(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Body() body: ComposeMailDto,
  ) {
    return this.composeService.composeNew(user.id, req.permissionScope ?? 'OWN', body);
  }

  @Post('threads/:threadId/reply')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Reply within a thread and send (sender/admin/owner)' })
  reply(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Body() body: ReplyMailDto,
  ) {
    return this.composeService.reply(user.id, req.permissionScope ?? 'OWN', threadId, body);
  }
}
