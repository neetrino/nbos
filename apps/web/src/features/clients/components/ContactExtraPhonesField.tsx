'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contactsApi, type Contact, type ContactExtraPhone } from '@/lib/api/clients';
import { getApiErrorMessage } from '@/lib/api-errors';

interface ContactExtraPhonesFieldProps {
  contactId: string;
  extraPhones: ContactExtraPhone[];
  disabled?: boolean;
  onChanged: (contact: Contact) => void;
}

export function ContactExtraPhonesField({
  contactId,
  extraPhones,
  disabled = false,
  onChanged,
}: ContactExtraPhonesFieldProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<Contact>) => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update extra phones.'));
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async () => {
    const phone = draft.trim();
    if (!phone) {
      setError('Enter a phone number.');
      return;
    }
    await run(() => contactsApi.addExtraPhone(contactId, phone));
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">Extra phones</p>
      {extraPhones.length === 0 ? (
        <p className="text-muted-foreground text-sm">No extra numbers yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {extraPhones.map((phone) => (
            <li
              key={phone.id}
              className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="truncate tabular-nums">{phone.e164}</span>
              {disabled ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  aria-label={`Remove ${phone.e164}`}
                  onClick={() => void run(() => contactsApi.removeExtraPhone(contactId, phone.id))}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {disabled ? null : (
        <div className="flex items-center gap-2">
          <Input
            type="tel"
            value={draft}
            placeholder="+374…"
            disabled={busy}
            className="h-9"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAdd();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void handleAdd()}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      )}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
