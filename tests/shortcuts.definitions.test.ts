import { describe, expect, it } from 'vitest';
import { formatShortcut, isMacPlatform, SHORTCUT_DEFINITIONS } from '../src/shortcuts/definitions';

describe('shortcut definitions', () => {
  it('contains core production shortcuts', () => {
    const ids = new Set(SHORTCUT_DEFINITIONS.map((shortcut) => shortcut.id));

    expect(ids.has('save_note')).toBe(true);
    expect(ids.has('new_note')).toBe(true);
    expect(ids.has('command_palette')).toBe(true);
    expect(ids.has('open_shortcuts_help')).toBe(true);
    expect(ids.has('open_settings')).toBe(true);
  });

  it('formats labels for windows and mac', () => {
    expect(formatShortcut('mod+shift+s', false)).toBe('Ctrl + Shift + S');
    expect(formatShortcut('mod+shift+s', true)).toBe('Cmd + Shift + S');
    expect(formatShortcut('alt+arrowdown', true)).toBe('Option + Down');
  });

  it('detects mac platforms safely', () => {
    expect(isMacPlatform('MacIntel')).toBe(true);
    expect(isMacPlatform('Win32')).toBe(false);
    expect(isMacPlatform(undefined)).toBe(false);
  });
});
