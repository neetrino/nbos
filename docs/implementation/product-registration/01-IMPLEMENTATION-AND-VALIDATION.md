# Product registration without development

Implemented the approved Product → Project relationship and optional Company creation through one shared registration dialog. Product, newly requested Project, and newly requested Company are written in one database transaction. New entities use the entered product name. Existing relations remain selectable in the same form.

The common product picker can launch registration without a preselected project. Deals, Subscriptions, finance relation pickers, and Project Products reuse this dialog; a newly registered product is selected automatically. Inline contact creation uses a sibling dialog and preserves the product draft.

## Delivery and finance

`Product.deliveryEnabled` defaults to `true` for compatibility. Registration with `startDelivery: false` leaves the delivery stage empty, skips stage checklists, and creates no Order. Delivery commands reject this product. Delivery Board queries explicitly require delivery to be enabled. Project/Product directories keep the registered product visible, including maintenance when subscriptions exist.

Billing does not treat a registered product as overdue development. Its Extensions retain their independent delivery deadlines. Tax invoice readiness requirements are unchanged.

## Validation

- Prisma schema validation, client generation, API and web typechecks passed.
- API and web production builds passed.
- ESLint on touched API/web files passed; the existing root invocation emits the Next pages-directory advisory.
- Prettier applied to touched supported files.
- 38 test files / 237 tests passed: Projects module, registration transaction/DTO permissions, web project-context race handling, and subscription delivery billing pause.
- Independent review found missing `NONE` permission rejection and draft loss during shared contact creation. Both were corrected and re-reviewed. A final hook review found stale loading flags on reselecting a previously resolved project; selection now resets request state and a deferred-response regression test covers it.
- Browser checks used the actual dialog/components in an isolated local Vite harness with mocked API and permissions. Checked existing project inheritance, create/search switching, company selection reset, contact create/cancel draft preservation, successful registration submission, desktop and 390px layout. No new console errors after harness fixes. Harness setup errors were resolved before these checks. This does not establish authenticated production or real-database end-to-end behavior.

## Migration and release boundary

Migration: `20261002090000_product_registration_without_delivery`.

Additive change: `products.delivery_enabled BOOLEAN NOT NULL DEFAULT true`. Existing records preserve delivery behavior. Risk is low, but table-lock duration must be assessed against the deployment database. Release order: migration → API → web. No migration, deployment, commit, or push was performed.

A disposable database transaction rollback test and production migration/application were not run. Transaction tests mock Prisma and verify the transaction boundary and error propagation; they do not prove PostgreSQL rollback. Application requires the new column before the updated API serves Prisma queries. If application code is rolled back, retain the additive column; older code does not distinguish newly registered products, so prevent their accidental inclusion in legacy Delivery flows during rollback.

Product canon: [Product registration without Delivery](../../NBOS/03-Business-Logic/12-Product-Registration-Without-Delivery.md).
