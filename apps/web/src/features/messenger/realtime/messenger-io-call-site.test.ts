import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB_SRC = path.join(process.cwd(), 'apps/web/src');
const ALLOWED = path.normalize(
  path.join('features', 'messenger', 'realtime', 'messenger-socket-client.ts'),
);

describe('messenger socket call site', () => {
  it('keeps a single production io( call site', () => {
    const matches = productionFiles(WEB_SRC).filter((file) => fileCallsIo(file));
    expect(matches.map((file) => path.relative(WEB_SRC, file))).toEqual([ALLOWED]);
  });

  it('does not import socket.io-client from the UI hooks', () => {
    const internal = readFileSync(
      path.join(WEB_SRC, 'features/messenger-internal/useInternalMessengerRealtime.ts'),
      'utf8',
    );
    const legacy = readFileSync(
      path.join(WEB_SRC, 'features/messenger/useMessengerRealtime.ts'),
      'utf8',
    );
    expect(internal).not.toMatch(/socket\.io-client/);
    expect(legacy).not.toMatch(/socket\.io-client/);
    expect(internal).not.toMatch(/\bio\(/);
    expect(stripComments(legacy)).not.toMatch(/\bio\(/);
  });
});

function productionFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...productionFiles(full));
      continue;
    }
    if (!name.endsWith('.ts') && !name.endsWith('.tsx')) continue;
    if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
    files.push(full);
  }
  return files;
}

function fileCallsIo(file: string): boolean {
  return stripComments(readFileSync(file, 'utf8'))
    .split('\n')
    .some((line) => lineCallsIo(line));
}

function lineCallsIo(line: string): boolean {
  return /\bio\(/.test(stripLineComment(line));
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripLineComment(line: string): string {
  let quote: "'" | '"' | '`' | null = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '/' && line[index + 1] === '/') return line.slice(0, index);
  }
  return line;
}
