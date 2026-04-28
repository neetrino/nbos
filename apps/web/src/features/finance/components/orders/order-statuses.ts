export const ORDER_STATUSES: Record<
  string,
  { label: string; variant: 'green' | 'blue' | 'amber' | 'red' | 'gray' }
> = {
  NEW: { label: 'New', variant: 'blue' },
  PREPAID: { label: 'Prepaid', variant: 'amber' },
  PARTIALLY_PAID: { label: 'Partially Paid', variant: 'amber' },
  FULLY_PAID: { label: 'Fully Paid', variant: 'green' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
  CLOSED: { label: 'Closed', variant: 'gray' },
};
