import { describe, expect, it } from 'vitest';
import { isProviderRequiredForType, showsProviderPicker } from './credential-field-config';

describe('provider picker visibility', () => {
  it('shows for domain, hosting, and mail types', () => {
    expect(showsProviderPicker('DOMAIN_REGISTRAR')).toBe(true);
    expect(showsProviderPicker('HOSTING_SERVER')).toBe(true);
    expect(showsProviderPicker('MAIL_SMTP')).toBe(true);
    expect(isProviderRequiredForType('MAIL_SMTP')).toBe(true);
  });

  it('hides for other credential types', () => {
    expect(showsProviderPicker('API_KEY')).toBe(false);
    expect(showsProviderPicker('LOGIN_PASSWORD')).toBe(false);
    expect(showsProviderPicker('SSH_PRIVATE_KEY')).toBe(false);
    expect(showsProviderPicker('APP_STORE_ACCOUNT')).toBe(false);
    expect(showsProviderPicker('ENV_BUNDLE')).toBe(false);
  });
});
