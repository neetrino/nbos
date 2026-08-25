import { describe, expect, it } from 'vitest';
import { resolveCredentialBrandMark } from './resolve-credential-brand-mark';

describe('resolveCredentialBrandMark', () => {
  it('uses the hosting provider and ignores a Gmail login', () => {
    expect(
      resolveCredentialBrandMark({
        provider: 'Hetzner',
        name: 'hetzner.com',
        login: 'mail@neetrino.com',
        category: 'HOSTING',
        credentialType: 'HOSTING_SERVER',
      })?.slug,
    ).toBe('hetzner');
  });

  it('matches Name.am from the domain provider and ignores a Gmail login', () => {
    expect(
      resolveCredentialBrandMark({
        provider: 'Name.am',
        name: 'Laser Vagaa',
        login: 'babajanyan1994s@gmail.com',
        category: 'DOMAIN',
        credentialType: 'DOMAIN_REGISTRAR',
      })?.slug,
    ).toBe('nameam');
  });

  it('matches Beget from the hosting provider and ignores a Gmail login', () => {
    expect(
      resolveCredentialBrandMark({
        provider: 'Beget',
        name: 'Beget 3',
        login: 'babajav3@gmail.com',
        category: 'HOSTING',
        credentialType: 'HOSTING_SERVER',
      })?.slug,
    ).toBe('beget');
  });

  it('still matches Gmail from the name outside Mail', () => {
    expect(
      resolveCredentialBrandMark({
        provider: null,
        name: 'Busines Gmail',
        login: 'info@qtm-group.com',
        category: 'SERVICE',
      })?.slug,
    ).toBe('gmail');
  });

  it('uses a Gmail login only for Mail credentials', () => {
    expect(
      resolveCredentialBrandMark({
        name: 'Inbox',
        login: 'neetrinoagency@gmail.com',
        category: 'MAIL',
        credentialType: 'MAIL_SMTP',
      })?.slug,
    ).toBe('gmail');
    expect(
      resolveCredentialBrandMark({
        name: 'NBOS',
        login: 'neetrinoagency@gmail.com',
        category: 'SERVICE',
      }),
    ).toBeNull();
  });

  it('matches Amnic, Ucom and Viva from the provider and ignores a Gmail login', () => {
    expect(
      resolveCredentialBrandMark({
        provider: 'Amnic',
        name: '.am registry',
        login: 'ops@gmail.com',
        category: 'DOMAIN',
        credentialType: 'DOMAIN_REGISTRAR',
      })?.slug,
    ).toBe('amnic');
    expect(
      resolveCredentialBrandMark({
        provider: 'Ucom',
        login: 'ops@gmail.com',
        category: 'SERVICE',
      })?.slug,
    ).toBe('ucom');
    expect(
      resolveCredentialBrandMark({
        provider: 'Viva',
        login: 'ops@gmail.com',
        category: 'SERVICE',
      })?.slug,
    ).toBe('viva');
  });

  it('matches Hostinger from the provider name', () => {
    expect(
      resolveCredentialBrandMark({
        provider: 'Hostinger',
        login: 'ops@gmail.com',
        category: 'HOSTING',
      })?.slug,
    ).toBe('hostinger');
  });
});
