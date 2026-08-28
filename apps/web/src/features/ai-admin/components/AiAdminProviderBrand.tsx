import type { ReactNode } from 'react';
import { ItBrandMarkIcon } from '@/components/shared/it-brand-mark/ItBrandMarkIcon';
import { resolveItBrandMarkFromHints } from '@/lib/it-brand-marks/resolve-it-brand-mark';

export function AiAdminProviderBrand(props: { provider: string; className?: string }) {
  const glyph = aiAdminProviderGlyph(props.provider, props.className);
  return glyph ?? null;
}

export function aiAdminProviderGlyph(provider: string, className?: string): ReactNode {
  const mark = resolveItBrandMarkFromHints(provider);
  if (!mark) return undefined;
  return <ItBrandMarkIcon mark={mark} className={className} />;
}
