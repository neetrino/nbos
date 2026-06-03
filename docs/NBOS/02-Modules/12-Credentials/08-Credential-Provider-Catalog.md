# Credential provider catalog (MVP)

> **Status:** product MVP list (2026-06-03) · **Source of truth for seed:** `packages/database/prisma/seed-credential-providers.ts`

One shared table `credential_providers` for hosting, domain, mail, cloud, and SaaS — no separate mail/hosting lists (R9).

---

## Rules

| Rule      | Detail                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| Search    | `GET /api/credentials/providers?q=` — prefix/substring on `name`                |
| Create    | `POST /api/credentials/providers` — inline from sheet picker; `isSeeded: false` |
| Link      | `credentials.providerId` FK; display name from relation                         |
| Slug      | Unique, derived from `name` (`credential-provider-slug` in `@nbos/shared`)      |
| Demo-only | `NBOS`, `LegacyMaps` — internal seed labels for demo credentials                |

---

## Seeded providers (global MVP + Armenia spike + 2 demo)

### Armenia (hosting, domain, telecom)

| Name               | Website                  |
| ------------------ | ------------------------ |
| HayHost            | https://hayhost.am       |
| REG.am             | https://www.reg.am       |
| Name.am            | https://www.name.am      |
| TeamCloud          | https://teamcloud.am     |
| OVIO               | https://ovio.am          |
| ABCDomain          | https://www.abcdomain.am |
| Internet.am        | https://www.internet.am  |
| Arminco            | https://www.arminco.com  |
| Web.am             | https://www.web.am       |
| Host.am            | https://www.host.am      |
| Arpinet            | https://www.arpinet.am   |
| Ucom               | https://www.ucom.am      |
| Viva               | https://www.viva.am      |
| Rostelecom Armenia | https://www.rtarmenia.am |
| Netsys             | https://www.netsys.am    |
| Amnic              | https://www.amnic.net    |

### Hosting & cloud

| Name         | Website                      |
| ------------ | ---------------------------- |
| Beget        | https://beget.com            |
| Timeweb      | https://timeweb.com          |
| Selectel     | https://selectel.ru          |
| Hostinger    | https://www.hostinger.com    |
| DigitalOcean | https://www.digitalocean.com |
| Hetzner      | https://www.hetzner.com      |
| AWS          | https://aws.amazon.com       |
| Google Cloud | https://cloud.google.com     |
| Vercel       | https://vercel.com           |
| Cloudflare   | https://www.cloudflare.com   |
| Neon         | https://neon.tech            |
| Supabase     | https://supabase.com         |

### Domain registrars (AM / RU / global)

| Name      | Website                   |
| --------- | ------------------------- |
| Reg.ru    | https://www.reg.ru        |
| Namecheap | https://www.namecheap.com |
| GoDaddy   | https://www.godaddy.com   |

### Mail & workspace

| Name             | Website                      |
| ---------------- | ---------------------------- |
| Google Workspace | https://workspace.google.com |
| Microsoft        | https://www.microsoft.com    |
| Zoho             | https://www.zoho.com         |
| Yandex           | https://yandex.ru            |
| Mail.ru          | https://mail.ru              |
| SendGrid         | https://sendgrid.com         |
| Mailgun          | https://www.mailgun.com      |

### Dev & APIs

| Name     | Website                     |
| -------- | --------------------------- |
| GitHub   | https://github.com          |
| GitLab   | https://about.gitlab.com    |
| Stripe   | https://stripe.com          |
| OpenAI   | https://openai.com          |
| Firebase | https://firebase.google.com |

### App stores

| Name        | Website                         |
| ----------- | ------------------------------- |
| Apple       | https://developer.apple.com     |
| Google Play | https://play.google.com/console |

### SaaS & tools

| Name      | Website                 |
| --------- | ----------------------- |
| Google    | https://google.com      |
| WordPress | https://wordpress.com   |
| Adobe     | https://www.adobe.com   |
| Figma     | https://www.figma.com   |
| HubSpot   | https://www.hubspot.com |
| Telegram  | https://telegram.org    |
| Slack     | https://slack.com       |
| Notion    | https://www.notion.so   |

### Demo (seed only)

| Name       | Notes                             |
| ---------- | --------------------------------- |
| NBOS       | Internal demo project credentials |
| LegacyMaps | Demo legacy `OTHER_SECRET` row    |

---

## Changes after MVP

1. Edit `CREDENTIAL_PROVIDER_SEEDS` in `seed-credential-providers.ts`.
2. Update this doc in the same PR.
3. Run `pnpm seed` (or targeted provider seed) in dev — upsert by `slug`, safe re-run.
4. Product sign-off for new global vendors before marking `isSeeded: true`.

---

## Related

- UX: `06-Credentials-UX-Decisions.md` (R5, R9)
- Data model: `02-Credentials-Data-Model.md` (`Provider` field)
- Plan: `todo.sheet.md` §6 DOMAIN/HOSTING examples
