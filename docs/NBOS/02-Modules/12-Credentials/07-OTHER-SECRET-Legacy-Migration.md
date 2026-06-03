# OTHER_SECRET — legacy type migration playbook

> **Status:** accepted · **Date:** 2026-06-03  
> `OTHER_SECRET` остаётся в `CredentialTypeEnum` для существующих строк; **новые** credentials этим типом не создаются (R6).

---

## Current policy

| Area          | Rule                                                                  |
| ------------- | --------------------------------------------------------------------- |
| Create UI     | `OTHER_SECRET` скрыт из type dropdown (`CREDENTIAL_TYPES_FOR_CREATE`) |
| Edit UI       | Тип виден только если запись уже `OTHER_SECRET`                       |
| Vault list    | Badge **Legacy** рядом с типом                                        |
| Secrets       | Значение в колонке `apiKey` (generic secret)                          |
| API / DB enum | **Не удалять** до нулевого счётчика строк и явной миграции            |

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

## Removing `OTHER_SECRET` from enum (last step only)

Preconditions:

- [ ] `COUNT(*) WHERE credential_type = 'OTHER_SECRET'` = 0 (including archived, or explicit archive policy)
- [ ] No Delivery slots / presets reference `OTHER_SECRET`
- [ ] Bitrix / import mappings updated (`05-Credentials-Integrations.md`)
- [ ] Web filters and tests updated

Steps:

1. Ship data migration (if any stragglers) using the reclassification guide.
2. Prisma migration: map enum away or use PostgreSQL enum replace strategy.
3. Remove from `CREDENTIAL_TYPES`, field config, shared lane sets.
4. Full seed + regression on vault list/sheet/reveal.

---

## Related

- UX: `06-Credentials-UX-Decisions.md` (R6, type change lanes)
- Plan: `todo.sheet.md` §7 OTHER_SECRET
- Code: `apps/web/src/features/credentials/utils/credential-type-display.ts`
