'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EXPENSE_CATEGORIES, EXPENSE_STAGES } from '@/features/finance/constants/finance';
import { expensesApi, type CreateExpensePayload, type Expense } from '@/lib/api/finance';
import { projectsApi, type Project } from '@/lib/api/projects';
import { PROJECTS_PAGE_SIZE, SCHEMA_EXPENSE_STATUSES } from './edit-expense-dialog-constants';
import { EditExpenseDialogForm, type EditExpenseFormState } from './EditExpenseDialogForm';

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: Expense) => void;
  /** Pre-select project when opening from `/finance/expenses?projectId=`. */
  defaultProjectId?: string | null;
}

const EMPTY_FORM: EditExpenseFormState = {
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
};

export function CreateExpenseDialog({
  open,
  onOpenChange,
  onCreated,
  defaultProjectId = null,
}: CreateExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<EditExpenseFormState>(EMPTY_FORM);

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

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY_FORM,
      projectId: defaultProjectId && defaultProjectId.length > 0 ? defaultProjectId : 'none',
    });
    setFormError(null);
  }, [open, defaultProjectId]);

  const categoryItems = useMemo(
    (): Array<{ value: string; label: string }> =>
      EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    [],
  );

  const statusItems = useMemo(
    (): Array<{ value: string; label: string }> =>
      EXPENSE_STAGES.filter((s) => SCHEMA_EXPENSE_STATUSES.has(s.value)).map((s) => ({
        value: s.value,
        label: s.label,
      })),
    [],
  );

  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  const canSubmit = Boolean(form.name.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setFormError(null);
    try {
      const payload: CreateExpensePayload = {
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
      const created = await expensesApi.create(payload);
      onCreated(created);
      onOpenChange(false);
    } catch {
      setFormError('Expense could not be created. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
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
          submitIdleLabel="Create"
          submitLoadingLabel="Creating…"
        />
      </DialogContent>
    </Dialog>
  );
}
