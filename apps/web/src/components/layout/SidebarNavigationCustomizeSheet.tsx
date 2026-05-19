'use client';

import { useState } from 'react';
import { ChevronRight, Eye, Link2, Trash2 } from 'lucide-react';
import type { SidebarModuleKey } from '@nbos/shared/constants';
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
import { cn } from '@/lib/utils';
import { SidebarCustomizeSortableList } from './SidebarCustomizeSortableList';

interface SidebarNavigationCustomizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryItems: NavModuleDefinition[];
  hiddenItems: NavModuleDefinition[];
  personalLinks: DashboardPersonalLink[];
  isSaving: boolean;
  onReorder: (keys: SidebarModuleKey[]) => void;
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
  onReorder,
  onHide,
  onRestore,
  onCreateLink,
  onDeleteLink,
}: SidebarNavigationCustomizeSheetProps) {
  const [linksOpen, setLinksOpen] = useState(false);
  const [hiddenOpen, setHiddenOpen] = useState(hiddenItems.length > 0);
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
      setLinksOpen(true);
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-border border-b px-5 py-4 text-left">
          <SheetTitle>Left menu</SheetTitle>
          <SheetDescription>
            Drag modules to reorder. Hidden items stay available under More in the sidebar.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section>
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Shown in menu
            </p>
            <SidebarCustomizeSortableList
              items={primaryItems}
              isSaving={isSaving}
              onReorder={onReorder}
              onHide={onHide}
            />
          </section>

          {hiddenItems.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setHiddenOpen((value) => !value)}
                className="text-foreground hover:bg-muted/60 flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium"
              >
                <span>Hidden ({hiddenItems.length})</span>
                <ChevronRight
                  size={16}
                  className={cn('transition-transform', hiddenOpen && 'rotate-90')}
                />
              </button>
              {hiddenOpen && (
                <ul className="mt-1 space-y-1.5">
                  {hiddenItems.map((item) => (
                    <li
                      key={item.key}
                      className="bg-muted/30 flex items-center justify-between gap-2 rounded-lg px-3 py-2"
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
              )}
            </section>
          )}

          <section className="border-border border-t pt-4">
            <button
              type="button"
              onClick={() => setLinksOpen((value) => !value)}
              className="text-foreground hover:bg-muted/60 flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Link2 size={16} className="text-muted-foreground" />
                My Links
                {personalLinks.length > 0 ? (
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {personalLinks.length}
                  </span>
                ) : null}
              </span>
              <ChevronRight
                size={16}
                className={cn('transition-transform', linksOpen && 'rotate-90')}
              />
            </button>

            {linksOpen && (
              <MyLinksPanel
                personalLinks={personalLinks}
                linkLabel={linkLabel}
                linkUrl={linkUrl}
                linkSaving={linkSaving}
                isSaving={isSaving}
                onDeleteLink={onDeleteLink}
                onLinkLabelChange={setLinkLabel}
                onLinkUrlChange={setLinkUrl}
                onCreateLink={handleCreateLink}
              />
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MyLinksPanel({
  personalLinks,
  linkLabel,
  linkUrl,
  linkSaving,
  isSaving,
  onDeleteLink,
  onLinkLabelChange,
  onLinkUrlChange,
  onCreateLink,
}: {
  personalLinks: DashboardPersonalLink[];
  linkLabel: string;
  linkUrl: string;
  linkSaving: boolean;
  isSaving: boolean;
  onDeleteLink: (id: string) => Promise<void>;
  onLinkLabelChange: (value: string) => void;
  onLinkUrlChange: (value: string) => void;
  onCreateLink: () => Promise<void>;
}) {
  return (
    <div className="mt-2 space-y-3 pl-1">
      {personalLinks.length > 0 && (
        <ul className="max-h-36 space-y-1 overflow-y-auto">
          {personalLinks.map((link) => (
            <li
              key={link.id}
              className="bg-muted/20 flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
            >
              <span className="truncate text-sm">{link.label}</span>
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
      <div className="grid gap-2">
        <Input
          value={linkLabel}
          onChange={(event) => onLinkLabelChange(event.target.value)}
          placeholder="Title"
          maxLength={60}
          className="h-9"
        />
        <Input
          value={linkUrl}
          onChange={(event) => onLinkUrlChange(event.target.value)}
          placeholder="URL or /path"
          maxLength={500}
          className="h-9"
        />
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={linkSaving || isSaving || !linkLabel.trim() || !linkUrl.trim()}
          onClick={() => void onCreateLink()}
        >
          Add link
        </Button>
      </div>
    </div>
  );
}
