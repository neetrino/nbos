'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Company, Contact } from '@/lib/api/clients';

const NONE = '__none__';

export type CreateProjectHubDialogFieldsProps = {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  contactId: string;
  onContactIdChange: (value: string) => void;
  companyId: string;
  onCompanyIdChange: (value: string) => void;
  contacts: Contact[];
  companies: Company[];
  optionsLoading: boolean;
  saving: boolean;
  error: string | null;
};

export function CreateProjectHubDialogFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  contactId,
  onContactIdChange,
  companyId,
  onCompanyIdChange,
  contacts,
  companies,
  optionsLoading,
  saving,
  error,
}: CreateProjectHubDialogFieldsProps) {
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
      <div>
        <Label>Client contact *</Label>
        <Select
          value={contactId || NONE}
          onValueChange={(v) => onContactIdChange(!v || v === NONE ? '' : v)}
          disabled={saving || optionsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={optionsLoading ? 'Loading…' : 'Select contact'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Select contact</SelectItem>
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Company (optional)</Label>
        <Select
          value={companyId || NONE}
          onValueChange={(v) => onCompanyIdChange(!v || v === NONE ? '' : v)}
          disabled={saving || optionsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {companies.map((co) => (
              <SelectItem key={co.id} value={co.id}>
                {co.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
