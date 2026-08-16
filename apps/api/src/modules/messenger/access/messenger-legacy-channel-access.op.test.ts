import { describe, expect, it } from 'vitest';
import {
  isMessengerProjectUuid,
  isOrgWideMessengerChannelType,
  messengerViewBypassesChannelFilter,
  normalizeMessengerRbacScope,
} from './messenger-legacy-channel-access.op';

describe('normalizeMessengerRbacScope', () => {
  it('normalizes known scopes', () => {
    expect(normalizeMessengerRbacScope('all')).toBe('ALL');
    expect(normalizeMessengerRbacScope('OWN')).toBe('OWN');
    expect(normalizeMessengerRbacScope('department')).toBe('DEPARTMENT');
    expect(normalizeMessengerRbacScope('NONE')).toBe('NONE');
  });

  it('defaults unknown to NONE', () => {
    expect(normalizeMessengerRbacScope(undefined)).toBe('NONE');
    expect(normalizeMessengerRbacScope('ASSIGNED')).toBe('NONE');
  });
});

describe('messengerViewBypassesChannelFilter', () => {
  it('bypasses only ALL', () => {
    expect(messengerViewBypassesChannelFilter('ALL')).toBe(true);
    expect(messengerViewBypassesChannelFilter('OWN')).toBe(false);
    expect(messengerViewBypassesChannelFilter('DEPARTMENT')).toBe(false);
    expect(messengerViewBypassesChannelFilter('NONE')).toBe(false);
  });
});

describe('isMessengerProjectUuid', () => {
  it('detects UUIDs', () => {
    expect(isMessengerProjectUuid('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBe(true);
    expect(isMessengerProjectUuid('system')).toBe(false);
    expect(isMessengerProjectUuid('nbos')).toBe(false);
  });
});

describe('isOrgWideMessengerChannelType', () => {
  it('marks GENERAL and ANNOUNCEMENT', () => {
    expect(isOrgWideMessengerChannelType('GENERAL')).toBe(true);
    expect(isOrgWideMessengerChannelType('ANNOUNCEMENT')).toBe(true);
    expect(isOrgWideMessengerChannelType('PROJECT')).toBe(false);
  });
});
