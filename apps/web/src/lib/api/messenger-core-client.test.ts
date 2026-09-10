import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB_SRC = path.join(process.cwd(), 'apps/web/src');

function readWeb(relative: string): string {
  return readFileSync(path.join(WEB_SRC, relative), 'utf8');
}

describe('Client Messenger web surface', () => {
  it('uses a separate route and does not hijack CRM /clients', () => {
    const nav = readWeb('lib/navigation/nav-config.ts');
    const app = readWeb('features/messenger-client/ClientMessengerApp.tsx');
    const internal = readWeb('features/messenger-internal/InternalMessengerApp.tsx');
    expect(nav).toMatch(/key: 'client-messenger'/);
    expect(nav).toMatch(/href: '\/client-messenger'/);
    expect(nav).toMatch(/label: 'Client Messenger'/);
    expect(nav).toMatch(/href: '\/clients'/);
    expect(app).toMatch(/Client Messenger/);
    expect(app).not.toMatch(/Internal Messenger/);
    expect(internal).toMatch(/Internal Messenger/);
    expect(internal).not.toMatch(/ClientMessengerApp/);
    expect(internal).not.toMatch(/\/client-messenger/);
  });

  it('locks the composer per conversation and does not carry Internal draft', () => {
    const app = readWeb('features/messenger-client/ClientMessengerApp.tsx');
    const session = readWeb('features/messenger-client/use-client-messenger-session.ts');
    const unlock = readWeb('features/messenger-client/client-composer-unlock.ts');
    const thread = readWeb('features/messenger-client/ClientConversationThread.tsx');
    const locked = readWeb('features/messenger-client/ClientLockedComposer.tsx');
    expect(session).toMatch(/relockComposerOnConversationChange/);
    expect(session).toMatch(/setNewMessage\(''\)/);
    expect(app).not.toMatch(/nbos:internal-messenger:draft/);
    expect(app).not.toMatch(/setItems\(\[\]\)/);
    expect(app).not.toMatch(/refreshLists/);
    expect(unlock).toMatch(/unlockedConversationId === nextConversationId/);
    expect(locked).toMatch(/CLIENT_REPLY_LABEL|Reply to client/);
    expect(locked).toMatch(/CLIENT_VISIBLE_LABEL|CLIENT VISIBLE/);
    expect(thread).not.toMatch(/Internal \| Public/);
    expect(thread).toMatch(/InternalCreateTaskFromMessages/);
    expect(thread).toMatch(/InternalForwardDialog/);
    expect(thread).toMatch(/ClientTicketFromMessages/);
    expect(thread).not.toMatch(/Public \| Internal/);
    expect(readWeb('features/messenger-internal/client-message-action-hooks.ts')).toMatch(
      /createTicket: true/,
    );
  });

  it('does not pass HTTP canonicalKey on Client API calls', () => {
    const client = readWeb('lib/api/messenger-core-client.ts');
    expect(client).toMatch(/\/api\/messenger\/core\/client/);
    expect(client).not.toMatch(/canonicalKey/);
    expect(client).not.toMatch(/allowClientPersist/);
    expect(client).not.toMatch(/\/api\/messenger\/channels/);
    expect(client).not.toMatch(/metaMessage/);
  });

  it('bootstraps Client Inbox defaults without mixing Internal collections', () => {
    const client = readWeb('lib/api/messenger-core-client.ts');
    const queries = readWeb('features/messenger-client/use-client-messenger-queries.ts');
    expect(client).toMatch(/\/bootstrap/);
    expect(client).toMatch(/api\.post/);
    expect(client).toMatch(/listDelta/);
    expect(queries).toMatch(/useMessengerZoneBootstrap\('CLIENT'/);
    expect(queries).toMatch(/isDefaultClientInbox/);
    expect(queries).toMatch(/messengerCollectionsEnabled/);
    expect(queries).toMatch(/messengerDefaultQueriesEnabled/);
    expect(queries).toMatch(/bootstrap\.error/);
    expect(queries).toMatch(/useMessengerCollectionDetail/);
  });

  it('does not silently PATCH attention[0] on shared conversations', () => {
    const assign = readWeb('features/messenger-client/ClientAttentionAssign.tsx');
    const header = readWeb('features/messenger-client/ClientThreadHeader.tsx');
    const list = readWeb('features/messenger-client/ClientConversationList.tsx');
    expect(assign).not.toMatch(/attention\?\.\[0\]/);
    expect(header).not.toMatch(/attention\?\.\[0\]/);
    expect(list).not.toMatch(/attention\?\.\[0\]/);
    expect(assign).toMatch(/viewedProductId/);
    expect(header).toMatch(/uniqueAttentionLabels/);
    expect(list).toMatch(/uniqueAttentionLabels/);
  });
});
