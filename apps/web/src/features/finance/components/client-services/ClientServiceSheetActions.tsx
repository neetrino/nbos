'use client';

import { CheckSquare, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClientServiceRecord } from '@/lib/api/client-services';

interface ClientServiceSheetActionsProps {
  service: ClientServiceRecord;
  canCreateTask: boolean;
  disabled?: boolean;
  onCreateInvoice: () => void;
  onCreateExpense: () => void;
  onCreateTask: () => void;
}

export function ClientServiceSheetActions({
  service,
  canCreateTask,
  disabled = false,
  onCreateInvoice,
  onCreateExpense,
  onCreateTask,
}: ClientServiceSheetActionsProps) {
  const isWePay = service.billingModel === 'WE_PAY';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isWePay ? (
        <>
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
        </>
      ) : null}
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
