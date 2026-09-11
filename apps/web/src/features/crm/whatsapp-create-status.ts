const WHATSAPP_CREATE_IN_FLIGHT_STATUSES = new Set(['PENDING', 'QUEUED', 'PROCESSING', 'CREATING']);
export const WHATSAPP_CREATE_OPERATION_TYPE = 'CREATE_PRODUCT_GROUP';

export function isWhatsAppCreateInFlight(status: string | null | undefined): boolean {
  return Boolean(status && WHATSAPP_CREATE_IN_FLIGHT_STATUSES.has(status));
}

/** Create-in-flight from binding or a create operation — ignore sync/invite PROCESSING. */
export function isWhatsAppCreateInFlightFromLatest(input: {
  bindingStatus: string | null | undefined;
  latestOperationType?: string | null;
  latestOperationStatus?: string | null;
}): boolean {
  if (isWhatsAppCreateInFlight(input.bindingStatus)) return true;
  if (input.latestOperationType !== WHATSAPP_CREATE_OPERATION_TYPE) return false;
  return isWhatsAppCreateInFlight(input.latestOperationStatus);
}

export function whatsappCreateButtonLabel(input: {
  inFlight: boolean;
  failed: boolean;
  idleLabel: string;
}): string {
  if (input.inFlight) return 'Creating group…';
  if (input.failed) return 'Retry create group';
  return input.idleLabel;
}
