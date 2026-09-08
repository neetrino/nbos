'use client';

import { useEffect, useState } from 'react';
import { CircleDot, Layers, Tag } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
} from '@/components/shared';
import {
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import { productsApi } from '@/lib/api/products';
import { productDisplayName, projectDisplayName } from '@/lib/format/project-product-display';
import { ClientServiceCredentialField } from './ClientServiceCredentialField';
import { ClientServiceProductField } from './ClientServiceProductField';
import { ClientServiceProviderField } from './ClientServiceProviderField';

interface ClientServiceGeneralBasicsSectionProps {
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  productName: string | null;
  projectName: string | null;
  credentialName: string | null;
  formDisabled: boolean;
}

export function ClientServiceGeneralBasicsSection({
  draft,
  patchDraft,
  productName,
  projectName,
  credentialName,
  formDisabled,
}: ClientServiceGeneralBasicsSectionProps) {
  const [open, setOpen] = useState(true);
  const [productLabel, setProductLabel] = useState(productName);
  const [projectLabel, setProjectLabel] = useState(projectName);
  const [credentialLabel, setCredentialLabel] = useState(credentialName);
  const [productResolving, setProductResolving] = useState(false);

  useEffect(() => {
    setProductLabel(productName);
    setProjectLabel(projectName);
    setCredentialLabel(credentialName);
  }, [draft.productId, draft.providerAccountId, productName, projectName, credentialName]);

  const selectProduct = async (productId: string, label: string) => {
    setProductLabel(label);
    setProductResolving(true);
    try {
      const product = await productsApi.getById(productId);
      patchDraft({ productId: product.id, projectId: product.projectId });
      setProductLabel(productDisplayName(product) ?? label);
      setProjectLabel(projectDisplayName(product.project) ?? product.project.name);
    } catch {
      setProductLabel(productName);
    } finally {
      setProductResolving(false);
    }
  };

  return (
    <DetailSheetCollapsibleSection
      title="Basics"
      icon={<Tag size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <ClientServiceProductField
          productId={draft.productId}
          productLabel={productLabel}
          projectLabel={projectLabel}
          disabled={formDisabled}
          resolving={productResolving}
          onSelect={(id, label) => {
            void selectProduct(id, label);
          }}
        />
        <ClientServiceBasicsTypeStatusRow
          draft={draft}
          formDisabled={formDisabled}
          patchDraft={patchDraft}
        />
        <ClientServiceProviderField
          providerName={draft.provider}
          disabled={formDisabled}
          onProviderChange={(provider) => patchDraft({ provider })}
        />
        <ClientServiceCredentialField
          credentialId={draft.providerAccountId}
          credentialLabel={credentialLabel}
          disabled={formDisabled}
          onSelect={(id, label) => {
            patchDraft({ providerAccountId: id });
            setCredentialLabel(label);
          }}
          onClear={() => {
            patchDraft({ providerAccountId: '' });
            setCredentialLabel(null);
          }}
        />
      </div>
    </DetailSheetCollapsibleSection>
  );
}

function ClientServiceBasicsTypeStatusRow({
  draft,
  formDisabled,
  patchDraft,
}: Pick<ClientServiceGeneralBasicsSectionProps, 'draft' | 'formDisabled' | 'patchDraft'>) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Type"
        type="select"
        value={draft.type}
        options={CLIENT_SERVICE_TYPES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<Layers size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(type) => type && patchDraft({ type })}
      />
      <InlineField
        variant="controlled"
        label="Status"
        type="select"
        value={draft.status}
        options={CLIENT_SERVICE_STATUSES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<CircleDot size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(status) => status && patchDraft({ status })}
      />
    </div>
  );
}
