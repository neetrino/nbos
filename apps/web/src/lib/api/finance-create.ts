export interface CreateInvoiceInput {
  orderId?: string;
  subscriptionId?: string;
  productId?: string;
  companyId?: string;
  amount: number;
  type?: string;
  dueDate?: string;
}
