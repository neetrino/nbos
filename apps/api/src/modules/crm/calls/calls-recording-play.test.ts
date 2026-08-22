import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  CRM_CALL_RECORDINGS_MODULE,
  CRM_CALL_RECORDINGS_PLAY_ACTION,
  CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS,
  CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_SLUGS,
  CRM_CALL_RECORDINGS_PLAY_PERMISSION,
  CRM_CALL_RECORDINGS_PLAY_PERMISSION_ID,
} from '@nbos/shared';
import { assertCanPlayCallRecording, hasCrmCallRecordingsPlay } from './calls-recording-play';

const MARKETING_ROLE_IDS = ['role-marketing', 'role-head-marketing'] as const;

describe('CRM_CALL_RECORDINGS_PLAY catalog', () => {
  it('uses the established module_action permission key', () => {
    expect(CRM_CALL_RECORDINGS_PLAY_PERMISSION).toBe('CRM_CALL_RECORDINGS_PLAY');
    expect(CRM_CALL_RECORDINGS_PLAY_PERMISSION_ID).toBe('perm-crm-call-recordings-play');
    expect(`${CRM_CALL_RECORDINGS_MODULE}_${CRM_CALL_RECORDINGS_PLAY_ACTION}`).toBe(
      CRM_CALL_RECORDINGS_PLAY_PERMISSION,
    );
  });

  it('grants the capability to Owner, CEO, Seller, and Head of Sales by default', () => {
    expect([...CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS]).toEqual([
      'role-owner',
      'role-ceo',
      'role-seller',
      'role-head-sales',
    ]);
    expect([...CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_SLUGS]).toEqual([
      'owner',
      'ceo',
      'seller',
      'head-sales',
    ]);
  });

  it('does not grant Marketing default roles', () => {
    for (const roleId of MARKETING_ROLE_IDS) {
      expect(CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS).not.toContain(roleId);
    }
    expect(CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_SLUGS).not.toContain('marketing');
    expect(CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_SLUGS).not.toContain('head-marketing');
  });
});

describe('hasCrmCallRecordingsPlay', () => {
  it('treats any non-NONE scope as granted and ignores role names', () => {
    expect(hasCrmCallRecordingsPlay({ CRM_CALL_RECORDINGS_PLAY: 'ALL' })).toBe(true);
    expect(hasCrmCallRecordingsPlay({ CRM_CALL_RECORDINGS_PLAY: 'OWN' })).toBe(true);
    expect(hasCrmCallRecordingsPlay({ CRM_CALL_RECORDINGS_PLAY: 'NONE' })).toBe(false);
    expect(hasCrmCallRecordingsPlay({})).toBe(false);
  });

  it('throws ForbiddenException without role comparisons', () => {
    expect(() => assertCanPlayCallRecording({})).toThrow(ForbiddenException);
    expect(() => assertCanPlayCallRecording({ CRM_CALL_RECORDINGS_PLAY: 'ALL' })).not.toThrow();
  });
});

describe('recording playback sources', () => {
  it('do not compare actor.role to a role name', () => {
    const files = ['calls-recording-play.ts', 'calls-recording.service.ts'];
    for (const file of files) {
      const src = readFileSync(join(__dirname, file), 'utf8');
      expect(src).not.toMatch(/role\s*===/);
      expect(src).not.toMatch(/\.role\s*==/);
    }
  });
});
