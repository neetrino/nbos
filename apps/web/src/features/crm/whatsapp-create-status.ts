const WHATSAPP_CREATE_IN_FLIGHT_STATUSES = new Set(['PENDING', 'QUEUED', 'PROCESSING', 'CREATING']);

export function isWhatsAppCreateInFlight(status: string | null | undefined): boolean {
  return Boolean(status && WHATSAPP_CREATE_IN_FLIGHT_STATUSES.has(status));
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
