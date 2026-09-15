'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { FolderKanban, Layers } from 'lucide-react';
import {
  CreateFormDialog,
  FormFieldRow,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  useProductRelationSearch,
  useProjectRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '@/features/support/constants/support';
import {
  translateSupportCategory,
  translateSupportPriority,
  type SupportTranslator,
} from '@/features/support/support-message-keys';

export interface SupportCreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle?: string;
  submitLabel?: string;
  title: string;
  projectId: string;
  productId: string;
  category: string;
  priority: string;
  description: string;
  onTitleChange: (value: string) => void;
  onProjectIdChange: (value: string) => void;
  onProductIdChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  forceNestedBackdrop?: boolean;
}

export function SupportCreateTicketDialog({
  open,
  onOpenChange,
  dialogTitle,
  submitLabel,
  title,
  projectId,
  productId,
  category,
  priority,
  description,
  onTitleChange,
  onProjectIdChange,
  onProductIdChange,
  onCategoryChange,
  onPriorityChange,
  onDescriptionChange,
  onSubmit,
  submitting,
  forceNestedBackdrop = false,
}: SupportCreateTicketDialogProps) {
  const t = useTranslations('support') as SupportTranslator;
  const tCommon = useTranslations('common');
  const [projectLabel, setProjectLabel] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const searchProjects = useProjectRelationSearch();
  const searchProducts = useProductRelationSearch(projectId || null);
  const projectPicker = useRelationPickerActions('project');
  const productPicker = useRelationPickerActions('product');
  const categoryOptions = TICKET_CATEGORIES.map((item) => ({
    value: item.value,
    label: translateSupportCategory(t, item.value, item.label),
  }));
  const priorityOptions = TICKET_PRIORITIES.map((item) => ({
    value: item.value,
    label: translateSupportPriority(t, item.value, item.label),
  }));
  const canSubmit = title.trim().length > 0 && !submitting;

  const clearProjectSelection = () => {
    onProjectIdChange('');
    setProjectLabel('');
    onProductIdChange('');
    setProductLabel('');
  };

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle ?? t('create.title')}
      submitting={submitting}
      canSubmit={canSubmit}
      submitLabel={submitLabel ?? tCommon('create')}
      submittingLabel={tCommon('creating')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop={forceNestedBackdrop}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <InlineField
        variant="controlled"
        label={t('create.titleLabel')}
        type="text"
        value={title}
        placeholder={t('create.titlePlaceholder')}
        onValueChange={onTitleChange}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label={t('filters.category')}
          type="select"
          value={category}
          options={categoryOptions}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) => value && onCategoryChange(value)}
        />
        <InlineField
          variant="controlled"
          label={t('filters.priority')}
          type="select"
          value={priority}
          options={priorityOptions}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) => value && onPriorityChange(value)}
        />
      </FormFieldRow>
      <RelationPickerField
        label={t('create.project')}
        entityKind="project"
        value={projectId || null}
        selectionLabel={projectId ? projectLabel || null : null}
        placeholder={t('create.projectPlaceholder')}
        icon={<FolderKanban size={12} />}
        onSearch={searchProjects}
        onSelect={(id, label) => {
          if (!id) {
            clearProjectSelection();
            return;
          }
          onProjectIdChange(id);
          setProjectLabel(label);
        }}
        onClear={clearProjectSelection}
        {...projectPicker}
      />
      {projectId ? (
        <RelationPickerField
          label={t('create.product')}
          entityKind="product"
          value={productId || null}
          selectionLabel={productId ? productLabel || null : null}
          placeholder={t('create.productPlaceholder')}
          icon={<Layers size={12} />}
          onSearch={searchProducts}
          onSelect={(id, label) => {
            onProductIdChange(id);
            setProductLabel(label);
          }}
          onClear={() => {
            onProductIdChange('');
            setProductLabel('');
          }}
          {...productPicker}
        />
      ) : null}
      <InlineField
        variant="controlled"
        label={t('create.description')}
        type="textarea"
        value={description}
        onValueChange={onDescriptionChange}
      />
    </CreateFormDialog>
  );
}
