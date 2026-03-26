# DevPad

DevPad is a local-first developer notes app built with TypeScript and Vite. It combines Markdown authoring, live preview, encryption, share links, import/export workflows, and a production-grade keyboard interaction system.

## What DevPad Provides

| Capability | Details |
| --- | --- |
| Local-first persistence | Notes and app settings are stored in IndexedDB via `idb`. |
| Markdown + code editing | CodeMirror 6 editor with Markdown mode and developer-focused theme. |
| Live preview | Sanitized preview rendering with `marked` + `highlight.js`. |
| Autosave + explicit save | Debounced autosave while typing plus manual save/rename flow. |
| Secure notes | Optional per-note AES-GCM encryption with PBKDF2-derived keys. |
| Share links | Versioned, compressed URL hash payloads for note sharing. |
| Backup workflows | Export/import full note libraries through JSON files. |
| Keyboard-first UX | Command palette, navigation, editing, and app control shortcuts. |

## Keyboard Shortcut System

DevPad includes a full shortcut layer with browser-conflict prevention (`preventDefault`) and platform-aware modifier handling.

### Mac note

- On macOS, use `Cmd` where Windows/Linux uses `Ctrl`.
- On macOS, use `Option` where Windows/Linux uses `Alt`.
- `Ctrl+/` on Windows/Linux is `Cmd+/` on Mac, and opens the shortcuts help modal.

### Core shortcuts

| Action | Windows/Linux | Mac |
| --- | --- | --- |
| Save note | `Ctrl+S` | `Cmd+S` |
| New note | `Ctrl+N` | `Cmd+N` |
| Focus sidebar | `Ctrl+O` | `Cmd+O` |
| Close current note tab | `Ctrl+W` | `Cmd+W` |
| Delete current note | `Ctrl+D` | `Cmd+D` |

### Navigation shortcuts

| Action | Windows/Linux | Mac |
| --- | --- | --- |
| Open command palette | `Ctrl+P` | `Cmd+P` |
| Find in note | `Ctrl+F` | `Cmd+F` |
| Next search result | `Ctrl+G` | `Cmd+G` |
| Previous search result | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Next note | `Alt+Down` or `Ctrl+Tab` | `Option+Down` or `Cmd+Tab` |
| Previous note | `Alt+Up` or `Ctrl+Shift+Tab` | `Option+Up` or `Cmd+Shift+Tab` |

### Editing shortcuts

| Action | Windows/Linux | Mac |
| --- | --- | --- |
| Bold | `Ctrl+B` | `Cmd+B` |
| Italic | `Ctrl+I` | `Cmd+I` |
| Underline | `Ctrl+U` | `Cmd+U` |
| Redo | `Ctrl+Y` or `Ctrl+Shift+Z` | `Cmd+Y` or `Cmd+Shift+Z` |
| Delete line | `Ctrl+Shift+K` | `Cmd+Shift+K` |
| Move line up/down | `Alt+Shift+Up/Down` | `Option+Shift+Up/Down` |
| Insert link | `Ctrl+K` | `Cmd+K` |

### Power and organization shortcuts

| Action | Windows/Linux | Mac |
| --- | --- | --- |
| Save As / Export flow | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Export flow | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Edit note title | `Ctrl+E` | `Cmd+E` |
| Global search (all notes) | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Reopen last closed note | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Add hashtag at cursor | `Ctrl+T` | `Cmd+T` |
| Import notes from file | `Ctrl+Shift+I` | `Cmd+Shift+I` |

### App/UI shortcuts

| Action | Windows/Linux | Mac |
| --- | --- | --- |
| Show shortcuts help | `Ctrl+/` | `Cmd+/` |
| Open settings | `Ctrl+,` | `Cmd+,` |
| Toggle dark/light theme | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Toggle fullscreen | `F11` | `F11` |

## Command Palette

`Ctrl+P` / `Cmd+P` opens a command palette that supports:

- Jumping directly to notes
- Creating notes
- Saving current note
- Opening settings
- Export and import actions
- Theme toggle
- Shortcut help access

## Feature Details

### Writing flow

- Debounced autosave (`200ms`) from editor change events.
- Starter template for empty notes, cleared on first intentional input.
- Save flow rewrites/normalizes first heading to keep title and document aligned.
- Tag extraction from hashtags (`#tag_name`) with deduped lowercase storage.
- Live word count in status bar.

### Data management

- Notes sorted by `updatedAt` descending.
- `Export all notes` emits `devpad-export.json` including `version`, `settings`, `notes`.
- `Import notes from file` validates/normalizes entries and applies settings when present.
- Clear-data action wipes both notes/settings stores and recreates a clean note.

### Sharing

- Share payloads are compressed and encoded into URL hash (`#share=...`).
- Opening a share URL enters guest mode with Import/Dismiss controls.
- Guest note import creates a local note and clears share hash from URL.

### Security

| Area | Implementation |
| --- | --- |
| Cipher | AES-GCM (`256-bit`) |
| KDF | PBKDF2-SHA256 (`310000` iterations) |
| Salt size | 16 bytes |
| IV size | 12 bytes |
| Key storage | Not persisted; session-only while note is unlocked |
| Preview protection | Allowlist sanitizer for tags and safe link schemes |

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/app.ts` | Main orchestration: notes, UI state, shortcuts, modal flows, encryption, import/export. |
| `src/editor/*` | CodeMirror setup, debounce, and editor theme. |
| `src/preview/render.ts` | Markdown-to-DOM rendering with syntax highlighting and sanitization. |
| `src/store/*` | IndexedDB schema and note CRUD helpers. |
| `src/crypto/*` | PBKDF2 key derivation and AES-GCM encryption/decryption. |
| `src/share/*` | Share payload encoding and decoding. |
| `src/import/files.ts` | Backup JSON parser and normalizer. |
| `src/export/files.ts` | Markdown/HTML/PDF export flows. |
| `src/shortcuts/*` | Shortcut definitions and keyboard event system. |
| `src/ui/*` | Sidebar, status bar, settings, command palette, and modal UIs. |
| `src/help.ts` | Help-page renderer. |

## Stack

- TypeScript (strict)
- Vite 5
- Vitest + JSDOM
- ESLint (`typescript-eslint`)
- CodeMirror 6
- `marked`
- `highlight.js`
- `idb`
- `lz-string`

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Run

```bash
npm install
npm run dev
```

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run lint` | Lint all source/tests with zero warnings. |
| `npm test` | Run all unit tests once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run build` | Type-check and produce production build. |
| `npm run preview` | Preview production build locally. |
| `npm run verify:preview` | Validate preview routes/assets. |
| `npm run validate:local` | Full local validation pipeline. |

## Test Coverage

| Test file | Focus |
| --- | --- |
| `tests/crypto.test.ts` | Encryption/decryption and salt generation behavior. |
| `tests/db.test.ts` | IndexedDB stores and indexes. |
| `tests/notes.test.ts` | Note CRUD and sorting. |
| `tests/share.test.ts` | Share payload encode/decode + limits. |
| `tests/export.test.ts` | Export output correctness and sanitization expectations. |
| `tests/import.test.ts` | Backup import parsing and validation. |
| `tests/settings.test.ts` | Settings save and import callback wiring. |
| `tests/statusbar.test.ts` | Status bar callback wiring. |
| `tests/sidebar.test.ts` | Sidebar rendering behavior. |
| `tests/exportflow.test.ts` | Export modal option callback behavior. |
| `tests/landing.test.ts` | Landing content rendering. |
| `tests/commandpalette.test.ts` | Command palette filtering and keyboard interaction. |
| `tests/shortcuts.definitions.test.ts` | Shortcut catalog and platform label formatting. |
| `tests/shortcuts.system.test.ts` | Keyboard matching engine behavior and input-scope guards. |
| `tests/shortcutshelp.test.ts` | Shortcut help modal rendering and close behavior. |

## Deployment Notes

- Base path is configured for GitHub Pages-style hosting: `/DevPad/`.
- Multi-entry build includes:
- Main app: `index.html`
- Help app: `help/index.html`
- Static SEO assets are in `public/` (`robots.txt`, `sitemap.xml`).

## License

MIT. See [LICENSE](./LICENSE).
