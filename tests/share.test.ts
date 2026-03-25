import { describe, expect, it } from 'vitest';
import { MAX_SHARE_BYTES } from '../src/constants';
import { decodeNote } from '../src/share/decode';
import { encodeNote } from '../src/share/encode';

describe('share', () => {
  it('round trips a shared note payload', () => {
    const encoded = encodeNote({
      title: 'Note',
      content: '# Hello',
      createdAt: 1
    });
    const decoded = decodeNote(encoded);
    expect(decoded).toEqual({
      version: 1,
      title: 'Note',
      content: '# Hello',
      createdAt: 1
    });
  });

  it('returns null for malformed input', () => {
    expect(decodeNote('#share=bad-data')).toBeNull();
  });

  it('throws when encoded content exceeds the share size limit', () => {
    const content = Array.from({ length: MAX_SHARE_BYTES }, (_, index) => `${index.toString(36)}:`).join('');
    expect(() =>
      encodeNote({
        title: 'Large',
        content,
        createdAt: 1
      })
    ).toThrow();
  });
});
