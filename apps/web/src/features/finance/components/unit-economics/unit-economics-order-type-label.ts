const ORDER_TYPE_LABEL: Record<string, string> = {
  PRODUCT: 'Product',
  EXTENSION: 'Extension',
  OUTSOURCE: 'Outsource',
  MAINTENANCE: 'Maintenance',
};

/** Human label for delivery order type on Unit Economics rows. */
export function unitEconomicsOrderTypeLabel(orderType: string): string {
  return ORDER_TYPE_LABEL[orderType] ?? orderType;
}
