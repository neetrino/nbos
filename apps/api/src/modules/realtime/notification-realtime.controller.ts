import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser, type CurrentUserPayload, SkipTransform } from '../../common/decorators';
import { NotificationSseHub } from './notification-sse.hub';

@ApiTags('Realtime')
@ApiBearerAuth()
@SkipThrottle()
@SkipTransform()
@Controller('realtime')
export class NotificationRealtimeController {
  constructor(private readonly sseHub: NotificationSseHub) {}

  @Get('notifications')
  @ApiOperation({
    summary: 'SSE stream for notification unread badge + list invalidation',
    description: 'Authenticated text/event-stream. Employee id is taken from the JWT/session only.',
  })
  stream(
    @CurrentUser() user: CurrentUserPayload,
    @Req() _req: Request,
    @Res({ passthrough: false }) res: Response,
  ): void {
    this.sseHub.attach(user.id, res);
  }
}
