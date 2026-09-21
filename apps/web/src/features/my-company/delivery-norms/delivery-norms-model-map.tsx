'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { type DeliveryNormsMapKey, locationForMapKey } from './delivery-norms-workspace';

const PROFILE_CHILD_KEYS = [
  'profileUnits',
  'profileIncluded',
  'profileCore',
  'profilePresets',
] as const;

export function DeliveryNormsModelMap({ onOpen }: { onOpen: (key: DeliveryNormsMapKey) => void }) {
  return (
    <ol className="space-y-3">
      <TopLevelStep mapKey="enrollment" onOpen={onOpen} />
      <TopLevelStep mapKey="rates" onOpen={onOpen} />
      <ProfilesStep onOpen={onOpen} />
      <TopLevelStep mapKey="functions" onOpen={onOpen} />
      <TopLevelStep mapKey="sale" onOpen={onOpen} />
    </ol>
  );
}

function TopLevelStep({
  mapKey,
  onOpen,
}: {
  mapKey: 'enrollment' | 'rates' | 'functions' | 'sale';
  onOpen: (key: DeliveryNormsMapKey) => void;
}) {
  const t = useTranslations('hr.deliveryNorms.workspace.map');
  return (
    <li className="border-border bg-card rounded-2xl border p-4">
      <MapRow
        mapKey={mapKey}
        index={t(`${mapKey}.index`)}
        title={t(`${mapKey}.title`)}
        body={t(`${mapKey}.body`)}
        onOpen={onOpen}
      />
    </li>
  );
}

function ProfilesStep({ onOpen }: { onOpen: (key: DeliveryNormsMapKey) => void }) {
  const t = useTranslations('hr.deliveryNorms.workspace.map');
  return (
    <li className="border-border bg-card space-y-3 rounded-2xl border p-4">
      <MapRow
        mapKey="profiles"
        index={t('profiles.index')}
        title={t('profiles.title')}
        body={t('profiles.body')}
        onOpen={onOpen}
      />
      <ol className="border-border space-y-2 border-l pl-4">
        {PROFILE_CHILD_KEYS.map((key) => (
          <MapSubstep
            key={key}
            mapKey={key}
            title={t(`${key}.title`)}
            body={t(`${key}.body`)}
            onOpen={onOpen}
          />
        ))}
      </ol>
    </li>
  );
}

function MapSubstep({
  mapKey,
  title,
  body,
  onOpen,
}: {
  mapKey: DeliveryNormsMapKey;
  title: string;
  body: string;
  onOpen: (key: DeliveryNormsMapKey) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="hover:bg-muted/70 flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left"
        onClick={() => onOpen(mapKey)}
      >
        <span className="min-w-0">
          <span className="text-foreground block text-sm font-medium">{title}</span>
          <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">{body}</span>
        </span>
        <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      </button>
    </li>
  );
}

function MapRow({
  mapKey,
  index,
  title,
  body,
  onOpen,
}: {
  mapKey: DeliveryNormsMapKey;
  index: string;
  title: string;
  body: string;
  onOpen: (key: DeliveryNormsMapKey) => void;
}) {
  const t = useTranslations('hr.deliveryNorms.workspace');
  const staysOnOverview = locationForMapKey(mapKey).tab === 'overview';
  return (
    <button
      type="button"
      className="flex w-full items-start justify-between gap-4 text-left"
      onClick={() => onOpen(mapKey)}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wide">
          {index}
        </span>
        <span className="min-w-0">
          <span className="text-foreground block text-sm font-semibold">{title}</span>
          <span className="text-muted-foreground mt-1 block text-sm leading-relaxed">{body}</span>
        </span>
      </span>
      <span
        className={cn(
          'text-muted-foreground mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium',
          staysOnOverview && 'sr-only',
        )}
      >
        {t('panel.open')}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </button>
  );
}
