import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_MAIL_ACCOUNT_SYNC_STUB,
  MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
} from './mail-audit.constants';
import { recordMailAccountSyncStubOp } from './mail-account-sync-stub.ops';
import { toAccountRow } from './mail-dto-map';
import { MAIL_SYNC_STUB_REASON_NO_PROVIDER } from './mail-sync-stub.constants';
import type { MailAccountRow } from './mail.types';

@Injectable()
export class MailAccountCommandService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * MVP stub: updates sync timestamps only (no IMAP/Gmail job).
   */
  async recordMailAccountSyncStub(
    employeeId: string,
    accessScope: string,
    accountId: string,
  ): Promise<MailAccountRow> {
    const outcome = await recordMailAccountSyncStubOp(this.prisma, {
      employeeId,
      accessScope,
      accountId,
    });
    if (!outcome.ok) {
      throw new NotFoundException('Mail account not found');
    }
    const auditChanges: InputJsonValue = {
      reason: MAIL_SYNC_STUB_REASON_NO_PROVIDER,
      emailAddress: outcome.account.emailAddress,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
      entityId: accountId,
      action: MAIL_AUDIT_ACTION_MAIL_ACCOUNT_SYNC_STUB,
      userId: employeeId,
      changes: auditChanges,
    });
    return toAccountRow(outcome.account);
  }
}
