import {
  MESSENGER_PERSIST_DB_NAME,
  MESSENGER_PERSIST_DB_VERSION,
  MESSENGER_PERSIST_STORE_NAME,
} from './messenger-persist.constants';
import { isNewerPersistCapture, parseMinimalPersistHeader } from './messenger-persist-recency';
import { isMessengerPersistGenerationCurrent } from './messenger-persist-session';

export type MessengerPersistCompareWriteInput = {
  identityId: string;
  serialized: string;
  capturedAt: number;
  generation: number;
};

export type MessengerPersistBackend = {
  read(identityId: string): Promise<string | null>;
  write(identityId: string, serialized: string): Promise<void>;
  compareAndWrite(input: MessengerPersistCompareWriteInput): Promise<boolean>;
  delete(identityId: string): Promise<void>;
  clear(): Promise<void>;
};

export type MemoryMessengerPersistBackendOptions = {
  afterRead?: () => Promise<void>;
};

export function createMemoryMessengerPersistBackend(
  initial?: Record<string, string>,
  options?: MemoryMessengerPersistBackendOptions,
): MessengerPersistBackend {
  const records = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    async read(identityId) {
      return records.get(identityId) ?? null;
    },
    async write(identityId, serialized) {
      records.set(identityId, serialized);
    },
    async compareAndWrite(input) {
      if (options?.afterRead) await options.afterRead();
      return commitMemoryCompareWrite(records, input);
    },
    async delete(identityId) {
      records.delete(identityId);
    },
    async clear() {
      records.clear();
    },
  };
}

export function createIndexedDbMessengerPersistBackend(): MessengerPersistBackend {
  return {
    read: (identityId) => withStore('readonly', (store) => requestToString(store.get(identityId))),
    write: (identityId, serialized) =>
      withStore('readwrite', (store) => requestToVoid(store.put({ id: identityId, payload: serialized }))),
    compareAndWrite: (input) => compareAndWriteIndexedDb(input),
    delete: (identityId) => withStore('readwrite', (store) => requestToVoid(store.delete(identityId))),
    clear: () => withStore('readwrite', (store) => requestToVoid(store.clear())),
  };
}

function commitMemoryCompareWrite(
  records: Map<string, string>,
  input: MessengerPersistCompareWriteInput,
): boolean {
  if (!isMessengerPersistGenerationCurrent(input.generation)) return false;
  const existing = parseMinimalPersistHeader(records.get(input.identityId) ?? null);
  if (!isNewerPersistCapture(existing, input)) return false;
  if (!isMessengerPersistGenerationCurrent(input.generation)) return false;
  records.set(input.identityId, input.serialized);
  return true;
}

async function compareAndWriteIndexedDb(input: MessengerPersistCompareWriteInput): Promise<boolean> {
  const db = await openMessengerPersistDb();
  try {
    return await runIndexedDbCompareAndWrite(db, input);
  } finally {
    db.close();
  }
}

function runIndexedDbCompareAndWrite(
  db: IDBDatabase,
  input: MessengerPersistCompareWriteInput,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let wrote = false;
    const tx = db.transaction(MESSENGER_PERSIST_STORE_NAME, 'readwrite');
    const store = tx.objectStore(MESSENGER_PERSIST_STORE_NAME);
    const getRequest = store.get(input.identityId);
    getRequest.onsuccess = () => {
      wrote = commitIndexedDbCandidate(store, input, getRequest.result);
    };
    getRequest.onerror = () => reject(getRequest.error ?? new Error('IndexedDB read failed'));
    tx.oncomplete = () => resolve(wrote);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  });
}

function commitIndexedDbCandidate(
  store: IDBObjectStore,
  input: MessengerPersistCompareWriteInput,
  row: unknown,
): boolean {
  if (!isMessengerPersistGenerationCurrent(input.generation)) return false;
  const existing = parseMinimalPersistHeader(payloadFromRow(row));
  if (!isNewerPersistCapture(existing, input)) return false;
  if (!isMessengerPersistGenerationCurrent(input.generation)) return false;
  store.put({ id: input.identityId, payload: input.serialized });
  return true;
}

function payloadFromRow(row: unknown): string | null {
  if (!row || typeof row !== 'object') return null;
  const payload = (row as { payload?: unknown }).payload;
  return typeof payload === 'string' ? payload : null;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operate: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openMessengerPersistDb();
  try {
    const tx = db.transaction(MESSENGER_PERSIST_STORE_NAME, mode);
    const result = operate(tx.objectStore(MESSENGER_PERSIST_STORE_NAME));
    const [value] = await Promise.all([result, transactionDone(tx)]);
    return value;
  } finally {
    db.close();
  }
}

function openMessengerPersistDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MESSENGER_PERSIST_DB_NAME, MESSENGER_PERSIST_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MESSENGER_PERSIST_STORE_NAME)) {
        db.createObjectStore(MESSENGER_PERSIST_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

function requestToString(request: IDBRequest): Promise<string | null> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(payloadFromRow(request.result));
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });
}

function requestToVoid(request: IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('IndexedDB write failed'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  });
}
