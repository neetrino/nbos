'use client';

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
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="wa-group-search">
        Select existing group
      </label>
      <Input
        id="wa-group-search"
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
        placeholder="Search groups"
      />
      <WhatsAppGroupSelect
        groups={props.groups}
        loading={props.loading}
        selectedGroupId={props.selectedGroupId}
        onSelectedGroupIdChange={props.onSelectedGroupIdChange}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        disabled={props.busy || !props.selectedGroupId}
        onClick={() => void bindSelectedGroup(props)}
      >
        Bind selected group
      </Button>
    </div>
  );
}

function WhatsAppGroupSelect(props: {
  groups: WhatsAppAvailableGroup[];
  loading: boolean;
  selectedGroupId: string;
  onSelectedGroupIdChange: (value: string) => void;
}) {
  if (props.groups.length === 0) {
    return props.loading ? null : (
      <p className="text-muted-foreground text-xs">No groups match this search.</p>
    );
  }

  return (
    <Select
      value={props.selectedGroupId || undefined}
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

async function bindSelectedGroup(props: {
  productId: string;
  selectedGroupId: string;
  currentGroupChatId: string | null | undefined;
  run: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
}): Promise<void> {
  const replace = Boolean(
    props.currentGroupChatId && props.currentGroupChatId !== props.selectedGroupId,
  );
  if (
    replace &&
    !window.confirm(
      'Replace the current Product WhatsApp binding? The old WhatsApp group will not be deleted.',
    )
  ) {
    return;
  }
  await props.run(
    () =>
      productWhatsAppApi.bind(props.productId, {
        groupChatId: props.selectedGroupId,
        replace,
      }),
    replace ? 'Binding replaced' : 'Group bound',
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
