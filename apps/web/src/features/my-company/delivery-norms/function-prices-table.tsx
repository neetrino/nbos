'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseFunctionPriceWriteBody } from '@nbos/shared';
import {
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { NormsRowActions } from './norms-row-actions';
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
import type { LiveFunctionPrice } from './live-function-prices';
import { messageFromCaught } from './message-from-caught';
import { NormativeStatusBadge, normativeStatusLabelKey } from './normative-status-badge';
import { PublishDraftButton } from './publish-draft-button';
import { RoleUnitsEditor } from './role-units-editor';
import {
  buildCompleteRoleUnitVector,
  createEmptyRoleUnitDrafts,
  roleUnitDraftsFromDto,
  type RoleUnitDraftRow,
} from './role-units-draft';
import { summarizeRoleUnits } from './summarize-role-units';

export function FunctionPricesTable({
  pairs,
  titles,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  pairs: LiveFunctionPrice[];
  titles: Map<string, string>;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (pairs.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('prices.empty')}</p>;
  }
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('fields.function')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.version')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.status')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <FunctionPriceLiveRow
              key={pair.key}
              pair={pair}
              title={titles.get(pair.key) ?? t('prices.unknownFunction')}
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

function FunctionPriceLiveRow({
  pair,
  title,
  canAdd,
  canPublish,
  onChanged,
  onError,
}: {
  pair: LiveFunctionPrice;
  title: string;
  canAdd: boolean;
  canPublish: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<RoleUnitDraftRow[]>(createEmptyRoleUnitDrafts);
  const [saving, setSaving] = useState(false);
  const current = pair.draft ?? pair.published;
  const canEdit = Boolean(pair.draft) ? canPublish : canAdd;
  return (
    <>
      <FunctionPriceSummaryRow
        pair={pair}
        title={title}
        canEdit={canEdit}
        canPublish={canPublish}
        onToggleEdit={() => {
          setDrafts(roleUnitDraftsFromDto(current?.roleUnits ?? []));
          setOpen((value) => !value);
        }}
        onChanged={onChanged}
        onError={onError}
      />
      {open ? (
        <FunctionPriceDraftEditor
          pair={pair}
          drafts={drafts}
          saving={saving}
          onDraftsChange={setDrafts}
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

type FunctionPriceSummaryRowProps = {
  pair: LiveFunctionPrice;
  title: string;
  canEdit: boolean;
  canPublish: boolean;
  onToggleEdit: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
};

function FunctionPriceSummaryRow({
  pair,
  title,
  canEdit,
  canPublish,
  onToggleEdit,
  onChanged,
  onError,
}: FunctionPriceSummaryRowProps) {
  const t = useTranslations('hr.deliveryNorms');
  const current = pair.draft ?? pair.published;
  const status = liveNormDisplayStatus(pair);
  return (
    <TableRow className={ENTITY_LIST_ROW_HOVER_CLASS}>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">{title}</p>
          {current ? (
            <p className="text-muted-foreground text-xs">{summarizeRoleUnits(current.roleUnits)}</p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <span className="text-muted-foreground tabular-nums">{current?.version ?? '—'}</span>
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {current ? (
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
                roleUnits={pair.draft.roleUnits}
                onPublish={async (confirmZeroUnits) => {
                  await deliveryNormsApi.publishFunctionPrice(pair.draft?.id ?? '', {
                    confirmZeroUnits,
                  });
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

function FunctionPriceDraftEditor({
  pair,
  drafts,
  saving,
  onDraftsChange,
  onError,
  onChanged,
  setSaving,
}: {
  pair: LiveFunctionPrice;
  drafts: RoleUnitDraftRow[];
  saving: boolean;
  onDraftsChange: (rows: RoleUnitDraftRow[]) => void;
  onError: (message: string) => void;
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <TableRow>
      <TableCell className={ENTITY_LIST_CELL_CLASS} colSpan={4}>
        <div className="space-y-3">
          <RoleUnitsEditor rows={drafts} disabled={saving} onChange={onDraftsChange} />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => {
                void saveFunctionPriceDraft({
                  pair,
                  drafts,
                  fallback: t('errors.create'),
                  invalidUnits: t('errors.roleUnits'),
                  onError,
                  onChanged,
                  setSaving,
                });
              }}
            >
              {saving ? t('create.creating') : t('edit.save')}
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

async function saveFunctionPriceDraft(input: {
  pair: LiveFunctionPrice;
  drafts: RoleUnitDraftRow[];
  fallback: string;
  invalidUnits: string;
  onError: (message: string) => void;
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const roleUnits = buildCompleteRoleUnitVector(input.drafts);
  if (roleUnits === null) {
    input.onError(input.invalidUnits);
    return;
  }
  input.setSaving(true);
  try {
    if (input.pair.draft) {
      await deliveryNormsApi.updateFunctionPriceDraft(input.pair.draft.id, { roleUnits });
    } else {
      await deliveryNormsApi.createFunctionPrice(
        parseFunctionPriceWriteBody({
          functionId: input.pair.functionId,
          tierId: input.pair.tierId,
          effectiveFrom: dateInputToIso(todayDateInputValue()),
          roleUnits,
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
