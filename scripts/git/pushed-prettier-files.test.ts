import { describe, expect, it } from 'vitest';
import {
  ZERO_GIT_SHA,
  isDeletedRemoteRef,
  parsePushRanges,
  selectFormatFiles,
} from './pushed-prettier-files.mjs';

describe('parsePushRanges', () => {
  it('reads local and remote SHAs from pre-push stdin', () => {
    const stdin = [
      'refs/heads/sipan abc111 refs/heads/sipan def222',
      'refs/heads/other 333444 refs/heads/other 555666',
    ].join('\n');

    expect(parsePushRanges(stdin)).toEqual([
      { fromSha: 'def222', toSha: 'abc111' },
      { fromSha: '555666', toSha: '333444' },
    ]);
  });

  it('skips incomplete lines', () => {
    expect(parsePushRanges('refs/heads/sipan only-two-fields\n')).toEqual([]);
  });
});

describe('selectFormatFiles', () => {
  it('keeps Prettier-checked extensions and drops the rest', () => {
    expect(
      selectFormatFiles([
        'apps/web/src/app/page.tsx',
        'apps/api/src/main.ts',
        'README.md',
        'apps/web/src/app/globals.css',
        'package.json',
        'packages/database/prisma/schema.prisma',
        'docs/note.txt',
      ]),
    ).toEqual([
      'apps/web/src/app/page.tsx',
      'apps/api/src/main.ts',
      'README.md',
      'apps/web/src/app/globals.css',
      'package.json',
    ]);
  });
});

describe('isDeletedRemoteRef', () => {
  it('detects a deleted remote SHA', () => {
    expect(isDeletedRemoteRef(ZERO_GIT_SHA)).toBe(true);
    expect(isDeletedRemoteRef('abc123')).toBe(false);
  });
});
