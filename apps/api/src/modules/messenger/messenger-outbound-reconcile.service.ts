import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { WhatsAppOutboundQueueService } from '../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { MessengerDeliveryStatusBus } from './core/messenger-delivery-status-bus';
import {
  reconcileMessengerOutboundCommands,
  type MessengerOutboundReconcileCounts,
} from './core/messenger-outbound-reconcile.ops';

@Injectable()
export class MessengerOutboundReconcileService {
  private readonly logger = new Logger(MessengerOutboundReconcileService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly outbound: WhatsAppOutboundQueueService,
    private readonly delivery: MessengerDeliveryStatusBus,
  ) {}

  async reconcile(): Promise<MessengerOutboundReconcileCounts> {
    const result = await reconcileMessengerOutboundCommands(
      this.prisma,
      this.outbound,
      new Date(),
      this.delivery,
    );
    this.logger.log(
      `reconcile done scanned=${result.scanned} enqueued=${result.enqueued} repaired=${result.repaired} manualReview=${result.manualReview} invalid=${result.invalid} errors=${result.errors}`,
    );
    return result;
  }
}
