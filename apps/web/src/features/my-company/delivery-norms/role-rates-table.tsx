'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_CURRENCY, parseRoleRateWriteBody } from '@nbos/shared';
import {
  EntityListAmount,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
} from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';
import { dateInputToIso, todayDateInputValue } from './effective-from';
import { liveNormDisplayStatus } from './live-norm-pair';
import { displayedRoleRate, type LiveRoleRate } from './live-role-rates';
import { messageFromCaught } from './message-from-caught';
import { NormsInlineMoneyEdit } from './norms-inline-money-edit';
import { NormsRowActions } from './norms-row-actions';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { ROLE_MESSAGE_KEYS } from './delivery-norms.constants';

export function RoleRatesTable({
  pairs,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  pairs: LiveRoleRate[];
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.role')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.rate')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.version')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.status')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <RoleRateLiveRow
              key={pair.roleKey}
              pair={pair}
              canAdd={canAdd}
              canPublish={canPublish}
              onChanged={onChanged}
              onError={onError}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RoleRateLiveRow({
  pair,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  pair: LiveRoleRate;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nextRate, setNextRate] = useState('');
  const [saving, setSaving] = useState(false);
  const canEdit = Boolean(pair.draft) ? canPublish : canAdd;
  return (
    <>
      <RoleRateSummaryRow
        pair={pair}
        canEdit={canEdit}
        canPublish={canPublish}
        onToggleEdit={() => {
          setNextRate(pair.draft?.rate ?? '');
          setOpen((current) => !current);
        }}
        onChanged={onChanged}
        onError={onError}
      />
      {open ? (
        <RoleRateDraftEditor
          pair={pair}
          nextRate={nextRate}
          saving={saving}
          onNextRateChange={setNextRate}
          onError={onError}
          onChanged={() => {
            setOpen(false);
            onChanged();
          }}
          setSaving={setSaving}
        />
      ) : null}
    </>
  );
}

type RoleRateSummaryRowProps = {
  pair: LiveRoleRate;
  canEdit: boolean;
  canPublish: boolean;
  onToggleEdit: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
};

function RoleRateSummaryRow({
  pair,
  canEdit,
  canPublish,
  onToggleEdit,
  onChanged,
  onError,
}: RoleRateSummaryRowProps) {
  const t = useTranslations('hr.deliveryNorms');
  const rate = displayedRoleRate(pair);
  const version = pair.draft?.version ?? pair.published?.version;
  const status = liveNormDisplayStatus(pair);
  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-foreground text-sm font-medium">
          {t(ROLE_MESSAGE_KEYS[pair.roleKey])}
        </span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {rate ? (
          <EntityListAmount amount={rate} currency={DELIVERY_COMPENSATION_CURRENCY} />
        ) : (
          <span className="text-muted-foreground">{t('none')}</span>
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{version ?? '—'}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {pair.published || pair.draft ? (
          <NormativeStatusBadge status={status} label={t(normativeStatusLabelKey(status))} />
        ) : (
          <span className="text-muted-foreground">{t('none')}</span>
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <NormsRowActions
          canEdit={canEdit}
          editLabel={t('edit.action')}
          onToggleEdit={onToggleEdit}
          publish={
            pair.draft && canPublish ? (
              <PublishDraftButton
                onPublish={async () => {
                  await deliveryNormsApi.publishRoleRate(pair.draft?.id ?? '');
                }}
                onError={onError}
                onPublished={onChanged}
              />
            ) : null
          }
        />
      </TableCell>
    </TableRow>
  );
}

function RoleRateDraftEditor({
  pair,
  nextRate,
  saving,
  onNextRateChange,
  onError,
  onChanged,
  setSaving,
}: {
  pair: LiveRoleRate;
  nextRate: string;
  saving: boolean;
  onNextRateChange: (value: string) => void;
  onError: (message: string) => void;
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <TableRow>
      <TableCell className={ENTITY_LIST_CELL_CLASS} colSpan={5}>
        <NormsInlineMoneyEdit
          currentAmount={pair.published?.rate ?? null}
          nextAmount={nextRate}
          saving={saving}
          onNextAmountChange={onNextRateChange}
          onSave={() => {
            void saveRoleRateDraft({
              pair,
              nextRate,
              fallback: t('errors.create'),
              onError,
              onChanged,
              setSaving,
            });
          }}
        />
      </TableCell>
    </TableRow>
  );
}

async function saveRoleRateDraft(input: {
  pair: LiveRoleRate;
  nextRate: string;
  fallback: string;
  onError: (message: string) => void;
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  input.setSaving(true);
  try {
    if (input.pair.draft) {
      await deliveryNormsApi.updateRoleRateDraft(input.pair.draft.id, {
        rate: input.nextRate.trim(),
      });
    } else {
      await deliveryNormsApi.createRoleRate(
        parseRoleRateWriteBody({
          roleKey: input.pair.roleKey,
          rate: input.nextRate.trim(),
          effectiveFrom: dateInputToIso(todayDateInputValue()),
          currency: DELIVERY_COMPENSATION_CURRENCY,
        }),
      );
    }
    input.onChanged();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
