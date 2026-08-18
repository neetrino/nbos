import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { createTransport } from 'nodemailer';
import { MailAttachmentPermanentError } from '../mail-provider-error.classify';
import { extractImapAttachment } from './imap-message.attachments';
import { normalizeParsedMail } from './imap-message.normalize';
import { buildImapFetchPlan, resolveImapLastUid, type ImapFetchPlan } from './imap-fetch-plan';
import type {
  DownloadedAttachment,
  FetchDeltaResult,
  MailProviderAdapter,
  MarkThreadReadInput,
  NormalizedMessage,
  ProviderSyncCursor,
  SendMessageInput,
  SendMessageResult,
  ValidateConnectionResult,
  ProviderHealth,
  WatchOrIdleResult,
} from './mail-provider-adapter';

export interface ImapSmtpProviderConfig {
  emailAddress: string;
  displayName: string | null;
  login: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
}

/** Corporate mailbox adapter: IMAP for receive/sync, SMTP for send. No app-password concept. */
export class ImapSmtpProviderAdapter implements MailProviderAdapter {
  constructor(private readonly config: ImapSmtpProviderConfig) {}

  private createImapClient(): ImapFlow {
    return new ImapFlow({
      host: this.config.imapHost,
      port: this.config.imapPort,
      secure: this.config.imapSecure,
      auth: { user: this.config.login, pass: this.config.password },
      logger: false,
    });
  }

  private createSmtpTransport() {
    return createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpSecure,
      auth: { user: this.config.login, pass: this.config.password },
    });
  }

  async validateConnection(): Promise<ValidateConnectionResult> {
    const imapResult = await this.validateImap();
    if (!imapResult.ok) {
      return imapResult;
    }
    return this.validateSmtp();
  }

  private async validateImap(): Promise<ValidateConnectionResult> {
    const client = this.createImapClient();
    try {
      await client.connect();
      await client.logout();
      return { ok: true, providerAccountId: this.config.login };
    } catch (error) {
      return { ok: false, error: `IMAP validation failed: ${describeError(error)}` };
    }
  }

  private async validateSmtp(): Promise<ValidateConnectionResult> {
    const transport = this.createSmtpTransport();
    try {
      await transport.verify();
      return { ok: true, providerAccountId: this.config.login };
    } catch (error) {
      return { ok: false, error: `SMTP validation failed: ${describeError(error)}` };
    } finally {
      transport.close();
    }
  }

  async startWatchOrIdle(): Promise<WatchOrIdleResult> {
    return {};
  }

  async fetchDelta(cursor: ProviderSyncCursor): Promise<FetchDeltaResult> {
    const client = this.createImapClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      return await this.fetchDeltaLocked(client, cursor);
    } finally {
      lock.release();
      await client.logout();
    }
  }

  private async fetchDeltaLocked(
    client: ImapFlow,
    cursor: ProviderSyncCursor,
  ): Promise<FetchDeltaResult> {
    const mailbox = client.mailbox;
    if (!mailbox || typeof mailbox === 'boolean') {
      return { messages: [], cursor };
    }
    const uidValidity = String(mailbox.uidValidity);
    const lastUid = resolveImapLastUid(cursor, uidValidity);
    const plan = buildImapFetchPlan(lastUid, Number(mailbox.exists));
    if (!plan) {
      return {
        messages: [],
        cursor: { imapUidValidity: uidValidity, imapLastUid: String(lastUid) },
      };
    }
    const { messages, maxUid } = await this.collectMessages(client, plan, lastUid);
    return {
      messages,
      cursor: { imapUidValidity: uidValidity, imapLastUid: String(Math.max(lastUid, maxUid)) },
    };
  }

  private async collectMessages(
    client: ImapFlow,
    plan: ImapFetchPlan,
    lastUid: number,
  ): Promise<{ messages: NormalizedMessage[]; maxUid: number }> {
    const messages: NormalizedMessage[] = [];
    let maxUid = lastUid;
    for await (const item of client.fetch(
      plan.range,
      { uid: true, source: true },
      { uid: plan.useUid },
    )) {
      if (item.uid <= lastUid || !item.source) {
        continue;
      }
      const parsed = await simpleParser(item.source);
      messages.push(normalizeParsedMail(parsed, item.uid));
      maxUid = Math.max(maxUid, item.uid);
    }
    return { messages, maxUid };
  }

  private async fetchParsedByUid(uid: number): Promise<ParsedMail | null> {
    const client = this.createImapClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const item = await client.fetchOne(String(uid), { uid: true, source: true }, { uid: true });
      if (!item || !item.source) {
        return null;
      }
      return simpleParser(item.source);
    } finally {
      lock.release();
      await client.logout();
    }
  }

  async fetchMessage(providerMessageId: string): Promise<NormalizedMessage | null> {
    const uid = Number(providerMessageId);
    if (!Number.isFinite(uid)) {
      return null;
    }
    const parsed = await this.fetchParsedByUid(uid);
    return parsed ? normalizeParsedMail(parsed, uid) : null;
  }

  async downloadAttachment(input: {
    providerMessageId: string;
    providerAttachmentId: string;
  }): Promise<DownloadedAttachment> {
    const uid = Number(input.providerMessageId);
    if (!Number.isFinite(uid)) {
      throw new MailAttachmentPermanentError('Invalid IMAP UID for attachment download');
    }
    const parsed = await this.fetchParsedByUid(uid);
    if (!parsed) {
      throw new MailAttachmentPermanentError('IMAP message not found for attachment download');
    }
    return extractImapAttachment(parsed, input.providerAttachmentId);
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const transport = this.createSmtpTransport();
    try {
      const info = await transport.sendMail({
        from: input.fromName ? `${input.fromName} <${input.fromEmail}>` : input.fromEmail,
        to: input.to,
        cc: input.cc.length ? input.cc : undefined,
        bcc: input.bcc.length ? input.bcc : undefined,
        subject: input.subject,
        text: input.bodyText,
        html: input.bodyHtml,
        inReplyTo: input.inReplyToMessageIdHeader ?? undefined,
        references: input.references ?? undefined,
        attachments: input.attachments?.map((item) => ({
          filename: item.filename,
          content: item.content,
          contentType: item.contentType,
          cid: item.contentId,
          contentDisposition: item.isInline ? 'inline' : 'attachment',
        })),
      });
      return {
        providerMessageId: info.messageId ?? null,
        messageIdHeader: info.messageId ?? null,
        providerThreadId: input.providerThreadId ?? null,
      };
    } finally {
      transport.close();
    }
  }

  async markThreadRead(input: MarkThreadReadInput): Promise<void> {
    const uids = input.providerMessageIds
      .map((id) => Number(id))
      .filter((uid) => Number.isFinite(uid) && uid > 0);
    if (uids.length === 0) {
      return;
    }
    const client = this.createImapClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
    } finally {
      lock.release();
      await client.logout();
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const result = await this.validateImap();
    return { ok: result.ok, detail: result.error ?? null };
  }

  async reconnect(): Promise<ValidateConnectionResult> {
    return this.validateConnection();
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}
