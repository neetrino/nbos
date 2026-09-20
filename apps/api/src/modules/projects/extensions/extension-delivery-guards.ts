import { BadRequestException } from '@nestjs/common';
import type { DeliveryRealtimePublisher } from '../../realtime/delivery-realtime.publisher';
import { requireDeliveryStage } from '../delivery-lifecycle';

export function ensureNotTerminal(resolution: string | null) {
  if (resolution) {
    throw new BadRequestException('Terminal delivery item cannot be changed');
  }
}

export function ensureActiveForStageMove(lifecycle: {
  resolution: string | null;
  workStatus: string;
}) {
  ensureNotTerminal(lifecycle.resolution);
  if (lifecycle.workStatus === 'ON_HOLD') {
    throw new BadRequestException('Paused extension must be resumed before stage movement');
  }
}

export function parseDeliveryStage(stage: string) {
  try {
    return requireDeliveryStage(stage);
  } catch {
    throw new BadRequestException(`Invalid delivery stage: ${stage}`);
  }
}

export async function publishExtensionChanged(
  deliveryRealtime: DeliveryRealtimePublisher,
  entityId: string,
): Promise<void> {
  await deliveryRealtime.publishItemChanged('extension', entityId);
}
