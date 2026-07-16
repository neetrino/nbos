/** Display label for access slots — drop trailing "account" (Domain account → Domain). */
export function formatDeliveryAccessSlotLabel(label: string): string {
  return label.replace(/\s+account$/i, '').trim();
}
