'use client';

import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

/** Product page gear — reserved for non-WhatsApp product options. */
export function ProductPageSettingsSheet() {
  return (
    <PageSettingsSheet
      title="Product settings"
      description="General options for this product."
      triggerAriaLabel="Product settings"
    >
      <p className="text-muted-foreground text-sm">More product settings will appear here.</p>
    </PageSettingsSheet>
  );
}
