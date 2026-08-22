import { describe, expect, it } from 'vitest';
import {
  consumeFixedWindow,
  createCounter,
  retryAfterSecondsUntil,
} from './agent-rate-limit.window';

const WINDOW_MS = 60_000;
const LIMIT = 3;
const START = 1_000_000;

describe('agent fixed-window accounting', () => {
  it('allows exactly the configured number of calls in one window', () => {
    const counter = createCounter(START);

    const decisions = [0, 1, 2, 3].map((offset) =>
      consumeFixedWindow(counter, LIMIT, WINDOW_MS, START + offset),
    );

    expect(decisions.map((decision) => decision.allowed)).toEqual([true, true, true, false]);
  });

  it('reports the remaining budget so a client can pace itself', () => {
    const counter = createCounter(START);

    const remaining = [0, 1, 2].map(
      (offset) => consumeFixedWindow(counter, LIMIT, WINDOW_MS, START + offset).remaining,
    );

    expect(remaining).toEqual([2, 1, 0]);
  });

  it('does not consume budget once the limit is reached', () => {
    const counter = createCounter(START);
    for (let call = 0; call < LIMIT + 5; call += 1) {
      consumeFixedWindow(counter, LIMIT, WINDOW_MS, START);
    }

    expect(counter.used).toBe(LIMIT);
  });

  it('starts a fresh window after the interval elapses', () => {
    const counter = createCounter(START);
    for (let call = 0; call < LIMIT; call += 1) {
      consumeFixedWindow(counter, LIMIT, WINDOW_MS, START);
    }

    const afterWindow = consumeFixedWindow(counter, LIMIT, WINDOW_MS, START + WINDOW_MS);

    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(LIMIT - 1);
  });

  it('reports a retry hint that covers the rest of the window', () => {
    const counter = createCounter(START);
    for (let call = 0; call < LIMIT; call += 1) {
      consumeFixedWindow(counter, LIMIT, WINDOW_MS, START);
    }

    const denied = consumeFixedWindow(counter, LIMIT, WINDOW_MS, START + 30_000);

    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(30);
  });

  it('never hands back a zero-second retry hint', () => {
    expect(retryAfterSecondsUntil(START, START)).toBe(1);
    expect(retryAfterSecondsUntil(START - 5_000, START)).toBe(1);
  });
});
