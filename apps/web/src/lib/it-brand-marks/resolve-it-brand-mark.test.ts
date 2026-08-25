import { describe, expect, it } from 'vitest';
import { resolveItBrandMark } from './resolve-it-brand-mark';

describe('resolveItBrandMark', () => {
  it('matches GitHub from hostname even when the label is generic', () => {
    const mark = resolveItBrandMark('https://github.com/nbos/app', 'git');
    expect(mark?.slug).toBe('github');
  });

  it('matches the Git logo from a git label when the host is unknown', () => {
    const mark = resolveItBrandMark('https://git.internal.company', 'git');
    expect(mark?.slug).toBe('git');
  });

  it('prefers a more specific Google host over google.com', () => {
    expect(resolveItBrandMark('https://docs.google.com/document/d/1', 'docs')?.slug).toBe(
      'googledocs',
    );
  });

  it('accepts bare hosts without a protocol', () => {
    expect(resolveItBrandMark('figma.com/file/abc', 'design')?.slug).toBe('figma');
  });

  it('uses the Slack local mark for slack.com', () => {
    expect(resolveItBrandMark('https://app.slack.com/client', 'slack')?.slug).toBe('slack');
    expect(resolveItBrandMark('https://app.slack.com/client', 'slack')?.hex).toBe('4A154B');
  });

  it('returns null for internal NBOS paths', () => {
    expect(resolveItBrandMark('/tasks', 'My tasks')).toBeNull();
  });
});
