import type { Prisma } from '@nbos/database';

const MODE = 'insensitive' as const;

function ic(value: string): Prisma.StringFilter {
  return { contains: value, mode: MODE };
}

/**
 * Text search for global / scoped task lists: title, code, description, linked
 * workspace / product / extension / project / order context.
 */
export function buildTaskListSearchWhere(trimmed: string): Prisma.TaskWhereInput {
  const q = trimmed;
  return {
    OR: [
      { title: ic(q) },
      { code: ic(q) },
      { description: ic(q) },
      { workspace: { name: ic(q) } },
      { workspace: { description: ic(q) } },
      { workspace: { project: { name: ic(q) } } },
      { workspace: { project: { code: ic(q) } } },
      { workspace: { product: { name: ic(q) } } },
      { workspace: { product: { project: { name: ic(q) } } } },
      { workspace: { product: { project: { code: ic(q) } } } },
      { workspace: { extension: { name: ic(q) } } },
      { workspace: { extension: { project: { name: ic(q) } } } },
      { workspace: { extension: { project: { code: ic(q) } } } },
      { workspace: { extension: { product: { name: ic(q) } } } },
      { product: { name: ic(q) } },
      { product: { project: { name: ic(q) } } },
      { product: { project: { code: ic(q) } } },
      { product: { order: { code: ic(q) } } },
      { extension: { name: ic(q) } },
      { extension: { project: { name: ic(q) } } },
      { extension: { project: { code: ic(q) } } },
      { extension: { product: { name: ic(q) } } },
      { extension: { order: { code: ic(q) } } },
    ],
  };
}
