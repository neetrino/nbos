# NBOS Platform - Current Brief

> Short current brief. Detailed business and UI canon lives in `docs/NBOS`.

## Product

NBOS Platform is the internal Business Operation System for Neetrino. It replaces scattered Bitrix24 workflows with one integrated platform for CRM, Projects Hub, Finance, Tasks, Support, Clients, Partners, Drive, Credentials, Messenger, Notifications, Calendar, Dashboard and Reports.

NBOS is an internal company platform, not a public SaaS product.

## Canon

The active source of truth is:

```text
docs/NBOS/00-Documentation-Hub.md
docs/NBOS/00-Implementation-Roadmap.md
docs/NBOS/00-Documentation-Consistency-Audit.md
```

Archived documents are historical context only.

## Core Business Principle

Project and Product are central operational entities.

Most business work connects to one or more of:

- Lead / Deal;
- Order / Invoice / Payment;
- Project;
- Product / Extension;
- Subscription / Maintenance;
- Task / Work Space;
- Client / Company / Contact;
- Partner;
- Drive File Asset;
- Credential;
- Messenger thread;
- Calendar projection;
- Notification.

## Current Development Direction

Implementation should follow:

```text
docs/NBOS/00-Implementation-Roadmap.md
```

Current first implementation block:

```text
Phase 1 - Platform shell and foundations
```

Main Phase 1 goals:

- align UI shell and navigation with canon;
- move Team / Departments under My Company;
- keep My Account outside Settings;
- remove global header Create;
- create My Company and Settings/Admin skeletons;
- establish RBAC visibility and graceful module degradation.

## Technology Baseline

See `docs/TECH_CARD.md` and `docs/01-ARCHITECTURE.md`.

Short version:

- frontend: Next.js / React / Tailwind;
- backend: NestJS modular monolith;
- database: PostgreSQL / Prisma;
- queues: Redis / BullMQ;
- files: Cloudflare R2;
- real-time: Socket.io;
- package manager: pnpm;
- monorepo: apps + packages.

## Integration Direction

Integration decisions must follow module canon, especially:

- Messenger: `docs/NBOS/02-Modules/09-Messenger/*`
- Notifications: `docs/NBOS/02-Modules/13-Notifications/*`
- Finance: `docs/NBOS/02-Modules/04-Finance/*`
- Drive: `docs/NBOS/02-Modules/11-Drive/*`

Important current decision:

- WhatsApp should be implemented first through QR-connected WhatsApp Web / WAHA-style adapter for project groups and rare 1:1 chats.
- WhatsApp Official API is not a near-term requirement unless business process changes.

## Quality Rule

Do not fake business-critical data.

If data is missing, show missing data. Never invent:

- payment status;
- invoice paid status;
- payroll totals;
- bonus release;
- partner payouts;
- credential access;
- audit logs;
- report formulas;
- marketing CPL/ROI without spend.

## Status

Documentation canon is ready for development.

See `docs/NBOS/00-Documentation-Consistency-Audit.md`.
