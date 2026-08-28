import { afterEach, describe, expect, it } from 'vitest';
import { resetRefreshRegistryForTests, runSingleFlightRefresh } from './refresh-registry';

describe('runSingleFlightRefresh', () => {
  afterEach(() => {
    resetRefreshRegistryForTests();
  });

  it('dedupes concurrent refresh calls for the same session', async () => {
    let calls = 0;
    const payload = {
      kind: 'refreshed' as const,
      accessToken: 'fresh',
      setCookie: 'session=new',
    };
    const refresh = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return payload;
    };
    const [a, b, c] = await Promise.all([
      runSingleFlightRefresh('session-a', refresh),
      runSingleFlightRefresh('session-a', refresh),
      runSingleFlightRefresh('session-a', refresh),
    ]);
    expect(a).toEqual(payload);
    expect(b).toBe(a);
    expect(c).toBe(a);
    expect(calls).toBe(1);
  });

  it('never shares a refresh result between different sessions', async () => {
    let callsA = 0;
    let callsB = 0;
    const [a, b] = await Promise.all([
      runSingleFlightRefresh('session-a', async () => {
        callsA += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { kind: 'refreshed' as const, accessToken: 'access-a' };
      }),
      runSingleFlightRefresh('session-b', async () => {
        callsB += 1;
        return { kind: 'refreshed' as const, accessToken: 'access-b' };
      }),
    ]);

    expect(a).toMatchObject({ accessToken: 'access-a' });
    expect(b).toMatchObject({ accessToken: 'access-b' });
    expect(callsA).toBe(1);
    expect(callsB).toBe(1);
  });

  it('does not replay a completed refresh result or its Set-Cookie', async () => {
    let calls = 0;
    const refresh = async () => {
      calls += 1;
      return {
        kind: 'refreshed' as const,
        accessToken: `fresh-${calls}`,
        setCookie: `session=refresh-${calls}`,
      };
    };

    const first = await runSingleFlightRefresh('session-a', refresh);
    const late = await runSingleFlightRefresh('session-a', refresh);

    expect(first).toMatchObject({ setCookie: 'session=refresh-1' });
    expect(late).toMatchObject({ setCookie: 'session=refresh-2' });
    expect(late).not.toBe(first);
    expect(calls).toBe(2);
  });

  it('does not cache an invalid-session result', async () => {
    let calls = 0;
    const refresh = async () => {
      calls += 1;
      return { kind: 'session-invalid' as const };
    };

    await runSingleFlightRefresh('session-a', refresh);
    await Promise.resolve();
    await runSingleFlightRefresh('session-a', refresh);

    expect(calls).toBe(2);
  });
});
