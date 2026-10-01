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
  it('access loader does not query ConversationLink, Product team, Collections, or bindings', () => {
    const load = readRepo('apps/api/src/modules/messenger/core/messenger-core-access-load.ts');
    expect(load).not.toMatch(/messengerConversationLink/);
    expect(load).not.toMatch(/productTeamMember/);
    expect(load).not.toMatch(/messengerConversationCollection/);
    expect(load).not.toMatch(/productCommunicationBinding/);
  });

  it('keeps Client SEND closed when clientSendScope is NONE', () => {
    const decision = evaluateMessengerCoreAccess({
      conversationId: 'c-ext',
      zone: 'CLIENT',
      viewScope: 'ALL',
      editScope: 'ALL',
      clientReadScope: 'ALL',
      clientSendScope: 'NONE',
      isActiveParticipant: true,
      participantRole: 'MEMBER',
      grantLevel: null,
    });
    expect(decision.canRead).toBe(true);
    expect(decision.canSend).toBe(false);
    expect(decision.sendDeniedBecause).toBe('NO_SEND');
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
