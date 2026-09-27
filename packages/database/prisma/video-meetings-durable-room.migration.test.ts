import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));
const IDLE_MIGRATION = 'migrations/20260927120000_video_meetings_idle_status/migration.sql';
const THREAD_MIGRATION = 'migrations/20260927120100_video_meetings_durable_thread/migration.sql';

function withoutComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

describe('video meetings durable room migrations', () => {
  const idleSql = readFileSync(join(root, IDLE_MIGRATION), 'utf8');
  const threadSql = readFileSync(join(root, THREAD_MIGRATION), 'utf8');

  it('adds IDLE in its own migration, before any use of the value', () => {
    expect(idleSql).toContain(`ALTER TYPE "VideoMeetingStatus" ADD VALUE IF NOT EXISTS 'IDLE'`);
    expect(idleSql).not.toMatch(/\bUPDATE\b/i);
  });

  it('backfills ENDED to IDLE without dropping the legacy value', () => {
    expect(threadSql).toContain(
      `UPDATE "video_meetings" SET "status" = 'IDLE' WHERE "status" = 'ENDED'`,
    );
    for (const sql of [idleSql, threadSql].map(withoutComments)) {
      expect(sql).not.toMatch(/\bDROP\b/i);
      expect(sql).not.toMatch(/\bRENAME\b/i);
    }
  });

  it('creates video_meeting_messages with thread indexes and no attachment columns', () => {
    expect(threadSql).toContain('CREATE TABLE "video_meeting_messages"');
    expect(threadSql).toContain('("meeting_id", "created_at")');
    expect(threadSql).toContain('"video_meeting_messages_session_id_idx"');
    expect(threadSql).not.toMatch(/attachment|file_asset/i);
    expect(threadSql).not.toMatch(/\bALTER TABLE "(?!video_meeting_messages)/i);
  });
});
