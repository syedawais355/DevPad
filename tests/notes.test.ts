import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NOTES_STORE, SETTINGS_STORE } from '../src/constants';
import { openDB } from '../src/store/db';
import { deleteNote, getAllNotes, getNote, getNotes, saveNote } from '../src/store/notes';
import type { Note } from '../src/types';

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

function createNote(id: string, updatedAt: number): Note {
  return {
    id,
    title: id,
    content: `${id} body`,
    createdAt: updatedAt,
    updatedAt,
    encrypted: false,
    tags: []
  };
}

describe('notes store', () => {
  it('saves and loads a note by id', async () => {
    const note = createNote('a', 1);
    await saveNote(note);
    await expect(getNote('a')).resolves.toEqual(note);
  });

  it('returns notes sorted by updatedAt descending', async () => {
    const first = createNote('first', 1);
    const second = createNote('second', 2);
    await saveNote(first);
    await saveNote(second);
    const notes = await getNotes();
    expect(notes.map((note) => note.id)).toEqual(['second', 'first']);
  });

  it('deletes notes', async () => {
    const note = createNote('a', 1);
    await saveNote(note);
    await deleteNote(note.id);
    await expect(getNote(note.id)).resolves.toBeUndefined();
  });

  it('returns all notes', async () => {
    await saveNote(createNote('a', 1));
    await saveNote(createNote('b', 2));
    const notes = await getAllNotes();
    expect(notes).toHaveLength(2);
  });
});
