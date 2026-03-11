'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EntitySheet, StatusBadge, InlineField } from '@/components/shared';
import { LEAD_STAGES, LEAD_SOURCES, getLeadStage, getLeadSource } from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
import { cn } from '@/lib/utils';

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
  if (!lead) return null;

  const stage = getLeadStage(lead.status);
  const source = getLeadSource(lead.source);
  const isTerminal = lead.status === 'SPAM' || lead.status === 'FROZEN' || lead.status === 'SQL';
  const activeStages = LEAD_STAGES.filter((s) => !('terminal' in s));
  const currentIdx = activeStages.findIndex((s) => s.key === lead.status);

  const saveField = async (field: string, value: string) => {
    const payload: Record<string, unknown> = {};
    payload[field] = value || null;
    await onUpdate(lead.id, payload as Partial<Lead>);
  };

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title=""
      footer={
        <div className="flex items-center justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(lead.id)}>
                <Trash2 size={14} className="mr-1" />
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
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-foreground text-xl font-bold">{lead.contactName}</h2>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-sm">
            <span className="font-mono">{lead.code}</span>
            {stage && (
              <>
                <span>·</span>
                <StatusBadge
                  label={stage.label}
                  variant={stage.variant}
                  dot
                  dotColor={stage.color}
                />
              </>
            )}
          </div>
        </div>

        {/* Pipeline Stages */}
        {!isTerminal && (
          <div className="border-border/50 bg-muted/30 rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Lead Pipeline
              </span>
              <span className="text-muted-foreground text-xs">
                Step {currentIdx + 1} of {activeStages.length}
              </span>
            </div>
            <div className="flex gap-1">
              {activeStages.map((s, i) => {
                const isCurrent = s.key === lead.status;
                const isPast = i < currentIdx;
                return (
                  <button
                    key={s.key}
                    onClick={() => onStatusChange(lead.id, s.key)}
                    title={s.label}
                    className={cn(
                      'relative h-2 flex-1 rounded-full transition-all hover:opacity-80',
                      isCurrent ? s.color : isPast ? s.color + ' opacity-60' : 'bg-border',
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-foreground text-xs font-medium">{stage?.label}</span>
              {currentIdx >= 0 && currentIdx < activeStages.length - 1 && (
                <button
                  onClick={() => onStatusChange(lead.id, activeStages[currentIdx + 1].key)}
                  className="text-accent flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  Next: {activeStages[currentIdx + 1].label}
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {isTerminal && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4',
              lead.status === 'SQL'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : lead.status === 'FROZEN'
                  ? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
            )}
          >
            {lead.status === 'SQL' ? (
              <CheckCircle2 size={20} />
            ) : lead.status === 'FROZEN' ? (
              <Snowflake size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <div>
              <p className="font-semibold">{stage?.label}</p>
              <p className="text-xs opacity-80">
                {lead.status === 'SQL'
                  ? 'Lead qualified — ready to convert to Deal'
                  : lead.status === 'FROZEN'
                    ? 'Lead frozen — can be reactivated later'
                    : 'Marked as spam'}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Fields Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {/* Contact Info */}
          <div className="col-span-2 mb-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <User size={13} />
              Contact Information
            </h3>
          </div>

          <InlineField
            label="Name"
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

          {/* Assignment */}
          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <User size={13} />
              Assignment
            </h3>
          </div>

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

          {/* Dates */}
          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <Calendar size={13} />
              Dates
            </h3>
          </div>

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

        {/* Notes */}
        <Separator />
        <InlineField
          label="Notes"
          value={lead.notes}
          type="textarea"
          placeholder="Add notes about this lead..."
          icon={<MessageSquare size={12} />}
          onSave={(v) => saveField('notes', v)}
        />

        {/* Linked Deal */}
        {lead.deal && (
          <>
            <Separator />
            <div>
              <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
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
          </>
        )}
      </div>
    </EntitySheet>
  );
}
