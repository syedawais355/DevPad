# DevPad

DevPad is a browser-only developer notepad for Markdown notes, code snippets, private drafting, and shareable documents. It is fully local-first: notes and settings live in IndexedDB, there is no backend API, and optional encryption is handled in the browser with Web Crypto.

## At A Glance

| Area | Implementation |
| --- | --- |
| Runtime | Static web app (Vite) |
| Storage | IndexedDB via `idb` |
| Editor | CodeMirror 6 |
| Preview | `marked` + `highlight.js` + custom sanitizer |
| Sharing | Compressed URL hash payloads (`lz-string`) |
| Encryption | PBKDF2 + AES-GCM (Web Crypto API) |
| Build outputs | Main app (`/`) + Help app (`/help/`) |

## Feature Overview

### Writing and editing

| Feature | Details |
| --- | --- |
| Markdown editor | CodeMirror 6 with Markdown mode and a custom theme. |
| Starter template | New/empty notes show a starter markdown template until first input. |
| Autosave | Debounced persistence (`200ms`) updates the active note continuously. |
| Manual save flow | `Save` prompts for a title and updates the top heading (`# Title`) to keep content/title aligned. |
| Title derivation | Sidebar/export/share titles are derived from the first meaningful line when needed. |
| Tag extraction | Hashtags like `#release` are extracted into normalized lowercased tags. |
| Word count | Status bar live-updates word count while typing. |

### Workspace and UI

| Feature | Details |
| --- | --- |
| Notes sidebar | Create/select/delete notes, open Help, and open Settings. |
| Note ordering | Notes are shown by `updatedAt` descending. |
| Pane resizing | Sidebar and preview widths are draggable with min/max constraints. |
| Quick collapse | Double-click pane resizers to collapse/restore sidebar or preview. |
| Appearance settings | Theme (`dark/light`), editor font size, and line height are configurable. |
| Save/error feedback | Status bar shows transient `saved` and error/info messages. |

### Sharing, export, and import

| Feature | Details |
| --- | --- |
| Share link generation | `Share` encodes note payload into URL hash (`#share=...`). |
| Share payload guards | Versioned payload schema with size limit (`MAX_SHARE_BYTES = 50000`). |
| Guest mode | Opening a share link loads note content as guest payload with Import/Dismiss actions. |
| Single note export | Export current note as Markdown (`.md`), styled HTML (`.html`), or PDF print flow (`.pdf`). |
| HTML/PDF export safety | Exported HTML is rendered through the same sanitized markdown pipeline. |
| Full backup export | Settings can export all notes + settings to `devpad-export.json`. |
| Full backup import | Settings can import a JSON backup, normalize records, upsert notes, and apply settings when present. |

### Security and privacy

| Feature | Details |
| --- | --- |
| Optional note encryption | Per-note encryption toggle in status bar. |
| KDF | PBKDF2-SHA256 with `310000` iterations and 16-byte random salt. |
| Cipher | AES-GCM with 256-bit key and 12-byte IV. |
| Key handling | Derived keys are not persisted; unlock sessions are memory-only per runtime. |
| Encrypted storage format | Stored as `base64(salt).base64(iv+ciphertext)` in note `content`. |
| Preview sanitization | DOM allowlist sanitizer removes unsafe HTML and blocks unsafe links. |
| Allowed link schemes | `http:`, `https:`, `mailto:`, `#...` only. |
| No backend storage | Notes stay local unless user explicitly exports or shares. |

## Markdown Rendering Details

- GFM and line breaks are enabled via `marked`.
- Syntax highlighting is enabled for: `javascript`, `typescript`, `json`, `markdown`, `html`, `css`, `bash`.
- Rendered output is sanitized with a strict tag allowlist before DOM insertion.

## Data Model

### Note

| Field | Type |
| --- | --- |
| `id` | `string` |
| `title` | `string` |
| `content` | `string` |
| `createdAt` | `number` (epoch ms) |
| `updatedAt` | `number` (epoch ms) |
| `encrypted` | `boolean` |
| `tags` | `string[]` |

### App settings

| Field | Type |
| --- | --- |
| `theme` | `'dark' \| 'light'` |
| `fontSize` | `number` |
| `lineHeight` | `number` |

### Full backup format

```json
{
  "version": 1,
  "settings": {
    "theme": "dark",
    "fontSize": 13,
    "lineHeight": 1.8
  },
  "notes": [
    {
      "id": "uuid",
      "title": "Example",
      "content": "# Example",
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000,
      "encrypted": false,
      "tags": ["example"]
    }
  ]
}
```

Import behavior:

- Ignores invalid note entries.
- Requires at least one valid note in the file.
- Normalizes missing/invalid fields with safe defaults.
- Applies imported settings only when a valid settings object is present.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/main.ts` | Main app entry and global styles. |
| `src/app.ts` | Application orchestration (notes, editor state, settings, sharing, encryption, import/export). |
| `src/help.ts` | Standalone help page renderer. |
| `src/store/db.ts` | IndexedDB schema setup and versioning. |
| `src/store/notes.ts` | Note CRUD and sorting helpers. |
| `src/editor/*` | CodeMirror setup, debounce, and editor theme. |
| `src/preview/render.ts` | Markdown rendering, syntax highlight integration, and sanitization. |
| `src/share/*` | Hash payload encode/decode and validation. |
| `src/crypto/*` | Key derivation and AES-GCM encryption/decryption. |
| `src/export/files.ts` | Note export to Markdown/HTML/PDF flows. |
| `src/import/files.ts` | Backup JSON parsing, validation, and normalization. |
| `src/ui/*` | Sidebar, status bar, settings, export modal, share modal, landing, guest banner. |
| `tests/*.test.ts` | Unit tests for core flows and UI modules. |

## Tech Stack

- TypeScript (strict mode)
- Vite 5
- Vitest + JSDOM
- ESLint + `typescript-eslint`
- CodeMirror 6
- `marked`
- `highlight.js`
- `idb`
- `lz-string`

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
npm install
npm run dev
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run local dev server. |
| `npm run lint` | Run ESLint with zero warnings allowed. |
| `npm test` | Run all Vitest tests once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run build` | Type-check and produce production build. |
| `npm run preview` | Preview production build. |
| `npm run preview:ci` | Preview on fixed host/port for CI checks. |
| `npm run verify:preview` | Smoke-check built preview routes/assets. |
| `npm run validate:local` | Full local quality pipeline (`lint + test + build + preview verify`). |

## Testing Coverage

| Test file | Focus |
| --- | --- |
| `tests/crypto.test.ts` | Encryption/decryption behavior and salt generation. |
| `tests/db.test.ts` | IndexedDB stores and indexes. |
| `tests/notes.test.ts` | Note CRUD and sort order. |
| `tests/share.test.ts` | Share encode/decode and size limits. |
| `tests/export.test.ts` | Markdown/HTML/PDF export flows and sanitization expectations. |
| `tests/import.test.ts` | Backup import parsing, normalization, and error paths. |
| `tests/settings.test.ts` | Settings save and import-file callback wiring. |
| `tests/statusbar.test.ts` | Status bar action callback wiring. |
| `tests/sidebar.test.ts` | Sidebar Help link rendering. |
| `tests/exportflow.test.ts` | Export format selection callback behavior. |
| `tests/landing.test.ts` | Landing hero and guide-link rendering. |

## Deployment Notes

- Build is configured for repository base path: `/DevPad/`.
- Multi-page build output includes the main app (`index.html`) and help page (`help/index.html`).
- Vite chunking separates editor/preview/vendor bundles for cache-friendly output.
- Project includes static SEO helpers in `public/` (`robots.txt`, `sitemap.xml`).

## Current Constraints

- No account system or multi-device sync.
- No collaborative editing.
- No full-text search yet.
- No backend persistence by design.

## License

MIT. See [LICENSE](./LICENSE).
