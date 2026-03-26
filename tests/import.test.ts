import { describe, expect, it } from 'vitest';
import { parseNotesArchive } from '../src/import/files';

describe('import files', () => {
  it('parses a valid archive and normalizes note fields', () => {
    const archive = parseNotesArchive(
      JSON.stringify({
        version: 3,
        settings: {
          theme: 'light',
          fontSize: 15,
          lineHeight: 2
        },
        notes: [
          {
            id: 'alpha',
            title: '  Launch Plan  ',
            content: '# Heading\n#project',
            createdAt: 1,
            updatedAt: 2,
            encrypted: false,
            tags: []
          },
          {
            id: 'beta',
            title: '',
            content: 'ciphertext',
            createdAt: 10,
            updatedAt: 11,
            encrypted: true,
            tags: ['Secure', 'secure']
          }
        ]
      })
    );

    expect(archive.version).toBe(3);
    expect(archive.settings).toEqual({
      theme: 'light',
      fontSize: 15,
      lineHeight: 2
    });
    expect(archive.notes).toHaveLength(2);
    expect(archive.notes[0].title).toBe('Launch Plan');
    expect(archive.notes[0].tags).toEqual(['project']);
    expect(archive.notes[1].title).toBe('Untitled Note');
    expect(archive.notes[1].tags).toEqual(['secure']);
  });

  it('keeps valid notes when the archive contains invalid entries', () => {
    const archive = parseNotesArchive(
      JSON.stringify({
        notes: [
          {
            id: 'valid',
            title: 'Valid',
            content: 'Body',
            createdAt: 1,
            updatedAt: 2,
            encrypted: false,
            tags: []
          },
          {
            title: 'Missing id',
            content: 'Ignored'
          }
        ]
      })
    );

    expect(archive.notes).toHaveLength(1);
    expect(archive.notes[0].id).toBe('valid');
  });

  it('throws when the file is malformed json', () => {
    expect(() => parseNotesArchive('{bad')).toThrow('import file is not valid json');
  });

  it('throws when the archive has no valid notes', () => {
    expect(() => parseNotesArchive(JSON.stringify({ notes: [{ title: 'No id' }] }))).toThrow('import file has no valid notes');
  });
});
