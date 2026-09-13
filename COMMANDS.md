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
pnpm dev
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

# PRODUCTION DB

PUT DIRECT_URL_PROD IN .ENV.LOCAL. SCRIPT NEVER PRINTS THE URL.

```bash
pnpm db:migrate:prod:status
```

```bash
pnpm db:migrate:prod
```

# PRODUCTION DEPLOY

```bash
pnpm deploy:prod:status
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

# PRODUCTION RELEASE (DB + DEPLOY)

DB MIGRATE FIRST. DEPLOY ONLY IF MIGRATE SUCCEEDS.

```bash
pnpm release:prod:status
```

```bash
pnpm release:prod
```
