'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  MessageSquare,
  ArrowRight,
  Snowflake,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Link2,
  LayoutGrid,
  History,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StatusBadge, InlineField } from '@/components/shared';
import { LeadPipelineStages } from './LeadPipelineStages';
import {
  LEAD_SOURCES,
  TERMINAL_LEAD_STAGES,
  getLeadStage,
  getLeadSource,
} from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
] as const;

interface LeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onConvertToDeal?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
}

export function LeadSheet({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onConvertToDeal,
  onDelete,
}: LeadSheetProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  if (!lead) return null;

  const isTerminal = TERMINAL_LEAD_STAGES.some((s) => s.key === lead.status);
  const stage = getLeadStage(lead.status);
  const source = getLeadSource(lead.source);
  const leadTitle = lead.name || lead.contactName;

  const saveField = async (field: string, value: string) => {
    const payload: Record<string, unknown> = {};
    payload[field] = value || null;
    await onUpdate(lead.id, payload as Partial<Lead>);
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
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveLeadName}
              onKeyDown={handleNameKeyDown}
              placeholder="Lead name..."
              className="text-foreground w-full border-0 border-b-2 border-sky-400 bg-transparent text-xl font-bold tracking-tight outline-none placeholder:text-stone-300"
            />
          ) : (
            <h2
              onClick={startEditingName}
              className="text-foreground -mx-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Click to edit lead name"
            >
              {leadTitle}
            </h2>
          )}
          <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
            {lead.code}
          </p>
        </div>

        {/* ── Pipeline Stages ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          {isTerminal ? (
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2',
                lead.status === 'SQL'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : lead.status === 'FROZEN'
                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
              )}
            >
              {lead.status === 'SQL' ? (
                <CheckCircle2 size={16} />
              ) : lead.status === 'FROZEN' ? (
                <Snowflake size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span className="text-sm font-semibold">{stage?.label}</span>
              <span className="text-xs opacity-70">
                {lead.status === 'SQL'
                  ? '— Ready to convert'
                  : lead.status === 'FROZEN'
                    ? '— Can be reactivated'
                    : '— Marked as spam'}
              </span>
            </div>
          ) : (
            <LeadPipelineStages
              currentStatus={lead.status}
              onStageClick={(key) => onStatusChange(lead.id, key)}
            />
          )}
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
                onConvertToDeal={onConvertToDeal}
                isTerminal={isTerminal}
              />
            )}
            {activeTab === 'history' && (
              <div className="text-muted-foreground py-12 text-center text-sm">
                History coming soon...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-stone-100 bg-stone-50/50 px-7 py-3 dark:border-stone-800 dark:bg-stone-900/20">
          <div className="flex items-center justify-between">
            <div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                  onClick={() => onDelete(lead.id)}
                >
                  <Trash2 size={13} className="mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {!isTerminal && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:bg-red-500/10"
                    onClick={() => onStatusChange(lead.id, 'SPAM')}
                  >
                    <AlertTriangle size={14} className="mr-1" />
                    Spam
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-cyan-600 hover:bg-cyan-500/10"
                    onClick={() => onStatusChange(lead.id, 'FROZEN')}
                  >
                    <Snowflake size={14} className="mr-1" />
                    Freeze
                  </Button>
                  {lead.status === 'MQL' && onConvertToDeal && (
                    <Button size="sm" onClick={() => onConvertToDeal(lead)}>
                      <ArrowRight size={14} className="mr-1" />
                      Convert to Deal
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── General Tab Content ── */

interface LeadGeneralContentProps {
  lead: Lead;
  source: ReturnType<typeof getLeadSource>;
  saveField: (field: string, value: string) => Promise<void>;
  onConvertToDeal?: (lead: Lead) => void;
  isTerminal: boolean;
}

function LeadGeneralContent({ lead, source, saveField }: LeadGeneralContentProps) {
  return (
    <div className="space-y-8">
      {/* Contact Information */}
      <div>
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

          <InlineField
            label="Source"
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
            icon={<Globe size={12} />}
            onSave={(v) => saveField('source', v)}
          />
        </div>
      </div>

      {/* Assignment */}
      <div>
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
