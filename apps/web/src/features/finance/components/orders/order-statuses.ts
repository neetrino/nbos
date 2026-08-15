export const ORDER_STATUSES: Record<
  string,
  { label: string; variant: 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'indigo' }
> = {
  PENDING_PAYMENT: { label: 'Pending Payment', variant: 'blue' },
  ACTIVE: { label: 'Active', variant: 'amber' },
  PARTIALLY_PAID: { label: 'Partially Paid', variant: 'amber' },
  FULLY_PAID: { label: 'Fully Paid', variant: 'green' },
  CLOSED: { label: 'Closed', variant: 'indigo' },
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUSES[status]?.label ?? status.replace(/_/g, ' ');
}
