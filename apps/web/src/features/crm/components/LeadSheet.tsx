'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  MessageSquare,
  ArrowRight,
  Trash2,
  Link2,
  LayoutGrid,
  History,
  Megaphone,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  StatusBadge,
  DetailSheetSettingsMenu,
  InlineField,
  SearchField,
} from '@/components/shared';
import { LeadPipelineStages } from './LeadPipelineStages';
import {
  LEAD_SOURCES,
  LEAD_STAGES,
  SALES_CHANNELS,
  getLeadSource,
} from '../constants/leadPipeline';
import { isLeadAttributionLocked } from '@nbos/shared/constants';
import type { Lead } from '@/lib/api/leads';
import { partnersApi } from '@/lib/api/partners';
import { contactsApi } from '@/lib/api/clients';
import { marketingApi } from '@/lib/api/marketing';
import { useCrmMarketingWhereOptions } from '../hooks/useCrmMarketingWhereOptions';
import {
  LEAD_SHEET_SECTION,
  type LeadSheetSectionId,
} from '@/features/shared/crm-sheet-section-ids';

const TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
] as const;

export interface LeadSheetBlockerNavigation {
  token: number;
  sectionId: LeadSheetSectionId;
}

interface LeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onConvertToDeal?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
  blockerNavigation?: LeadSheetBlockerNavigation | null;
  onBlockerNavigationConsumed?: () => void;
}

export function LeadSheet({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onConvertToDeal,
  onDelete,
  blockerNavigation = null,
  onBlockerNavigationConsumed,
}: LeadSheetProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const scrollToLeadSection = useCallback((sectionId: LeadSheetSectionId) => {
    setActiveTab('general');
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    if (!open || !blockerNavigation) return;
    const { sectionId } = blockerNavigation;
    queueMicrotask(() => {
      scrollToLeadSection(sectionId);
      onBlockerNavigationConsumed?.();
    });
  }, [open, blockerNavigation, scrollToLeadSection, onBlockerNavigationConsumed]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  if (!lead) return null;

  const currentStage = LEAD_STAGES.find((s) => s.key === lead.status);
  const isTerminal = currentStage ? 'terminal' in currentStage : false;
  const source = getLeadSource(lead.source);
  const leadTitle = lead.name || lead.code;

  const saveField = async (field: string, value: string | null) => {
    const payload: Record<string, unknown> = {};
    payload[field] = value || null;
    await onUpdate(lead.id, payload as Partial<Lead>);
  };

  const saveFields = async (fields: Record<string, string | null>) => {
    await onUpdate(lead.id, fields as Partial<Lead>);
  };

  const startEditingName = () => {
    setNameValue(lead.name ?? '');
    setEditingName(true);
  };

  const saveLeadName = () => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (trimmed !== (lead.name ?? '')) {
      onUpdate(lead.id, { name: trimmed || null } as Partial<Lead>);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveLeadName();
    }
    if (e.key === 'Escape') {
      setEditingName(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:w-[92vw] sm:max-w-[1400px]"
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-stone-100 bg-gradient-to-br from-sky-50/50 via-white to-white px-7 pt-5 pb-3 dark:border-stone-800 dark:from-sky-950/10 dark:via-transparent dark:to-transparent">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={saveLeadName}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Inquiry title (product / service)…"
                  className="text-foreground w-full border-0 border-b-2 border-sky-400 bg-transparent text-xl font-bold tracking-tight outline-none placeholder:text-stone-300"
                />
              ) : (
                <h2
                  onClick={startEditingName}
                  className="text-foreground -mx-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Click to edit inquiry title (product / service)"
                >
                  {leadTitle}
                </h2>
              )}
              <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
                {lead.code}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-0.5">
              {!isTerminal && lead.status === 'MQL' && onConvertToDeal ? (
                <Button type="button" size="sm" onClick={() => onConvertToDeal(lead)}>
                  <ArrowRight size={14} className="mr-1" />
                  Convert to Deal
                </Button>
              ) : null}
              {onDelete ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(lead.id)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Pipeline Stages ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          <LeadPipelineStages
            currentStatus={lead.status}
            onStageClick={(key) => onStatusChange(lead.id, key)}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 dark:border-stone-800">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={
                    'relative flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors ' +
                    (isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                      : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300')
                  }
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-7 py-5">
            {activeTab === 'general' && (
              <LeadGeneralContent
                lead={lead}
                source={source}
                saveField={saveField}
                saveFields={saveFields}
                sectionIds={{
                  contact: LEAD_SHEET_SECTION.CONTACT,
                  marketing: LEAD_SHEET_SECTION.MARKETING,
                  assignment: LEAD_SHEET_SECTION.ASSIGNMENT,
                }}
              />
            )}
            {activeTab === 'history' && (
              <div className="text-muted-foreground py-12 text-center text-sm">
                History coming soon...
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ── General Tab Content ── */

interface LeadGeneralContentProps {
  lead: Lead;
  source: ReturnType<typeof getLeadSource>;
  saveField: (field: string, value: string | null) => Promise<void>;
  saveFields: (fields: Record<string, string | null>) => Promise<void>;
  sectionIds: {
    contact: LeadSheetSectionId;
    marketing: LeadSheetSectionId;
    assignment: LeadSheetSectionId;
  };
}

function LeadGeneralContent({
  lead,
  source,
  saveField,
  saveFields,
  sectionIds,
}: LeadGeneralContentProps) {
  const { options: marketingWhereOptions } = useCrmMarketingWhereOptions(
    lead.source === 'MARKETING',
  );
  const saveMultipleFields = async (fields: Record<string, string | null>) => {
    await saveFields(fields);
  };

  const searchPartners = useCallback(async (query: string) => {
    const data = await partnersApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((p) => ({ value: p.id, label: p.name }));
  }, []);

  const searchContacts = useCallback(async (query: string) => {
    const data = await contactsApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`,
      subtitle: c.email ?? undefined,
    }));
  }, []);

  const searchAttributionOptions = useCallback(
    async (query: string) => {
      if (!lead.sourceDetail) return [];
      const options = await marketingApi.getAttributionOptions(lead.sourceDetail);
      return options
        .filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
        .map((option) => ({
          value: `${option.type}:${option.id}`,
          label: option.label,
          subtitle: option.subtitle ?? option.type,
        }));
    },
    [lead.sourceDetail],
  );

  const whereOptions =
    lead.source === 'SALES'
      ? SALES_CHANNELS.map((c) => ({ value: c.value, label: c.label }))
      : lead.source === 'MARKETING'
        ? marketingWhereOptions
        : [];

  const attributionLocked = isLeadAttributionLocked(lead.status);

  return (
    <div className="space-y-8">
      {/* Contact Information */}
      <div id={sectionIds.contact}>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <User size={13} />
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            label="Contact Name"
            value={lead.contactName}
            type="text"
            placeholder="Contact name..."
            icon={<User size={12} />}
            onSave={(v) => saveField('contactName', v)}
          />

          <InlineField
            label="Phone"
            value={lead.phone}
            displayValue={
              lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.phone}
                </a>
              ) : undefined
            }
            type="phone"
            placeholder="+374..."
            icon={<Phone size={12} />}
            onSave={(v) => saveField('phone', v)}
          />

          <InlineField
            label="Email"
            value={lead.email}
            displayValue={
              lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.email}
                </a>
              ) : undefined
            }
            type="email"
            placeholder="email@example.com"
            icon={<Mail size={12} />}
            onSave={(v) => saveField('email', v)}
          />
        </div>
      </div>

      {/* Marketing */}
      <div id={sectionIds.marketing}>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Megaphone size={13} />
          Marketing
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            label="From"
            value={lead.source}
            displayValue={
              source ? (
                <span className="flex items-center gap-1.5">
                  <span>{source.icon}</span>
                  <span className="text-foreground font-medium">{source.label}</span>
                </span>
              ) : undefined
            }
            type="select"
            options={LEAD_SOURCES.map((s) => ({
              value: s.value,
              label: s.label,
              icon: <span>{s.icon}</span>,
            }))}
            placeholder="Select source..."
            icon={<Megaphone size={12} />}
            onSave={async (v) => {
              await saveMultipleFields({
                source: v,
                sourceDetail: null,
                sourcePartnerId: null,
                sourceContactId: null,
                marketingAccountId: null,
                marketingActivityId: null,
              });
            }}
            clearable={!attributionLocked}
          />

          {(lead.source === 'SALES' || lead.source === 'MARKETING') && (
            <InlineField
              label="Where?"
              value={lead.sourceDetail}
              displayValue={
                lead.sourceDetail ? (
                  <span className="text-foreground text-sm font-medium">
                    {whereOptions.find((o) => o.value === lead.sourceDetail)?.label ??
                      lead.sourceDetail}
                  </span>
                ) : undefined
              }
              type="select"
              options={whereOptions}
              placeholder="Select channel..."
              icon={<ExternalLink size={12} />}
              onSave={async (v) => {
                await saveMultipleFields({
                  sourceDetail: v,
                  marketingAccountId: null,
                  marketingActivityId: null,
                });
              }}
              clearable={!attributionLocked}
            />
          )}

          {lead.source === 'MARKETING' && lead.sourceDetail && (
            <SearchField
              label="Which one"
              value={
                lead.marketingAccount
                  ? lead.marketingAccount.name
                  : (lead.marketingActivity?.title ?? null)
              }
              displayValue={
                lead.marketingAccount || lead.marketingActivity ? (
                  <span className="text-foreground text-sm font-medium">
                    {lead.marketingAccount?.name ?? lead.marketingActivity?.title}
                  </span>
                ) : undefined
              }
              placeholder="Search accounts or activities..."
              icon={<ExternalLink size={12} />}
              onSearch={searchAttributionOptions}
              onSave={async (v) => {
                const [type, id] = v.split(':');
                await saveMultipleFields({
                  marketingAccountId: type === 'ACCOUNT' ? (id ?? null) : null,
                  marketingActivityId: type === 'ACTIVITY' ? (id ?? null) : null,
                });
              }}
              onClear={
                attributionLocked
                  ? undefined
                  : () =>
                      saveMultipleFields({
                        marketingAccountId: null,
                        marketingActivityId: null,
                      })
              }
            />
          )}

          {lead.source === 'PARTNER' && (
            <SearchField
              label="Which Partner?"
              value={lead.sourcePartner?.name ?? null}
              displayValue={
                lead.sourcePartner ? (
                  <span className="text-foreground text-sm font-medium">
                    {lead.sourcePartner.name}
                  </span>
                ) : undefined
              }
              placeholder="Search partners..."
              icon={<Building2 size={12} />}
              onSearch={searchPartners}
              onSave={async (v) => {
                await saveField('sourcePartnerId', v);
              }}
              onClear={attributionLocked ? undefined : () => saveField('sourcePartnerId', null)}
            />
          )}

          {lead.source === 'CLIENT' && (
            <SearchField
              label="Which Client?"
              value={
                lead.sourceContact
                  ? `${lead.sourceContact.firstName} ${lead.sourceContact.lastName}`
                  : null
              }
              displayValue={
                lead.sourceContact ? (
                  <span className="text-foreground text-sm font-medium">
                    {lead.sourceContact.firstName} {lead.sourceContact.lastName}
                  </span>
                ) : undefined
              }
              placeholder="Search contacts..."
              icon={<User size={12} />}
              onSearch={searchContacts}
              onSave={async (v) => {
                await saveField('sourceContactId', v);
              }}
              onClear={attributionLocked ? undefined : () => saveField('sourceContactId', null)}
            />
          )}
        </div>
      </div>

      {/* Assignment */}
      <div id={sectionIds.assignment}>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <User size={13} />
          Assignment
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            label="Assigned Seller"
            value={lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : ''}
            displayValue={
              lead.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {lead.assignee.firstName[0]}
                    {lead.assignee.lastName[0]}
                  </div>
                  <span className="text-foreground text-sm font-medium">
                    {lead.assignee.firstName} {lead.assignee.lastName}
                  </span>
                </div>
              ) : undefined
            }
            editable={false}
            icon={<User size={12} />}
          />
        </div>
      </div>

      {/* Linked Deal */}
      {lead.deal && (
        <div>
          <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Link2 size={13} />
            Linked Deal
          </h3>
          <div className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Link2 size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{lead.deal.code}</p>
              <StatusBadge label={lead.deal.status.replace(/_/g, ' ')} variant="blue" />
            </div>
          </div>
        </div>
      )}

      {/* Dates */}
      <div>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Calendar size={13} />
          Dates
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            label="Created"
            value={new Date(lead.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Calendar size={12} />}
            editable={false}
          />

          <InlineField
            label="Last Updated"
            value={new Date(lead.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Clock size={12} />}
            editable={false}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <MessageSquare size={13} />
          Notes
        </h3>
        <InlineField
          label=""
          value={lead.notes}
          type="textarea"
          placeholder="Add notes about this lead..."
          icon={<MessageSquare size={12} />}
          onSave={(v) => saveField('notes', v)}
        />
      </div>
    </div>
  );
}
