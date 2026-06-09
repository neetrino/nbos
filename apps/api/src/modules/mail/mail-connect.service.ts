import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailSyncLogKind, PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_MAIL_ACCOUNT_CONNECTED,
  MAIL_AUDIT_ACTION_MAIL_ACCOUNT_DISCONNECTED,
  MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
} from './mail-audit.constants';
import type { ConnectCorporateMailboxDto } from './dto/connect-corporate-mailbox.dto';
import { mailRoleCanManageAccess } from './mail-access.policy';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';
import { toAccountRow } from './mail-dto-map';
import { MailQueueService } from './mail-queue.service';
import { MailSyncService } from './mail-sync.service';
import { ImapSmtpProviderAdapter } from './providers/imap-smtp.adapter';
import { isSecureModeTls } from './providers/mail-provider-adapter.factory';
import { MailProviderSecretStore } from './providers/mail-provider-secret.store';
import type { MailAccountRow } from './mail.types';

@Injectable()
export class MailConnectService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly secretStore: MailProviderSecretStore,
    private readonly queueService: MailQueueService,
    private readonly syncService: MailSyncService,
    private readonly auditService: AuditService,
  ) {}

  async connectCorporate(
    employeeId: string,
    dto: ConnectCorporateMailboxDto,
  ): Promise<MailAccountRow> {
    const adapter = new ImapSmtpProviderAdapter({
      emailAddress: dto.email,
      displayName: dto.displayName ?? null,
      login: dto.login,
      password: dto.password,
      imapHost: dto.imapHost,
      imapPort: dto.imapPort,
      imapSecure: isSecureModeTls(dto.imapSecure),
      smtpHost: dto.smtpHost,
      smtpPort: dto.smtpPort,
      smtpSecure: isSecureModeTls(dto.smtpSecure),
    });
    const validation = await adapter.validateConnection();
    if (!validation.ok) {
      throw new BadRequestException(validation.error ?? 'Mailbox validation failed');
    }
    const account = await this.persistCorporateMailbox(employeeId, dto);
    await this.secretStore.store(account.id, { kind: 'corporate', password: dto.password });
    await this.afterConnect(account.id, employeeId, dto.email, 'CORPORATE_IMAP_SMTP');
    return toAccountRow(account);
  }

  private async persistCorporateMailbox(employeeId: string, dto: ConnectCorporateMailboxDto) {
    return this.prisma.mailAccount.create({
      data: {
        ownerEmployeeId: employeeId,
        createdByEmployeeId: employeeId,
        emailAddress: dto.email,
        displayName: dto.displayName ?? null,
        providerType: 'CORPORATE_IMAP_SMTP',
        status: 'ACTIVE',
        providerConnection: {
          create: {
            providerType: 'CORPORATE_IMAP_SMTP',
            status: 'CONNECTED',
            username: dto.login,
            imapHost: dto.imapHost,
            imapPort: dto.imapPort,
            secureMode: dto.imapSecure,
            smtpHost: dto.smtpHost,
            smtpPort: dto.smtpPort,
            smtpSecureMode: dto.smtpSecure,
            lastValidatedAt: new Date(),
          },
        },
      },
      include: { providerConnection: true },
    });
  }

  /** Shared post-connect side effects: audit, sync log, and initial sync kick-off. */
  async afterConnect(
    mailAccountId: string,
    employeeId: string,
    emailAddress: string,
    providerType: string,
  ): Promise<void> {
    const changes: InputJsonValue = { emailAddress, providerType };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
      entityId: mailAccountId,
      action: MAIL_AUDIT_ACTION_MAIL_ACCOUNT_CONNECTED,
      userId: employeeId,
      changes,
    });
    await this.prisma.mailSyncLog.create({
      data: { mailAccountId, kind: MailSyncLogKind.CONNECTION_VALIDATED },
    });
    await this.triggerSyncNow(mailAccountId);
  }

  async triggerSync(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
  ): Promise<{ queued: boolean }> {
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded) {
      throw new NotFoundException('Mail account not found');
    }
    return { queued: await this.triggerSyncNow(mailAccountId) };
  }

  private async triggerSyncNow(mailAccountId: string): Promise<boolean> {
    const queued = await this.queueService.enqueueSync(mailAccountId);
    if (!queued) {
      // No Redis/queue in this environment: run the sync inline (dev fallback).
      await this.syncService.syncAccount(mailAccountId);
    }
    return queued;
  }

  async disconnect(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
  ): Promise<MailAccountRow> {
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded) {
      throw new NotFoundException('Mail account not found');
    }
    if (!mailRoleCanManageAccess(loaded.role)) {
      throw new ForbiddenException('You cannot disconnect this mailbox');
    }
    await this.secretStore.delete(mailAccountId);
    const updated = await this.prisma.mailAccount.update({
      where: { id: mailAccountId },
      data: { status: 'DISABLED', providerConnection: { update: { status: 'NOT_CONNECTED' } } },
      include: { providerConnection: true },
    });
    const changes: InputJsonValue = { emailAddress: updated.emailAddress };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MAIL_ACCOUNT,
      entityId: mailAccountId,
      action: MAIL_AUDIT_ACTION_MAIL_ACCOUNT_DISCONNECTED,
      userId: employeeId,
      changes,
    });
    return toAccountRow(updated);
  }
}
