'use client';

import { useCallback, useState } from 'react';
import { Server } from 'lucide-react';
import { useCredentialProviderSearch } from '@/features/credentials/hooks/use-credential-provider-search';
import type { SearchOption } from '@/components/shared/search-field-option';
import { credentialsApi, type CredentialProviderOption } from '@/lib/api/credentials';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchField } from '@/components/shared/SearchField';
import { ItBrandMarkIcon } from '@/components/shared/it-brand-mark/ItBrandMarkIcon';
import { resolveItBrandMarkFromHints } from '@/lib/it-brand-marks/resolve-it-brand-mark';
import { isProviderRequiredForType } from '@/features/credentials/credential-field-config';
import { CREDENTIAL_PROVIDER_SEARCH_LIMIT } from '@/features/credentials/constants/credential-provider-search';

export interface CredentialProviderPickerProps {
  credentialType?: string;
  providerId: string | null;
  providerName: string;
  onChange: (providerId: string | null, providerName: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  labelStyle?: 'stacked' | 'outlined';
}

export function CredentialProviderPicker({
  credentialType,
  providerId,
  providerName,
  onChange,
  disabled = false,
  className,
  label,
  labelStyle = 'stacked',
}: CredentialProviderPickerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  const required = credentialType ? isProviderRequiredForType(credentialType) : false;
  const brand = resolveItBrandMarkFromHints(providerName);
  const { loadProviders, invalidateProviders } = useCredentialProviderSearch();

  const onSearch = useCallback(
    async (query: string) => toProviderSearchOptions(await loadProviders(query)),
    [loadProviders],
  );

  const openCreate = () => {
    setCreateName('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const name = createName.trim();
    if (name.length < 2) return;
    setCreating(true);
    try {
      const created = await credentialsApi.createProvider({ name });
      invalidateProviders();
      onChange(created.id, created.name);
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <SearchField
        label={label ?? (required ? 'Provider *' : 'Provider')}
        labelStyle={labelStyle}
        value={providerId}
        placeholder="Search providers…"
        icon={<Server size={14} />}
        className={className}
        displayValue={
          providerName ? (
            <span className="flex min-w-0 items-center gap-2">
              {brand ? <ItBrandMarkIcon mark={brand} className="size-3.5 shrink-0" /> : null}
              <span className="truncate">{providerName}</span>
            </span>
          ) : undefined
        }
        onSearch={onSearch}
        onSave={(id, label) => onChange(id, label)}
        onClear={() => onChange(null, '')}
        onNew={openCreate}
        newLabel="Create provider"
        disabled={disabled}
        maxResults={CREDENTIAL_PROVIDER_SEARCH_LIMIT}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create provider</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="new-provider-name">Company / service name</Label>
            <Input
              id="new-provider-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Beget, Google"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={creating || createName.trim().length < 2}
              onClick={() => void submitCreate()}
            >
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function toProviderSearchOptions(items: CredentialProviderOption[]): SearchOption[] {
  return items.map((provider) => {
    const mark = resolveItBrandMarkFromHints(provider.name, provider.slug);
    return {
      value: provider.id,
      label: provider.name,
      subtitle: provider.slug,
      leading: mark ? <ItBrandMarkIcon mark={mark} className="size-3.5" /> : undefined,
    };
  });
}
