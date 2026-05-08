import { StatusBadge } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
} from '@/features/projects/constants/projects';
import { getNextExtensionTarget } from '../extensions/extension-status-flow';
import { ExtensionReadiness } from '../extensions/ExtensionReadiness';

interface ExtensionStageGateBlurbProps {
  extension: FullExtension;
}

export function ExtensionStageGateBlurb({ extension }: ExtensionStageGateBlurbProps) {
  const lc = extension.deliveryLifecycle;
  const next = getNextExtensionTarget(lc);
  const nextLabel = next ? `Next target: ${next}` : 'No configured transition from this state.';

  return (
    <div className="bg-muted/30 rounded-xl border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">Current delivery state</p>
          <ExtensionReadiness extension={extension} />
        </div>
        {lc ? (
          <StatusBadge
            label={formatDeliveryLifecycleLabel(lc)}
            variant={getDeliveryLifecycleVariant(lc)}
          />
        ) : null}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">{nextLabel}</p>
    </div>
  );
}
