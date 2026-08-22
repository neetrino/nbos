import { describe, expect, it } from 'vitest';
import {
  AI_CAPABILITIES_FORBIDDEN_PHASE_1,
  findInvalidCapabilityKeys,
  getAiCapability,
  isAiCapabilityKey,
  isScopeTypeAllowedForCapability,
  listAiCapabilities,
} from './capability-registry';
import { isValidCapabilityKeyFormat } from './capability-types';

describe('AI capability registry', () => {
  it('exposes only well-formed, unique capability keys', () => {
    const capabilities = listAiCapabilities();
    const keys = capabilities.map((capability) => capability.key);

    expect(findInvalidCapabilityKeys()).toEqual([]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(capabilities.length).toBeGreaterThan(0);
  });

  it('rejects keys that do not follow <module>.<action>', () => {
    expect(isValidCapabilityKeyFormat('tasks.read')).toBe(true);
    expect(isValidCapabilityKeyFormat('tasks.read_discussion')).toBe(true);
    expect(isValidCapabilityKeyFormat('Tasks.Read')).toBe(false);
    expect(isValidCapabilityKeyFormat('tasks')).toBe(false);
    expect(isValidCapabilityKeyFormat('tasks.read.extra')).toBe(false);
    expect(isValidCapabilityKeyFormat('')).toBe(false);
  });

  it('registers the Phase 1 read catalog', () => {
    for (const key of [
      'workspaces.read',
      'tasks.list',
      'tasks.read',
      'tasks.read_links',
      'tasks.read_discussion',
      'drive.read_task_artifact',
    ]) {
      expect(isAiCapabilityKey(key)).toBe(true);
      expect(getAiCapability(key)?.access).toBe('READ');
    }
  });

  it('registers tasks.create and tasks.update as separate write capabilities', () => {
    const create = getAiCapability('tasks.create');
    const update = getAiCapability('tasks.update');

    expect(create?.access).toBe('WRITE');
    expect(update?.access).toBe('WRITE');
    expect(create?.key).not.toBe(update?.key);
    expect(create?.idempotency).toBe('REQUIRED');
    expect(update?.idempotency).toBe('REQUIRED');
  });

  it('registers messenger draft and send as distinct grantable capabilities', () => {
    const draft = getAiCapability('messenger.reply_draft');
    const send = getAiCapability('messenger.reply_send');
    expect(draft?.access).toBe('WRITE');
    expect(send?.access).toBe('WRITE');
    expect(draft?.approval).toBe('NONE');
    expect(send?.approval).toBe('REQUIRED');
    expect(send?.risk).toBe('HIGH');
    expect(draft?.key).not.toBe(send?.key);
  });

  it('never registers Phase 1 forbidden capabilities', () => {
    for (const key of AI_CAPABILITIES_FORBIDDEN_PHASE_1) {
      expect(isAiCapabilityKey(key)).toBe(false);
      expect(getAiCapability(key)).toBeNull();
    }
  });

  it('treats unknown capability keys as not grantable', () => {
    expect(getAiCapability('tasks.definitely_not_real')).toBeNull();
    expect(isAiCapabilityKey('')).toBe(false);
    expect(isAiCapabilityKey('__proto__')).toBe(false);
    expect(isAiCapabilityKey('constructor')).toBe(false);
  });

  it('declares complete policy metadata for every capability', () => {
    for (const capability of listAiCapabilities()) {
      expect(capability.version).toBeGreaterThan(0);
      expect(capability.module.length).toBeGreaterThan(0);
      expect(capability.allowedScopeTypes.length).toBeGreaterThan(0);
      expect(capability.input.id.length).toBeGreaterThan(0);
      expect(capability.output.fields.length).toBeGreaterThan(0);
      expect(capability.deprecated).toBe(false);
    }
  });

  it('requires audit on every write capability', () => {
    const writes = listAiCapabilities().filter((capability) => capability.access === 'WRITE');
    expect(writes.length).toBeGreaterThan(0);
    for (const capability of writes) {
      expect(capability.audit).toBe('ALWAYS');
    }
  });

  it('keeps drive artifact reads below secret-adjacent classification', () => {
    expect(getAiCapability('drive.read_task_artifact')?.maxDataClassification).toBe('INTERNAL');
  });

  it('validates scope types per capability', () => {
    const create = getAiCapability('tasks.create');
    expect(create).not.toBeNull();
    expect(isScopeTypeAllowedForCapability(create!, 'WORKSPACE')).toBe(true);
    expect(isScopeTypeAllowedForCapability(create!, 'RESOURCE')).toBe(false);
  });
});
