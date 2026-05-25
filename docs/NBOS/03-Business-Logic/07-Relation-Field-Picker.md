# Relation field picker (web UX)

## Purpose

NBOS links records across modules (Lead, Deal, Project, Finance, Support, …). Entity-link fields use one **global picker UX**:

1. **Search** — typeahead against the API (dropdown, capped results).
2. **Select** — row shows entity kind, title, optional subtitle; checkmark on current value.
3. **Create** — blue bottom bar opens the **same create dialog** as elsewhere; search text prefills name (contacts: first/last split).
4. **Closed state** — full-width chip row (same width as empty search trigger, independent of label length). Label click **opens** entity (sheet or route); **pencil** opens search to **replace** the link; **X** clears when `onClear` is provided (optional fields only). Multi-select stacks one full-width chip per row.

Implementation: `apps/web/src/components/shared/relation-picker/`.

## Platform wiring

| Piece                                                     | Role                                                    |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `RelationPickerField`                                     | Field UI (single or `multiple` chips).                  |
| `useRelationPickerActions(kind, createIntent?, context?)` | `onCreate` / `onOpenSelected` → app host.               |
| `AppEntityRelationProvider`                               | Mounted in `AppLayout`; hosts sheets + create dialogs.  |
| `useRegisterRelationCreated(handler)`                     | Parent sheet patches draft when inline create finishes. |

Search loaders (shared): `useContactRelationSearch`, `useCompanyRelationSearch`, `useProjectRelationSearch`, `useProductRelationSearch`, plus employee search where used.

## Create intents

When one form has several pickers of the **same kind**, pass a stable `createIntent` string (e.g. `deal-contact`, `deal-source-contact`). The host emits it on `RelationCreatedEvent.intent`; the sheet’s `apply*RelationCreated` maps the event to the correct draft field.

**Product create** requires a project scope: pass `createContext: { projectId }` (and intent e.g. `deal-existing-product`). Create is hidden until `projectId` is set. The wire format may embed scope as `intent@projectId` internally.

**Employee** — search/select/open sheet only; no inline create from picker (HR onboarding flow).

## Open behavior

| Kind                      | Open                                |
| ------------------------- | ----------------------------------- |
| Contact, Company, Partner | Nested detail sheet                 |
| Employee                  | `EmployeeSheet`                     |
| Project                   | `/projects/:id`                     |
| Product                   | `/projects/:projectId/products/:id` |

## Multi-select (contacts)

`RelationPickerField` supports `multiple` in UI. One **Contacts** field per entity; the API accepts
`contactIds[]` (ordered: first id → primary `contactId` FK, rest → junction table).

| Entity  | Create intent      | Notes                                                                 |
| ------- | ------------------ | --------------------------------------------------------------------- |
| Deal    | `deal-contacts`    | Single multi picker on deal sheet                                     |
| Lead    | `lead-contacts`    | Free-text **Contact name** stays separate; CRM links via multi picker |
| Project | `project-contacts` | Company stays a separate single picker (`project-company`)            |

When at least one contact is linked, a **+** on the field label opens the same search/create dropdown
to add more. Chips: hover shows **X** to disconnect; click the chip body to open the contact sheet.

On SQL / Deal conversion and Deal Won project auto-create, the full `contactIds` list copies to the
target entity.

## When not to use the picker

Keep `SearchField` for:

- Google Drive / file asset search.
- Composite or encoded ids (e.g. marketing attribution “Which one?” → `ACCOUNT:id` / `ACTIVITY:id`).
- Filter bars and non-entity option lists.

See entity graph: [06-Entity-Relationships.md](./06-Entity-Relationships.md).

## Example (single field)

```tsx
const picker = useRelationPickerActions('contact', 'deal-contact');

<RelationPickerField
  label="Contact"
  entityKind="contact"
  value={draft.contactId}
  selectionLabel={draft.contactDisplayLabel}
  onSearch={useContactRelationSearch()}
  onSelect={(id, label) => patchDraft({ contactId: id, contactDisplayLabel: label })}
  onClear={() => patchDraft({ contactId: null, contactDisplayLabel: null })}
  {...picker}
/>;
```

## Example (sheet registers create)

```tsx
useRegisterRelationCreated(
  open && draft
    ? (event) => {
        setDraft((prev) => (prev ? applyDealRelationCreated(prev, event) : prev));
      }
    : null,
);
```
