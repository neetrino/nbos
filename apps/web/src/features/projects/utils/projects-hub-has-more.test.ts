import { describe, expect, it } from 'vitest';
import { projectsHubHasMore } from './projects-hub-has-more';

describe('projectsHubHasMore', () => {
  it('is false when nothing is loaded and total is zero', () => {
    expect(projectsHubHasMore(0, 0)).toBe(false);
  });

  it('is true while loaded count is below total', () => {
    expect(projectsHubHasMore(20, 45)).toBe(true);
  });

  it('is false when all items are loaded', () => {
    expect(projectsHubHasMore(45, 45)).toBe(false);
    expect(projectsHubHasMore(50, 45)).toBe(false);
  });
});
