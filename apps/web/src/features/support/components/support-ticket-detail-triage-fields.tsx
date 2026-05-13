'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
} from '@/features/support/constants/support';
import type { Contact } from '@/lib/api/clients';
import type { Employee } from '@/lib/api/employees';
import type { ProjectProductSummary } from '@/lib/api/projects';
import type { SupportTriageDraft } from './support-ticket-detail-helpers';

export interface SupportTicketDetailTriageFieldsProps {
  draft: SupportTriageDraft;
  terminal: boolean;
  employees: Employee[];
  contacts: Contact[];
  productOptions: ProjectProductSummary[];
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}

export function SupportTicketDetailTriageFields({
  draft,
  terminal,
  employees,
  contacts,
  productOptions,
  onPatchDraft,
}: SupportTicketDetailTriageFieldsProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="st-title">Title</Label>
          <Input
            id="st-title"
            value={draft.title}
            onChange={(e) => onPatchDraft({ title: e.target.value })}
            disabled={terminal}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="st-desc">Description</Label>
          <Textarea
            id="st-desc"
            value={draft.description}
            onChange={(e) => onPatchDraft({ description: e.target.value })}
            rows={4}
            className="resize-y"
            disabled={terminal}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="st-cat">Category</Label>
          <select
            id="st-cat"
            className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={draft.category}
            onChange={(e) => onPatchDraft({ category: e.target.value })}
            disabled={terminal}
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="st-pri">Priority</Label>
          <select
            id="st-pri"
            className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={draft.priority}
            onChange={(e) => onPatchDraft({ priority: e.target.value })}
            disabled={terminal}
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="st-cov">Coverage decision</Label>
          <select
            id="st-cov"
            className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={draft.coverageDecision}
            onChange={(e) => onPatchDraft({ coverageDecision: e.target.value })}
            disabled={terminal}
          >
            <option value="">Not decided</option>
            {TICKET_COVERAGE_DECISIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="st-asg">Assignee</Label>
          <select
            id="st-asg"
            className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={draft.assignedTo}
            onChange={(e) => onPatchDraft({ assignedTo: e.target.value })}
            disabled={terminal}
          >
            <option value="">Unassigned</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="st-prod">Product</Label>
          <select
            id="st-prod"
            className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={draft.productId}
            onChange={(e) => onPatchDraft({ productId: e.target.value })}
            disabled={terminal}
          >
            <option value="">None</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="st-contact">Contact</Label>
          <select
            id="st-contact"
            className="border-border bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={draft.contactId}
            onChange={(e) => onPatchDraft({ contactId: e.target.value })}
            disabled={terminal}
          >
            <option value="">None</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.billable}
            onChange={(e) => onPatchDraft({ billable: e.target.checked })}
            disabled={terminal}
            className="size-4 rounded border"
          />
          Billable
        </label>
      </div>
    </>
  );
}
