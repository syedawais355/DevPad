import { decompressFromUint8Array } from 'lz-string';
import { CURRENT_SHARE_VERSION, SHARE_HASH_PREFIX } from '../constants';
import type { SharePayload } from '../types';

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isSharePayload(value: unknown): value is SharePayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === CURRENT_SHARE_VERSION &&
    typeof candidate.title === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.createdAt === 'number'
  );
}

export function decodeNote(hash: string): SharePayload | null {
  try {
    const raw = hash.startsWith(SHARE_HASH_PREFIX)
      ? hash.slice(SHARE_HASH_PREFIX.length)
      : hash.startsWith('#')
        ? hash.slice(1)
        : hash;
    if (raw.length === 0) {
      return null;
    }
    const compressed = base64UrlToBytes(raw);
    const serialized = decompressFromUint8Array(compressed);
    if (serialized === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(serialized);
    return isSharePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
