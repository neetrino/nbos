import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import type { MessengerCoreAccessFacts } from './messenger-core-access.types';

const ROOT = process.cwd();

function readRepo(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('Slice 2 binding is not ACL', () => {
  it('access loader does not query ConversationLink, Product team, or Collections', () => {
    const load = readRepo('apps/api/src/modules/messenger/core/messenger-core-access-load.ts');
    expect(load).not.toMatch(/messengerConversationLink/);
    expect(load).not.toMatch(/productTeamMember/);
    expect(load).not.toMatch(/messengerConversationCollection/);
  });

  it('SHARED Collection membership is not an access fact', () => {
    const facts: MessengerCoreAccessFacts = {
      conversationId: 'c-ext',
      zone: 'CLIENT',
      viewScope: 'OWN',
      editScope: 'OWN',
      clientReadScope: 'NONE',
      clientSendScope: 'NONE',
      isActiveParticipant: false,
      participantRole: null,
      grantLevel: null,
    };
    expect(evaluateMessengerCoreAccess(facts).canRead).toBe(false);
  });
});
