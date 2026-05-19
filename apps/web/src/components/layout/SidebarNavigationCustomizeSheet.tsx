'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Link2, Trash2 } from 'lucide-react';
import { SIDEBAR_MODULE_KEYS_NON_HIDABLE, type SidebarModuleKey } from '@nbos/shared/constants';
import type { NavModuleDefinition } from '@/lib/navigation/nav-config';
import type { DashboardPersonalLink } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface SidebarNavigationCustomizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryItems: NavModuleDefinition[];
  hiddenItems: NavModuleDefinition[];
  personalLinks: DashboardPersonalLink[];
  isSaving: boolean;
  onMove: (key: SidebarModuleKey, direction: 'up' | 'down') => void;
  onHide: (key: SidebarModuleKey) => void;
  onRestore: (key: SidebarModuleKey) => void;
  onCreateLink: (label: string, url: string) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
}

export function SidebarNavigationCustomizeSheet({
  open,
  onOpenChange,
  primaryItems,
  hiddenItems,
  personalLinks,
  isSaving,
  onMove,
  onHide,
  onRestore,
  onCreateLink,
  onDeleteLink,
}: SidebarNavigationCustomizeSheetProps) {
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkSaving, setLinkSaving] = useState(false);

  const handleCreateLink = async () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setLinkSaving(true);
    try {
      await onCreateLink(linkLabel.trim(), linkUrl.trim());
      setLinkLabel('');
      setLinkUrl('');
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Customize sidebar</SheetTitle>
          <SheetDescription>
            Reorder modules, hide rarely used items, and add personal links. Changes apply only to
            your account.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Visible modules
            </h3>
            <ul className="space-y-2">
              {primaryItems.map((item, index) => (
                <ModuleCustomizeRow
                  key={item.key}
                  label={item.label}
                  canMoveUp={index > 0}
                  canMoveDown={index < primaryItems.length - 1}
                  canHide={!SIDEBAR_MODULE_KEYS_NON_HIDABLE.includes(item.key)}
                  isSaving={isSaving}
                  onMoveUp={() => onMove(item.key, 'up')}
                  onMoveDown={() => onMove(item.key, 'down')}
                  onHide={() => onHide(item.key)}
                />
              ))}
            </ul>
          </section>

          {hiddenItems.length > 0 && (
            <section>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                Hidden (More)
              </h3>
              <ul className="space-y-2">
                {hiddenItems.map((item) => (
                  <li
                    key={item.key}
                    className="border-border/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <span className="text-sm">{item.label}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => onRestore(item.key)}
                    >
                      <Eye size={14} className="mr-1" />
                      Show
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Link2 size={14} />
              My Links
            </h3>
            {personalLinks.length > 0 && (
              <ul className="mb-3 space-y-2">
                {personalLinks.map((link) => (
                  <li
                    key={link.id}
                    className="border-border/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{link.label}</p>
                      <p className="text-muted-foreground truncate text-xs">{link.url}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${link.label}`}
                      onClick={() => void onDeleteLink(link.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2">
              <Input
                value={linkLabel}
                onChange={(event) => setLinkLabel(event.target.value)}
                placeholder="Link title"
                maxLength={60}
              />
              <Input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="/path or https://..."
                maxLength={500}
              />
              <Button
                type="button"
                size="sm"
                disabled={linkSaving || isSaving || !linkLabel.trim() || !linkUrl.trim()}
                onClick={() => void handleCreateLink()}
              >
                Add link
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ModuleCustomizeRow({
  label,
  canMoveUp,
  canMoveDown,
  canHide,
  isSaving,
  onMoveUp,
  onMoveDown,
  onHide,
}: {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canHide: boolean;
  isSaving: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
}) {
  return (
    <li className="border-border/60 flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canMoveUp || isSaving}
          aria-label="Move up"
          onClick={onMoveUp}
        >
          <ChevronUp size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canMoveDown || isSaving}
          aria-label="Move down"
          onClick={onMoveDown}
        >
          <ChevronDown size={16} />
        </Button>
        {canHide && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isSaving}
            aria-label="Hide from sidebar"
            onClick={onHide}
          >
            <EyeOff size={16} />
          </Button>
        )}
      </div>
    </li>
  );
}
