import { NOTES_STORE } from '../constants';
import type { Note } from '../types';
import { openDB } from './db';

export async function getAllNotes(): Promise<Note[]> {
  const database = await openDB();
  return database.getAll(NOTES_STORE);
}

export async function getNotes(): Promise<Note[]> {
  const notes = await getAllNotes();
  return [...notes].sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function getNote(id: string): Promise<Note | undefined> {
  const database = await openDB();
  return database.get(NOTES_STORE, id);
}

export async function saveNote(note: Note): Promise<void> {
  const database = await openDB();
  await database.put(NOTES_STORE, note);
}

export async function deleteNote(id: string): Promise<void> {
  const database = await openDB();
  await database.delete(NOTES_STORE, id);
}
