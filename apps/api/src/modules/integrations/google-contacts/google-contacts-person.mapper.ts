import type { people_v1 } from 'googleapis';
import { googleContactPhoneValues } from './google-contacts-phone';
import type { GoogleContactPersonInput } from './google-contacts.types';

export function nbosContactBiography(contactId: string): string {
  return `NBOS Contact ID: ${contactId}`;
}

export function toGooglePersonBody(
  contact: GoogleContactPersonInput,
  etag?: string | null,
): people_v1.Schema$Person {
  const phones = googleContactPhoneValues([
    contact.phone ?? '',
    ...contact.extraPhones.map((row) => row.e164),
  ]);
  const person: people_v1.Schema$Person = {
    names: [
      {
        givenName: contact.firstName,
        familyName: contact.lastName,
      },
    ],
    biographies: [
      {
        value: nbosContactBiography(contact.id),
        contentType: 'TEXT_PLAIN',
      },
    ],
  };
  if (contact.email?.trim()) {
    person.emailAddresses = [{ value: contact.email.trim() }];
  }
  if (phones.length > 0) {
    person.phoneNumbers = phones.map((value, index) => ({
      value,
      type: index === 0 ? 'mobile' : 'other',
    }));
  }
  if (etag) {
    person.etag = etag;
  }
  return person;
}
