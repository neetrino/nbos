'use client';

import { useCallback, useEffect, useState } from 'react';
import { technicalApi, type TechnicalProductProfileResponse } from '@/lib/api/technical';
import {
  emptyAssetDraft,
  emptyEnvironmentDraft,
  emptyProfileDraft,
  profileDraftFromData,
  technicalAssetItems,
  technicalEnvironmentItems,
} from './product-technical-state';
import { ListCard, ProfileCard, QuickAddCard, ReadinessCard } from './product-technical-ui';

export function ProductTechnicalTab({ productId }: { productId: string }) {
  const [data, setData] = useState<TechnicalProductProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft);
  const [assetDraft, setAssetDraft] = useState(emptyAssetDraft);
  const [envDraft, setEnvDraft] = useState(emptyEnvironmentDraft);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await technicalApi.getProductProfile(productId);
      setData(next);
      setProfileDraft(profileDraftFromData(next));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile() {
    setSaving(true);
    try {
      const next = await technicalApi.updateProfile(productId, profileDraft);
      setData(next);
    } finally {
      setSaving(false);
    }
  }

  async function createAsset() {
    if (!assetDraft.name.trim()) return;
    setSaving(true);
    try {
      setData(await technicalApi.createAsset(productId, assetDraft));
      setAssetDraft(emptyAssetDraft());
    } finally {
      setSaving(false);
    }
  }

  async function createEnvironment() {
    if (!envDraft.name.trim()) return;
    setSaving(true);
    try {
      setData(await technicalApi.createEnvironment(productId, envDraft));
      setEnvDraft(emptyEnvironmentDraft());
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Loading technical profile...
      </div>
    );
  if (!data)
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Technical profile unavailable.
      </div>
    );

  return (
    <div className="space-y-6">
      <ReadinessCard data={data} />
      <section className="grid gap-6 lg:grid-cols-2">
        <ProfileCard
          draft={profileDraft}
          onDraftChange={setProfileDraft}
          onSave={saveProfile}
          saving={saving}
        />
        <QuickAddCard
          assetDraft={assetDraft}
          envDraft={envDraft}
          saving={saving}
          onAssetChange={setAssetDraft}
          onEnvironmentChange={setEnvDraft}
          onCreateAsset={createAsset}
          onCreateEnvironment={createEnvironment}
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <ListCard
          title="Technical Assets"
          empty="No assets yet. Add hosting, repository, database, monitoring or domain dependencies."
          items={technicalAssetItems(data)}
        />
        <ListCard
          title="Environments"
          empty="No environments yet. Add Production/Staging/Development environments."
          items={technicalEnvironmentItems(data)}
        />
      </section>
    </div>
  );
}
