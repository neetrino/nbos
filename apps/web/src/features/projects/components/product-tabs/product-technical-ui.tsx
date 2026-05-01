import { AlertTriangle, CheckCircle2, Database, Globe2, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  TechnicalAssetType,
  TechnicalEnvironmentKind,
  TechnicalProductProfileResponse,
} from '@/lib/api/technical';
import { SelectInput, TextInput } from './product-technical-inputs';

export const ASSET_TYPES: TechnicalAssetType[] = [
  'DOMAIN',
  'HOSTING',
  'REPOSITORY',
  'DATABASE',
  'STORAGE',
  'MONITORING',
  'OTHER',
];

export const ENV_KINDS: TechnicalEnvironmentKind[] = [
  'PRODUCTION',
  'STAGING',
  'DEVELOPMENT',
  'PREVIEW',
  'LEGACY',
];

export type TechnicalProfileDraft = {
  productionUrl: string;
  repositoryUrl: string;
  hostingProvider: string;
};

export type TechnicalAssetDraft = {
  name: string;
  type: TechnicalAssetType;
  provider: string;
};

export type TechnicalEnvironmentDraft = {
  name: string;
  kind: TechnicalEnvironmentKind;
  url: string;
};

export function ReadinessCard({ data }: { data: TechnicalProductProfileResponse }) {
  const ready = data.readiness.isReadyForTransfer;
  const Icon = ready ? CheckCircle2 : AlertTriangle;
  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <div className="flex items-start gap-3">
        <Icon className={ready ? 'text-green-600' : 'text-amber-600'} size={22} />
        <div>
          <h3 className="font-semibold">
            {ready ? 'Technical readiness looks good' : 'Technical readiness missing data'}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {data.readiness.summary.environmentCount} environments,{' '}
            {data.readiness.summary.assetCount} assets,{' '}
            {data.readiness.summary.credentialLinkedCount} credential links.
          </p>
        </div>
      </div>
      {data.readiness.blockers.length > 0 && (
        <div className="mt-4 grid gap-2">
          {data.readiness.blockers.map((item) => (
            <div
              key={item.code}
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              <span className="font-medium">{item.label}: </span>
              {item.message}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProfileCard({
  draft,
  onDraftChange,
  onSave,
  saving,
}: {
  draft: TechnicalProfileDraft;
  onDraftChange: (draft: TechnicalProfileDraft) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Globe2 size={16} /> Technical Profile
      </h3>
      <div className="space-y-3">
        <TextInput
          label="Production URL"
          value={draft.productionUrl}
          onChange={(productionUrl) => onDraftChange({ ...draft, productionUrl })}
        />
        <TextInput
          label="Repository URL"
          value={draft.repositoryUrl}
          onChange={(repositoryUrl) => onDraftChange({ ...draft, repositoryUrl })}
        />
        <TextInput
          label="Hosting Provider"
          value={draft.hostingProvider}
          onChange={(hostingProvider) => onDraftChange({ ...draft, hostingProvider })}
        />
        <Button onClick={onSave} disabled={saving} size="sm">
          Save Profile
        </Button>
      </div>
    </section>
  );
}

export function QuickAddCard({
  assetDraft,
  envDraft,
  saving,
  onAssetChange,
  onEnvironmentChange,
  onCreateAsset,
  onCreateEnvironment,
}: {
  assetDraft: TechnicalAssetDraft;
  envDraft: TechnicalEnvironmentDraft;
  saving: boolean;
  onAssetChange: (draft: TechnicalAssetDraft) => void;
  onEnvironmentChange: (draft: TechnicalEnvironmentDraft) => void;
  onCreateAsset: () => void;
  onCreateEnvironment: () => void;
}) {
  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Server size={16} /> Quick Add
      </h3>
      <div className="space-y-4">
        <AssetQuickAdd
          draft={assetDraft}
          saving={saving}
          onChange={onAssetChange}
          onCreate={onCreateAsset}
        />
        <div className="border-border border-t pt-4">
          <EnvironmentQuickAdd
            draft={envDraft}
            saving={saving}
            onChange={onEnvironmentChange}
            onCreate={onCreateEnvironment}
          />
        </div>
      </div>
    </section>
  );
}

export function ListCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; meta: string; status: string }>;
}) {
  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Database size={16} /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="border-border rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{item.title}</p>
                <span className="bg-secondary rounded-md px-2 py-0.5 text-xs">{item.status}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{item.meta}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AssetQuickAdd({
  draft,
  saving,
  onChange,
  onCreate,
}: {
  draft: TechnicalAssetDraft;
  saving: boolean;
  onChange: (draft: TechnicalAssetDraft) => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-2">
      <TextInput
        label="Asset name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <SelectInput
        label="Asset type"
        value={draft.type}
        options={ASSET_TYPES}
        onChange={(type) => onChange({ ...draft, type: type as TechnicalAssetType })}
      />
      <TextInput
        label="Provider"
        value={draft.provider}
        onChange={(provider) => onChange({ ...draft, provider })}
      />
      <Button
        onClick={onCreate}
        disabled={saving || !draft.name.trim()}
        size="sm"
        variant="outline"
      >
        Add Asset
      </Button>
    </div>
  );
}

function EnvironmentQuickAdd({
  draft,
  saving,
  onChange,
  onCreate,
}: {
  draft: TechnicalEnvironmentDraft;
  saving: boolean;
  onChange: (draft: TechnicalEnvironmentDraft) => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-2">
      <TextInput
        label="Environment name"
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <SelectInput
        label="Environment kind"
        value={draft.kind}
        options={ENV_KINDS}
        onChange={(kind) => onChange({ ...draft, kind: kind as TechnicalEnvironmentKind })}
      />
      <TextInput
        label="Environment URL"
        value={draft.url}
        onChange={(url) => onChange({ ...draft, url })}
      />
      <Button
        onClick={onCreate}
        disabled={saving || !draft.name.trim()}
        size="sm"
        variant="outline"
      >
        Add Environment
      </Button>
    </div>
  );
}
