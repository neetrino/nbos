'use client';

import { Building2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InlineField, RelationPickerField } from '@/components/shared';
import {
  useCompanyRelationSearch,
  useContactRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';

export type CreateProjectHubDialogFieldsProps = {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  contactId: string;
  contactLabel: string;
  onContactChange: (id: string, label: string) => void;
  companyId: string;
  companyLabel: string;
  onCompanyChange: (id: string, label: string) => void;
  onCompanyClear: () => void;
  saving: boolean;
};

export function CreateProjectHubDialogFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  contactId,
  contactLabel,
  onContactChange,
  companyId,
  companyLabel,
  onCompanyChange,
  onCompanyClear,
  saving,
}: CreateProjectHubDialogFieldsProps) {
  const t = useTranslations('forms');
  const searchContacts = useContactRelationSearch(25);
  const searchCompanies = useCompanyRelationSearch(25);
  const contactPicker = useRelationPickerActions('contact', 'project-hub-create');
  const companyPicker = useRelationPickerActions('company', 'project-hub-create');

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('project.fields.name')}
        type="text"
        value={name}
        placeholder={t('project.placeholders.name')}
        disabled={saving}
        onValueChange={onNameChange}
      />
      <InlineField
        variant="controlled"
        label={t('project.fields.description')}
        type="textarea"
        value={description}
        placeholder={t('project.placeholders.description')}
        disabled={saving}
        onValueChange={onDescriptionChange}
      />
      <RelationPickerField
        label={t('project.fields.clientContact')}
        entityKind="contact"
        value={contactId || null}
        selectionLabel={contactLabel || null}
        placeholder={t('project.placeholders.contactSearch')}
        icon={<User size={12} />}
        disabled={saving}
        onSearch={searchContacts}
        onSelect={onContactChange}
        maxResults={25}
        {...contactPicker}
      />
      <RelationPickerField
        label={t('project.fields.company')}
        entityKind="company"
        value={companyId || null}
        selectionLabel={companyLabel || null}
        placeholder={t('project.placeholders.companySearch')}
        icon={<Building2 size={12} />}
        disabled={saving}
        onSearch={searchCompanies}
        onSelect={onCompanyChange}
        onClear={onCompanyClear}
        maxResults={25}
        {...companyPicker}
      />
    </>
  );
}
