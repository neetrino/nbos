'use client';

import { Check, CheckSquare, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceActionProps {
  showForm: boolean;
  invoiceAmount: string;
  creatingInvoice: boolean;
  setInvoiceAmount: (value: string) => void;
  setShowInvoiceForm: (value: boolean) => void;
  handleCreateInvoice: () => void;
}

interface TaskActionProps {
  showForm: boolean;
  taskTitle: string;
  creatingTask: boolean;
  setTaskTitle: (value: string) => void;
  setShowTaskForm: (value: boolean) => void;
  handleCreateTask: () => void;
}

export function InvoiceAction({
  showForm,
  invoiceAmount,
  creatingInvoice,
  setInvoiceAmount,
  setShowInvoiceForm,
  handleCreateInvoice,
}: InvoiceActionProps) {
  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        onClick={() => setShowInvoiceForm(true)}
      >
        <Plus size={14} />
        Create Invoice
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
      <label className="text-muted-foreground block text-[11px] font-medium">
        Invoice amount (AMD)
      </label>
      <input
        type="number"
        value={invoiceAmount}
        onChange={(event) => setInvoiceAmount(event.target.value)}
        placeholder="Amount..."
        className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400 dark:border-stone-700 dark:bg-stone-900"
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleCreateInvoice();
          if (event.key === 'Escape') setShowInvoiceForm(false);
        }}
      />
      <ActionButtons
        disabled={creatingInvoice || !invoiceAmount || Number(invoiceAmount) <= 0}
        onConfirm={handleCreateInvoice}
        onCancel={() => {
          setShowInvoiceForm(false);
          setInvoiceAmount('');
        }}
      />
    </div>
  );
}

export function DisabledInvoiceAction() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-center gap-1.5 border-stone-300 text-stone-500 dark:border-stone-600 dark:text-stone-400"
      disabled
      title="Fill required: Cost, Payment Type, Project, Deal Type, Tax Status; if Tax then Company"
    >
      <Plus size={14} />
      Create Invoice
    </Button>
  );
}

export function TaskAction({
  showForm,
  taskTitle,
  creatingTask,
  setTaskTitle,
  setShowTaskForm,
  handleCreateTask,
}: TaskActionProps) {
  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/30"
        onClick={() => setShowTaskForm(true)}
      >
        <CheckSquare size={14} />
        Create Task
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800 dark:bg-sky-950/20">
      <label className="text-muted-foreground block text-[11px] font-medium">Task title</label>
      <input
        type="text"
        value={taskTitle}
        onChange={(event) => setTaskTitle(event.target.value)}
        placeholder="Title..."
        className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-sky-400 dark:border-stone-700 dark:bg-stone-900"
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleCreateTask();
          if (event.key === 'Escape') setShowTaskForm(false);
        }}
      />
      <ActionButtons
        disabled={creatingTask || !taskTitle.trim()}
        onConfirm={handleCreateTask}
        onCancel={() => {
          setShowTaskForm(false);
          setTaskTitle('');
        }}
      />
    </div>
  );
}

function ActionButtons({
  disabled,
  onConfirm,
  onCancel,
}: {
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-1.5">
      <Button size="sm" className="gap-1" disabled={disabled} onClick={onConfirm}>
        <Check size={12} />
        Create
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <X size={12} />
      </Button>
    </div>
  );
}
