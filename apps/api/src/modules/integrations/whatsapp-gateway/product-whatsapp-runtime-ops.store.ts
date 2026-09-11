export type Slice9OperationRow = {
  id: string;
  productId: string;
  bindingId: string | null;
  type: string;
  status: string;
  dedupeKey: string;
  source: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export function createSlice9AccessAndOpsPrisma(
  nextId: (prefix: string) => string,
  operations: Slice9OperationRow[],
  invitations: Map<string, { id: string; status: string; productId: string }>,
  participantCreates: unknown[],
) {
  return {
    ...createParticipantAndGrantPrisma(nextId, participantCreates),
    ...createEmployeePrisma(),
    whatsAppGroupOperation: createOperationPrisma(nextId, operations),
    productWhatsAppParticipantSync: { findMany: async () => [] },
    ...createInvitationPrisma(nextId, invitations),
  };
}

function createParticipantAndGrantPrisma(
  nextId: (prefix: string) => string,
  participantCreates: unknown[],
) {
  return {
    messengerConversationParticipant: {
      create: async (args: unknown) => {
        participantCreates.push(args);
        return { id: nextId('part') };
      },
      findFirst: async () => null,
    },
    resourceAccessGrant: { findFirst: async () => null },
  };
}

function createEmployeePrisma() {
  return {
    employee: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id !== 'dev-b') return null;
        return {
          id: 'dev-b',
          status: 'ACTIVE',
          departments: [],
          role: {
            permissions: [
              { scope: 'OWN', permission: { module: 'MESSENGER', action: 'VIEW' } },
              { scope: 'OWN', permission: { module: 'MESSENGER', action: 'EDIT' } },
              { scope: 'OWN', permission: { module: 'MESSENGER', action: 'CLIENT_READ' } },
              { scope: 'NONE', permission: { module: 'MESSENGER', action: 'CLIENT_SEND' } },
            ],
          },
        };
      },
    },
  };
}

function createOperationPrisma(
  nextId: (prefix: string) => string,
  operations: Slice9OperationRow[],
) {
  const whatsAppGroupOperation = {
    findUnique: async ({ where }: { where: { dedupeKey: string } }) =>
      operations.find((row) => row.dedupeKey === where.dedupeKey) ?? null,
    findFirst: async ({ where }: { where: { productId: string } }) => {
      const matches = operations.filter((row) => row.productId === where.productId);
      return matches[matches.length - 1] ?? null;
    },
    findMany: async ({ where }: { where: { productId: string } }) =>
      operations.filter((row) => row.productId === where.productId),
    create: async ({ data }: { data: Partial<Slice9OperationRow> & { productId: string } }) => {
      const row = newOperationRow(nextId, data);
      operations.push(row);
      return row;
    },
    upsert: async ({
      where,
      create,
    }: {
      where: { dedupeKey: string };
      create: Partial<Slice9OperationRow> & { productId: string; dedupeKey: string };
    }) => {
      const existing = operations.find((row) => row.dedupeKey === where.dedupeKey);
      if (existing) return existing;
      return whatsAppGroupOperation.create({ data: create });
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<Slice9OperationRow>;
    }) => {
      const row = operations.find((item) => item.id === where.id);
      if (!row) throw new Error('missing op');
      Object.assign(row, data);
      return row;
    },
  };
  return whatsAppGroupOperation;
}

function newOperationRow(
  nextId: (prefix: string) => string,
  data: Partial<Slice9OperationRow> & { productId: string },
): Slice9OperationRow {
  return {
    id: nextId('op'),
    productId: data.productId,
    bindingId: data.bindingId ?? null,
    type: data.type ?? 'BIND_EXISTING_GROUP',
    status: data.status ?? 'PENDING',
    dedupeKey: data.dedupeKey ?? nextId('dk'),
    source: data.source ?? 'MANUAL_BIND',
    createdAt: new Date(),
    startedAt: null,
    completedAt: data.completedAt ?? null,
    failedAt: null,
    errorCode: null,
    errorMessage: null,
  };
}

function createInvitationPrisma(
  nextId: (prefix: string) => string,
  invitations: Map<string, { id: string; status: string; productId: string }>,
) {
  return {
    productWhatsAppClientInvitation: {
      findUnique: async ({ where }: { where: { dedupeKey: string } }) =>
        invitations.get(where.dedupeKey) ?? null,
      findFirst: async () => null,
      create: async ({
        data,
      }: {
        data: { productId: string; dedupeKey: string; status: string };
      }) => {
        const row = { id: nextId('inv'), status: data.status, productId: data.productId };
        invitations.set(data.dedupeKey, row);
        return row;
      },
      update: async () => ({ id: 'inv-1' }),
    },
  };
}
