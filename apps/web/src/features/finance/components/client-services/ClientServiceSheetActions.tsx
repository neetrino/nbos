'use client';

import { CheckSquare, FileText, ListChecks, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientServiceRecord } from '@/lib/api/client-services';

interface ClientServiceSheetActionsProps {
  service: ClientServiceRecord;
  canCreateTask: boolean;
  disabled?: boolean;
  onCreateInvoice: () => void;
  onCreateExpensePlan: () => void;
  onCreateExpense: () => void;
  onCreateTask: () => void;
}

export function ClientServiceSheetActions({
  service,
  canCreateTask,
  disabled = false,
  onCreateInvoice,
  onCreateExpensePlan,
  onCreateExpense,
  onCreateTask,
}: ClientServiceSheetActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {service.billingModel === 'CLIENT_PAID' ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onCreateInvoice}
        >
          <FileText size={14} aria-hidden />
          Create invoice
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onCreateExpensePlan}
      >
        <ListChecks size={14} aria-hidden />
        Create expense plan
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onCreateExpense}
      >
        <Receipt size={14} aria-hidden />
        Create expense
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !canCreateTask}
        onClick={onCreateTask}
      >
        <CheckSquare size={14} aria-hidden />
        Create task
      </Button>
    </div>
  );
}
