import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NOTES_STORE, SETTINGS_STORE } from '../src/constants';
import { openDB } from '../src/store/db';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  });
});

beforeEach(async () => {
  const database = await openDB();
  await database.clear(NOTES_STORE);
  await database.clear(SETTINGS_STORE);
});

describe('db', () => {
  it('creates the notes and settings stores with indexes', async () => {
    const database = await openDB();
    expect(database.objectStoreNames.contains(NOTES_STORE)).toBe(true);
    expect(database.objectStoreNames.contains(SETTINGS_STORE)).toBe(true);

    const transaction = database.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    expect(store.indexNames.contains('updatedAt')).toBe(true);
    expect(store.indexNames.contains('title')).toBe(true);
    await transaction.done;
  });
});
