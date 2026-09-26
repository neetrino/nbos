import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VIDEO_MEETINGS_DEFAULT_ROLE_IDS, VIDEO_MEETINGS_MODULE } from '@nbos/shared';

const root = dirname(fileURLToPath(import.meta.url));
const MIGRATION = 'migrations/20260926170000_video_meetings_v1_schema/migration.sql';

describe('video meetings V1 schema + permissions migration', () => {
  const sql = readFileSync(join(root, MIGRATION), 'utf8');

  it('is additive only (no destructive SQL on existing tables)', () => {
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
    expect(sql).not.toMatch(/\bALTER TABLE "(?!video_meeting)/i);
    expect(sql).toContain('CREATE TABLE "video_meetings"');
    expect(sql).toContain('CREATE TABLE "video_meeting_recording_assets"');
    expect(sql).toContain('CREATE TABLE "video_meeting_entity_links"');
  });

  it('creates VIDEO_MEETINGS VIEW/EDIT/ADD/DELETE and never CALLS', () => {
    expect(sql).toContain(`'${VIDEO_MEETINGS_MODULE}', 'VIEW'`);
    expect(sql).toContain(`'${VIDEO_MEETINGS_MODULE}', 'EDIT'`);
    expect(sql).toContain(`'${VIDEO_MEETINGS_MODULE}', 'ADD'`);
    expect(sql).toContain(`'${VIDEO_MEETINGS_MODULE}', 'DELETE'`);
    expect(sql).not.toMatch(/'CALLS'/);
    expect(sql).toContain('ON CONFLICT ("module", "action") DO NOTHING');
    expect(sql).toContain('ON CONFLICT ("role_id", "permission_id") DO NOTHING');
  });

  it('grants Owner/CEO only and documents the open matrix DECISION', () => {
    for (const roleId of VIDEO_MEETINGS_DEFAULT_ROLE_IDS) {
      expect(sql).toContain(roleId);
    }
    expect(sql).toContain("'owner'");
    expect(sql).toContain("'ceo'");
    expect(sql).not.toContain('role-seller');
    expect(sql).not.toContain('role-head-sales');
    expect(sql).toMatch(/DECISION/i);
  });

  it('keeps meeting and recording status enums independent', () => {
    expect(sql).toContain("'CREATED', 'WAITING', 'ACTIVE', 'ENDED', 'CANCELLED'");
    expect(sql).toContain("'PENDING', 'RECORDING', 'FINALIZING', 'READY', 'PARTIAL', 'FAILED'");
    expect(sql).toContain("'PENDING', 'READY', 'FAILED', 'MISSING'");
    expect(sql).toContain('token_digest');
    expect(sql).not.toContain('token_plaintext');
    expect(sql).toContain("'UNKNOWN', 'GRANTED', 'DECLINED', 'REVOKED'");
  });
});
