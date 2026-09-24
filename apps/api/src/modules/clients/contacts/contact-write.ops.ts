import type { ContactRole, InputJsonValue, TransactionClient } from '@nbos/database';
import { CONTACT_LIST_INCLUDE, deleteOverlappingExtraPhones } from './contact-phone.ops';

export interface CreateContactDto {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
  messengerLinks?: InputJsonValue;
  responsibleEmployeeId?: string | null;
}

export async function applyContactUpdate(
  tx: TransactionClient,
  id: string,
  data: Partial<CreateContactDto>,
) {
  if (data.phone !== undefined) {
    await deleteOverlappingExtraPhones(tx, id, data.phone);
  }
  return tx.contact.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.role && { role: data.role as ContactRole }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.messengerLinks !== undefined && {
        messengerLinks: JSON.parse(JSON.stringify(data.messengerLinks)),
      }),
      ...(data.responsibleEmployeeId !== undefined && {
        responsibleEmployeeId: data.responsibleEmployeeId,
      }),
    },
    include: CONTACT_LIST_INCLUDE,
  });
}
