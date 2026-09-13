#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  ZERO_GIT_SHA,
  isDeletedRemoteRef,
  parsePushRanges,
  selectFormatFiles,
} from './pushed-prettier-files.mjs';

const DEFAULT_BASE_REFS = ['origin/main', 'main'];

function gitLines(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error((result.stderr || `git ${args.join(' ')} failed`).trim());
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function resolveDefaultBase() {
  for (const ref of DEFAULT_BASE_REFS) {
    const result = spawnSync('git', ['rev-parse', '--verify', ref], { encoding: 'utf8' });
    if (result.status === 0) return ref;
  }
  return null;
}

function changedFilesInRange(fromSha, toSha) {
  if (isDeletedRemoteRef(toSha)) return [];
  if (fromSha === ZERO_GIT_SHA) {
    const base = resolveDefaultBase();
    if (!base) return [];
    return gitLines(['diff', '--name-only', '--diff-filter=ACMR', `${base}...${toSha}`]);
  }
  return gitLines(['diff', '--name-only', '--diff-filter=ACMR', `${fromSha}...${toSha}`]);
}

function readStdinOrEmpty() {
  if (process.stdin.isTTY) return '';
  return readFileSync(0, 'utf8');
}

function collectPushedFiles(stdinText) {
  const names = new Set();
  const ranges = parsePushRanges(stdinText);
  if (ranges.length === 0) {
    const base = resolveDefaultBase();
    if (!base) return [];
    for (const file of gitLines(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`])) {
      names.add(file);
    }
    return selectFormatFiles([...names]);
  }

  for (const range of ranges) {
    for (const file of changedFilesInRange(range.fromSha, range.toSha)) {
      names.add(file);
    }
  }
  return selectFormatFiles([...names]);
}

const files = collectPushedFiles(readStdinOrEmpty());
if (files.length === 0) process.exit(0);

const check = spawnSync(
  'pnpm',
  ['exec', 'prettier', '--check', '--ignore-path', '.prettierignore', ...files],
  { stdio: 'inherit' },
);

if (check.status !== 0) {
  console.error(
    'husky(pre-push): Prettier would change files in this push. The pre-commit hook auto-formats on commit — restage the formatted files and push again.',
  );
  process.exit(check.status ?? 1);
}
