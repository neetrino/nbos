'use client';

import { useState } from 'react';
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
    <div className="space-y-2">
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
  return (
    <>
      <label className="text-sm font-medium" htmlFor="wa-group-id">
        Paste group ID
      </label>
      <Input
        id="wa-group-id"
        value={pastedGroupId}
        onChange={(event) => setPastedGroupId(event.target.value)}
        placeholder="120363… or 120363…@g.us"
        disabled={props.busy}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
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
        Save group ID
      </Button>
    </>
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
    <>
      <label className="text-sm font-medium" htmlFor="wa-group-search">
        Select existing group
      </label>
      <Input
        id="wa-group-search"
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
        placeholder="Search groups"
        disabled={props.gatewayActionsDisabled}
      />
      <WhatsAppGroupSelect
        groups={props.groups}
        loading={props.loading}
        selectedGroupId={props.selectedGroupId}
        onSelectedGroupIdChange={props.onSelectedGroupIdChange}
        disabled={props.gatewayActionsDisabled}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
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
        Bind selected group
      </Button>
    </>
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
