import { describe, expect, it } from 'vitest';
import {
  countEnvMergeOverwrites,
  envRowHasProtectedData,
  findEnvRowIndexByKey,
} from './credential-env-table-guards';

describe('credential-env-table-guards', () => {
  it('detects protected row from baseline key', () => {
    const serverKeys = new Set(['NODE_ENV']);
    expect(envRowHasProtectedData({ key: 'NODE_ENV', value: '' }, serverKeys, new Map())).toBe(
      true,
    );
  });

  it('finds duplicate key on another row', () => {
    const rows = [
      { key: 'A', value: '1' },
      { key: 'B', value: '' },
    ];
    expect(findEnvRowIndexByKey(rows, 'A', 1)).toBe(0);
  });

  it('counts merge overwrites for stored keys', () => {
    const existing = [{ key: 'NODE_ENV', value: '' }];
    const incoming = [{ key: 'NODE_ENV', value: 'prod' }];
    const serverKeys = new Set(['NODE_ENV']);
    expect(countEnvMergeOverwrites(existing, incoming, serverKeys, new Map())).toBe(1);
  });
});
