# NBOS Work Plans — index

> Root work-plan index. Detailed plans are split so Platform Access Foundation can be completed before the Credentials Vault build.

## Active order

1. [1.todo-Access.md](./1.todo-Access.md) — Platform Access Foundation: RBAC/action levels, role access levels, personal overrides, Project/Product teams, manual resource overrides.
2. [2.todo-Credentials.md](./2.todo-Credentials.md) — Credentials Vault: UI shell, Sheet, view modes, ENV/comment, and final vault implementation using the access foundation.

## Why split

- Access levels are platform-wide, not Credentials-only.
- Credentials must consume Project/Product team access correctly, so access foundation comes first.
- Drive, Finance, Project Hub, Tasks and future modules should reuse the same foundation instead of each module inventing its own access model.
