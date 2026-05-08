import Link from 'next/link';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import { DeliveryStageTimelineCard } from '../product-tabs/DeliveryStageTimelineCard';
import { ProductDoneReadinessPanel } from '../product-tabs/ProductDoneReadinessPanel';
import { ExtensionReadiness } from '../extensions/ExtensionReadiness';

interface DeliveryItemDetailCockpitProps {
  lifecycle: DeliveryLifecycleProjection | undefined;
  product: FullProduct | null;
  extension: FullExtension | null;
  terminal: boolean;
  resolution: 'DONE' | 'CANCELLED' | null | undefined;
  cancellationReason: string | null;
  clientAcceptedAt: string | null;
  clientAcceptanceNote: string | null;
}

export function DeliveryItemDetailCockpit({
  lifecycle,
  product,
  extension,
  terminal,
  resolution,
  cancellationReason,
  clientAcceptedAt,
  clientAcceptanceNote,
}: DeliveryItemDetailCockpitProps) {
  return (
    <div className="space-y-6 px-5 py-5 sm:px-7">
      {terminal ? (
        <ClosedOutcomeBanner
          resolution={resolution}
          cancellationReason={cancellationReason}
          clientAcceptedAt={clientAcceptedAt}
          clientAcceptanceNote={clientAcceptanceNote}
          closedAt={product?.closedAt ?? extension?.closedAt ?? null}
          closedBy={product?.closedBy ?? extension?.closedBy ?? null}
        />
      ) : null}

      {lifecycle ? (
        <DeliveryStageTimelineCard
          lifecycle={lifecycle}
          title="Stage gate timeline"
          description="Current stage is highlighted; completed stages read as done. Requirement counts reflect the active stage when the API provides them. Deep actions remain on the product page."
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {product ? <ProductCockpitMain product={product} /> : null}
          {extension ? <ExtensionCockpitMain extension={extension} /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {product ? <ProductCockpitRail product={product} /> : null}
          {extension ? <ExtensionCockpitRail extension={extension} /> : null}
        </div>
      </div>
    </div>
  );
}

function CockpitSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
      <h4 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}

function ProductCockpitMain({ product }: { product: FullProduct }) {
  const showWordPress = product.productCategory === 'WORDPRESS';

  return (
    <>
      <CockpitSection title="Blockers & Done readiness">
        {product.doneReadiness ? (
          <ProductDoneReadinessPanel readiness={product.doneReadiness} />
        ) : (
          <p className="text-muted-foreground text-xs">
            Done readiness loads with the product record. Use the product page to resolve finance
            and documentation gates before completing delivery.
          </p>
        )}
      </CockpitSection>

      <CockpitSection title="Key work links">
        <p className="text-muted-foreground text-xs">
          Staging, repository, and design links are managed on the product Work Space and Technical
          tabs.
        </p>
        <Link
          href={`/projects/${product.projectId}/products/${product.id}?tab=tasks`}
          className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
        >
          Open Work Space →
        </Link>
      </CockpitSection>

      <CockpitSection title="Languages & product line">
        <p className="text-sm">
          <span className="text-muted-foreground">Primary line: </span>
          {product.productType}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Multilingual and language-specific fields are edited on the product Overview tab.
        </p>
      </CockpitSection>

      {showWordPress ? (
        <CockpitSection title="Platform / template">
          <p className="text-muted-foreground text-xs">
            WordPress and template-specific URLs live on the product Overview and Technical tabs.
          </p>
        </CockpitSection>
      ) : null}
    </>
  );
}

function ProductCockpitRail({ product }: { product: FullProduct }) {
  const pm = product.pm;
  const summary = product.doneReadiness?.summary;

  return (
    <>
      <CockpitSection title="Team">
        {pm ? (
          <p className="text-sm">
            PM:{' '}
            <span className="font-medium">
              {pm.firstName} {pm.lastName}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">No PM assigned.</p>
        )}
      </CockpitSection>

      <CockpitSection title="Delivery notes">
        <p className="text-muted-foreground text-xs">
          Scope and working notes stored on the product Overview description field.
        </p>
        {product.description?.trim() ? (
          <p className="mt-2 text-sm whitespace-pre-wrap">{product.description.trim()}</p>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">No notes yet.</p>
        )}
        <Link
          href={`/projects/${product.projectId}/products/${product.id}?tab=overview`}
          className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
        >
          Edit on product Overview →
        </Link>
      </CockpitSection>

      <CockpitSection title="Accesses readiness">
        {summary ? (
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>Credentials: {summary.credentialCount}</li>
            <li>Handoff credentials: {summary.handoffCredentialCount}</li>
            <li>Domains: {summary.domainCount}</li>
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">
            Open the product Credentials tab for the full vault. Summary appears when Done readiness
            is evaluated.
          </p>
        )}
        <Link
          href={`/projects/${product.projectId}/products/${product.id}?tab=credentials`}
          className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
        >
          Open Accesses →
        </Link>
      </CockpitSection>

      <CockpitSection title="Files & handoff">
        <p className="text-muted-foreground text-xs">
          Offer/contract and handoff documents are tracked on Finance and Technical contexts on the
          product page.
        </p>
      </CockpitSection>

      <CockpitSection title="Client / order">
        {product.project.company ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Company: </span>
            {product.project.company.name}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">No company linked on project.</p>
        )}
        {product.order ? (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Order: </span>
            {product.order.code}
          </p>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">No order linked.</p>
        )}
        <Link
          href={`/projects/${product.projectId}/products/${product.id}?tab=finance`}
          className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
        >
          Open Finance tab →
        </Link>
      </CockpitSection>
    </>
  );
}

function ExtensionCockpitMain({ extension }: { extension: FullExtension }) {
  return (
    <CockpitSection title="Scope & execution">
      <ExtensionReadiness extension={extension} />
      <p className="text-muted-foreground mt-3 text-xs">
        Open tasks: {extension._count.tasks}. Full board lives under Work Space on the product page.
      </p>
    </CockpitSection>
  );
}

function ExtensionCockpitRail({ extension }: { extension: FullExtension }) {
  const a = extension.assignee;

  return (
    <>
      <CockpitSection title="Team">
        {a ? (
          <p className="text-sm">
            Owner:{' '}
            <span className="font-medium">
              {a.firstName} {a.lastName}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">No assignee.</p>
        )}
      </CockpitSection>
      <CockpitSection title="Delivery notes">
        <p className="text-muted-foreground text-xs">
          Scope and comments for this extension use the description field on the product Extensions
          tab.
        </p>
        {extension.description?.trim() ? (
          <p className="mt-2 text-sm whitespace-pre-wrap">{extension.description.trim()}</p>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">No notes yet.</p>
        )}
        <Link
          href={`/projects/${extension.projectId}/products/${extension.productId}?tab=extensions`}
          className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
        >
          Edit on Extensions tab →
        </Link>
      </CockpitSection>

      <CockpitSection title="Product context">
        <p className="text-sm">{extension.product.name}</p>
        <Link
          href={`/projects/${extension.projectId}/products/${extension.productId}?tab=extensions`}
          className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
        >
          Manage extensions →
        </Link>
      </CockpitSection>
      <CockpitSection title="Order">
        {extension.order ? (
          <p className="text-sm">{extension.order.code}</p>
        ) : (
          <p className="text-muted-foreground text-xs">No order linked.</p>
        )}
      </CockpitSection>
    </>
  );
}

function ClosedOutcomeBanner({
  resolution,
  cancellationReason,
  clientAcceptedAt,
  clientAcceptanceNote,
  closedAt,
  closedBy,
}: {
  resolution: 'DONE' | 'CANCELLED' | null | undefined;
  cancellationReason: string | null;
  clientAcceptedAt: string | null;
  clientAcceptanceNote: string | null;
  closedAt: string | null;
  closedBy: { firstName: string; lastName: string } | null;
}) {
  return (
    <div className="bg-muted/40 rounded-xl border p-4 text-sm">
      <p className="font-semibold">Closed outcome</p>
      <p className="text-muted-foreground mt-1 text-xs">Result: {resolution ?? '—'}</p>
      {closedAt ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Closed: {new Date(closedAt).toLocaleString()}
          {closedBy
            ? ` · ${closedBy.firstName} ${closedBy.lastName}`.trim()
            : ' · closer not recorded'}
        </p>
      ) : null}
      {resolution === 'CANCELLED' && cancellationReason ? (
        <p className="mt-2 text-xs">Reason: {cancellationReason}</p>
      ) : null}
      {resolution === 'DONE' && clientAcceptedAt ? (
        <p className="mt-2 text-xs">
          Client accepted: {new Date(clientAcceptedAt).toLocaleString()}
        </p>
      ) : null}
      {resolution === 'DONE' && clientAcceptanceNote ? (
        <p className="mt-2 text-xs">Note: {clientAcceptanceNote}</p>
      ) : null}
    </div>
  );
}
