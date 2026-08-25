import type { people_v1 } from 'googleapis';
import type { PrismaClient } from '@nbos/database';
import {
  GOOGLE_CONTACTS_PERSON_FIELDS,
  GOOGLE_CONTACTS_UPDATE_FIELDS,
} from './google-contacts.constants';
import {
  isGooglePeopleEtagConflict,
  isGooglePeopleNotFound,
} from './google-contacts-people-errors';
import { nbosContactBiography, toGooglePersonBody } from './google-contacts-person.mapper';
import type { GoogleContactPersonInput } from './google-contacts.types';

type PrismaLike = Pick<InstanceType<typeof PrismaClient>, 'googleContactMapping'>;

export async function upsertGoogleContactPerson(
  people: people_v1.People,
  prisma: PrismaLike,
  contact: GoogleContactPersonInput,
  mapping: { resourceName: string; etag: string | null } | null,
): Promise<{ resourceName: string; etag: string | null }> {
  if (mapping) {
    return updateMappedPerson(people, prisma, contact, mapping);
  }
  return createLinkedPerson(people, prisma, contact);
}

async function updateMappedPerson(
  people: people_v1.People,
  prisma: PrismaLike,
  contact: GoogleContactPersonInput,
  mapping: { resourceName: string; etag: string | null },
): Promise<{ resourceName: string; etag: string | null }> {
  try {
    return await runUpdate(people, contact, mapping.resourceName, mapping.etag);
  } catch (error) {
    if (isGooglePeopleNotFound(error)) {
      await prisma.googleContactMapping.deleteMany({ where: { contactId: contact.id } });
      return createLinkedPerson(people, prisma, contact);
    }
    if (isGooglePeopleEtagConflict(error)) {
      const fresh = await people.people.get({
        resourceName: mapping.resourceName,
        personFields: GOOGLE_CONTACTS_PERSON_FIELDS,
      });
      return runUpdate(people, contact, mapping.resourceName, fresh.data.etag ?? null);
    }
    throw error;
  }
}

async function runUpdate(
  people: people_v1.People,
  contact: GoogleContactPersonInput,
  resourceName: string,
  etag: string | null,
): Promise<{ resourceName: string; etag: string | null }> {
  const updated = await people.people.updateContact({
    resourceName,
    updatePersonFields: GOOGLE_CONTACTS_UPDATE_FIELDS,
    personFields: GOOGLE_CONTACTS_PERSON_FIELDS,
    requestBody: toGooglePersonBody(contact, etag),
  });
  return {
    resourceName: updated.data.resourceName ?? resourceName,
    etag: updated.data.etag ?? null,
  };
}

async function createLinkedPerson(
  people: people_v1.People,
  prisma: PrismaLike,
  contact: GoogleContactPersonInput,
): Promise<{ resourceName: string; etag: string | null }> {
  const existing = await findPersonByBiography(people, contact.id);
  if (existing?.resourceName) {
    return updateMappedPerson(people, prisma, contact, {
      resourceName: existing.resourceName,
      etag: existing.etag ?? null,
    });
  }
  const created = await people.people.createContact({
    personFields: GOOGLE_CONTACTS_PERSON_FIELDS,
    requestBody: toGooglePersonBody(contact, null),
  });
  const resourceName = created.data.resourceName;
  if (!resourceName) {
    throw new Error('Google createContact returned no resourceName');
  }
  return { resourceName, etag: created.data.etag ?? null };
}

async function findPersonByBiography(
  people: people_v1.People,
  contactId: string,
): Promise<{ resourceName?: string | null; etag?: string | null } | null> {
  const biography = nbosContactBiography(contactId);
  const result = await people.people.searchContacts({
    query: biography,
    readMask: GOOGLE_CONTACTS_PERSON_FIELDS,
    pageSize: 5,
  });
  const match = result.data.results?.find((row) =>
    row.person?.biographies?.some((entry) => entry.value === biography),
  );
  return match?.person ?? null;
}
