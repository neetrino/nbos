import { google, type gmail_v1, type Auth } from 'googleapis';
import { buildRawGmailMessage } from './gmail-mime';
import { normalizeGmailMessage } from './gmail-message.normalize';
import type {
  FetchDeltaResult,
  MailProviderAdapter,
  NormalizedMessage,
  ProviderHealth,
  ProviderSyncCursor,
  SendMessageInput,
  SendMessageResult,
  ValidateConnectionResult,
} from './mail-provider-adapter';

export interface GmailProviderConfig {
  emailAddress: string;
  displayName: string | null;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  /** Pub/Sub topic for `users.watch`; watch is skipped when absent. */
  pubsubTopic?: string | null;
}

const INITIAL_SYNC_WINDOW = 30;

/** Gmail adapter: OAuth2 + Gmail API (read/send), Pub/Sub watch for near-real-time receive. */
export class GmailProviderAdapter implements MailProviderAdapter {
  private readonly gmail: gmail_v1.Gmail;

  constructor(private readonly config: GmailProviderConfig) {
    this.gmail = google.gmail({ version: 'v1', auth: this.createAuthClient() });
  }

  private createAuthClient(): Auth.OAuth2Client {
    const client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
    );
    client.setCredentials({ refresh_token: this.config.refreshToken });
    return client;
  }

  async validateConnection(): Promise<ValidateConnectionResult> {
    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      return { ok: true, providerAccountId: profile.data.emailAddress ?? this.config.emailAddress };
    } catch (error) {
      return { ok: false, error: `Gmail validation failed: ${describeError(error)}` };
    }
  }

  async startWatchOrIdle(): Promise<void> {
    if (!this.config.pubsubTopic) {
      return;
    }
    await this.gmail.users.watch({
      userId: 'me',
      requestBody: { topicName: this.config.pubsubTopic, labelIds: ['INBOX'] },
    });
  }

  async fetchDelta(cursor: ProviderSyncCursor): Promise<FetchDeltaResult> {
    const ids = cursor.gmailHistoryId
      ? await this.listHistoryMessageIds(cursor.gmailHistoryId)
      : await this.listRecentInboxIds();
    const messages = await this.fetchMessages(ids);
    const profile = await this.gmail.users.getProfile({ userId: 'me' });
    return {
      messages,
      cursor: { gmailHistoryId: profile.data.historyId ?? cursor.gmailHistoryId },
    };
  }

  private async listHistoryMessageIds(startHistoryId: string): Promise<string[]> {
    const response = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded'],
    });
    const ids = new Set<string>();
    for (const history of response.data.history ?? []) {
      for (const added of history.messagesAdded ?? []) {
        if (added.message?.id) {
          ids.add(added.message.id);
        }
      }
    }
    return [...ids];
  }

  private async listRecentInboxIds(): Promise<string[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: INITIAL_SYNC_WINDOW,
    });
    return (response.data.messages ?? [])
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id));
  }

  private async fetchMessages(ids: string[]): Promise<NormalizedMessage[]> {
    const messages: NormalizedMessage[] = [];
    for (const id of ids) {
      const message = await this.fetchMessage(id);
      if (message) {
        messages.push(message);
      }
    }
    return messages;
  }

  async fetchMessage(providerMessageId: string): Promise<NormalizedMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: providerMessageId,
        format: 'full',
      });
      return normalizeGmailMessage(response.data);
    } catch {
      return null;
    }
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const raw = buildRawGmailMessage(input);
    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId: input.providerThreadId ?? undefined },
    });
    return {
      providerMessageId: response.data.id ?? null,
      messageIdHeader: input.inReplyToMessageIdHeader ?? null,
      providerThreadId: response.data.threadId ?? input.providerThreadId ?? null,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const result = await this.validateConnection();
    return { ok: result.ok, detail: result.error ?? null };
  }

  async reconnect(): Promise<ValidateConnectionResult> {
    return this.validateConnection();
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}
