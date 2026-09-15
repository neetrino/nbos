import { DEFAULT_PARTNER_DEFAULT_PERCENT } from '@/features/partners/constants/partners';

export interface CreatePartnerFormState {
  name: string;
  level: string;
  direction: string;
  defaultPercent: string;
  status: string;
  contactId: string;
  notes: string;
  startDate: string;
}

export function emptyPartnerForm(defaultName = ''): CreatePartnerFormState {
  return {
    name: defaultName.trim(),
    level: 'REGULAR',
    direction: 'INBOUND',
    defaultPercent: String(DEFAULT_PARTNER_DEFAULT_PERCENT),
    status: 'ACTIVE',
    contactId: 'none',
    notes: '',
    startDate: '',
  };
}
