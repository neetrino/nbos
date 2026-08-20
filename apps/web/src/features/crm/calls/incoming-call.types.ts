export interface IncomingCallPayload {
  type: 'incoming_call';
  callId: string;
  direction: 'INBOUND';
  phone: string | null;
  contactName: string | null;
  leadName: string | null;
  dealName: string | null;
  responsibleEmployeeName: string | null;
  leadId: string | null;
  contactId: string | null;
  dealId: string | null;
}

export function parseIncomingCallPayload(raw: string): IncomingCallPayload | null {
  try {
    const data = JSON.parse(raw) as Partial<IncomingCallPayload>;
    if (data.type !== 'incoming_call') return null;
    if (typeof data.callId !== 'string' || data.callId.length === 0) return null;
    if (data.direction !== 'INBOUND') return null;
    return {
      type: 'incoming_call',
      callId: data.callId,
      direction: 'INBOUND',
      phone: asNullableString(data.phone),
      contactName: asNullableString(data.contactName),
      leadName: asNullableString(data.leadName),
      dealName: asNullableString(data.dealName),
      responsibleEmployeeName: asNullableString(data.responsibleEmployeeName),
      leadId: asNullableString(data.leadId),
      contactId: asNullableString(data.contactId),
      dealId: asNullableString(data.dealId),
    };
  } catch {
    return null;
  }
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
