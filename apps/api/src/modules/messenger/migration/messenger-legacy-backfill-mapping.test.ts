import { describe, expect, it } from 'vitest';
import {
  legacyChannelCanonicalKey,
  legacyChannelConversationId,
  legacyDirectConversationId,
  planLegacyChannelConversation,
  planLegacyDirectConversation,
} from './messenger-legacy-backfill-mapping';

describe('legacy id reuse', () => {
  it('keeps conversation ids equal to legacy ids', () => {
    expect(legacyChannelConversationId('ch-1')).toBe('ch-1');
    expect(legacyDirectConversationId('th-1')).toBe('th-1');
    expect(legacyChannelCanonicalKey('ch-1')).toBe('legacy_channel:ch-1');
  });
});

describe('planLegacyChannelConversation', () => {
  it('maps GENERAL to INTERNAL_GROUP', () => {
    const plan = planLegacyChannelConversation({
      channelId: 'c1',
      name: '#general',
      projectId: 'system',
      type: 'GENERAL',
      primaryProjectIdsClaimed: new Set(),
      projectExists: false,
    });
    expect(plan.type).toBe('INTERNAL_GROUP');
    expect(plan.canonicalKey).toBe('legacy_channel:c1');
    expect(plan.primaryProjectId).toBeNull();
  });

  it('maps PROJECT + existing UUID to PROJECT_GENERAL with PRIMARY', () => {
    const projectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const plan = planLegacyChannelConversation({
      channelId: 'c2',
      name: '#delivery',
      projectId,
      type: 'PROJECT',
      primaryProjectIdsClaimed: new Set(),
      projectExists: true,
    });
    expect(plan.type).toBe('PROJECT_GENERAL');
    expect(plan.canonicalKey).toBe(`project_general:${projectId}`);
    expect(plan.primaryProjectId).toBe(projectId);
  });

  it('uses RELATED when PRIMARY already claimed', () => {
    const projectId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const plan = planLegacyChannelConversation({
      channelId: 'c3',
      name: '#extra',
      projectId,
      type: 'PROJECT',
      primaryProjectIdsClaimed: new Set([projectId]),
      projectExists: true,
    });
    expect(plan.type).toBe('INTERNAL_GROUP');
    expect(plan.relatedProjectId).toBe(projectId);
    expect(plan.primaryProjectId).toBeNull();
  });

  it('does not invent PRODUCT/DEAL/TASK chats', () => {
    const plan = planLegacyChannelConversation({
      channelId: 'c4',
      name: '#ann',
      projectId: 'system',
      type: 'ANNOUNCEMENT',
      primaryProjectIdsClaimed: new Set(),
      projectExists: false,
    });
    expect(plan.type).toBe('INTERNAL_GROUP');
  });
});

describe('planLegacyDirectConversation', () => {
  it('normalizes participant pair and canonical key', () => {
    const a = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const b = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const plan = planLegacyDirectConversation({
      threadId: 't1',
      participantAId: b,
      participantBId: a,
    });
    expect(plan.type).toBe('DIRECT');
    expect(plan.conversationId).toBe('t1');
    expect(plan.directParticipantLowId).toBe(a);
    expect(plan.directParticipantHighId).toBe(b);
    expect(plan.canonicalKey).toBe(`direct:${a}:${b}`);
  });
});
