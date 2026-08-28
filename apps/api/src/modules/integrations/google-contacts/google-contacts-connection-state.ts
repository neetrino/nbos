/** Org Google Contacts credentials exist and sync is allowed. */
export function canEnqueueGoogleContactsSync(row: {
  status: string;
  secret: { id: string } | null;
}): boolean {
  return row.secret != null && row.status !== 'DISCONNECTED';
}

/** Founder UI: show Sync now / Disconnect instead of Connect. */
export function isGoogleContactsLinked(row: {
  status: string;
  secret: { id: string } | null;
}): boolean {
  return canEnqueueGoogleContactsSync(row);
}
