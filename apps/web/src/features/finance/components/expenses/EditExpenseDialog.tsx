'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EXPENSE_CATEGORIES, EXPENSE_STAGES } from '@/features/finance/constants/finance';
import { expensesApi, type Expense, type UpdateExpensePayload } from '@/lib/api/finance';
import { projectsApi, type Project } from '@/lib/api/projects';
import {
  PROJECTS_PAGE_SIZE,
  SCHEMA_EXPENSE_STATUSES,
  toDateInputValue,
} from './edit-expense-dialog-constants';
import { EditExpenseDialogForm, type EditExpenseFormState } from './EditExpenseDialogForm';

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Expense) => void;
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSaved,
}: EditExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<EditExpenseFormState>({
    name: '',
    amount: '',
    type: 'PLANNED',
    category: 'OTHER',
    frequency: 'ONE_TIME',
    status: 'THIS_MONTH',
    dueDate: '',
    projectId: 'none',
    isPassThrough: false,
    taxStatus: 'TAX',
    notes: '',
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setProjectsLoading(true);
    projectsApi
      .getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setProjects(res.items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const categoryItems = useMemo((): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = EXPENSE_CATEGORIES.map((c) => ({
      value: c.value,
      label: c.label,
    }));
    if (expense && !items.some((c) => c.value === expense.category)) {
      items.push({ value: expense.category, label: expense.category });
    }
    return items;
  }, [expense]);

  const statusItems = useMemo((): Array<{ value: string; label: string }> => {
    const base: Array<{ value: string; label: string }> = EXPENSE_STAGES.filter((s) =>
      SCHEMA_EXPENSE_STATUSES.has(s.value),
    ).map((s) => ({ value: s.value, label: s.label }));
    if (expense && !base.some((s) => s.value === expense.status)) {
      const row = EXPENSE_STAGES.find((s) => s.value === expense.status);
      return [
        ...base,
        { value: row?.value ?? expense.status, label: row?.label ?? expense.status },
      ];
    }
    return base;
  }, [expense]);

  useEffect(() => {
    if (!open || !expense) return;
    setForm({
      name: expense.name,
      amount: String(parseFloat(expense.amount)),
      type: expense.type,
      category: expense.category,
      frequency: expense.frequency,
      status: expense.status,
      dueDate: toDateInputValue(expense.dueDate),
      projectId: expense.projectId ?? 'none',
      isPassThrough: expense.isPassThrough,
      taxStatus: expense.taxStatus,
      notes: expense.notes ?? '',
    });
    setFormError(null);
  }, [open, expense]);

  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  const canSubmit =
    Boolean(expense && form.name.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense || !canSubmit) return;

    setLoading(true);
    setFormError(null);
    try {
      const payload: UpdateExpensePayload = {
        name: form.name.trim(),
        type: form.type,
        category: form.category,
        amount: parsedAmount,
        frequency: form.frequency,
        status: form.status,
        dueDate: form.dueDate.trim() ? form.dueDate : null,
        projectId: form.projectId === 'none' ? null : form.projectId,
        isPassThrough: form.isPassThrough,
        taxStatus: form.taxStatus,
        notes: form.notes.trim() ? form.notes.trim() : null,
      };
      const updated = await expensesApi.update(expense.id, payload);
      onSaved(updated);
      onOpenChange(false);
    } catch {
      setFormError('Expense could not be saved. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit expense</DialogTitle>
        </DialogHeader>

        <EditExpenseDialogForm
          form={form}
          setForm={setForm}
          categoryItems={categoryItems}
          statusItems={statusItems}
          projects={projects}
          projectsLoading={projectsLoading}
          parsedAmount={parsedAmount}
          formError={formError}
          loading={loading}
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
