'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { listedProductTypesForPicker, productPlatformApplies } from '@nbos/shared';
import {
  CreateFormDialog,
  DetailSheetFieldSegmented,
  RelationPickerField,
} from '@/components/shared';
import { parseRelationSearchName } from '@/components/shared/relation-picker/parse-relation-search-name';
import { CreateContactDialog } from '@/features/clients/components/CreateContactDialog';
import {
  useCompanyRelationSearch,
  useContactRelationSearch,
  useProjectRelationSearch,
} from '@/components/shared/relation-picker/relation-search-loaders';
import { usePermission } from '@/lib/permissions';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/features/projects/constants/projects';
import { productsApi, type Product } from '@/lib/api/products';
import {
  CreateProductDialogFields,
  type CreateProductFormState,
} from './CreateProductDialogFields';
import { ProductRegistrationRelation } from './ProductRegistrationRelation';
import { useProductRegistration } from './use-product-registration';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (product?: Product) => void;
  projectId?: string;
  taxStatus?: 'TAX' | 'TAX_FREE';
  defaultName?: string;
  forceNestedBackdrop?: boolean;
}

const EMPTY_PRODUCT_FORM: CreateProductFormState = {
  name: '',
  productCategory: '',
  productType: '',
  productPlatform: '',
  description: '',
};

export function CreateProductDialog(props: CreateProductDialogProps) {
  // A closed dialog owns no pending searches or unsaved nested creation state.
  if (!props.open) return null;
  return (
    <CreateProductDialogSession
      key={`${props.projectId ?? ''}:${props.defaultName ?? ''}`}
      {...props}
    />
  );
}

function CreateProductDialogSession({
  open,
  onOpenChange,
  onCreated,
  projectId,
  taxStatus,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreateProductDialogProps) {
  const t = useTranslations('forms');
  const tCommon = useTranslations('common');
  const { can } = usePermission();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDelivery, setStartDelivery] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT_FORM, name: defaultName.trim() });
  const registration = useProductRegistration(projectId);
  const searchProjects = useProjectRelationSearch();
  const searchCompanies = useCompanyRelationSearch();
  const searchContacts = useContactRelationSearch();
  const [contactCreate, setContactCreate] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const categoryOptions = useMemo(
    () =>
      PRODUCT_CATEGORIES.map((category) => ({
        value: category.value,
        label: t(`product.categories.${category.value}` as never),
      })),
    [t],
  );
  const typeOptions = useMemo(() => {
    const listed = listedProductTypesForPicker(
      form.productCategory,
      form.productType,
      form.productPlatform,
    );
    return PRODUCT_TYPES.filter((type) => listed.includes(type.value)).map((type) => ({
      value: type.value,
      label: t(`product.types.${type.value}` as never),
    }));
  }, [form.productCategory, form.productType, form.productPlatform, t]);
  const canSubmit = Boolean(
    form.name.trim() &&
    form.productCategory &&
    form.productType &&
    (!productPlatformApplies(form.productCategory) || form.productPlatform) &&
    registration.contact.id &&
    (registration.project.mode === 'create' || registration.project.id) &&
    !registration.resolving &&
    !registration.contextError &&
    can('ADD', 'PROJECTS') &&
    (registration.company.mode !== 'create' || can('ADD', 'CLIENTS')),
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const product = await productsApi.register({
        name: form.name.trim(),
        productCategory: form.productCategory,
        productType: form.productType,
        productPlatform: form.productPlatform || null,
        description: form.description || undefined,
        taxStatus,
        startDelivery,
        contactId: registration.contact.id,
        projectId: registration.project.mode === 'existing' ? registration.project.id : undefined,
        createProject: registration.project.mode === 'create',
        companyId: registration.company.mode === 'existing' ? registration.company.id : null,
        createCompany: registration.company.mode === 'create',
      });
      onCreated?.(product);
      onOpenChange(false);
    } catch {
      setError(t('product.registration.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CreateFormDialog
        open={open}
        onOpenChange={(next) => {
          if (!loading) onOpenChange(next);
        }}
        title={t('product.title')}
        error={error || (registration.contextError ? t('product.registration.contextError') : null)}
        submitting={loading}
        canSubmit={canSubmit}
        submitLabel={t('product.registration.submit')}
        submittingLabel={tCommon('creating')}
        cancelLabel={tCommon('cancel')}
        forceNestedBackdrop={forceNestedBackdrop}
        onSubmit={(event) => void submit(event)}
      >
        <fieldset disabled={loading} className="grid min-w-0 gap-3 disabled:opacity-70">
          <CreateProductDialogFields
            form={form}
            categoryOptions={categoryOptions}
            typeOptions={typeOptions}
            onFormChange={(partial) => setForm((prev) => ({ ...prev, ...partial }))}
          />
          <DetailSheetFieldSegmented
            label={t('product.registration.mode')}
            value={startDelivery ? 'delivery' : 'existing'}
            options={[
              { value: 'existing', label: t('product.registration.withoutDelivery') },
              { value: 'delivery', label: t('product.registration.withDelivery') },
            ]}
            disabled={loading}
            onValueChange={(mode) => setStartDelivery(mode === 'delivery')}
          />
          <RelationPickerField
            label={t('product.registration.contact')}
            entityKind="contact"
            value={registration.contact.id || null}
            selectionLabel={registration.contact.label}
            placeholder={t('product.registration.searchContact')}
            disabled={loading}
            onSearch={searchContacts}
            onSelect={registration.selectContact}
            onCreate={
              can('ADD', 'CLIENTS')
                ? (query) => setContactCreate(parseRelationSearchName(query))
                : undefined
            }
          />
          <ProductRegistrationRelation
            kind="project"
            name={form.name.trim()}
            value={registration.project}
            disabled={loading}
            onSearch={searchProjects}
            onChange={registration.setProject}
          />
          <ProductRegistrationRelation
            kind="company"
            name={form.name.trim()}
            value={registration.company}
            disabled={loading || registration.resolving}
            canCreate={can('ADD', 'CLIENTS')}
            onSearch={searchCompanies}
            onChange={registration.selectCompany}
          />
        </fieldset>
      </CreateFormDialog>
      <CreateContactDialog
        open={contactCreate !== null}
        prefill={contactCreate}
        forceNestedBackdrop
        onOpenChange={(next) => {
          if (!next) setContactCreate(null);
        }}
        onCreated={(contact) => {
          if (contact)
            registration.selectContact(
              contact.id,
              `${contact.firstName} ${contact.lastName}`.trim(),
            );
          setContactCreate(null);
        }}
      />
    </>
  );
}
