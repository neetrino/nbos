'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CredentialFormFieldLabel } from '@/features/credentials/components/credential-form-field-label';
import { CredentialCategoryIcon } from '@/features/credentials/components/credential-meta-icon';
import { credentialCategoryIcon } from '@/features/credentials/utils/credential-vault-card-meta';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';

/** Dropdown list — wide enough for long labels (e.g. Admin). */
const CATEGORY_SELECT_DROPDOWN_MIN_WIDTH_CLASS = 'min-w-52';

export interface CredentialFormCategoryMenuProps {
  category: string;
  categoryLabel: string;
  categoryOptions: readonly CredentialCategoryOption[];
  categoryLocked: boolean;
  onCategoryChange: (value: string) => void;
}

function CategoryOptionLabel({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <CredentialCategoryIcon
        category={value}
        className="size-3.5 shrink-0 opacity-80"
        aria-hidden
      />
      {label}
    </span>
  );
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
        onValueChange={(v) => onCategoryChange(v ?? category)}
        disabled={categoryLocked}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select category">
            {(value: string | null) =>
              value ? <CategoryOptionLabel value={value} label={categoryLabel} /> : null
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={CATEGORY_SELECT_DROPDOWN_MIN_WIDTH_CLASS}>
          {categoryOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <CategoryOptionLabel value={opt.value} label={opt.label} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
