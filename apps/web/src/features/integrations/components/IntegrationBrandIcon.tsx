import { ItBrandMarkIcon } from '@/components/shared/it-brand-mark/ItBrandMarkIcon';
import { resolveItBrandMarkFromHints } from '@/lib/it-brand-marks/resolve-it-brand-mark';

const INTEGRATION_BRAND_ICON_CLASS = 'mt-0.5 size-5';

export function IntegrationBrandIcon({
  name,
  className = INTEGRATION_BRAND_ICON_CLASS,
}: {
  name: string;
  className?: string;
}) {
  const mark = resolveItBrandMarkFromHints(name);
  if (!mark) return null;
  return <ItBrandMarkIcon mark={mark} className={className} />;
}
