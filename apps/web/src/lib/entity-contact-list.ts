import { mergeEntityContactIds } from '@nbos/shared';

type ContactRow = {
  contact: { id: string; firstName: string; lastName: string };
};

/** Builds unified contact ids + labels from primary FK + junction rows. */
export function contactIdsAndLabelsFromRows(
  primary: { id: string; firstName: string; lastName: string } | null | undefined,
  additionalRows: ContactRow[] | undefined,
): { contactIds: string[]; contactLabels: Record<string, string> } {
  const labels: Record<string, string> = {};
  const additionalIds: string[] = [];
  for (const row of additionalRows ?? []) {
    const contact = row.contact;
    additionalIds.push(contact.id);
    labels[contact.id] = `${contact.firstName} ${contact.lastName}`.trim();
  }
  const contactIds = mergeEntityContactIds(primary?.id ?? null, additionalIds);
  if (primary) {
    labels[primary.id] = `${primary.firstName} ${primary.lastName}`.trim();
  }
  return { contactIds, contactLabels: labels };
}
