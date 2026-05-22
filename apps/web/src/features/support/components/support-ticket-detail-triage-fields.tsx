'use client';

import { useEffect, useState } from 'react';
import { Layers, User, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RelationPickerField } from '@/components/shared';
import {
  useContactRelationSearch,
  useProductRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeSearchLoader } from '@/features/projects/components/delivery-board/delivery-item-detail-employee-search';
import {
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
} from '@/features/support/constants/support';
import type { SupportTriageDraft } from './support-ticket-detail-helpers';

export interface SupportTicketDetailTriageFieldsProps {
  draft: SupportTriageDraft;
  terminal: boolean;
  projectId: string;
  assigneeLabel?: string | null;
  productLabel?: string | null;
  contactLabel?: string | null;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}

export function SupportTicketDetailTriageFields({
  draft,
  terminal,
  projectId,
  assigneeLabel: assigneeLabelProp,
  productLabel: productLabelProp,
  contactLabel: contactLabelProp,
  onPatchDraft,
}: SupportTicketDetailTriageFieldsProps) {
  const [assigneeLabel, setAssigneeLabel] = useState(assigneeLabelProp ?? '');
  const [productLabel, setProductLabel] = useState(productLabelProp ?? '');
  const [contactLabel, setContactLabel] = useState(contactLabelProp ?? '');

  const searchEmployees = useEmployeeSearchLoader();
  const searchProducts = useProductRelationSearch(projectId || null);
  const searchContacts = useContactRelationSearch();
  const employeePicker = useRelationPickerActions('employee');
  const productPicker = useRelationPickerActions('product');
  const contactPicker = useRelationPickerActions('contact');

  useEffect(() => {
    if (assigneeLabelProp != null) setAssigneeLabel(assigneeLabelProp);
  }, [assigneeLabelProp]);

  useEffect(() => {
    if (productLabelProp != null) setProductLabel(productLabelProp);
  }, [productLabelProp]);

  useEffect(() => {
    if (contactLabelProp != null) setContactLabel(contactLabelProp);
  }, [contactLabelProp]);

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
        <div className="min-w-0">
          <RelationPickerField
            label="Assignee"
            entityKind="employee"
            value={draft.assignedTo || null}
            selectionLabel={assigneeLabel || null}
            placeholder="Unassigned — search employee…"
            icon={<UserCog size={12} />}
            disabled={terminal}
            onSearch={searchEmployees}
            onSelect={(id, label) => {
              onPatchDraft({ assignedTo: id });
              setAssigneeLabel(label);
            }}
            onClear={() => {
              onPatchDraft({ assignedTo: '' });
              setAssigneeLabel('');
            }}
            {...employeePicker}
          />
        </div>
        <div className="min-w-0">
          <RelationPickerField
            label="Product"
            entityKind="product"
            value={draft.productId || null}
            selectionLabel={productLabel || null}
            placeholder="Search products…"
            icon={<Layers size={12} />}
            disabled={terminal}
            onSearch={searchProducts}
            onSelect={(id, label) => {
              onPatchDraft({ productId: id });
              setProductLabel(label);
            }}
            onClear={() => {
              onPatchDraft({ productId: '' });
              setProductLabel('');
            }}
            {...productPicker}
          />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <RelationPickerField
            label="Contact"
            entityKind="contact"
            value={draft.contactId || null}
            selectionLabel={contactLabel || null}
            placeholder="Search contacts…"
            icon={<User size={12} />}
            disabled={terminal}
            onSearch={searchContacts}
            onSelect={(id, label) => {
              onPatchDraft({ contactId: id });
              setContactLabel(label);
            }}
            onClear={() => {
              onPatchDraft({ contactId: '' });
              setContactLabel('');
            }}
            {...contactPicker}
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
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
