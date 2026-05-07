/**
 * Optional: seed `task_board_stages` rows for boardType KANBAN (ownerId = null).
 * The web app does not call a list endpoint for these; primary boards use `Task.status`.
 * Useful only if you add tooling or integrations that read this table.
 *
 * Usage: cd packages/database && pnpm exec tsx prisma/seed-board-stages.ts
 */
import { createPrismaClient } from '../src/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

/** Aligns with web `WORKSPACE_KANBAN_COLUMN_DEFS` (status-driven primary board). */
const kanbanStages = [
  { boardType: 'KANBAN', title: 'Open', color: '#3B82F6', sortOrder: 0, isDefault: true },
  { boardType: 'KANBAN', title: 'In Progress', color: '#A855F7', sortOrder: 1, isDefault: false },
  { boardType: 'KANBAN', title: 'Review', color: '#6366F1', sortOrder: 2, isDefault: false },
  { boardType: 'KANBAN', title: 'Completed', color: '#22C55E', sortOrder: 3, isDefault: false },
];

async function main() {
  const prisma = createPrismaClient() as any;
  const count = await prisma.taskBoardStage.count({
    where: { ownerId: null, boardType: 'KANBAN' },
  });
  if (count > 0) {
    console.log(`KANBAN stages already exist (${count} rows). Skipping.`);
    await prisma.$disconnect();
    return;
  }
  await prisma.taskBoardStage.createMany({ data: kanbanStages });
  console.log(`Seeded ${kanbanStages.length} default KANBAN board stages.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
