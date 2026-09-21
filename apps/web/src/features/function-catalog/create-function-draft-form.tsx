'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';

const EMPTY = {
  code: '',
  category: '',
  iconKey: 'Layers',
  title: '',
  summary: '',
  scopeBoundaries: '',
  instructions: '',
  acceptanceCriteria: '',
};

export function CreateFunctionDraftForm({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations('hr.functionCatalog');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {t('createDraft')}
      </Button>
    );
  }

  return (
    <form
      className="border-border bg-card grid gap-2 rounded-2xl border p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          setSaving(true);
          try {
            await deliveryFunctionsApi.createDraft(form);
            setForm(EMPTY);
            setOpen(false);
            onCreated();
          } finally {
            setSaving(false);
          }
        })();
      }}
    >
      {(
        [
          ['code', form.code],
          ['category', form.category],
          ['title', form.title],
          ['summary', form.summary],
        ] as const
      ).map(([key, value]) => (
        <Input
          key={key}
          required
          value={value}
          placeholder={key}
          onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        />
      ))}
      <textarea
        required
        value={form.instructions}
        placeholder={t('instructions')}
        onChange={(event) =>
          setForm((current) => ({ ...current, instructions: event.target.value }))
        }
        className="border-input bg-background text-foreground col-span-full min-h-24 rounded-md border px-3 py-2 text-sm"
      />
      <textarea
        required
        value={form.scopeBoundaries}
        placeholder={t('scope')}
        onChange={(event) =>
          setForm((current) => ({ ...current, scopeBoundaries: event.target.value }))
        }
        className="border-input bg-background text-foreground col-span-full min-h-20 rounded-md border px-3 py-2 text-sm"
      />
      <textarea
        required
        value={form.acceptanceCriteria}
        placeholder={t('acceptance')}
        onChange={(event) =>
          setForm((current) => ({ ...current, acceptanceCriteria: event.target.value }))
        }
        className="border-input bg-background text-foreground col-span-full min-h-20 rounded-md border px-3 py-2 text-sm"
      />
      <div className="col-span-full flex gap-2">
        <Button type="submit" disabled={saving}>
          {t('createDraft')}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {tCommon('cancel')}
        </Button>
      </div>
    </form>
  );
}
