'use client';

import { useEffect, useState } from 'react';
import { SIDEBAR_WIDTH_COLLAPSED_PX } from '@/components/layout/sidebar-layout-constants';

/** Reads `--app-sidebar-width` set by {@link AppLayout}. */
export function useAppSidebarCollapsed(): boolean {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--app-sidebar-width')
        .trim();
      const px = Number.parseInt(raw, 10);
      setCollapsed(Number.isFinite(px) ? px <= SIDEBAR_WIDTH_COLLAPSED_PX : false);
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  return collapsed;
}
