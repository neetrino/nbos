export interface CreateInvoiceInput {
  orderId?: string;
  subscriptionId?: string;
  projectId: string;
  companyId?: string;
  amount: number;
  type: string;
  dueDate?: string;
}
