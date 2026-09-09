import type { ComponentPropsWithRef } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_DOCK_ITEM_CLASS } from './mobile-bottom-nav-constants';
import { MOBILE_WORKSPACE_SETTINGS_LABEL } from './mobile-workspace-dock-constants';

export function MobileDockSettingsButton(props: ComponentPropsWithRef<'button'>) {
  return (
    <button
      {...props}
      type="button"
      className={cn(
        MOBILE_DOCK_ITEM_CLASS,
        'text-muted-foreground hover:text-foreground hover:bg-muted/70 h-auto w-full',
        props.className,
      )}
      aria-label={MOBILE_WORKSPACE_SETTINGS_LABEL}
    >
      <Settings size={18} aria-hidden />
      {MOBILE_WORKSPACE_SETTINGS_LABEL}
    </button>
  );
}
