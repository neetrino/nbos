import { Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { MailAttachmentMutationService } from './mail-attachment-mutation.service';

type AuthedRequest = Request & { permissionScope?: string };

@ApiTags('Mail')
@ApiBearerAuth()
@Controller('mail')
export class MailAttachmentController {
  constructor(private readonly mailAttachmentMutationService: MailAttachmentMutationService) {}

  @Post('threads/:threadId/messages/:messageId/attachments/:attachmentId/retry-download')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({
    summary: 'Retry inbound attachment download (FAILED → PENDING, or re-enqueue stuck PENDING)',
  })
  async retryAttachmentDownload(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.mailAttachmentMutationService.retryAttachmentDownload(
      user.id,
      req.permissionScope ?? 'OWN',
      threadId,
      messageId,
      attachmentId,
    );
  }
}
