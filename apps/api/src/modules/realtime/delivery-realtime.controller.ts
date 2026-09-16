import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser, type CurrentUserPayload, SkipTransform } from '../../common/decorators';
import { DeliverySseHub } from './delivery-sse.hub';

@ApiTags('Realtime')
@ApiBearerAuth()
@SkipThrottle()
@SkipTransform()
@Controller('realtime')
export class DeliveryRealtimeController {
  constructor(private readonly sseHub: DeliverySseHub) {}

  @Get('delivery')
  @ApiOperation({
    summary: 'SSE stream for delivery-board item invalidation',
    description:
      'Authenticated text/event-stream. Invalidation only; clients refetch via authorized REST.',
  })
  stream(
    @CurrentUser() user: CurrentUserPayload,
    @Req() _req: Request,
    @Res({ passthrough: false }) res: Response,
  ): void {
    this.sseHub.attach(user.id, res);
  }
}
