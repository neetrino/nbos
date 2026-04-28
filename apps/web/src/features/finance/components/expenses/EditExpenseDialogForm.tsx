'use client';

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
import { DialogFooter } from '@/components/ui/dialog';
import type { Project } from '@/lib/api/projects';
import { EXPENSE_FREQUENCIES, EXPENSE_TYPES, TAX_STATUSES } from './edit-expense-dialog-constants';

export interface EditExpenseFormState {
  name: string;
  amount: string;
  type: string;
  category: string;
  frequency: string;
  status: string;
  dueDate: string;
  projectId: string;
  isPassThrough: boolean;
  taxStatus: string;
  notes: string;
}

interface EditExpenseDialogFormProps {
  form: EditExpenseFormState;
  setForm: React.Dispatch<React.SetStateAction<EditExpenseFormState>>;
  categoryItems: Array<{ value: string; label: string }>;
  statusItems: Array<{ value: string; label: string }>;
  projects: Project[];
  projectsLoading: boolean;
  parsedAmount: number;
  formError: string | null;
  loading: boolean;
  canSubmit: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitIdleLabel?: string;
  submitLoadingLabel?: string;
}

export function EditExpenseDialogForm({
  form,
  setForm,
  categoryItems,
  statusItems,
  projects,
  projectsLoading,
  parsedAmount,
  formError,
  loading,
  canSubmit,
  onSubmit,
  onCancel,
  submitIdleLabel = 'Save',
  submitLoadingLabel = 'Saving…',
}: EditExpenseDialogFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          placeholder="Expense name"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Amount *</Label>
          <Input
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            aria-invalid={form.amount.trim() !== '' && !Number.isFinite(parsedAmount)}
          />
        </div>
        <div>
          <Label>Due date</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => {
              if (v) setForm({ ...form, type: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
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
              {categoryItems.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => {
              if (v) setForm({ ...form, status: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusItems.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tax status</Label>
          <Select
            value={form.taxStatus}
            onValueChange={(v) => {
              if (v) setForm({ ...form, taxStatus: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_STATUSES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  {p.code} · {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="expense-pass-through"
          checked={form.isPassThrough}
          onCheckedChange={(checked) => setForm({ ...form, isPassThrough: checked === true })}
        />
        <Label htmlFor="expense-pass-through" className="cursor-pointer font-normal">
          Pass-through
        </Label>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Optional notes"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !canSubmit}>
          {loading ? submitLoadingLabel : submitIdleLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
