export const DB_NAME = 'devpad';
export const DB_VERSION = 1;
export const NOTES_STORE = 'notes';
export const SETTINGS_STORE = 'settings';
export const SETTINGS_KEY_APP = 'app_settings';
export const DEBOUNCE_MS = 200;
export const MAX_SHARE_BYTES = 50000;
export const CURRENT_SHARE_VERSION = 1;
export const PBKDF2_ITERATIONS = 310000;
export const SALT_BYTES = 16;
export const IV_BYTES = 12;
export const AES_KEY_LENGTH = 256;
export const ERROR_DISPLAY_MS = 2000;
export const SAVE_MESSAGE_MS = 1200;
export const DEFAULT_SIDEBAR_WIDTH = 280;
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 420;
export const DEFAULT_PREVIEW_WIDTH = 420;
export const MIN_PREVIEW_WIDTH = 280;
export const MAX_PREVIEW_WIDTH = 760;
export const MIN_EDITOR_WIDTH = 360;
export const PANE_COLLAPSE_THRESHOLD = 140;
export const PANE_RESIZER_SIZE = 14;
export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_LINE_HEIGHT = 1.8;
export const DEFAULT_THEME: 'dark' | 'light' = 'dark';
export const DEFAULT_NOTE_TITLE = 'Untitled Note';
export const DEFAULT_NOTE_CONTENT = '';
export const STARTER_NOTE_TEMPLATE = `# My Basic Document

This is a simple paragraph. It contains some introductory text about the topic below.

## Key Points

- First important point
- Second important point
- Third important point

## Data Table

| Name  | Age | City   |
|-------|-----|--------|
| Alice | 25  | London |
| Bob   | 30  | Paris  |
| Carol | 28  | Berlin |

## Code Example

\`\`\`ts
function greet(name: string): string {
  return \`Hello, \${name}\`;
}

console.log(greet('DevPad'));
\`\`\`
`;
export const TITLE_MAX_LENGTH = 72;
export const SIDEBAR_NOTE_LIMIT = 120;
export const SHARE_HASH_PREFIX = '#share=';
export const NOTE_EXPORT_EXTENSION = '.md';
export const EXPORT_ALL_FILENAME = 'devpad-export.json';
export const EXPORT_NOTE_FILENAME = 'devpad-note';
export const ENCRYPTED_CONTENT_SEPARATOR = '.';
export const TAG_PATTERN = '#([A-Za-z0-9_-]+)';
export const EMPTY_STRING = '';
