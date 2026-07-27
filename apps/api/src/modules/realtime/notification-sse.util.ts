import type { Response } from 'express';
import type { SseOutboundFrame } from './notification-realtime.types';

export function applySseResponseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

export function writeSseComment(res: Response, comment: string): void {
  if (res.writableEnded) {
    return;
  }
  res.write(`: ${comment}\n\n`);
}

export function writeSseFrame(res: Response, frame: SseOutboundFrame): void {
  if (res.writableEnded) {
    return;
  }
  res.write(`event: ${frame.event}\n`);
  res.write(`id: ${frame.id}\n`);
  res.write(`data: ${frame.data}\n\n`);
}
