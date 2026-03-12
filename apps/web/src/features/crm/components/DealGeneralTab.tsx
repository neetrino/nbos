'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  User,
  Calendar,
  Clock,
  MessageSquare,
  Link2,
  ExternalLink,
  Building2,
  CreditCard,
  Tag,
  FolderKanban,
  Layers,
} from 'lucide-react';
import { InlineField, StatusBadge } from '@/components/shared';
import { Separator } from '@/components/ui/separator';
import { DEAL_TYPES, PRODUCT_TYPES, PAYMENT_TYPES, formatAmount } from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { projectsApi, type Project } from '@/lib/api/projects';

interface DealGeneralTabProps {
  deal: Deal;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
}

export function DealGeneralTab({ deal, onUpdate }: DealGeneralTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    contactsApi
      .getAll({ pageSize: 200 })
      .then((d) => setContacts(d.items))
      .catch(() => {});
    projectsApi
      .getAll({ pageSize: 200 })
      .then((d) => setProjects(d.items))
      .catch(() => {});
  }, []);

  const saveField = async (field: string, value: string) => {
    const payload: Record<string, unknown> = {};
    if (field === 'amount') {
      payload[field] = value ? Number(value) : null;
    } else {
      payload[field] = value || null;
    }
    await onUpdate(deal.id, payload as Partial<Deal>);
  };

  const dealTypeLabel = DEAL_TYPES.find((t) => t.value === deal.type)?.label ?? deal.type;
  const isExtension = deal.type === 'EXTENSION';

  return (
    <div className="space-y-6">
      {/* Core Deal Info */}
      <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
        <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <Tag size={12} />
          Deal Info
        </h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InlineField
            label="Amount"
            value={deal.amount}
            displayValue={
              deal.amount != null ? (
                <span className="text-lg font-extrabold text-amber-600 tabular-nums dark:text-amber-400">
                  {formatAmount(deal.amount)}
                </span>
              ) : undefined
            }
            type="number"
            placeholder="Enter amount..."
            icon={<DollarSign size={12} />}
            onSave={(v) => saveField('amount', v)}
          />

          <InlineField
            label="Deal Type"
            value={deal.type}
            displayValue={
              <StatusBadge
                label={dealTypeLabel}
                variant={
                  deal.type === 'EXTENSION' ? 'blue' : deal.type === 'UPSELL' ? 'purple' : 'amber'
                }
              />
            }
            type="select"
            options={DEAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            icon={<Layers size={12} />}
            onSave={(v) => saveField('type', v)}
          />

          {deal.type === 'NEW_CLIENT' && (
            <InlineField
              label="Product Type"
              value={null}
              type="select"
              options={PRODUCT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Select product type..."
              icon={<Tag size={12} />}
              onSave={() => Promise.resolve()}
            />
          )}

          {isExtension && (
            <InlineField
              label="Extend Product"
              value={null}
              type="select"
              options={[]}
              placeholder="Select product to extend..."
              icon={<Layers size={12} />}
              onSave={() => Promise.resolve()}
            />
          )}

          <InlineField
            label="Payment Type"
            value={deal.paymentType}
            displayValue={
              deal.paymentType ? (
                <span className="text-foreground text-sm font-medium">
                  {PAYMENT_TYPES.find((p) => p.value === deal.paymentType)?.label ??
                    deal.paymentType?.replace(/_/g, ' ')}
                </span>
              ) : undefined
            }
            type="select"
            options={PAYMENT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
            placeholder="Select payment type..."
            icon={<CreditCard size={12} />}
            onSave={(v) => saveField('paymentType', v)}
          />

          <InlineField
            label="Source"
            value={deal.source}
            displayValue={
              deal.source ? (
                <span className="text-foreground text-sm font-medium">
                  {deal.source.replace(/_/g, ' ')}
                </span>
              ) : undefined
            }
            type="text"
            placeholder="Lead source..."
            icon={<ExternalLink size={12} />}
            editable={false}
          />
        </div>
      </section>

      {/* Project Link */}
      <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
        <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <FolderKanban size={12} />
          Project
        </h4>
        <InlineField
          label="Linked Project"
          value={null}
          type="select"
          options={[
            { value: '__NEW__', label: '＋ New Project' },
            ...projects.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
          ]}
          placeholder="Search or create project..."
          icon={<FolderKanban size={12} />}
          onSave={(v) => saveField('projectId', v)}
        />
      </section>

      {/* Contact & Team */}
      <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
        <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <User size={12} />
          Contact & Team
        </h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InlineField
            label="Contact"
            value={deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : ''}
            displayValue={
              deal.contact ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {deal.contact.firstName[0]}
                    {deal.contact.lastName[0]}
                  </div>
                  <div>
                    <p className="text-foreground text-sm leading-tight font-medium">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </p>
                    {deal.contact.email && (
                      <p className="text-muted-foreground text-[11px]">{deal.contact.email}</p>
                    )}
                  </div>
                </div>
              ) : undefined
            }
            type="select"
            options={contacts.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName}`,
            }))}
            placeholder="Select contact..."
            icon={<User size={12} />}
            onSave={(v) => saveField('contactId', v)}
          />

          <InlineField
            label="Seller"
            value={deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : ''}
            displayValue={
              deal.seller ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    {deal.seller.firstName[0]}
                    {deal.seller.lastName[0]}
                  </div>
                  <span className="text-foreground text-sm font-medium">
                    {deal.seller.firstName} {deal.seller.lastName}
                  </span>
                </div>
              ) : undefined
            }
            editable={false}
            icon={<Building2 size={12} />}
          />

          <InlineField
            label="Created"
            value={new Date(deal.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Calendar size={12} />}
            editable={false}
          />

          <InlineField
            label="Last Updated"
            value={new Date(deal.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Clock size={12} />}
            editable={false}
          />
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
        <InlineField
          label="Notes"
          value={deal.notes}
          type="textarea"
          placeholder="Add notes about this deal..."
          icon={<MessageSquare size={12} />}
          onSave={(v) => saveField('notes', v)}
        />
      </section>

      {/* Source Lead */}
      {deal.lead && (
        <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
          <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
            <Link2 size={12} />
            Source Lead
          </h4>
          <div className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition-colors hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <User size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{deal.lead.contactName}</p>
              <p className="text-muted-foreground text-xs">{deal.lead.code}</p>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </div>
        </section>
      )}
    </div>
  );
}
