/**
 * One-off: rename company checklist template content to Eastern Armenian,
 * keeping English product terms (kickoff, offer, vault, WP, etc.).
 *
 * Updates template.name, published version items, and existing instance snapshots
 * so open Delivery cards reflect the change immediately.
 *
 * Run: pnpm --filter @nbos/database exec tsx scripts/rename-checklist-templates-hy.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import type { Prisma } from '../src/generated/prisma/client';
import { createPrismaClient } from '../src/client';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

type ItemPatch = { title: string; instruction?: string };

type TemplatePatch = {
  name: string;
  itemsByEnglishTitle: Record<string, ItemPatch>;
};

const PATCHES: Record<string, TemplatePatch> = {
  'Project prep / kickoff': {
    name: 'Նախագծի նախապատրաստում / kickoff',
    itemsByEnglishTitle: {
      'Read and confirm project offer / scope': {
        title: 'Կարդալ և հաստատել project offer / scope',
        instruction: 'Offer-ը ընդունված է. out-of-scope-ը նշված է։',
      },
      'Collect brand assets': {
        title: 'Հավաքել brand assets',
        instruction: 'Logo, գույներ, fonts, առկա կայքի հղումներ։',
      },
      'Collect content & languages': {
        title: 'Հավաքել content և լեզուները',
        instruction: 'Էջերի/menu ուրվագիծ, լեզուներ, contacts, socials։',
      },
      'Environments & domains known': {
        title: 'Environments և domains հայտնի են',
        instruction: 'Dev/stage/prod hosts. DNS owner. ով է ուղղում domain-ը։',
      },
      'Access in Credentials vault': {
        title: 'Access՝ Credentials vault-ում',
        instruction:
          'Hosting, repo, CI, stores, analytics — միայն հղումներ, առանց secrets checklist-ում։',
      },
      'Team roles assigned': {
        title: 'Թիմի roles նշանակված են',
        instruction: 'PM, developer, designer, tech՝ ըստ անհրաժեշտության product-ում։',
      },
      'Kickoff with project team': {
        title: 'Kickoff նախագծի թիմի հետ',
        instruction: 'Կարճ ներքին briefing արված է։',
      },
    },
  },
  'Custom Code — web delivery': {
    name: 'Custom Code — web delivery',
    itemsByEnglishTitle: {
      'Repo & environments ready': {
        title: 'Repo և environments պատրաստ են',
        instruction: undefined,
      },
      'Core scope implemented': {
        title: 'Հիմնական scope իրականացված է',
      },
      'Auth / roles (if in scope)': {
        title: 'Auth / roles (եթե scope-ում է)',
      },
      'Forms, email, webhooks': {
        title: 'Forms, email, webhooks',
      },
      'Errors, logging, healthcheck': {
        title: 'Errors, logging, healthcheck',
      },
      'Secrets only in vault/CI': {
        title: 'Secrets միայն vault/CI-ում',
      },
      'HTTPS & security baseline': {
        title: 'HTTPS և security baseline',
      },
      'Deploy runbook + rollback known': {
        title: 'Deploy runbook + rollback հայտնի են',
      },
      'Monitoring / alerts (if in scope)': {
        title: 'Monitoring / alerts (եթե scope-ում է)',
      },
      'Client handoff notes': {
        title: 'Հաճախորդի handoff նշումներ',
      },
    },
  },
  'Mobile App — delivery': {
    name: 'Mobile App — delivery',
    itemsByEnglishTitle: {
      'Platforms & store accounts': {
        title: 'Platforms և store accounts',
      },
      'API contract & environments': {
        title: 'API contract և environments',
      },
      'Core app flows implemented': {
        title: 'Հիմնական app flows իրականացված են',
      },
      'Push / deep links (if in scope)': {
        title: 'Push / deep links (եթե scope-ում է)',
      },
      'Internal testing build': {
        title: 'Ներքին testing build',
      },
      'Store listing assets': {
        title: 'Store listing assets',
      },
      'Certificates / profiles valid': {
        title: 'Certificates / profiles վավեր են',
      },
      'Crash reporting on prod build': {
        title: 'Crash reporting՝ prod build-ում',
      },
      'Store submission ownership': {
        title: 'Store submission պատասխանատու',
      },
      'Client handoff': {
        title: 'Հաճախորդի handoff',
      },
    },
  },
  'WordPress — site delivery': {
    name: 'WordPress — site delivery',
    itemsByEnglishTitle: {
      'WP bootstrap: clean sample content': {
        title: 'WP bootstrap՝ մաքրել sample content',
      },
      'WP bootstrap: admin & indexing': {
        title: 'WP bootstrap՝ admin և indexing',
      },
      'Install theme (+ child if needed)': {
        title: 'Տեղադրել theme (+ child եթե պետք է)',
      },
      'Template setup after theme': {
        title: 'Template setup՝ theme-ից հետո',
      },
      'Neetrino plugin & Elementor PRO': {
        title: 'Neetrino plugin և Elementor PRO',
      },
      'Build pages, menu, header, footer': {
        title: 'Կառուցել pages, menu, header, footer',
      },
      'Home + Contact + forms': {
        title: 'Home + Contact + forms',
      },
      'Shop extras (if ecommerce)': {
        title: 'Shop extras (եթե ecommerce)',
      },
      'Responsive pass': {
        title: 'Responsive pass',
      },
      'Transfer: domain & hosting': {
        title: 'Transfer՝ domain և hosting',
      },
      'Transfer: migrate test → live': {
        title: 'Transfer՝ migrate test → live',
      },
      'Security plugins pack': {
        title: 'Security plugins pack',
      },
      'Go-live: indexing & handoff': {
        title: 'Go-live՝ indexing և handoff',
      },
      'WP cleanup before client': {
        title: 'WP cleanup՝ հաճախորդին հանձնելուց առաջ',
      },
    },
  },
  'Universal QA': {
    name: 'Universal QA',
    itemsByEnglishTitle: {
      'Links & buttons': {
        title: 'Links և buttons',
      },
      'No placeholders / lorem': {
        title: 'Չկան placeholders / lorem',
      },
      'Forms & mail': {
        title: 'Forms և mail',
      },
      'Responsive smoke': {
        title: 'Responsive smoke',
      },
      'Empty / 404 states': {
        title: 'Empty / 404 states',
      },
      'No test/PII data in prod': {
        title: 'Prod-ում չկա test/PII data',
      },
      'Performance smoke': {
        title: 'Performance smoke',
      },
      'Offer acceptance criteria': {
        title: 'Offer acceptance criteria',
      },
    },
  },
  'Employee Offboarding': {
    name: 'Աշխատակցի offboarding',
    itemsByEnglishTitle: {
      'Notify team and clients if needed': {
        title: 'Ծանուցել թիմին և հաճախորդներին՝ եթե պետք է',
      },
      'Transfer active projects': {
        title: 'Փոխանցել ակտիվ projects',
      },
      'Transfer active tasks': {
        title: 'Փոխանցել ակտիվ tasks',
      },
      'Transfer client contacts (Seller)': {
        title: 'Փոխանցել հաճախորդի contacts (Seller)',
      },
      'Revoke NBOS Platform access': {
        title: 'Չեղարկել NBOS Platform access',
      },
      'Revoke Git, Figma, IDE access': {
        title: 'Չեղարկել Git, Figma, IDE access',
      },
      'Revoke work email access': {
        title: 'Չեղարկել աշխատանքային email access',
      },
      'Remove from work Telegram chats': {
        title: 'Հեռացնել աշխատանքային Telegram chats-ից',
      },
      'Revoke Credentials vault access': {
        title: 'Չեղարկել Credentials vault access',
      },
      'Rotate critical shared passwords': {
        title: 'Փոխել critical shared passwords',
      },
      'Final payroll and bonus calculation': {
        title: 'Վերջնական payroll և bonus հաշվարկ',
      },
      'Pay final settlement': {
        title: 'Վճարել վերջնական settlement',
      },
      'Archive employee profile': {
        title: 'Արխիվացնել employee profile',
      },
      'Exit interview (optional)': {
        title: 'Exit interview (ըստ ցանկության)',
      },
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function patchItemsJson(items: unknown, map: Record<string, ItemPatch>): { next: unknown; changed: number } {
  if (!Array.isArray(items)) return { next: items, changed: 0 };
  let changed = 0;
  const next = items.map((row) => {
    if (!isRecord(row) || typeof row.title !== 'string') return row;
    const patch = map[row.title];
    if (!patch) return row;
    changed += 1;
    const updated: Record<string, unknown> = { ...row, title: patch.title };
    if (patch.instruction !== undefined) {
      updated.instruction = patch.instruction;
    }
    return updated;
  });
  return { next, changed };
}

async function main(): Promise<void> {
  const prisma = createPrismaClient({ skipBudgetAssert: true, role: 'api' });
  try {
    const templates = await prisma.checklistTemplate.findMany({
      include: {
        versions: true,
        instances: { select: { id: true, snapshotItems: true } },
      },
    });

    let templatesUpdated = 0;
    let versionsUpdated = 0;
    let instancesUpdated = 0;
    let itemsPatched = 0;

    for (const template of templates) {
      const patch = PATCHES[template.name];
      if (!patch) {
        console.log(`SKIP (no patch): ${template.name}`);
        continue;
      }

      if (template.name !== patch.name) {
        await prisma.checklistTemplate.update({
          where: { id: template.id },
          data: { name: patch.name },
        });
        templatesUpdated += 1;
        console.log(`NAME: "${template.name}" → "${patch.name}"`);
      } else {
        console.log(`NAME unchanged (already target or EN kept): ${template.name}`);
      }

      for (const version of template.versions) {
        const { next, changed } = patchItemsJson(version.items, patch.itemsByEnglishTitle);
        if (changed === 0) continue;
        await prisma.checklistTemplateVersion.update({
          where: { id: version.id },
          data: { items: next as Prisma.InputJsonValue },
        });
        versionsUpdated += 1;
        itemsPatched += changed;
        console.log(`  version v${version.versionNumber}: ${changed} items`);
      }

      for (const instance of template.instances) {
        const { next, changed } = patchItemsJson(instance.snapshotItems, patch.itemsByEnglishTitle);
        if (changed === 0) continue;
        await prisma.checklistInstance.update({
          where: { id: instance.id },
          data: { snapshotItems: next as Prisma.InputJsonValue },
        });
        instancesUpdated += 1;
        itemsPatched += changed;
      }
      console.log(`  instances patched: ${template.instances.length} scanned`);
    }

    console.log(
      JSON.stringify(
        { templatesUpdated, versionsUpdated, instancesUpdated, itemsPatched },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
