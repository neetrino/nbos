import { describe, expect, it } from 'vitest';
import {
  activeCallHeroInitials,
  activeCallHeroTitle,
  shouldShowHeroPhone,
} from './active-call-hero';

describe('activeCallHeroTitle', () => {
  it('prefers the contact name', () => {
    expect(activeCallHeroTitle('Anna', 'Incoming call +374')).toBe('Anna');
  });

  it('collapses generated inbound labels to New caller', () => {
    expect(activeCallHeroTitle(null, 'Incoming call +37443729201')).toBe('New caller');
  });

  it('keeps outbound display names', () => {
    expect(activeCallHeroTitle(null, '+37443729201')).toBe('+37443729201');
  });
});

describe('activeCallHeroInitials', () => {
  it('uses the first letters of a real name', () => {
    expect(activeCallHeroInitials('Anna Petrosyan')).toBe('AP');
  });

  it('hides initials for generic caller titles', () => {
    expect(activeCallHeroInitials('New caller')).toBeNull();
  });
});

describe('shouldShowHeroPhone', () => {
  it('hides a duplicate phone heading', () => {
    expect(shouldShowHeroPhone('+374', '+374')).toBe(false);
    expect(shouldShowHeroPhone('+374', 'New caller')).toBe(true);
  });
});
