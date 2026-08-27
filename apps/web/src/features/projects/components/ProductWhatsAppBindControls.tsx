'use client';

import { useState, type ReactNode } from 'react';
import { ClipboardPaste, Link2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productWhatsAppApi, type WhatsAppAvailableGroup } from '@/lib/api/whatsapp';
import {
  WA_OUTLINE_ACTION_BUTTON,
  WA_SECTION_CARD,
} from './product-whatsapp-settings-ui';

const REPLACE_BINDING_CONFIRM =
  'Replace the current Product WhatsApp binding? The old WhatsApp group will not be deleted.';

export function ProductWhatsAppBindControls(props: {
  productId: string;
  search: string;
  onSearchChange: (value: string) => void;
  groups: WhatsAppAvailableGroup[];
  loading: boolean;
  selectedGroupId: string;
  onSelectedGroupIdChange: (value: string) => void;
  currentGroupChatId: string | null | undefined;
  busy: boolean;
  gatewayConfigured: boolean;
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}) {
  const gatewayActionsDisabled = props.busy || !props.gatewayConfigured;
  return (
    <div className="space-y-3">
      <PasteGroupIdControls
        productId={props.productId}
        currentGroupChatId={props.currentGroupChatId}
        busy={props.busy}
        run={props.run}
      />
      <SelectExistingGroupControls {...props} gatewayActionsDisabled={gatewayActionsDisabled} />
    </div>
  );
}

function PasteGroupIdControls(props: {
  productId: string;
  currentGroupChatId: string | null | undefined;
  busy: boolean;
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}) {
  const [pastedGroupId, setPastedGroupId] = useState('');

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error('Clipboard is empty.');
        return;
      }
      setPastedGroupId(text.trim());
    } catch {
      toast.error('Could not read clipboard.');
    }
  }

  return (
    <BindSection
      icon={Link2}
      title="Paste group ID"
      description="Paste group link or ID to bind it with this product."
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Input
            id="wa-group-id"
            value={pastedGroupId}
            onChange={(event) => setPastedGroupId(event.target.value)}
            placeholder="120363… or 120363…@g.us"
            disabled={props.busy}
            className="pr-10"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Paste from clipboard"
            className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
            disabled={props.busy}
            onClick={() => void pasteFromClipboard()}
          >
            <ClipboardPaste className="size-3.5" aria-hidden />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          className={WA_OUTLINE_ACTION_BUTTON}
          disabled={props.busy || !pastedGroupId.trim()}
          onClick={() =>
            void bindGroupChatId({
              productId: props.productId,
              groupChatId: pastedGroupId.trim(),
              currentGroupChatId: props.currentGroupChatId,
              persistIfUnreachable: true,
              boundMessage: 'WhatsApp group ID saved.',
              run: props.run,
            })
          }
        >
          <Save className="size-3.5" aria-hidden />
          Save group ID
        </Button>
      </div>
    </BindSection>
  );
}

function SelectExistingGroupControls(props: {
  productId: string;
  search: string;
  onSearchChange: (value: string) => void;
  groups: WhatsAppAvailableGroup[];
  loading: boolean;
  selectedGroupId: string;
  onSelectedGroupIdChange: (value: string) => void;
  currentGroupChatId: string | null | undefined;
  busy: boolean;
  gatewayActionsDisabled: boolean;
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}) {
  return (
    <BindSection
      icon={Search}
      title="Select existing group"
      description="Search and bind an existing WhatsApp group."
    >
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Input
              id="wa-group-search"
              value={props.search}
              onChange={(event) => props.onSearchChange(event.target.value)}
              placeholder="Search groups…"
              disabled={props.gatewayActionsDisabled}
              className="pr-10"
            />
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2"
              aria-hidden
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className={WA_OUTLINE_ACTION_BUTTON}
            disabled={props.gatewayActionsDisabled || !props.selectedGroupId}
            onClick={() =>
              void bindGroupChatId({
                productId: props.productId,
                groupChatId: props.selectedGroupId,
                currentGroupChatId: props.currentGroupChatId,
                persistIfUnreachable: false,
                boundMessage: 'Group bound',
                run: props.run,
              })
            }
          >
            <Link2 className="size-3.5" aria-hidden />
            Bind selected group
          </Button>
        </div>
        <WhatsAppGroupSelect
          groups={props.groups}
          loading={props.loading}
          selectedGroupId={props.selectedGroupId}
          onSelectedGroupIdChange={props.onSelectedGroupIdChange}
          disabled={props.gatewayActionsDisabled}
        />
      </div>
    </BindSection>
  );
}

function BindSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Link2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={WA_SECTION_CARD}>
      <div className="mb-3 flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div className="min-w-0">
          <h4 className="text-foreground text-sm font-semibold">{title}</h4>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function WhatsAppGroupSelect(props: {
  groups: WhatsAppAvailableGroup[];
  loading: boolean;
  selectedGroupId: string;
  onSelectedGroupIdChange: (value: string) => void;
  disabled: boolean;
}) {
  if (props.groups.length === 0) {
    if (props.loading || props.disabled) return null;
    return <p className="text-muted-foreground text-xs">No groups match this search.</p>;
  }

  return (
    <Select
      value={props.selectedGroupId || undefined}
      disabled={props.disabled}
      onValueChange={(value) => {
        if (value) props.onSelectedGroupIdChange(value);
      }}
    >
      <SelectTrigger className="w-full" aria-label="Select WhatsApp group">
        <SelectValue placeholder="Select a group…">
          {(value: string | null) => formatSelectedGroupLabel(value, props.groups)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {props.groups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {formatWhatsAppGroupOptionLabel(group)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

async function bindGroupChatId(props: {
  productId: string;
  groupChatId: string;
  currentGroupChatId: string | null | undefined;
  persistIfUnreachable: boolean;
  boundMessage: string;
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}): Promise<void> {
  if (!props.groupChatId) return;
  const replace = Boolean(
    props.currentGroupChatId && props.currentGroupChatId !== props.groupChatId,
  );
  if (replace && !window.confirm(REPLACE_BINDING_CONFIRM)) return;
  await props.run(
    () =>
      productWhatsAppApi.bind(props.productId, {
        groupChatId: props.groupChatId,
        replace,
        persistIfUnreachable: props.persistIfUnreachable || undefined,
      }),
    replace ? 'Binding replaced' : props.boundMessage,
  );
}

function formatSelectedGroupLabel(
  value: string | null,
  groups: WhatsAppAvailableGroup[],
): string | null {
  if (!value) return null;
  const group = groups.find((item) => item.id === value);
  return group ? formatWhatsAppGroupOptionLabel(group) : value;
}

function formatWhatsAppGroupOptionLabel(group: WhatsAppAvailableGroup): string {
  const missing = group.missingFromGateway ? ' (missing from Gateway)' : '';
  const count = typeof group.participantCount === 'number' ? ` · ${group.participantCount}` : '';
  return `${group.name}${missing}${count}`;
}
