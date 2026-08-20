import type { CallSseEventName } from './call-realtime.constants';

export interface IncomingCallSsePayload {
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

export interface IncomingCallBusMessage {
  event: CallSseEventName;
  payload: IncomingCallSsePayload & { employeeId: string };
}
