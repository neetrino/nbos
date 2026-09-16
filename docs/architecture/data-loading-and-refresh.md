# Data loading and refresh standard

**Status:** standard for all NBOS web data surfaces
**Applies to:** `apps/web/**` — every screen, panel, tab, board and detail sheet that reads API data
**Related:** [`ADR-REALTIME-NOTIFICATIONS.md`](./ADR-REALTIME-NOTIFICATIONS.md), [`01-ARCHITECTURE.md`](../01-ARCHITECTURE.md)

## Problem this standard fixes

Screens used to hold one `loading` boolean and render `{loading ? <LoadingState /> : content}`.
Saving a record in a detail sheet called the screen's own loader again, which raised that boolean,
which replaced the board or table behind the open sheet with skeletons and re-mounted it from
scratch. Scroll position, loaded kanban pages and expanded sections were lost on every save.

Nothing was reloading the page. The screen was telling itself it had no data while it checked for
newer data. Those are two different situations and they must render differently.

## The contract

Every data surface distinguishes three situations. This is the whole standard; everything else
follows from it.

| Situation        | Meaning                                       | What the user sees                                               |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| **Loading**      | First load. Nothing to render yet.            | Skeleton (`LoadingState`) or an error screen if the load failed. |
| **Revalidating** | Data is on screen; we are checking for newer. | The existing content, untouched. No unmount, no layout shift.    |
| **Ready**        | Data is on screen; nothing in flight.         | The content.                                                     |

A surface that already holds data never returns to **Loading**. It goes to **Revalidating** and
back to **Ready**. This is stale-while-revalidate: show what we have, swap it silently when the
fresh copy arrives.

The same rule covers failures. If a refresh fails while data is on screen, keep the data and show a
dismissible `ListMutationErrorBanner`. The full-screen `QueryLoadError` is only for a first load
that failed, when there is genuinely nothing to show. Because `DataView` will not render the error
screen over existing content, a surface that omits the banner reports nothing at all — the rule is
not optional.

### Keeping data is not the same as keeping the right data

Two situations look like a refresh but must clear what is on screen.

**The identity changed.** On a detail route, `hasData` means "the loaded record is the one this URL
asks for", not "some record is loaded". Comparing against the route parameter — `doc?.id === id` —
is what makes the difference; a bare null check leaves the previous document rendered under the new
address while the new one loads. The same applies to any surface keyed by a selection: keep the id
the rows were loaded for and compare it, because a parent list can resolve the new key long before
its children arrive. `useStageColumnBoard` takes a `subjectKey` for this. Filters and search are not
identity — narrowing a result set is an ordinary revalidation and should keep the rows on screen.

**The server withdrew access.** Permissions can be revoked, or a record deleted, between the first
load and the refresh. A refresh rejected with 401, 403 or 404 means the caller may no longer read
what is on screen, so the surface drops it and falls back to its error branch. Only transient
failures — network, timeout, 5xx — keep stale content. Branch on `isAccessRevokedApiError` from
`@/lib/api-errors`; never treat every rejection as transient.

## Rendering rule

Use `DataView` from `@/components/shared`. Do not hand-roll the branch.

`DataView` takes `loading`, `error` and `hasData`, plus the fallbacks for each branch, and decides
which one to render. Once `hasData` is true it refuses to render the skeleton or the error screen,
so the blanking regression cannot be reintroduced by accident. It renders no wrapper element, so it
is layout-neutral inside flex and grid parents. Use its render-callback form when the content needs
to know a refresh is in flight.

Banned in new code:

- `{loading ? <LoadingState /> : content}` and any variant that swaps rendered content for a skeleton.
- `if (loading) return <LoadingState />` above content that may already exist.
- `{error ? <QueryLoadError /> : content}` when `content` could already be on screen.

`loading && items.length === 0` is the same idea done by hand. It is acceptable in existing code but
new code uses `DataView`, so the rule lives in one place.

## Hook rule

A data hook owns two booleans, not one.

- `loading` — first load only, no renderable data yet.
- `refreshing` — a fetch is in flight over data that is already on screen.

A reload decides between them by asking whether it currently has renderable data. A failed
revalidation keeps the previous data in state and only reports the error, except when the server
withdrew access, as described above.

A hook that can report an error over existing data also exposes a way to clear it, so its consumer
can render a dismissible banner. `useStageColumnBoard` returns `clearError` for this.

Reference implementations:

- `apps/web/src/hooks/use-entity-detail-hydration.ts` — detail sheets (`loading` / `hydrating`).
- `apps/web/src/features/shared/kanban/use-stage-column-board.ts` — stage boards (`loading` / `refreshing`).

`hydrating` in the detail hook is the same concept as `refreshing`; it predates this standard and is
kept to avoid churn in its consumers.

## Refetch rule: merge, refetch, or push

After a successful write, pick the cheapest correct option.

**Merge the response.** Default when the endpoint returns the full entity in the same shape the
surface renders. Update that one row in local state and do not call the server again. Applies to
deal update, tasks, contacts, companies, invoices, subscriptions, expenses and expense plans.

**Refetch the list.** Required when any of these hold:

- The create response is thinner than a list row (deals, leads, projects, extensions).
- The list row carries computed fields the write response does not return — product
  `checklistStageProgress` and `currentStageReadiness`, client service `paymentStage` and `overdue`,
  employee `_count`.
- The write has server-side side effects on other records. Deal moving to `WON` creates a project,
  product, subscription and orders. A paid invoice can promote a deal. A product stage change
  recalculates bonus pools. In these cases the edited row is not the only thing that changed.

Refetching is legitimate and is not what this standard removes. What it removes is the blanking that
used to accompany it: a refetch must run under **Revalidating**, never under **Loading**.

**Push (SSE).** Only where another user's action must reach this screen without an interaction from
its owner. Push is not a substitute for the two rules above; it is what tells a screen that a
refetch is now worth doing. Add a push channel only when staleness is user-visible and the surface
is genuinely concurrent.

A push event carries an invalidation signal, never business data. The client reacts by refetching
through the REST endpoints it already uses, so authorization stays on those endpoints and the stream
itself cannot leak anything. Keep the payload to an entity type, an entity id, a schema version and
a timestamp. Publish after the write and its side effects have all committed, so a client that
refetches immediately reads a settled state, and make a publish failure log and return rather than
fail the user's write.

Coalesce on the client: a burst of events must collapse into one fetch, and a hidden tab should
defer its refresh until it is looked at again.

Existing channels, each with its own Redis-backed bus so it works across API instances:

- `apps/api/src/modules/realtime/notification-*` — per-employee, drives the notification badge.
- `apps/api/src/modules/realtime/call-*` — per-employee, drives the active-call overlay.
- `apps/api/src/modules/realtime/delivery-*` — broadcast, invalidates the company-wide Delivery
  Board. Client side: `apps/web/src/lib/realtime/connect-delivery-sse.ts` and
  `delivery-board-refetch-scheduler.ts`.

Choose per-employee fan-out when the event concerns one person, and broadcast when the surface is
company-wide — but only when the underlying reads are open to every authenticated employee, as
product reads are. Never broaden who receives an event beyond who may already read the data.

## Checklist for a new screen

1. The data hook exposes `loading` and `refreshing` separately.
2. Content is rendered through `DataView`.
3. `hasData` compares the loaded data against the route parameter or selection key it belongs to.
4. A failed refresh over existing data shows a banner, not an error screen — and the banner is
   actually rendered, with a dismiss handler wired to the hook.
5. A refresh rejected with 401, 403 or 404 clears the data instead of keeping it.
6. After a write, the response is merged unless one of the refetch conditions above applies.
7. If a refetch is needed, it runs silently — nothing on screen unmounts.

## Direction of travel

TanStack Query is already a dependency and already implements this contract natively: `data` stays
while `isFetching` is true, separate from `isLoading`. It is currently used in roughly 45 files,
mostly messenger. New list surfaces should prefer it, and hand-rolled loaders should migrate towards
it over time. Until that migration lands, `DataView` and the two-boolean hook rule give the same
guarantees to the hand-rolled loaders.
