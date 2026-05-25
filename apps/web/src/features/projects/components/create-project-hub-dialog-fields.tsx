'use client';

import { User, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RelationPickerField } from '@/components/shared';
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
  error: string | null;
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
  error,
}: CreateProjectHubDialogFieldsProps) {
  const searchContacts = useContactRelationSearch(25);
  const searchCompanies = useCompanyRelationSearch(25);
  const contactPicker = useRelationPickerActions('contact', 'project-hub-create');
  const companyPicker = useRelationPickerActions('company', 'project-hub-create');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="project-hub-name">Name *</Label>
        <Input
          id="project-hub-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Logistics Pro Dashboard"
          disabled={saving}
        />
      </div>
      <div>
        <Label htmlFor="project-hub-description">Description</Label>
        <Textarea
          id="project-hub-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Short context for the team"
          rows={3}
          disabled={saving}
        />
      </div>
      <RelationPickerField
        label="Client contact"
        entityKind="contact"
        value={contactId || null}
        selectionLabel={contactLabel || null}
        placeholder="Search contacts…"
        icon={<User size={12} />}
        disabled={saving}
        onSearch={searchContacts}
        onSelect={onContactChange}
        maxResults={25}
        {...contactPicker}
      />
      <RelationPickerField
        label="Company"
        entityKind="company"
        value={companyId || null}
        selectionLabel={companyLabel || null}
        placeholder="Optional — search company…"
        icon={<Building2 size={12} />}
        disabled={saving}
        onSearch={searchCompanies}
        onSelect={onCompanyChange}
        onClear={onCompanyClear}
        maxResults={25}
        {...companyPicker}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
