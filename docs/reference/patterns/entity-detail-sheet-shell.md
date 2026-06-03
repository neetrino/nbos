# Entity detail sheet shell

> Engineering reference for `EntityDetailSheetContent` (NBOS web).

## Layout modes (primary)

| `layout`    | Width                                                       | Default rail                      |
| ----------- | ----------------------------------------------------------- | --------------------------------- |
| `full`      | `width`: `wide` (75vw), `medium` (48rem), `compact` (42rem) | Close + Copy + Open (+ Workspace) |
| `auxiliary` | 36rem fixed                                                 | **Close only**                    |

### Center-rise shell (`EntityCenterSheetContent`)

Compact forms that should not use the full right panel (e.g. Credentials vault entry):

```tsx
<EntityCenterSheetContent width="medium">
  {children}
</EntityCenterSheetContent>
```

Max height **95vh**, centered, animates from bottom. No floating rail — close control inside the panel.

```tsx
// Deal-scale entity
<EntityDetailSheetContent open={open} layout="full" sourcePageHref={href} />

// Compact entity (invoice)
<EntityDetailSheetContent open={open} layout="full" width="compact" sourcePageHref={href} />

// Bonus ledger / HR peek
<EntityDetailSheetContent open={open} layout="auxiliary" />
```

Override rail on auxiliary: `showRailActions` + `sourcePageHref` when product needs share later.

## Use the shell

Wrap sheet body in `apps/web/src/components/shared/EntityDetailSheetContent.tsx`. Parent owns `<Sheet open onOpenChange>`.

## Do not hand-wire rail

```bash
rg 'floatingClose' apps/web/src/features --glob '*Sheet*.tsx'
```

Expected: no matches.

## Other props

| Prop                                       | When                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| `contentClassName` + `railAnchorClassName` | Bespoke width (Task, Drive, checklist)                   |
| `trailingRail`                             | Extra buttons under standard rail (`layout="full"`)      |
| `floatingRailContent`                      | Fully custom rail (workspace drive)                      |
| `forceNestedBackdrop`                      | Nested sheet over parent sheet (see entity-item-surface) |

## Related items in tabs

Stacked child sheets from entity tabs: [`entity-item-surface.md`](./entity-item-surface.md).

## Exceptions (raw `SheetContent`)

| Surface                 | Reason            |
| ----------------------- | ----------------- |
| `QuickCreateTaskDialog` | Dialog, not sheet |

## Canon

[`docs/NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md`](../../NBOS/05-UI-Specifications/10-Entity-Detail-Sheet-Standard.md)
