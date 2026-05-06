'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { MarketingCrmWhereOption } from '@/lib/api/marketing';

interface CrmWhereDraftRow {
  label: string;
  sortOrder: string;
  isActive: boolean;
}

interface MarketingCrmWhereSettingsSectionProps {
  rows: MarketingCrmWhereOption[];
  draft: Record<string, CrmWhereDraftRow>;
  onDraftChange: (channel: string, next: Partial<CrmWhereDraftRow>) => void;
  onSaveRow: (channel: string) => void;
  savingChannel: string | null;
}

export function MarketingCrmWhereSettingsSection({
  rows,
  draft,
  onDraftChange,
  onSaveRow,
  savingChannel,
}: MarketingCrmWhereSettingsSectionProps) {
  return (
    <section className="border-border bg-card space-y-4 rounded-2xl border p-5">
      <div>
        <h2 className="text-lg font-semibold">CRM Where (Marketing)</h2>
        <p className="text-muted-foreground text-sm">
          Labels and order for the Marketing &quot;Where&quot; field on leads and deals. Codes match
          marketing accounts; disabling hides a channel from new picks only.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const rowDraft = draft[row.channel];
          if (!rowDraft) return null;
          return (
            <div
              key={row.channel}
              className={
                'border-border space-y-3 rounded-xl border p-4 ' +
                (!row.isActive ? 'opacity-70' : '')
              }
            >
              <p className="text-muted-foreground font-mono text-xs">{row.channel}</p>
              <div>
                <Label>Label</Label>
                <Input
                  value={rowDraft.label}
                  onChange={(e) => onDraftChange(row.channel, { label: e.target.value })}
                />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={rowDraft.sortOrder}
                  onChange={(e) => onDraftChange(row.channel, { sortOrder: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">Active in CRM</Label>
                <Switch
                  checked={rowDraft.isActive}
                  onCheckedChange={(checked) =>
                    onDraftChange(row.channel, { isActive: Boolean(checked) })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={savingChannel === row.channel || !rowDraft.label.trim()}
                onClick={() => onSaveRow(row.channel)}
              >
                {savingChannel === row.channel ? 'Saving…' : 'Save row'}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
