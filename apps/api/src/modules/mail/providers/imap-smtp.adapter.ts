import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createTransport } from 'nodemailer';
import { normalizeParsedMail } from './imap-message.normalize';
import type {
  FetchDeltaResult,
  MailProviderAdapter,
  MarkThreadReadInput,
  NormalizedMessage,
  ProviderSyncCursor,
  SendMessageInput,
  SendMessageResult,
  ValidateConnectionResult,
  ProviderHealth,
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

/** Max messages fetched on the very first sync (no stored UID cursor). */
const INITIAL_SYNC_WINDOW = 30;

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

  async startWatchOrIdle(): Promise<void> {
    // IMAP IDLE is owned by the long-running worker (ImapIdleWorker), not the adapter.
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
    const validityChanged =
      cursor.imapUidValidity !== undefined && cursor.imapUidValidity !== uidValidity;
    const lastUid = validityChanged ? 0 : Number(cursor.imapLastUid ?? 0);
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

  async fetchMessage(providerMessageId: string): Promise<NormalizedMessage | null> {
    const uid = Number(providerMessageId);
    if (!Number.isFinite(uid)) {
      return null;
    }
    const client = this.createImapClient();
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const item = await client.fetchOne(String(uid), { uid: true, source: true }, { uid: true });
      if (!item || !item.source) {
        return null;
      }
      const parsed = await simpleParser(item.source);
      return normalizeParsedMail(parsed, item.uid);
    } finally {
      lock.release();
      await client.logout();
    }
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

interface ImapFetchPlan {
  range: string;
  /** True → range is UID-based (incremental); false → sequence-based (first sync window). */
  useUid: boolean;
}

function buildImapFetchPlan(lastUid: number, exists: number): ImapFetchPlan | null {
  if (exists <= 0) {
    return null;
  }
  if (lastUid > 0) {
    return { range: `${lastUid + 1}:*`, useUid: true };
  }
  const firstSeq = Math.max(1, exists - INITIAL_SYNC_WINDOW + 1);
  return { range: `${firstSeq}:*`, useUid: false };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}
