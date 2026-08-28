export const GOOGLE_CONTACTS_CONNECTION_ID = 'google-contacts-org';

export const GOOGLE_CONTACTS_QUEUE_NAME = 'google.contacts-sync';
export const GOOGLE_CONTACTS_JOB_NAME = 'google.contacts.sync';

/** People API write quota: serialize updates with a 1s gap. */
export const GOOGLE_CONTACTS_OUTBOUND_GAP_MS = 1_000;

export const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts';
export const GOOGLE_CONTACTS_EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

export const GOOGLE_CONTACTS_SCOPES = [GOOGLE_CONTACTS_SCOPE, GOOGLE_CONTACTS_EMAIL_SCOPE] as const;

export const GOOGLE_CONTACTS_PERSON_FIELDS =
  'names,emailAddresses,phoneNumbers,biographies,metadata';

export const GOOGLE_CONTACTS_UPDATE_FIELDS = 'names,emailAddresses,phoneNumbers,biographies';

export const GOOGLE_CONTACTS_AUDIT_ENTITY = 'google_contacts';
export const GOOGLE_CONTACTS_AUDIT_CONNECTED = 'google_contacts.connected';
export const GOOGLE_CONTACTS_AUDIT_DISCONNECTED = 'google_contacts.disconnected';
export const GOOGLE_CONTACTS_AUDIT_SYNC_REQUESTED = 'google_contacts.sync_requested';
