'use client';

import { useCallback, useState } from 'react';
import { Server } from 'lucide-react';
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
import { credentialsApi } from '@/lib/api/credentials';
import { isProviderRequiredForType } from '@/features/credentials/credential-field-config';

export interface CredentialProviderPickerProps {
  credentialType: string;
  providerId: string | null;
  providerName: string;
  onChange: (providerId: string | null, providerName: string) => void;
  disabled?: boolean;
}

export function CredentialProviderPicker({
  credentialType,
  providerId,
  providerName,
  onChange,
  disabled = false,
}: CredentialProviderPickerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  const required = isProviderRequiredForType(credentialType);

  const onSearch = useCallback(async (query: string) => {
    const items = await credentialsApi.searchProviders(query);
    return items.map((p) => ({
      value: p.id,
      label: p.name,
      subtitle: p.slug,
    }));
  }, []);

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
      onChange(created.id, created.name);
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <SearchField
        label={required ? 'Provider *' : 'Provider'}
        value={providerId}
        displayValue={providerName || undefined}
        placeholder="Search providers…"
        icon={<Server size={14} />}
        onSearch={onSearch}
        onSave={(id, label) => onChange(id, label)}
        onClear={() => onChange(null, '')}
        onNew={openCreate}
        newLabel="Create provider"
        disabled={disabled}
        maxResults={12}
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
