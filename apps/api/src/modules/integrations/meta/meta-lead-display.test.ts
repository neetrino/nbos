import { describe, expect, it } from 'vitest';
import {
  buildFacebookLeadTitle,
  buildInstagramLeadContactName,
  buildInstagramLeadTitle,
  buildMetaLeadNames,
  isGenericMetaLeadField,
} from './meta-lead-display';

describe('meta-lead-display', () => {
  it('builds Instagram title from display name', () => {
    expect(
      buildInstagramLeadTitle({
        displayName: 'Karo Gabrielyan',
        username: 'karo_gabrielyan',
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
      }),
    ).toBe('Karo Gabrielyan');
  });

  it('builds Instagram subtitle from username', () => {
    expect(
      buildInstagramLeadContactName({
        displayName: 'Karo Gabrielyan',
        username: 'karo_gabrielyan',
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
      }),
    ).toBe('@karo_gabrielyan');
  });

  it('builds Facebook title from first and last name', () => {
    expect(
      buildFacebookLeadTitle({
        displayName: null,
        username: null,
        firstName: 'Karo',
        lastName: 'Gabrielyan',
        profilePictureUrl: null,
      }),
    ).toBe('Karo Gabrielyan');
  });

  it('detects generic Instagram lead names', () => {
    expect(isGenericMetaLeadField('Instagram DM', 'INSTAGRAM')).toBe(true);
    expect(isGenericMetaLeadField('Instagram user', 'INSTAGRAM')).toBe(true);
    expect(isGenericMetaLeadField('Karo Gabrielyan', 'INSTAGRAM')).toBe(false);
  });

  it('builds meta lead names per platform', () => {
    expect(
      buildMetaLeadNames('INSTAGRAM', {
        displayName: 'Karo Gabrielyan',
        username: 'karo_gabrielyan',
        firstName: null,
        lastName: null,
        profilePictureUrl: null,
      }),
    ).toEqual({
      name: 'Karo Gabrielyan',
      contactName: '@karo_gabrielyan',
    });
  });
});
