'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import {
  EXPENSE_FREQUENCIES,
  PROJECTS_PAGE_SIZE,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  expensePlansApi,
  type CreateExpensePlanPayload,
  type ExpensePlan,
} from '@/lib/api/expense-plans';
import { projectsApi, type Project } from '@/lib/api/projects';

/** Prisma `ExpenseCategoryEnum` has no `OFFICE`; UI list includes it for legacy cards only. */
const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES.filter((c) => c.value !== 'OFFICE');

interface CreateExpensePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (plan: ExpensePlan) => void;
}

export function CreateExpensePlanDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateExpensePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: 'OTHER',
    frequency: 'ONE_TIME',
    nextDueDate: '',
    provider: '',
    projectId: 'none',
    autoGenerate: false,
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

  useEffect(() => {
    if (!open) return;
    setForm({
      name: '',
      amount: '',
      category: 'OTHER',
      frequency: 'ONE_TIME',
      nextDueDate: '',
      provider: '',
      projectId: 'none',
      autoGenerate: false,
      notes: '',
    });
    setFormError(null);
  }, [open]);

  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  const canSubmit = Boolean(form.name.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setFormError(null);
    const payload: CreateExpensePlanPayload = {
      name: form.name.trim(),
      category: form.category,
      amount: parsedAmount,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate.trim() ? form.nextDueDate : null,
      provider: form.provider.trim() || null,
      projectId: form.projectId !== 'none' ? form.projectId : null,
      autoGenerate: form.autoGenerate,
      notes: form.notes.trim() || null,
    };
    try {
      const created = await expensePlansApi.create(payload);
      onCreated(created);
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        getApiErrorMessage(caught, 'Expense plan could not be created. Check your connection.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New expense plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Office rent"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, category: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected amount *</Label>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, frequency: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Next due</Label>
              <Input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Provider</Label>
            <Input
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="Vendor or service name"
            />
          </div>
          <div>
            <Label>Project</Label>
            <Select
              value={form.projectId}
              onValueChange={(v) => {
                if (v) setForm({ ...form, projectId: v });
              }}
              disabled={projectsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={projectsLoading ? 'Loading…' : 'Optional'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-gen"
              checked={form.autoGenerate}
              onCheckedChange={(v) => setForm({ ...form, autoGenerate: v === true })}
            />
            <Label htmlFor="auto-gen" className="text-sm font-normal">
              Auto-generate expense cards (future)
            </Label>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating…' : 'Create plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
