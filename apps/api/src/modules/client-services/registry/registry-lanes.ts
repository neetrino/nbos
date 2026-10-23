import {
  RDAP_LANE_CONCURRENCY,
  WHOIS_LANE_CONCURRENCY,
  WHOIS_QUERY_GAP_MS,
} from './domain-registry.constants';
import { planRegistryLookup } from './tld-router';

export const RDAP_LANE_KEY = 'rdap';

export interface RegistryLaneItem {
  domainName: string;
}

export interface RunRegistryLanesOptions {
  /** Epoch ms. Workers stop taking new items after it; their first item always runs. */
  deadlineAt: number;
  gapMs?: number;
  now?: () => number;
  pause?: (ms: number) => Promise<void>;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** One lane per registry endpoint, so lookups that share a rate limit share a lane. */
export function registryLaneKey(domainName: string): string {
  const plan = planRegistryLookup(domainName);
  if (plan.primary === 'WHOIS' && plan.whoisHost) return `whois:${plan.whoisHost}`;
  return RDAP_LANE_KEY;
}

export function groupByRegistryLane<T extends RegistryLaneItem>(
  items: readonly T[],
): Map<string, T[]> {
  const lanes = new Map<string, T[]>();
  for (const item of items) {
    const key = registryLaneKey(item.domainName);
    const lane = lanes.get(key);
    if (lane) lane.push(item);
    else lanes.set(key, [item]);
  }
  return lanes;
}

/**
 * Lanes run in parallel. Inside a lane, workers query one after another with `gapMs`
 * between queries. `run` must not throw.
 */
export async function runRegistryLanes<T extends RegistryLaneItem>(
  items: readonly T[],
  run: (item: T) => Promise<void>,
  options: RunRegistryLanesOptions,
): Promise<void> {
  const workers: Promise<void>[] = [];
  for (const [key, queue] of groupByRegistryLane(items)) {
    const concurrency = key === RDAP_LANE_KEY ? RDAP_LANE_CONCURRENCY : WHOIS_LANE_CONCURRENCY;
    const count = Math.min(concurrency, queue.length);
    for (let index = 0; index < count; index += 1) {
      workers.push(drainLane(queue, run, options));
    }
  }
  await Promise.all(workers);
}

async function drainLane<T>(
  queue: T[],
  run: (item: T) => Promise<void>,
  options: RunRegistryLanesOptions,
): Promise<void> {
  const now = options.now ?? Date.now;
  const pause = options.pause ?? delay;
  const gapMs = options.gapMs ?? WHOIS_QUERY_GAP_MS;
  let started = false;
  while (queue.length > 0) {
    if (started) await pause(gapMs);
    if (started && now() >= options.deadlineAt) return;
    const item = queue.shift();
    if (item === undefined) return;
    started = true;
    await run(item);
  }
}
