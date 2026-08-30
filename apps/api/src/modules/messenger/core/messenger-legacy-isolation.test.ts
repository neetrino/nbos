import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function readRepo(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('legacy path isolation', () => {
  it('Channel/DM writers still do not import WhatsApp or Core as a second store', () => {
    const service = readRepo('apps/api/src/modules/messenger/messenger.service.ts');
    expect(service).toMatch(/prisma\.messengerChannelMessage\.create/);
    expect(service).toMatch(/prisma\.messengerDirect/);
    expect(service).not.toMatch(/whatsapp/i);
    expect(service).not.toMatch(/groupChatId/);
    expect(service).not.toMatch(/messengerConversation\.create/);
    expect(service).not.toMatch(/MessengerTopic/);
  });

  it('Core is the only new messengerConversation writer generation', () => {
    const coreConversation = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-conversation.ops.ts',
    );
    const coreMessage = readRepo(
      'apps/api/src/modules/messenger/core/messenger-core-message.ops.ts',
    );
    expect(coreConversation).toMatch(/messengerConversation\.create/);
    expect(coreMessage).toMatch(/messengerMessage\.create/);
  });
});
