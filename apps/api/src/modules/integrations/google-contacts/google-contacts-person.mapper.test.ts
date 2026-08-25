import { describe, expect, it } from 'vitest';
import { toGooglePersonBody } from './google-contacts-person.mapper';

describe('toGooglePersonBody', () => {
  it('maps name, email, phones and NBOS biography', () => {
    const person = toGooglePersonBody({
      id: 'contact-1',
      firstName: 'Vazgen',
      lastName: 'Petrosyan',
      email: 'vazgen@example.com',
      phone: '+37477961718',
      extraPhones: [{ e164: '+37499111222' }],
    });
    expect(person.names?.[0]).toEqual({ givenName: 'Vazgen', familyName: 'Petrosyan' });
    expect(person.emailAddresses?.[0]?.value).toBe('vazgen@example.com');
    expect(person.phoneNumbers?.map((row) => row.value)).toEqual([
      '+37477961718',
      '#077961718',
      '+37499111222',
      '#099111222',
    ]);
    expect(person.biographies?.[0]?.value).toBe('NBOS Contact ID: contact-1');
  });
});
