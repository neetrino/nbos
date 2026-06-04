# OTHER_SECRET — legacy type migration playbook

> **Status:** completed (enum removed) · **Date:** 2026-06-03  
> Migration `20260603180000_remove_credential_type_other_secret`: все строки `OTHER_SECRET` → `API_KEY`, значение удалено из `CredentialTypeEnum`.

---

## Historical policy (before enum removal)

| Area      | Rule                                             |
| --------- | ------------------------------------------------ |
| Create UI | `OTHER_SECRET` был скрыт из type dropdown        |
| Secrets   | Generic secret хранился в `apiKey`               |
| Removal   | Строки → `API_KEY`; enum value удалён (см. ниже) |

---

## Inventory (before any enum removal)

```sql
SELECT id, name, category, credential_type, provider_id, created_at
FROM credentials
WHERE credential_type = 'OTHER_SECRET' AND archived_at IS NULL
ORDER BY created_at;
```

Prisma (maintenance script / admin console):

```ts
await prisma.credential.findMany({
  where: { credentialType: 'OTHER_SECRET', archivedAt: null },
  select: { id: true, name: true, category: true, providerId: true },
});
```

---

## Reclassification guide

| If the secret is…  | Target `credentialType` | Notes                                                                                   |
| ------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| Bearer / API token | `API_KEY`               | Move ciphertext `apiKey` → `apiKey` (no column change)                                  |
| Login + password   | `LOGIN_PASSWORD`        | Split into `login` + `password` if currently only in `apiKey`, may need manual rotation |
| `.env` file        | `ENV_BUNDLE`            | Paste into `envData`; retire `apiKey` after verify                                      |
| SSH key material   | `SSH_PRIVATE_KEY`       | `password` column = private key; add `passphrase` if needed                             |
| Unknown / one-off  | Keep `OTHER_SECRET`     | Leave Legacy badge until product defines a new enum value                               |

**Category** (`ADMIN`, `SERVICE`, `OTHER`, …) меняется отдельно по vault scope — не выводить из type.

---

## Migration procedure (per credential)

1. Open Sheet → confirm access and audit trail.
2. Choose target type from table above.
3. If cross-lane (e.g. `OTHER_SECRET` → `ENV_BUNDLE`): use type-change dialog (R1) and save with `acknowledgeOrphanedSecrets` when API requires it.
4. Re-enter or rotate secrets into fields visible for the new type.
5. Verify `secretsPresent` in list and reveal/copy for the new shape.
6. Optional: archive duplicate credentials after merge.

Bulk SQL updates of `credential_type` **without** re-encrypting or reshaping secrets are **forbidden**.

---

## Adding a new enum value (future)

When product approves a dedicated type (e.g. `OAUTH_CLIENT`):

1. Add value to `CredentialTypeEnum` in Prisma + migration.
2. Extend `CREDENTIAL_TYPES`, `credential-field-config`, `credential-type-change-lanes` (L1/L2/L3).
3. Document required fields in `06-Credentials-UX-Decisions.md`.
4. Run inventory on remaining `OTHER_SECRET` rows; migrate eligible rows to the new type.
5. Update seed demo — no new `OTHER_SECRET` rows.

---

## Enum removal (done)

- [x] Data: `UPDATE credentials SET credential_type = 'API_KEY' WHERE credential_type = 'OTHER_SECRET'`
- [x] Migration `20260603180000_remove_credential_type_other_secret`
- [x] Prisma schema, web `CREDENTIAL_TYPES`, field config, `@nbos/shared` lanes
- [x] Legacy vault badge removed; seed uses `RECOVERY_CODES` instead of `OTHER_SECRET` in generator pool

---

## Related

- UX: `06-Credentials-UX-Decisions.md` (R6, type change lanes)
- Plan: `todo.sheet.md` §7 OTHER_SECRET
- Code: `apps/web/src/features/credentials/utils/credential-type-display.ts`
