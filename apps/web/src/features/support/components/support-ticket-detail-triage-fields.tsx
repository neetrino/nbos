'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
} from '@/features/support/constants/support';
import {
  translateSupportCategory,
  translateSupportCoverage,
  translateSupportPriority,
  type SupportTranslator,
} from '@/features/support/support-message-keys';
import type { SupportTriageDraft } from './support-ticket-detail-helpers';
import { SupportTicketTriageRelations } from './support-ticket-detail-triage-relations';

export interface SupportTicketDetailTriageFieldsProps {
  draft: SupportTriageDraft;
  terminal: boolean;
  projectId: string | null;
  assigneeLabel?: string | null;
  assigneeAvatar?: string | null;
  productLabel?: string | null;
  contactLabel?: string | null;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}

export function SupportTicketDetailTriageFields({
  draft,
  terminal,
  projectId,
  assigneeLabel: assigneeLabelProp,
  assigneeAvatar: assigneeAvatarProp,
  productLabel: productLabelProp,
  contactLabel: contactLabelProp,
  onPatchDraft,
}: SupportTicketDetailTriageFieldsProps) {
  const [assigneeLabel, setAssigneeLabel] = useState(assigneeLabelProp ?? '');
  const [assigneeAvatar, setAssigneeAvatar] = useState(assigneeAvatarProp ?? null);
  const [productLabel, setProductLabel] = useState(productLabelProp ?? '');
  const [contactLabel, setContactLabel] = useState(contactLabelProp ?? '');

  return (
    <>
      <SupportTicketTriageTextFields
        draft={draft}
        terminal={terminal}
        onPatchDraft={onPatchDraft}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SupportTicketTriageSelects draft={draft} terminal={terminal} onPatchDraft={onPatchDraft} />
        <SupportTicketTriageRelations
          draft={draft}
          terminal={terminal}
          projectId={projectId}
          assigneeLabel={assigneeLabel}
          assigneeAvatar={assigneeAvatar}
          productLabel={productLabel}
          contactLabel={contactLabel}
          onPatchDraft={onPatchDraft}
          onAssigneeChange={(id, label, avatar) => {
            onPatchDraft({ assignedTo: id });
            setAssigneeLabel(label);
            setAssigneeAvatar(avatar);
          }}
          onProductChange={(id, label) => {
            onPatchDraft({ productId: id });
            setProductLabel(label);
          }}
          onContactChange={(id, label) => {
            onPatchDraft({ contactId: id });
            setContactLabel(label);
          }}
        />
      </div>
    </>
  );
}

function SupportTicketTriageTextFields({
  draft,
  terminal,
  onPatchDraft,
}: {
  draft: SupportTriageDraft;
  terminal: boolean;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}) {
  const t = useTranslations('support');
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="st-title">{t('sheet.title')}</Label>
        <Input
          id="st-title"
          value={draft.title}
          onChange={(e) => onPatchDraft({ title: e.target.value })}
          disabled={terminal}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="st-desc">{t('sheet.description')}</Label>
        <Textarea
          id="st-desc"
          value={draft.description}
          onChange={(e) => onPatchDraft({ description: e.target.value })}
          rows={4}
          className="resize-y"
          disabled={terminal}
        />
      </div>
    </div>
  );
}

function SupportTicketTriageSelects({
  draft,
  terminal,
  onPatchDraft,
}: {
  draft: SupportTriageDraft;
  terminal: boolean;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}) {
  const t = useTranslations('support') as SupportTranslator;
  return (
    <>
      <SupportTicketCodeSelect
        id="st-cat"
        label={t('filters.category')}
        value={draft.category}
        disabled={terminal}
        options={TICKET_CATEGORIES}
        translateOption={(value, fallback) => translateSupportCategory(t, value, fallback)}
        onChange={(value) => onPatchDraft({ category: value })}
      />
      <SupportTicketCodeSelect
        id="st-pri"
        label={t('filters.priority')}
        value={draft.priority}
        disabled={terminal}
        options={TICKET_PRIORITIES}
        translateOption={(value, fallback) => translateSupportPriority(t, value, fallback)}
        onChange={(value) => onPatchDraft({ priority: value })}
      />
      <SupportTicketCoverageSelect draft={draft} terminal={terminal} onPatchDraft={onPatchDraft} />
    </>
  );
}

function SupportTicketCodeSelect({
  id,
  label,
  value,
  disabled,
  options,
  translateOption,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  options: ReadonlyArray<{ value: string; label: string }>;
  translateOption: (value: string, fallback: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {translateOption(option.value, option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SupportTicketCoverageSelect({
  draft,
  terminal,
  onPatchDraft,
}: {
  draft: SupportTriageDraft;
  terminal: boolean;
  onPatchDraft: (partial: Partial<SupportTriageDraft>) => void;
}) {
  const t = useTranslations('support') as SupportTranslator;
  return (
    <div className="space-y-1 sm:col-span-2">
      <Label htmlFor="st-cov">{t('sheet.coverageDecision')}</Label>
      <Select
        value={draft.coverageDecision || 'none'}
        onValueChange={(v) => {
          if (!v) return;
          onPatchDraft({ coverageDecision: v === 'none' ? '' : v });
        }}
        disabled={terminal}
      >
        <SelectTrigger id="st-cov" className="w-full">
          <SelectValue placeholder={t('sheet.notDecided')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('sheet.notDecided')}</SelectItem>
          {TICKET_COVERAGE_DECISIONS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {translateSupportCoverage(t, c.value, c.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
