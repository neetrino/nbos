'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IntegrationBrandIcon } from '@/features/integrations/components/IntegrationBrandIcon';
import {
  DEAL_WHATSAPP_HEADER_LABEL,
  type DealWhatsAppHeaderPresentation,
  type DealWhatsAppHeaderTone,
  resolveDealWhatsAppHeaderPresentation,
} from '../deal-whatsapp-header-control';
import type { DealWhatsAppQuickAction } from '../deal-whatsapp-quick-action';
import { DealWhatsAppBindDialog } from './DealWhatsAppBindDialog';

const HEADER_BUTTON_CLASS = 'rounded-full shadow-sm';
const WHATSAPP_MENU_WIDTH_CLASS = 'w-max min-w-0';

interface DealWhatsAppHeaderControlProps {
  actions: DealWhatsAppQuickAction[];
  bindOpen: boolean;
  busy: boolean;
  onBindOpenChange: (open: boolean) => void;
  onBindSubmit: (groupChatId: string) => Promise<void>;
}

export function DealWhatsAppHeaderControl({
  actions,
  bindOpen,
  busy,
  onBindOpenChange,
  onBindSubmit,
}: DealWhatsAppHeaderControlProps) {
  const presentation = resolveDealWhatsAppHeaderPresentation(actions);
  return (
    <>
      <DealWhatsAppHeaderTrigger presentation={presentation} />
      <DealWhatsAppBindDialog
        open={bindOpen}
        busy={busy}
        onOpenChange={onBindOpenChange}
        onSubmit={onBindSubmit}
      />
    </>
  );
}

function DealWhatsAppHeaderTrigger({
  presentation,
}: {
  presentation: DealWhatsAppHeaderPresentation;
}) {
  if (presentation.mode === 'menu') {
    return <DealWhatsAppMenuButton presentation={presentation} />;
  }
  return (
    <DealWhatsAppFaceButton
      presentation={presentation}
      disabled={presentation.mode === 'disabled'}
    />
  );
}

function DealWhatsAppFaceButton({
  presentation,
  disabled = false,
}: {
  presentation: DealWhatsAppHeaderPresentation;
  disabled?: boolean;
}) {
  const blocked = disabled || !presentation.directAction?.enabled;
  return (
    <Button
      type="button"
      size="sm"
      variant={headerButtonVariant(presentation.tone)}
      className={HEADER_BUTTON_CLASS}
      disabled={blocked}
      title={presentation.triggerTitle}
      aria-label={presentation.triggerTitle ?? presentation.triggerLabel}
      onClick={() => presentation.directAction?.onClick?.()}
    >
      <WhatsAppHeaderIcon />
      {presentation.triggerLabel}
    </Button>
  );
}

function DealWhatsAppMenuButton({
  presentation,
}: {
  presentation: DealWhatsAppHeaderPresentation;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="sm"
            variant={headerButtonVariant(presentation.tone)}
            className={HEADER_BUTTON_CLASS}
            title={presentation.triggerTitle ?? DEAL_WHATSAPP_HEADER_LABEL}
            aria-label={presentation.triggerTitle ?? DEAL_WHATSAPP_HEADER_LABEL}
          >
            <WhatsAppHeaderIcon />
            {presentation.triggerLabel}
            <ChevronDown size={14} className="opacity-60" aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className={WHATSAPP_MENU_WIDTH_CLASS}>
        {presentation.items.map((action) => (
          <DealWhatsAppMenuItem action={action} key={action.id} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DealWhatsAppMenuItem({ action }: { action: DealWhatsAppQuickAction }) {
  const Icon = action.icon;
  return (
    <DropdownMenuItem
      disabled={!action.enabled}
      title={action.disabledTitle ?? action.title}
      onClick={() => action.onClick?.()}
      className="whitespace-nowrap"
    >
      <Icon />
      {action.label}
    </DropdownMenuItem>
  );
}

function WhatsAppHeaderIcon() {
  return <IntegrationBrandIcon name="WhatsApp" className="size-3.5" />;
}

function headerButtonVariant(tone: DealWhatsAppHeaderTone): 'outline' | 'destructive' {
  return tone === 'danger' ? 'destructive' : 'outline';
}
