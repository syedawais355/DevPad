import type { ShortcutId } from './definitions';

export interface ShortcutBinding {
  id: ShortcutId;
  combo: string;
  handler: () => void;
  enabled?: () => boolean;
  allowWhenInputFocused?: boolean;
}

interface ParsedCombo {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

function normalizeKey(value: string): string {
  const key = value.toLowerCase();
  switch (key) {
    case 'esc':
      return 'escape';
    case ' ':
      return 'space';
    default:
      return key;
  }
}

function parseCombo(combo: string): ParsedCombo {
  const tokens = combo.toLowerCase().split('+');
  const keyToken = tokens.at(-1);
  if (keyToken === undefined || keyToken.length === 0) {
    throw new Error(`invalid shortcut combo: ${combo}`);
  }

  return {
    key: normalizeKey(keyToken),
    mod: tokens.includes('mod'),
    ctrl: tokens.includes('ctrl'),
    meta: tokens.includes('meta'),
    alt: tokens.includes('alt') || tokens.includes('option'),
    shift: tokens.includes('shift')
  };
}

function eventMatchesCombo(event: KeyboardEvent, combo: ParsedCombo, isMac: boolean): boolean {
  const expectedCtrl = combo.ctrl || (!isMac && combo.mod);
  const expectedMeta = combo.meta || (isMac && combo.mod);
  if (event.ctrlKey !== expectedCtrl) {
    return false;
  }
  if (event.metaKey !== expectedMeta) {
    return false;
  }
  if (event.altKey !== combo.alt) {
    return false;
  }
  if (event.shiftKey !== combo.shift) {
    return false;
  }
  return normalizeKey(event.key) === combo.key;
}

export function isInputLikeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.closest('.cm-editor') !== null) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const input = target.closest('input, textarea, select');
  return input !== null;
}

export function setupShortcutSystem(
  targetWindow: Window,
  isMac: boolean,
  bindings: ShortcutBinding[]
): () => void {
  const parsedBindings = bindings.map((binding) => ({
    ...binding,
    parsed: parseCombo(binding.combo)
  }));

  const onKeyDown = (event: KeyboardEvent): void => {
    for (const binding of parsedBindings) {
      if (binding.enabled !== undefined && !binding.enabled()) {
        continue;
      }

      if (!binding.allowWhenInputFocused && isInputLikeTarget(event.target)) {
        continue;
      }

      if (!eventMatchesCombo(event, binding.parsed, isMac)) {
        continue;
      }

      event.preventDefault();
      binding.handler();
      return;
    }
  };

  targetWindow.addEventListener('keydown', onKeyDown);
  return () => {
    targetWindow.removeEventListener('keydown', onKeyDown);
  };
}
