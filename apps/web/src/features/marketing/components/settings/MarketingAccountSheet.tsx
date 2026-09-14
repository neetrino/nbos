'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { toastApiError } from '@/lib/permissions';
import { marketingApi, type MarketingAccount } from '@/lib/api/marketing';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import {
  buildMarketingAccountPatch,
  createMarketingAccountDraft,
  isMarketingAccountDraftDirty,
  type MarketingAccountDraft,
} from '@/features/marketing/utils/build-marketing-account-draft';
import { MarketingAccountSheetBody } from './MarketingAccountSheetBody';

interface MarketingAccountSheetProps {
  account: MarketingAccount | null;
  open: boolean;
  canEdit: boolean;
  expensePlans: ExpensePlan[];
  plansLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}

export function MarketingAccountSheet({
  account,
  open,
  canEdit,
  expensePlans,
  plansLoading,
  onOpenChange,
  onSaved,
}: MarketingAccountSheetProps) {
  const { persistedValue, onOpenChangeComplete } = useSheetPersistedValue(account);
  const hostMounted = useSheetHostMounted(open, persistedValue);

  if (!hostMounted || !persistedValue) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent open={open} layout="full" width="compact" forceNestedBackdrop>
        <MarketingAccountSheetEditor
          key={persistedValue.id}
          account={persistedValue}
          canEdit={canEdit}
          expensePlans={expensePlans}
          plansLoading={plansLoading}
          onSaved={onSaved}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}

interface MarketingAccountSheetEditorProps {
  account: MarketingAccount;
  canEdit: boolean;
  expensePlans: ExpensePlan[];
  plansLoading: boolean;
  onSaved: () => Promise<void>;
}

function MarketingAccountSheetEditor({
  account,
  canEdit,
  expensePlans,
  plansLoading,
  onSaved,
}: MarketingAccountSheetEditorProps) {
  const t = useTranslations('marketing');
  const [draft, setDraft] = useState(() => createMarketingAccountDraft(account));
  const [snap, setSnap] = useState(() => createMarketingAccountDraft(account));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dirty = isMarketingAccountDraftDirty(draft, snap);

  return (
    <MarketingAccountSheetBody
      account={account}
      draft={draft}
      snap={snap}
      dirty={dirty}
      canEdit={canEdit}
      saving={saving}
      errorMessage={errorMessage}
      expensePlans={expensePlans}
      plansLoading={plansLoading}
      onDraftChange={setDraft}
      onSave={() => {
        void saveMarketingAccount({
          accountId: account.id,
          snap,
          draft,
          setSaving,
          setErrorMessage,
          setSnap,
          onSaved,
          successMessage: t('settings.sheet.updated'),
          fallbackError: t('settings.loadError'),
        });
      }}
    />
  );
}

async function saveMarketingAccount(params: {
  accountId: string;
  snap: MarketingAccountDraft;
  draft: MarketingAccountDraft;
  setSaving: (value: boolean) => void;
  setErrorMessage: (value: string | null) => void;
  setSnap: (value: MarketingAccountDraft) => void;
  onSaved: () => Promise<void>;
  successMessage: string;
  fallbackError: string;
}): Promise<void> {
  if (!params.draft.name.trim()) return;
  const patch = buildMarketingAccountPatch(params.snap, params.draft);
  if (Object.keys(patch).length === 0) return;
  params.setSaving(true);
  params.setErrorMessage(null);
  try {
    await marketingApi.updateAccount(params.accountId, patch);
    params.setSnap(params.draft);
    await params.onSaved();
    toast.success(params.successMessage);
  } catch (caught) {
    toastApiError(caught, params.fallbackError);
    params.setErrorMessage(params.fallbackError);
  } finally {
    params.setSaving(false);
  }
}
