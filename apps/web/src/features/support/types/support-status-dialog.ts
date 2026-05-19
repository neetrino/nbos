import type { SupportTicket } from '@/lib/api/support';

export type SupportStatusDialogState = {
  ticket: SupportTicket;
  mode: 'RESOLVED' | 'CLOSED';
};
