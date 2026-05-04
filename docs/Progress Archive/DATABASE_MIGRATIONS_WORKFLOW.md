# Database migrations — team workflow

NBOS uses **Prisma Migrate** (`packages/database/prisma/migrations`). To reduce merge pain:

1. **One migration per logical change** — keep migrations small and named after the feature.
2. **Coordinate schema changes** — before starting, confirm nobody else is landing a migration on the same models in parallel.
3. **Linear history** — if two branches both add migrations, rebase one branch and **rename** the later migration folder so timestamps stay ordered, then resolve SQL conflicts carefully.
4. **Never hand-edit applied migrations** in shared environments; add a new migration to correct mistakes.
5. **CI/local** — run `pnpm --filter @nbos/database exec prisma migrate dev` (or `deploy` in CI) against a disposable DB when unsure.

For schema rules and product constraints, follow `docs/NBOS` and `docs/TECH_CARD.md`.
