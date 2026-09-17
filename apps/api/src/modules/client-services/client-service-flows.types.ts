export interface CreateClientServiceInvoiceBody {
  amount?: number;
  dueDate?: string | null;
  type?: string;
}

export interface CreateClientServiceExpensePlanBody {
  amount?: number;
  nextDueDate?: string | null;
  autoGenerate?: boolean;
}

export interface CreateClientServiceExpenseBody {
  amount?: number;
  dueDate?: string | null;
  status?: string;
  notes?: string;
  sourceInvoiceId?: string | null;
}

export interface CreateClientServiceTaskBody {
  creatorId: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: string;
  extraLinks?: Array<{ entityType: string; entityId: string }>;
  productId?: string | null;
  assigneeId?: string | null;
}
