import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { purgeTrashedCredentialsPastRetention } from './credential-trash-purge.ops';

@Injectable()
export class CredentialsTrashPurgeService {
  private readonly logger = new Logger(CredentialsTrashPurgeService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async runRetentionPurge(now = new Date()) {
    const result = await purgeTrashedCredentialsPastRetention(this.prisma, this.auditService, now);
    this.logger.log(
      `Credential trash retention purge: ${result.purged} purged (${result.candidateIds.length} candidates).`,
    );
    return result;
  }
}
