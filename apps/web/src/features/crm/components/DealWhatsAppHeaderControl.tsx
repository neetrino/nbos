'use client';

import { useTranslations } from 'next-intl';
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
  type DealWhatsAppHeaderPresentation,
  type DealWhatsAppHeaderTone,
  resolveDealWhatsAppHeaderPresentation,
} from '../deal-whatsapp-header-control';
import type { DealWhatsAppQuickAction } from '../deal-whatsapp-quick-action';
import { DealWhatsAppBindDialog } from './DealWhatsAppBindDialog';
import {
  translateDealWhatsAppActionLabel,
  translateDealWhatsAppActionTitle,
  translateDealWhatsAppDisabledTitle,
} from '../i18n/crm-whatsapp-copy';

const HEADER_BUTTON_CLASS = 'rounded-full shadow-sm';
const WHATSAPP_MENU_WIDTH_CLASS = 'w-max min-w-0';

interface DealWhatsAppHeaderControlProps {
  dealId: string;
  actions: DealWhatsAppQuickAction[];
  bindOpen: boolean;
  busy: boolean;
  onBindOpenChange: (open: boolean) => void;
  onBindSubmit: (groupChatId: string) => Promise<void>;
}

export function DealWhatsAppHeaderControl({
  dealId,
  actions,
  bindOpen,
  busy,
  onBindOpenChange,
  onBindSubmit,
}: DealWhatsAppHeaderControlProps) {
  const t = useTranslations('crm');
  const presentation = resolveDealWhatsAppHeaderPresentation(actions);
  const triggerLabel = t('dealSheet.whatsapp.header');
  const triggerTitle =
    translateDealWhatsAppDisabledTitle(t, presentation.triggerTitle) ??
    translateDealWhatsAppActionTitle(
      t,
      presentation.directAction?.id ?? '',
      presentation.triggerTitle,
    ) ??
    triggerLabel;
  return (
    <>
      <DealWhatsAppHeaderTrigger
        presentation={presentation}
        triggerLabel={triggerLabel}
        triggerTitle={triggerTitle}
      />
      <DealWhatsAppBindDialog
        dealId={dealId}
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
  triggerLabel,
  triggerTitle,
}: {
  presentation: DealWhatsAppHeaderPresentation;
  triggerLabel: string;
  triggerTitle: string;
}) {
  if (presentation.mode === 'menu') {
    return (
      <DealWhatsAppMenuButton
        presentation={presentation}
        triggerLabel={triggerLabel}
        triggerTitle={triggerTitle}
      />
    );
  }
  return (
    <DealWhatsAppFaceButton
      presentation={presentation}
      triggerLabel={triggerLabel}
      triggerTitle={triggerTitle}
      disabled={presentation.mode === 'disabled'}
    />
  );
}

function DealWhatsAppFaceButton({
  presentation,
  triggerLabel,
  triggerTitle,
  disabled = false,
}: {
  presentation: DealWhatsAppHeaderPresentation;
  triggerLabel: string;
  triggerTitle: string;
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
      title={triggerTitle}
      aria-label={triggerTitle}
      onClick={() => presentation.directAction?.onClick?.()}
    >
      <WhatsAppHeaderIcon />
      {triggerLabel}
    </Button>
  );
}

function DealWhatsAppMenuButton({
  presentation,
  triggerLabel,
  triggerTitle,
}: {
  presentation: DealWhatsAppHeaderPresentation;
  triggerLabel: string;
  triggerTitle: string;
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
            title={triggerTitle}
            aria-label={triggerTitle}
          >
            <WhatsAppHeaderIcon />
            {triggerLabel}
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
  const t = useTranslations('crm');
  const Icon = action.icon;
  const label = translateDealWhatsAppActionLabel(t, action.id, action.label);
  const title =
    translateDealWhatsAppDisabledTitle(t, action.disabledTitle) ??
    translateDealWhatsAppActionTitle(t, action.id, action.title);
  return (
    <DropdownMenuItem
      disabled={!action.enabled}
      title={title}
      onClick={() => action.onClick?.()}
      className="whitespace-nowrap"
    >
      <Icon />
      {label}
    </DropdownMenuItem>
  );
}

function WhatsAppHeaderIcon() {
  return <IntegrationBrandIcon name="WhatsApp" className="size-3.5" />;
}

function headerButtonVariant(tone: DealWhatsAppHeaderTone): 'outline' | 'destructive' {
  return tone === 'danger' ? 'destructive' : 'outline';
}
