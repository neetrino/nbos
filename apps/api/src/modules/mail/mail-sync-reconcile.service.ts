import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { enqueueSyncForActiveMailboxes } from './mail-sync-reconcile.ops';
import { MailQueueService } from './mail-queue.service';

export interface MailSyncReconcileResult {
  enqueued: number;
}

@Injectable()
export class MailSyncReconcileService {
  private readonly logger = new Logger(MailSyncReconcileService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queue: MailQueueService,
  ) {}

  async enqueueActiveMailboxSyncs(): Promise<MailSyncReconcileResult> {
    const enqueued = await enqueueSyncForActiveMailboxes({
      prisma: this.prisma,
      enqueueSync: (mailAccountId) => this.queue.enqueueSync(mailAccountId),
    });
    this.logger.log(`mail-sync-reconcile enqueued=${enqueued}`);
    return { enqueued };
  }
}
