'use client';

import { useTranslations } from 'next-intl';
import { Layers, User, UserCog } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useContactRelationSearch,
  useProductRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeSearchLoader } from '@/features/projects/components/delivery-board/delivery-item-detail-employee-search';
import type { SupportTriageDraft } from './support-ticket-detail-helpers';

export function SupportTicketTriageRelations({
  draft,
  terminal,
  projectId,
  assigneeLabel,
  assigneeAvatar,
  productLabel,
  contactLabel,
  onAssigneeChange,
  onProductChange,
  onContactChange,
  onPatchDraft,
}: {
  draft: SupportTriageDraft;
  terminal: boolean;
  projectId: string | null;
  assigneeLabel: string;
  assigneeAvatar: string | null;
  productLabel: string;
  contactLabel: string;
  onAssigneeChange: (id: string, label: string, avatar: string | null) => void;
  onProductChange: (id: string, label: string) => void;
  onContactChange: (id: string, label: string) => void;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}) {
  const t = useTranslations('support');
  const searchEmployees = useEmployeeSearchLoader();
  const searchProducts = useProductRelationSearch(projectId || null);
  const searchContacts = useContactRelationSearch();
  const employeePicker = useRelationPickerActions('employee');
  const productPicker = useRelationPickerActions('product');
  const contactPicker = useRelationPickerActions('contact');

  return (
    <>
      <div className="min-w-0">
        <RelationPickerField
          label={t('list.assignee')}
          entityKind="employee"
          value={draft.assignedTo || null}
          selectionLabel={assigneeLabel || null}
          selectionAvatar={assigneeAvatar}
          icon={<UserCog size={12} />}
          disabled={terminal}
          onSearch={searchEmployees}
          onSelect={(id, label, avatar) => {
            onAssigneeChange(id, label, avatar?.trim() || null);
          }}
          onClear={() => onAssigneeChange('', '', null)}
          {...employeePicker}
        />
      </div>
      <div className="min-w-0">
        <RelationPickerField
          label={t('create.product')}
          entityKind="product"
          value={draft.productId || null}
          selectionLabel={productLabel || null}
          placeholder={t('create.productPlaceholder')}
          icon={<Layers size={12} />}
          disabled={terminal}
          onSearch={searchProducts}
          onSelect={onProductChange}
          onClear={() => onProductChange('', '')}
          {...productPicker}
        />
      </div>
      <div className="min-w-0 sm:col-span-2">
        <RelationPickerField
          label={t('sheet.contact')}
          entityKind="contact"
          value={draft.contactId || null}
          selectionLabel={contactLabel || null}
          placeholder={t('sheet.contactPlaceholder')}
          icon={<User size={12} />}
          disabled={terminal}
          onSearch={searchContacts}
          onSelect={onContactChange}
          onClear={() => onContactChange('', '')}
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
        {t('sheet.billable')}
      </label>
    </>
  );
}
