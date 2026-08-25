import { describe, expect, it } from 'vitest';
import { resetRefreshRegistryForTests, runSingleFlightRefresh } from './refresh-registry';

describe('runSingleFlightRefresh', () => {
  it('dedupes concurrent refresh calls and shares the rotated tokens', async () => {
    resetRefreshRegistryForTests();
    let calls = 0;
    const payload = { accessToken: 'fresh', setCookie: 'session=new' };
    const refresh = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return payload;
    };
    const [a, b, c] = await Promise.all([
      runSingleFlightRefresh(refresh),
      runSingleFlightRefresh(refresh),
      runSingleFlightRefresh(refresh),
    ]);
    expect(a).toEqual(payload);
    expect(b).toBe(a);
    expect(c).toBe(a);
    expect(calls).toBe(1);
  });

  it('returns null to every waiter when refresh fails', async () => {
    resetRefreshRegistryForTests();
    let calls = 0;
    const refresh = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return null;
    };
    const [a, b] = await Promise.all([
      runSingleFlightRefresh(refresh),
      runSingleFlightRefresh(refresh),
    ]);
    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(calls).toBe(1);
  });
});
