'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
import { CredentialFormSelectOption } from '@/features/credentials/components/credential-form-select-option';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import { credentialCategoryIcon } from '@/features/credentials/utils/credential-vault-card-meta';

export interface CredentialFormCategoryMenuProps {
  category: string;
  categoryLabel: string;
  categoryOptions: readonly CredentialCategoryOption[];
  categoryLocked: boolean;
  onCategoryChange: (value: string) => void;
}

function formatCategoryOptionLabel(
  value: string,
  options: readonly CredentialCategoryOption[],
  fallback: string,
): string {
  return options.find((opt) => opt.value === value)?.label ?? fallback;
}

export function CredentialFormCategoryMenu({
  category,
  categoryLabel,
  categoryOptions,
  categoryLocked,
  onCategoryChange,
}: CredentialFormCategoryMenuProps) {
  const CategoryIcon = credentialCategoryIcon(category);

  return (
    <div className="grid gap-2">
      <CredentialFormFieldLabel label="Category" icon={CategoryIcon} />
      <Select
        value={category}
        onValueChange={(value) => onCategoryChange(value ?? category)}
        disabled={categoryLocked}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select category">
            {(value: string | null) =>
              value ? (
                <CredentialFormSelectOption
                  kind="category"
                  value={value}
                  label={formatCategoryOptionLabel(value, categoryOptions, categoryLabel)}
                />
              ) : null
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categoryOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <CredentialFormSelectOption kind="category" value={opt.value} label={opt.label} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
