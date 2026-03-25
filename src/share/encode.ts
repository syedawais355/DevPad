import { compressToUint8Array } from 'lz-string';
import {
  CURRENT_SHARE_VERSION,
  MAX_SHARE_BYTES
} from '../constants';
import type { SharePayload } from '../types';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function encodeNote(note: Pick<SharePayload, 'title' | 'content' | 'createdAt'>): string {
  const payload: SharePayload = {
    version: CURRENT_SHARE_VERSION,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt
  };
  const serialized = JSON.stringify(payload);
  const compressed = compressToUint8Array(serialized);
  const encoded = bytesToBase64Url(compressed);
  const size = new TextEncoder().encode(encoded).length;
  if (size > MAX_SHARE_BYTES) {
    throw new Error('Share payload too large');
  }
  return encoded;
}
