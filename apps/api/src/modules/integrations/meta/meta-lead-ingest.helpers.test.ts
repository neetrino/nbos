import { describe, expect, it } from 'vitest';
import {
  buildLatestMessagePreview,
  META_MESSAGE_PREVIEW_MAX,
  resolveInboundMessageType,
} from './meta-lead-ingest.helpers';

describe('meta-lead-ingest.helpers', () => {
  it('preserves emoji and multiline text in preview bounds', () => {
    const text = '👋 Здравствуйте,\nхочу заказать сайт';
    expect(buildLatestMessagePreview(text)).toBe(text);
  });

  it('truncates preview safely', () => {
    const text = 'a'.repeat(META_MESSAGE_PREVIEW_MAX + 10);
    expect(buildLatestMessagePreview(text)?.endsWith('…')).toBe(true);
  });

  it('classifies inbound message types', () => {
    expect(resolveInboundMessageType('hello')).toBe('TEXT');
    expect(resolveInboundMessageType('')).toBe('EMPTY');
    expect(resolveInboundMessageType(undefined)).toBe('UNSUPPORTED');
  });
});
