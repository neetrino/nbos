'use client';

import { useTranslations } from 'next-intl';
import { AmdCurrencyIcon, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { InvoiceCreateProductField } from './InvoiceCreateProductField';
import type { CreateInvoiceFormState } from './create-invoice-dialog-utils';

type InvoiceCreateTranslator = ReturnType<typeof useTranslations<'invoices'>>;

interface CreateInvoiceStandardFieldsProps {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
  t: InvoiceCreateTranslator;
  showProduct: boolean;
  productLocked: boolean;
}

export function CreateInvoiceStandardFields({
  form,
  setForm,
  t,
  showProduct,
  productLocked,
}: CreateInvoiceStandardFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      {showProduct ? (
        <InvoiceCreateProductField
          productId={form.productId ?? ''}
          productLabel={form.productLabel ?? null}
          label={t('create.product')}
          placeholder={t('create.product')}
          locked={productLocked}
          onSelect={(productId, productLabel) => setForm({ ...form, productId, productLabel })}
          onClear={() => setForm({ ...form, productId: '', productLabel: null })}
        />
      ) : null}
      <InvoiceAmountFields form={form} setForm={setForm} t={t} />
    </div>
  );
}

function InvoiceAmountFields({
  form,
  setForm,
  t,
}: {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
  t: InvoiceCreateTranslator;
}) {
  return (
    <FormFieldRow>
      <InlineField
        variant="controlled"
        label={t('create.amount')}
        type="money"
        value={form.amount}
        className={FORM_FIELD_CELL_CLASS}
        icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
        onValueChange={(amount) => setForm({ ...form, amount })}
      />
      <InlineField
        variant="controlled"
        label={t('create.dueDate')}
        type="date"
        value={form.dueDate}
        datePickerVariant="extended"
        className={FORM_FIELD_CELL_CLASS}
        onValueChange={(dueDate) => setForm({ ...form, dueDate })}
      />
    </FormFieldRow>
  );
}
