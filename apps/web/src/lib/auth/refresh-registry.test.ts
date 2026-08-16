import { describe, expect, it } from 'vitest';
import { resetRefreshRegistryForTests, runSingleFlightRefresh } from './refresh-registry';

describe('runSingleFlightRefresh', () => {
  it('dedupes concurrent refresh calls', async () => {
    resetRefreshRegistryForTests();
    let calls = 0;
    const refresh = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return true;
    };
    const [a, b, c] = await Promise.all([
      runSingleFlightRefresh(refresh),
      runSingleFlightRefresh(refresh),
      runSingleFlightRefresh(refresh),
    ]);
    expect(a && b && c).toBe(true);
    expect(calls).toBe(1);
  });
});
