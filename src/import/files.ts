import {
  CURRENT_SHARE_VERSION,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_NOTE_TITLE,
  DEFAULT_THEME,
  TAG_PATTERN
} from '../constants';
import type { AppSettings, Note } from '../types';

interface RawArchive {
  version?: unknown;
  settings?: unknown;
  notes?: unknown;
}

type RawNote = Partial<Record<keyof Note, unknown>>;

export interface ImportedArchive {
  version: number;
  settings: AppSettings | null;
  notes: Note[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function normalizeTitle(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_NOTE_TITLE;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? DEFAULT_NOTE_TITLE : trimmed;
}

function deriveTags(content: string): string[] {
  const matches = [...content.matchAll(new RegExp(TAG_PATTERN, 'gu'))];
  return [...new Set(matches.map((match) => match[1].toLowerCase()))];
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((tag) => typeof tag === 'string').map((tag) => tag.toLowerCase()))];
}

function parseNote(raw: unknown): Note | null {
  if (!isObject(raw)) {
    return null;
  }

  const note = raw as RawNote;
  if (typeof note.id !== 'string' || note.id.trim().length === 0) {
    return null;
  }

  const content = typeof note.content === 'string' ? note.content : '';
  const encrypted = note.encrypted === true;
  const now = Date.now();
  const createdAt = asNumber(note.createdAt) ?? now;
  const updatedAt = asNumber(note.updatedAt) ?? createdAt;
  const importedTags = normalizeTags(note.tags);

  return {
    id: note.id,
    title: normalizeTitle(note.title),
    content,
    createdAt,
    updatedAt,
    encrypted,
    tags: encrypted
      ? importedTags
      : (importedTags.length > 0 ? importedTags : deriveTags(content))
  };
}

function parseSettings(raw: unknown): AppSettings | null {
  if (!isObject(raw)) {
    return null;
  }

  const theme = raw.theme === 'light' ? 'light' : DEFAULT_THEME;
  const fontSize = asNumber(raw.fontSize) ?? DEFAULT_FONT_SIZE;
  const lineHeight = asNumber(raw.lineHeight) ?? DEFAULT_LINE_HEIGHT;

  return {
    theme,
    fontSize,
    lineHeight
  };
}

export function parseNotesArchive(content: string): ImportedArchive {
  if (content.trim().length === 0) {
    throw new Error('import file is empty');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('import file is not valid json');
  }

  if (!isObject(parsed)) {
    throw new Error('import file format is invalid');
  }

  const archive = parsed as RawArchive;
  const notes = Array.isArray(archive.notes)
    ? archive.notes.map((note) => parseNote(note)).filter((note): note is Note => note !== null)
    : [];

  if (notes.length === 0) {
    throw new Error('import file has no valid notes');
  }

  return {
    version: asNumber(archive.version) ?? CURRENT_SHARE_VERSION,
    settings: parseSettings(archive.settings),
    notes
  };
}
