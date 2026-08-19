import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
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
import type { ReconnectCorporateMailboxDto } from './dto/reconnect-corporate-mailbox.dto';
import { mailRoleCanManageAccess } from './mail-access.policy';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';
import {
  promoteCorporateMailboxConnected,
  resolveCorporateReconnectSettings,
  upsertCorporateMailboxDraft,
  writeCorporateMailboxDraft,
} from './mail-connect-corporate.ops';
import {
  mailboxNeedsReconnectException,
  validateCorporateMailbox,
} from './mail-connect-validate.ops';
import { toAccountRow } from './mail-dto-map';
import { isMailProductionRuntime } from './mail-outbound-dispatch';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { markMailboxNeedsReconnect } from './mail-send-outcome.ops';
import { dispatchManualMailSync, enqueueMailSyncBestEffort } from './mail-sync-dispatch';
import { MailQueueService } from './mail-queue.service';
import { MailSyncService } from './mail-sync.service';
import { MailProviderSecretStore } from './providers/mail-provider-secret.store';
import type { MailAccountRow } from './mail.types';

@Injectable()
export class MailConnectService {
  private readonly logger = new Logger(MailConnectService.name);

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
    const account = await upsertCorporateMailboxDraft(this.prisma, employeeId, dto);
    await this.secretStore.store(account.id, { kind: 'corporate', password: dto.password });
    return this.validateAndActivate(account.id, employeeId, dto, dto.password);
  }

  async reconnectCorporate(
    employeeId: string,
    viewScope: string,
    mailAccountId: string,
    dto: ReconnectCorporateMailboxDto,
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
      throw new ForbiddenException('You cannot reconnect this mailbox');
    }
    if (loaded.account.providerType !== 'CORPORATE_IMAP_SMTP') {
      throw new BadRequestException('Only corporate IMAP/SMTP mailboxes can reconnect here');
    }
    const settings = await this.mergeReconnectSettings(mailAccountId, loaded.account, dto);
    const password = await this.resolveReconnectPassword(mailAccountId, dto.password);
    await writeCorporateMailboxDraft(this.prisma, mailAccountId, settings);
    if (dto.password) {
      await this.secretStore.store(mailAccountId, { kind: 'corporate', password: dto.password });
    }
    return this.validateAndActivate(mailAccountId, employeeId, settings, password);
  }

  private async validateAndActivate(
    mailAccountId: string,
    employeeId: string,
    settings: Parameters<typeof validateCorporateMailbox>[0],
    password: string,
  ): Promise<MailAccountRow> {
    const validation = await validateCorporateMailbox(settings, password);
    if (!validation.ok) {
      const detail = validation.error ?? 'Mailbox validation failed';
      await markMailboxNeedsReconnect(this.prisma, mailAccountId, detail);
      throw mailboxNeedsReconnectException(mailAccountId, detail);
    }
    const promoted = await promoteCorporateMailboxConnected(this.prisma, mailAccountId);
    await this.afterConnect(mailAccountId, employeeId, settings.email, 'CORPORATE_IMAP_SMTP');
    return toAccountRow(promoted);
  }

  private async mergeReconnectSettings(
    mailAccountId: string,
    account: { emailAddress: string; displayName: string | null },
    dto: ReconnectCorporateMailboxDto,
  ) {
    const connection = await this.prisma.mailProviderConnection.findUnique({
      where: { mailAccountId },
    });
    const resolved = resolveCorporateReconnectSettings({ account, connection, patch: dto });
    if ('error' in resolved) {
      throw new BadRequestException(resolved.error);
    }
    return resolved;
  }

  private async resolveReconnectPassword(
    mailAccountId: string,
    password: string | undefined,
  ): Promise<string> {
    if (password) {
      return password;
    }
    const secret = await this.secretStore.read(mailAccountId);
    if (secret?.kind === 'corporate' && secret.password) {
      return secret.password;
    }
    throw new BadRequestException('Password is required to reconnect this mailbox');
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
    const queued = await enqueueMailSyncBestEffort({
      queue: this.queueService,
      syncService: this.syncService,
      logger: this.logger,
      mailAccountId,
      allowLocalInline: false,
    });
    this.kickLocalInlineSyncIfNeeded(queued, mailAccountId);
  }

  /** Local without Redis: start sync after HTTP returns. Never block connect. */
  private kickLocalInlineSyncIfNeeded(queued: boolean, mailAccountId: string): void {
    if (queued || isMailProductionRuntime()) {
      return;
    }
    this.logger.warn(`${MAIL_INLINE_FALLBACK_LOG} mailAccountId=${mailAccountId}`);
    void this.syncService.syncAccount(mailAccountId).catch((caught: unknown) => {
      this.logger.error(`Local inline mail sync failed for ${mailAccountId}`, caught);
    });
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
    return {
      queued: await dispatchManualMailSync({
        queue: this.queueService,
        syncService: this.syncService,
        logger: this.logger,
        mailAccountId,
      }),
    };
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
    await this.prisma.mailAccount.update({
      where: { id: mailAccountId },
      data: { status: 'DISABLED' },
    });
    await this.prisma.mailProviderConnection.updateMany({
      where: { mailAccountId },
      data: { status: 'NOT_CONNECTED' },
    });
    const updated = await this.prisma.mailAccount.findUniqueOrThrow({
      where: { id: mailAccountId },
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
