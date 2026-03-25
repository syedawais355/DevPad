import { openDB as openIndexedDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, NOTES_STORE, SETTINGS_STORE } from '../constants';
import type { Note } from '../types';

interface SettingRecord {
  key: string;
  value: unknown;
}

interface DevPadSchema extends DBSchema {
  [NOTES_STORE]: {
    key: string;
    value: Note;
    indexes: {
      updatedAt: number;
      title: string;
    };
  };
  [SETTINGS_STORE]: {
    key: string;
    value: SettingRecord;
  };
}

export async function openDB(): Promise<IDBPDatabase<DevPadSchema>> {
  return openIndexedDB<DevPadSchema>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = database.createObjectStore(NOTES_STORE, {
          keyPath: 'id'
        });
        notesStore.createIndex('updatedAt', 'updatedAt');
        notesStore.createIndex('title', 'title');
      }

      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, {
          keyPath: 'key'
        });
      }
    }
  });
}
