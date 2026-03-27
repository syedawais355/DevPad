export type ShortcutCategory = 'Core' | 'Navigation' | 'Editing' | 'Power' | 'Organization' | 'UI';

export type ShortcutId =
  | 'save_note'
  | 'new_note'
  | 'focus_sidebar'
  | 'close_note'
  | 'delete_note'
  | 'command_palette'
  | 'find_in_note'
  | 'find_next'
  | 'find_previous'
  | 'next_note'
  | 'previous_note'
  | 'next_note_tab'
  | 'previous_note_tab'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'redo'
  | 'delete_line'
  | 'move_line_up'
  | 'move_line_down'
  | 'insert_link'
  | 'save_as_export'
  | 'export_note'
  | 'edit_note_title'
  | 'global_search'
  | 'reopen_closed_note'
  | 'add_tag'
  | 'import_backup'
  | 'open_shortcuts_help'
  | 'open_settings'
  | 'toggle_theme'
  | 'toggle_fullscreen'
  | 'undo';

export interface ShortcutDefinition {
  id: ShortcutId;
  category: ShortcutCategory;
  combo: string;
  description: string;
}

const TOKEN_DISPLAY = {
  arrowup: 'Up',
  arrowdown: 'Down',
  tab: 'Tab',
  f11: 'F11',
  ',': ',',
  '/': '/',
  mod_windows: 'Ctrl',
  mod_mac: 'Cmd',
  alt_windows: 'Alt',
  alt_mac: 'Option',
  shift: 'Shift'
} as const;

function displayToken(token: string, isMac: boolean): string {
  if (token === 'mod') {
    return isMac ? TOKEN_DISPLAY.mod_mac : TOKEN_DISPLAY.mod_windows;
  }
  if (token === 'alt') {
    return isMac ? TOKEN_DISPLAY.alt_mac : TOKEN_DISPLAY.alt_windows;
  }
  if (token === 'shift') {
    return TOKEN_DISPLAY.shift;
  }
  const normalized = token.toLowerCase();
  if (normalized in TOKEN_DISPLAY) {
    return TOKEN_DISPLAY[normalized as keyof typeof TOKEN_DISPLAY];
  }
  return token.length === 1 ? token.toUpperCase() : token[0].toUpperCase() + token.slice(1).toLowerCase();
}

export function formatShortcut(combo: string, isMac: boolean): string {
  return combo.split('+').map((token) => displayToken(token, isMac)).join(' + ');
}

export function isMacPlatform(platform: string | undefined): boolean {
  if (platform === undefined) {
    return false;
  }
  return /mac|iphone|ipad|ipod/iu.test(platform);
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: 'save_note', category: 'Core', combo: 'mod+s', description: 'Save note' },
  { id: 'new_note', category: 'Core', combo: 'mod+n', description: 'Create note' },
  { id: 'focus_sidebar', category: 'Core', combo: 'mod+o', description: 'Focus notes sidebar' },
  { id: 'close_note', category: 'Core', combo: 'mod+w', description: 'Close current note tab' },
  { id: 'delete_note', category: 'Core', combo: 'mod+d', description: 'Delete current note' },

  { id: 'command_palette', category: 'Navigation', combo: 'mod+p', description: 'Open command palette' },
  { id: 'find_in_note', category: 'Navigation', combo: 'mod+f', description: 'Find in current note' },
  { id: 'find_next', category: 'Navigation', combo: 'mod+g', description: 'Find next match' },
  { id: 'find_previous', category: 'Navigation', combo: 'mod+shift+g', description: 'Find previous match' },
  { id: 'next_note', category: 'Navigation', combo: 'alt+arrowdown', description: 'Switch to next note' },
  { id: 'previous_note', category: 'Navigation', combo: 'alt+arrowup', description: 'Switch to previous note' },
  { id: 'next_note_tab', category: 'Navigation', combo: 'mod+tab', description: 'Next note (tab cycle)' },
  { id: 'previous_note_tab', category: 'Navigation', combo: 'mod+shift+tab', description: 'Previous note (tab cycle)' },

  { id: 'bold', category: 'Editing', combo: 'mod+b', description: 'Bold selection' },
  { id: 'italic', category: 'Editing', combo: 'mod+i', description: 'Italic selection' },
  { id: 'underline', category: 'Editing', combo: 'mod+u', description: 'Underline selection' },
  { id: 'undo', category: 'Editing', combo: 'mod+z', description: 'Undo' },
  { id: 'redo', category: 'Editing', combo: 'mod+y', description: 'Redo' },
  { id: 'delete_line', category: 'Editing', combo: 'mod+shift+k', description: 'Delete line' },
  { id: 'move_line_up', category: 'Editing', combo: 'alt+shift+arrowup', description: 'Move line up' },
  { id: 'move_line_down', category: 'Editing', combo: 'alt+shift+arrowdown', description: 'Move line down' },
  { id: 'insert_link', category: 'Editing', combo: 'mod+k', description: 'Insert markdown link' },

  { id: 'save_as_export', category: 'Power', combo: 'mod+shift+s', description: 'Save As / Export note' },
  { id: 'export_note', category: 'Power', combo: 'mod+shift+e', description: 'Open export flow' },
  { id: 'edit_note_title', category: 'Power', combo: 'mod+e', description: 'Edit note title' },
  { id: 'global_search', category: 'Power', combo: 'mod+shift+f', description: 'Search across notes' },
  { id: 'reopen_closed_note', category: 'Power', combo: 'mod+shift+t', description: 'Reopen last closed note' },

  { id: 'add_tag', category: 'Organization', combo: 'mod+t', description: 'Add hashtag at cursor' },
  { id: 'import_backup', category: 'Organization', combo: 'mod+shift+i', description: 'Import notes from file' },

  { id: 'open_shortcuts_help', category: 'UI', combo: 'mod+/', description: 'Show keyboard shortcuts' },
  { id: 'open_settings', category: 'UI', combo: 'mod+,', description: 'Open settings' },
  { id: 'toggle_theme', category: 'UI', combo: 'mod+shift+l', description: 'Toggle dark / light theme' },
  { id: 'toggle_fullscreen', category: 'UI', combo: 'f11', description: 'Toggle fullscreen' }
];

export function getShortcutDefinition(id: ShortcutId): ShortcutDefinition {
  const found = SHORTCUT_DEFINITIONS.find((shortcut) => shortcut.id === id);
  if (found === undefined) {
    throw new Error(`unknown shortcut id: ${id}`);
  }
  return found;
}
