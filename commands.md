# COMMANDS

COPY ONE LINE. RUN FROM REPO ROOT.

# LOCAL

```bash
pnpm install
```

```bash
pnpm db:generate
```

```bash
pnpm dev:web
```

```bash
pnpm dev:api
```

```bash
pnpm dev:worker
```

```bash
pnpm start:full
```

```bash
pnpm db:studio
```

# CHECK

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

```bash
pnpm format
```

```bash
pnpm build
```

# DATABASE

```bash
pnpm db:migrate
```

```bash
pnpm db:migrate:status
```

```bash
pnpm db:seed
```

NOT ON PRODUCTION:

```bash
pnpm db:push
```

# PRODUCTION

MIGRATE FIRST IF SCHEMA CHANGED. DO NOT STORE DIRECT URL IN THIS FILE.

```bash
read -rsp "Neon DIRECT_URL: " NBOS_RELEASE_DIRECT_URL; printf '\n'; DIRECT_URL="$NBOS_RELEASE_DIRECT_URL" pnpm db:migrate:status; unset NBOS_RELEASE_DIRECT_URL
```

```bash
read -rsp "Neon DIRECT_URL: " NBOS_RELEASE_DIRECT_URL; printf '\n'; DIRECT_URL="$NBOS_RELEASE_DIRECT_URL" pnpm db:migrate:deploy; unset NBOS_RELEASE_DIRECT_URL
```

```bash
pnpm deploy:prod -- --dry-run
```

```bash
pnpm deploy:prod
```

```bash
pnpm deploy:prod -- backend
```

```bash
pnpm deploy:prod -- web
```
