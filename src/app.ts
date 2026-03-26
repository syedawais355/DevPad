import {
  CURRENT_SHARE_VERSION,
  DEFAULT_PREVIEW_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_NOTE_CONTENT,
  DEFAULT_NOTE_TITLE,
  DEFAULT_THEME,
  EMPTY_STRING,
  ENCRYPTED_CONTENT_SEPARATOR,
  EXPORT_ALL_FILENAME,
  MAX_PREVIEW_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_EDITOR_WIDTH,
  MIN_PREVIEW_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NOTES_STORE,
  PANE_COLLAPSE_THRESHOLD,
  PANE_RESIZER_SIZE,
  SETTINGS_KEY_APP,
  SETTINGS_STORE,
  SHARE_HASH_PREFIX,
  STARTER_NOTE_TEMPLATE,
  TAG_PATTERN,
  TITLE_MAX_LENGTH
} from './constants';
import { decrypt, encrypt } from './crypto/aes';
import { deriveKey, generateSalt } from './crypto/keys';
import { exportNote, type ExportFormat } from './export/files';
import {
  createEditor,
  getContent
} from './editor/setup';
import { parseNotesArchive } from './import/files';
import { renderMarkdownPreview } from './preview/render';
import { decodeNote } from './share/decode';
import { encodeNote } from './share/encode';
import { openDB } from './store/db';
import { deleteNote, getNotes, saveNote } from './store/notes';
import type { AppSettings, Note, SharePayload } from './types';
import { renderExportflow } from './ui/exportflow';
import { renderGuestBanner } from './ui/guestbanner';
import { renderLanding } from './ui/landing';
import { renderSettings } from './ui/settings';
import { renderShareflow } from './ui/shareflow';
import { renderSidebar } from './ui/sidebar';
import { renderStatusbar, type StatusbarElement } from './ui/statusbar';

interface SettingsRecord {
  key: string;
  value: AppSettings;
}

interface EncryptionSession {
  key: CryptoKey;
  salt: Uint8Array;
}

interface PaneLayout {
  sidebar: number;
  preview: number;
}

const defaultSettings: AppSettings = {
  theme: DEFAULT_THEME,
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = EMPTY_STRING;
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function serializeEncryptedContent(salt: Uint8Array, ciphertext: string): string {
  return `${bytesToBase64(salt)}${ENCRYPTED_CONTENT_SEPARATOR}${ciphertext}`;
}

function parseEncryptedContent(content: string): { salt: Uint8Array; ciphertext: string } | null {
  const separatorIndex = content.indexOf(ENCRYPTED_CONTENT_SEPARATOR);
  if (separatorIndex < 0) {
    return null;
  }
  const saltValue = content.slice(0, separatorIndex);
  const ciphertext = content.slice(separatorIndex + ENCRYPTED_CONTENT_SEPARATOR.length);
  if (saltValue.length === 0 || ciphertext.length === 0) {
    return null;
  }
  return {
    salt: base64ToBytes(saltValue),
    ciphertext
  };
}

function deriveTitle(content: string): string {
  const firstLine = content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (firstLine === undefined) {
    return DEFAULT_NOTE_TITLE;
  }
  const normalized = firstLine.replace(/^[#>*\-\d.\s]+/u, EMPTY_STRING).trim();
  if (normalized.length === 0) {
    return DEFAULT_NOTE_TITLE;
  }
  return normalized.slice(0, TITLE_MAX_LENGTH);
}

function deriveTags(content: string): string[] {
  const matches = [...content.matchAll(new RegExp(TAG_PATTERN, 'gu'))];
  return [...new Set(matches.map((match) => match[1].toLowerCase()))];
}

function normalizeTitle(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return DEFAULT_NOTE_TITLE;
  }
  return trimmed.slice(0, TITLE_MAX_LENGTH);
}

function applyTitleToContent(content: string, title: string): string {
  const lines = content.split(/\r?\n/u);
  const firstContentLineIndex = lines.findIndex((line) => line.trim().length > 0);
  const heading = `# ${normalizeTitle(title)}`;

  if (firstContentLineIndex < 0) {
    return `${heading}\n`;
  }

  if (/^#{1,6}\s+/u.test(lines[firstContentLineIndex].trim())) {
    const nextLines = [...lines];
    nextLines[firstContentLineIndex] = heading;
    return nextLines.join('\n');
  }

  const body = content.trim().length === 0 ? EMPTY_STRING : content.trimStart();
  return body.length === 0 ? `${heading}\n` : `${heading}\n\n${body}`;
}

function countWords(content: string): number {
  const words = content.trim().split(/\s+/u).filter((word) => word.length > 0);
  return words.length;
}

function download(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function loadSettings(): Promise<AppSettings> {
  const database = await openDB();
  const record = await database.get(SETTINGS_STORE, SETTINGS_KEY_APP) as SettingsRecord | undefined;
  if (record === undefined) {
    return defaultSettings;
  }
  return {
    ...defaultSettings,
    ...record.value
  };
}

async function saveSettingsRecord(settings: AppSettings): Promise<void> {
  const database = await openDB();
  const record: SettingsRecord = {
    key: SETTINGS_KEY_APP,
    value: settings
  };
  await database.put(SETTINGS_STORE, record);
}

async function clearAllData(): Promise<void> {
  const database = await openDB();
  await database.clear(NOTES_STORE);
  await database.clear(SETTINGS_STORE);
}

function createEmptyNote(timestamp: number): Note {
  return {
    id: crypto.randomUUID(),
    title: DEFAULT_NOTE_TITLE,
    content: DEFAULT_NOTE_CONTENT,
    createdAt: timestamp,
    updatedAt: timestamp,
    encrypted: false,
    tags: []
  };
}

export function mountApp(root: HTMLElement): void {
  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const sidebarHost = document.createElement('div');
  sidebarHost.className = 'sidebar-shell';

  const sidebarResizer = document.createElement('button');
  sidebarResizer.className = 'pane-resizer pane-resizer--sidebar';
  sidebarResizer.type = 'button';
  sidebarResizer.title = 'Resize sidebar';
  sidebarResizer.setAttribute('aria-label', 'Resize notes sidebar');

  const main = document.createElement('main');
  main.className = 'app-main';
  main.setAttribute('aria-label', 'DevPad workspace');

  const guestBannerHost = document.createElement('div');
  const landingHost = document.createElement('div');

  const workspace = document.createElement('div');
  workspace.className = 'workspace';
  workspace.id = 'editor-workspace';

  const editorColumn = document.createElement('section');
  editorColumn.className = 'editor-column';
  editorColumn.setAttribute('aria-label', 'Markdown editor area');

  const editorFrame = document.createElement('div');
  editorFrame.className = 'editor-frame';

  const previewColumn = document.createElement('section');
  previewColumn.className = 'preview-column';
  previewColumn.setAttribute('aria-label', 'Markdown preview');

  const previewResizer = document.createElement('button');
  previewResizer.className = 'pane-resizer pane-resizer--preview';
  previewResizer.type = 'button';
  previewResizer.title = 'Resize preview';
  previewResizer.setAttribute('aria-label', 'Resize markdown preview panel');

  const preview = document.createElement('div');
  preview.className = 'preview';

  const statusbarHost = document.createElement('div');

  previewColumn.append(preview);
  editorColumn.append(editorFrame, statusbarHost);
  workspace.append(editorColumn, previewResizer, previewColumn);
  main.append(landingHost, guestBannerHost, workspace);
  shell.append(sidebarHost, sidebarResizer, main);
  root.replaceChildren(shell);

  let settings = defaultSettings;
  let notes: Note[] = [];
  let activeNoteId: string | null = null;
  let guestPayload: SharePayload | null = null;
  let statusbar: StatusbarElement | null = null;
  let settingsModal: HTMLElement | null = null;
  let shareModal: HTMLElement | null = null;
  let exportModal: HTMLElement | null = null;
  let isStarterTemplateVisible = false;
  let isHydrating = false;
  let paneLayout: PaneLayout = {
    sidebar: DEFAULT_SIDEBAR_WIDTH,
    preview: DEFAULT_PREVIEW_WIDTH
  };
  const rememberedPaneLayout: PaneLayout = {
    sidebar: DEFAULT_SIDEBAR_WIDTH,
    preview: DEFAULT_PREVIEW_WIDTH
  };
  const unlockedNotes = new Map<string, EncryptionSession>();
  landingHost.replaceChildren(renderLanding());

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function getShellWidth(): number {
    return shell.getBoundingClientRect().width;
  }

  function getWorkspaceWidth(): number {
    return workspace.getBoundingClientRect().width;
  }

  function constrainSidebarWidth(width: number): number {
    const max = Math.max(
      0,
      Math.min(
        MAX_SIDEBAR_WIDTH,
        getShellWidth() - MIN_EDITOR_WIDTH - PANE_RESIZER_SIZE
      )
    );
    if (max === 0) {
      return 0;
    }
    if (width < PANE_COLLAPSE_THRESHOLD) {
      return 0;
    }
    return clamp(width, Math.min(MIN_SIDEBAR_WIDTH, max), max);
  }

  function constrainPreviewWidth(width: number): number {
    const max = Math.max(
      0,
      Math.min(
        MAX_PREVIEW_WIDTH,
        getWorkspaceWidth() - MIN_EDITOR_WIDTH - PANE_RESIZER_SIZE
      )
    );
    if (max === 0) {
      return 0;
    }
    if (width < PANE_COLLAPSE_THRESHOLD) {
      return 0;
    }
    return clamp(width, Math.min(MIN_PREVIEW_WIDTH, max), max);
  }

  function applyPaneLayout(): void {
    root.style.setProperty('--sidebar-width', `${paneLayout.sidebar}px`);
    root.style.setProperty('--preview-width', `${paneLayout.preview}px`);
    root.style.setProperty('--pane-resizer-size', `${PANE_RESIZER_SIZE}px`);
    root.style.setProperty('--editor-min-width', `${MIN_EDITOR_WIDTH}px`);

    sidebarHost.style.width = `${paneLayout.sidebar}px`;
    previewColumn.style.width = `${paneLayout.preview}px`;

    sidebarHost.dataset.collapsed = String(paneLayout.sidebar === 0);
    previewColumn.dataset.collapsed = String(paneLayout.preview === 0);
    sidebarResizer.dataset.collapsed = String(paneLayout.sidebar === 0);
    previewResizer.dataset.collapsed = String(paneLayout.preview === 0);
  }

  function setStarterTemplateVisible(value: boolean): void {
    isStarterTemplateVisible = value;
    editorColumn.dataset.starter = String(value);
    preview.dataset.starter = String(value);
  }

  function toggleSidebarPane(): void {
    if (paneLayout.sidebar === 0) {
      paneLayout.sidebar = constrainSidebarWidth(rememberedPaneLayout.sidebar);
    } else {
      rememberedPaneLayout.sidebar = paneLayout.sidebar;
      paneLayout.sidebar = 0;
    }
    applyPaneLayout();
  }

  function togglePreviewPane(): void {
    if (paneLayout.preview === 0) {
      paneLayout.preview = constrainPreviewWidth(rememberedPaneLayout.preview);
    } else {
      rememberedPaneLayout.preview = paneLayout.preview;
      paneLayout.preview = 0;
    }
    applyPaneLayout();
  }

  function bindHorizontalResize(
    handle: HTMLButtonElement,
    getStartWidth: () => number,
    getNextWidth: (startWidth: number, deltaX: number) => number
  ): void {
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = getStartWidth();
      const move = (moveEvent: PointerEvent): void => {
        const deltaX = moveEvent.clientX - startX;
        const nextWidth = getNextWidth(startWidth, deltaX);
        handle.dataset.dragging = 'true';
        if (handle === sidebarResizer) {
          paneLayout.sidebar = nextWidth;
          if (nextWidth > 0) {
            rememberedPaneLayout.sidebar = nextWidth;
          }
        } else {
          paneLayout.preview = nextWidth;
          if (nextWidth > 0) {
            rememberedPaneLayout.preview = nextWidth;
          }
        }
        applyPaneLayout();
      };

      const stop = (): void => {
        handle.dataset.dragging = 'false';
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    });
  }

  function closeShareModal(): void {
    if (shareModal !== null) {
      shareModal.remove();
      shareModal = null;
    }
  }

  function closeExportModal(): void {
    if (exportModal !== null) {
      exportModal.remove();
      exportModal = null;
    }
  }

  function closeSettingsModal(): void {
    if (settingsModal !== null) {
      settingsModal.remove();
      settingsModal = null;
    }
  }

  function updateStatusbarWordCount(content: string): void {
    if (statusbar === null) {
      return;
    }
    const target = statusbar.querySelector('.statusbar__words');
    if (target instanceof HTMLElement) {
      target.textContent = `${countWords(content)} words`;
    }
  }

  function getEditorDocumentContent(): string {
    return getContent(editorView);
  }

  function getCurrentContent(): string {
    return isStarterTemplateVisible ? EMPTY_STRING : getEditorDocumentContent();
  }

  function getPreviewContent(): string {
    return isStarterTemplateVisible ? STARTER_NOTE_TEMPLATE : getEditorDocumentContent();
  }

  function getCurrentTitle(content: string): string {
    if (guestPayload !== null && guestPayload.title.trim().length > 0) {
      return guestPayload.title;
    }
    const activeTitle = notes.find((note) => note.id === activeNoteId)?.title;
    if (activeTitle !== undefined && activeTitle.trim().length > 0) {
      return activeTitle;
    }
    return deriveTitle(content);
  }

  function applyAppearance(): void {
    editorView.dom.style.fontSize = `${settings.fontSize}px`;
    editorView.dom.style.lineHeight = String(settings.lineHeight);
    preview.style.fontSize = `${settings.fontSize + 2}px`;
    preview.style.lineHeight = String(settings.lineHeight + 0.35);

    if (settings.theme === 'light') {
      root.style.setProperty('--bg', '#f4efe7');
      root.style.setProperty('--panel', '#ffffff');
      root.style.setProperty('--sidebar', '#f0e8da');
      root.style.setProperty('--text', 'rgba(20, 20, 20, 0.92)');
      root.style.setProperty('--text-muted', 'rgba(20, 20, 20, 0.55)');
      root.style.setProperty('--text-soft', 'rgba(20, 20, 20, 0.2)');
      root.style.setProperty('--border', 'rgba(20, 20, 20, 0.08)');
      root.style.setProperty('--border-soft', 'rgba(20, 20, 20, 0.06)');
    } else {
      root.style.removeProperty('--bg');
      root.style.removeProperty('--panel');
      root.style.removeProperty('--sidebar');
      root.style.removeProperty('--text');
      root.style.removeProperty('--text-muted');
      root.style.removeProperty('--text-soft');
      root.style.removeProperty('--border');
      root.style.removeProperty('--border-soft');
    }

    applyPaneLayout();
  }

  function renderSidebarList(): void {
    const sidebar = renderSidebar(notes, guestPayload === null ? activeNoteId : null, {
      onSelect(id: string): void {
        void selectNote(id);
      },
      onCreate(): void {
        void createNote();
      },
      onDelete(id: string): void {
        void removeNote(id);
      },
      onOpenSettings(): void {
        openSettingsModal();
      }
    });
    sidebarHost.replaceChildren(sidebar);
  }

  function renderGuestBannerState(): void {
    if (guestPayload === null) {
      guestBannerHost.replaceChildren();
      return;
    }
    guestBannerHost.replaceChildren(
      renderGuestBanner(guestPayload.title, {
        onImport(): void {
          void importGuestNote();
        },
        onDismiss(): void {
          dismissGuestNote();
        }
      })
    );
  }

  function refreshPreviewAndStatus(): void {
    renderMarkdownPreview(preview, getPreviewContent());
    updateStatusbarWordCount(getCurrentContent());
  }

  function setEditorDocument(content: string): void {
    setStarterTemplateVisible(content.length === 0);
    isHydrating = true;
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content.length === 0 ? STARTER_NOTE_TEMPLATE : content
      }
    });
    isHydrating = false;
    refreshPreviewAndStatus();
  }

  async function persistCurrentNote(content: string, titleOverride?: string): Promise<void> {
    if (guestPayload !== null) {
      guestPayload = {
        ...guestPayload,
        title: titleOverride ?? deriveTitle(content),
        content
      };
      renderGuestBannerState();
      return;
    }

    if (activeNoteId === null) {
      return;
    }

    const current = notes.find((note) => note.id === activeNoteId);
    if (current === undefined) {
      return;
    }

    let storedContent = content;
    if (current.encrypted) {
      const session = unlockedNotes.get(current.id);
      if (session === undefined) {
        return;
      }
      const ciphertext = await encrypt(content, session.key);
      storedContent = serializeEncryptedContent(session.salt, ciphertext);
    }

    const nextNote: Note = {
      ...current,
      title: titleOverride ?? deriveTitle(content),
      content: storedContent,
      updatedAt: Date.now(),
      tags: deriveTags(content)
    };

    await saveNote(nextNote);
    notes = notes.map((note) => (note.id === nextNote.id ? nextNote : note));
    notes = [...notes].sort((left, right) => right.updatedAt - left.updatedAt);
    renderSidebarList();
    if (statusbar !== null) {
      statusbar.showSaved();
    }
  }

  async function selectNote(id: string): Promise<void> {
    const note = notes.find((entry) => entry.id === id);
    if (note === undefined) {
      return;
    }

    guestPayload = null;
    renderGuestBannerState();
    activeNoteId = id;

    if (!note.encrypted) {
      setEditorDocument(note.content);
      renderSidebarList();
      return;
    }

    const encryptedPayload = parseEncryptedContent(note.content);
    if (encryptedPayload === null) {
      if (statusbar !== null) {
        statusbar.showMessage('encrypted note is invalid');
      }
      return;
    }

    const passphrase = window.prompt('Passphrase for this note');
    if (passphrase === null || passphrase.length === 0) {
      return;
    }

    try {
      const key = await deriveKey(passphrase, encryptedPayload.salt);
      const plaintext = await decrypt(encryptedPayload.ciphertext, key);
      unlockedNotes.set(note.id, {
        key,
        salt: encryptedPayload.salt
      });
      setEditorDocument(plaintext);
      renderSidebarList();
    } catch {
      if (statusbar !== null) {
        statusbar.showMessage('unable to decrypt note');
      }
    }
  }

  async function createNote(): Promise<void> {
    guestPayload = null;
    renderGuestBannerState();
    const note = createEmptyNote(Date.now());
    await saveNote(note);
    notes = [note, ...notes].sort((left, right) => right.updatedAt - left.updatedAt);
    activeNoteId = note.id;
    setEditorDocument(note.content);
    renderSidebarList();
  }

  async function removeNote(id: string): Promise<void> {
    await deleteNote(id);
    unlockedNotes.delete(id);
    notes = notes.filter((note) => note.id !== id);
    if (activeNoteId === id) {
      activeNoteId = null;
      if (notes.length > 0) {
        await selectNote(notes[0].id);
      } else {
        await createNote();
      }
    }
    renderSidebarList();
  }

  async function saveCurrentDocument(): Promise<void> {
    const baseContent = isStarterTemplateVisible ? STARTER_NOTE_TEMPLATE : getEditorDocumentContent();
    const requestedTitle = window.prompt(
      'Save note as',
      isStarterTemplateVisible ? deriveTitle(baseContent) : getCurrentTitle(baseContent)
    );
    if (requestedTitle === null) {
      return;
    }

    const title = normalizeTitle(requestedTitle);
    const content = applyTitleToContent(baseContent, title);

    if (guestPayload !== null) {
      const timestamp = Date.now();
      const note: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: guestPayload.createdAt || timestamp,
        updatedAt: timestamp,
        encrypted: false,
        tags: deriveTags(content)
      };
      await saveNote(note);
      notes = [note, ...notes].sort((left, right) => right.updatedAt - left.updatedAt);
      activeNoteId = note.id;
      guestPayload = null;
      history.replaceState(null, EMPTY_STRING, `${window.location.pathname}${window.location.search}`);
      renderGuestBannerState();
      renderSidebarList();
      setEditorDocument(content);
      if (statusbar !== null) {
        statusbar.showSaved();
      }
      return;
    }

    setEditorDocument(content);
    await persistCurrentNote(content, title);
  }

  async function exportCurrentNote(format: ExportFormat): Promise<void> {
    const content = getCurrentContent();
    const title = guestPayload?.title ?? notes.find((note) => note.id === activeNoteId)?.title ?? DEFAULT_NOTE_TITLE;
    await exportNote({ title, content }, format, root.ownerDocument ?? document);
  }

  function openExportModal(): void {
    closeExportModal();
    const title = guestPayload?.title ?? notes.find((note) => note.id === activeNoteId)?.title ?? DEFAULT_NOTE_TITLE;
    exportModal = renderExportflow(title, {
      onSelect(format: ExportFormat): void {
        closeExportModal();
        void (async (): Promise<void> => {
          try {
            await exportCurrentNote(format);
          } catch (error) {
            if (statusbar !== null) {
              statusbar.showMessage(error instanceof Error ? error.message : 'export failed');
            }
          }
        })();
      },
      onClose(): void {
        closeExportModal();
      }
    });
    root.append(exportModal);
  }

  async function toggleEncryption(): Promise<void> {
    if (guestPayload !== null || activeNoteId === null) {
      return;
    }

    const note = notes.find((entry) => entry.id === activeNoteId);
    if (note === undefined) {
      return;
    }

    const content = getCurrentContent();
    if (!note.encrypted) {
      const passphrase = window.prompt('Choose a passphrase for this note');
      if (passphrase === null || passphrase.length === 0) {
        return;
      }
      const salt = generateSalt();
      const key = await deriveKey(passphrase, salt);
      const ciphertext = await encrypt(content, key);
      unlockedNotes.set(note.id, { key, salt });
      const nextNote: Note = {
        ...note,
        encrypted: true,
        content: serializeEncryptedContent(salt, ciphertext),
        updatedAt: Date.now(),
        title: deriveTitle(content),
        tags: deriveTags(content)
      };
      await saveNote(nextNote);
      notes = notes.map((entry) => (entry.id === nextNote.id ? nextNote : entry));
      renderSidebarList();
      if (statusbar !== null) {
        statusbar.showSaved();
      }
      return;
    }

    unlockedNotes.delete(note.id);
    const nextNote: Note = {
      ...note,
      encrypted: false,
      content,
      updatedAt: Date.now(),
      title: deriveTitle(content),
      tags: deriveTags(content)
    };
    await saveNote(nextNote);
    notes = notes.map((entry) => (entry.id === nextNote.id ? nextNote : entry));
    renderSidebarList();
    if (statusbar !== null) {
      statusbar.showSaved();
    }
  }

  function openShareModal(): void {
    try {
      closeShareModal();
      const content = getCurrentContent();
      const payload = {
        title: guestPayload?.title ?? notes.find((note) => note.id === activeNoteId)?.title ?? DEFAULT_NOTE_TITLE,
        content,
        createdAt: guestPayload?.createdAt ?? notes.find((note) => note.id === activeNoteId)?.createdAt ?? Date.now()
      };
      const encoded = encodeNote(payload);
      const shareUrl = `${window.location.origin}${window.location.pathname}${SHARE_HASH_PREFIX}${encoded}`;
      shareModal = renderShareflow(shareUrl, {
        onClose(): void {
          closeShareModal();
        }
      });
      root.append(shareModal);
    } catch (error) {
      if (statusbar !== null) {
        statusbar.showMessage(error instanceof Error ? error.message : 'share failed');
      }
    }
  }

  async function importGuestNote(): Promise<void> {
    if (guestPayload === null) {
      return;
    }
    const timestamp = Date.now();
    const note: Note = {
      id: crypto.randomUUID(),
      title: guestPayload.title || DEFAULT_NOTE_TITLE,
      content: getCurrentContent(),
      createdAt: guestPayload.createdAt || timestamp,
      updatedAt: timestamp,
      encrypted: false,
      tags: deriveTags(getCurrentContent())
    };
    await saveNote(note);
    notes = [note, ...notes].sort((left, right) => right.updatedAt - left.updatedAt);
    activeNoteId = note.id;
    guestPayload = null;
    history.replaceState(null, EMPTY_STRING, `${window.location.pathname}${window.location.search}`);
    renderGuestBannerState();
    renderSidebarList();
    setEditorDocument(note.content);
  }

  function dismissGuestNote(): void {
    guestPayload = null;
    history.replaceState(null, EMPTY_STRING, `${window.location.pathname}${window.location.search}`);
    renderGuestBannerState();
    if (notes.length > 0) {
      void selectNote(notes[0].id);
      return;
    }
    void createNote();
  }

  async function exportAllNotes(): Promise<void> {
    const payload = JSON.stringify(
      {
        version: CURRENT_SHARE_VERSION,
        settings,
        notes
      },
      null,
      2
    );
    download(EXPORT_ALL_FILENAME, payload, 'application/json;charset=utf-8');
  }

  async function importAllNotes(file: File): Promise<void> {
    let archive: ReturnType<typeof parseNotesArchive>;

    try {
      archive = parseNotesArchive(await file.text());
    } catch (error) {
      if (statusbar !== null) {
        statusbar.showMessage(error instanceof Error ? error.message : 'import failed');
      }
      return;
    }

    for (const note of archive.notes) {
      await saveNote(note);
      unlockedNotes.delete(note.id);
    }

    notes = await getNotes();
    if (archive.settings !== null) {
      settings = archive.settings;
      await saveSettingsRecord(settings);
      applyAppearance();
    }

    const activeNote = activeNoteId === null ? undefined : notes.find((note) => note.id === activeNoteId);
    if (guestPayload === null && activeNote !== undefined && !activeNote.encrypted) {
      setEditorDocument(activeNote.content);
    } else if (activeNoteId === null && notes.length > 0) {
      const nextNote = notes.find((note) => !note.encrypted) ?? notes[0];
      if (nextNote.encrypted) {
        activeNoteId = nextNote.id;
      } else {
        await selectNote(nextNote.id);
      }
    }

    renderSidebarList();
    if (statusbar !== null) {
      statusbar.showMessage(
        archive.settings === null
          ? `imported ${archive.notes.length} notes`
          : `imported ${archive.notes.length} notes and settings`
      );
    }
  }

  async function openSettingsModal(): Promise<void> {
    closeSettingsModal();
    settingsModal = renderSettings(settings, {
      onSave(nextSettings: AppSettings): void {
        settings = nextSettings;
        void saveSettingsRecord(settings);
        applyAppearance();
        closeSettingsModal();
      },
      onClose(): void {
        closeSettingsModal();
      },
      onClearData(): void {
        void (async (): Promise<void> => {
          await clearAllData();
          unlockedNotes.clear();
          notes = [];
          activeNoteId = null;
          guestPayload = null;
          renderGuestBannerState();
          await createNote();
          closeSettingsModal();
        })();
      },
      onExportAll(): void {
        void exportAllNotes();
      },
      onImportAll(file: File): void {
        void importAllNotes(file);
      }
    });
    root.append(settingsModal);
  }

  const editorView = createEditor(editorFrame, EMPTY_STRING, (content: string): void => {
    if (isHydrating) {
      return;
    }
    renderMarkdownPreview(preview, content);
    updateStatusbarWordCount(content);
    void persistCurrentNote(content);
  });
  editorView.dom.setAttribute('aria-label', 'DevPad markdown editor');

  editorView.contentDOM.addEventListener('focusin', () => {
    if (!isStarterTemplateVisible) {
      return;
    }
    window.requestAnimationFrame(() => {
      editorView.dispatch({
        selection: {
          anchor: 0,
          head: editorView.state.doc.length
        }
      });
    });
  });

  editorView.contentDOM.addEventListener('pointerdown', (event) => {
    if (!isStarterTemplateVisible) {
      return;
    }
    event.preventDefault();
    editorView.focus();
    editorView.dispatch({
      selection: {
        anchor: 0,
        head: editorView.state.doc.length
      }
    });
  });

  editorView.contentDOM.addEventListener('beforeinput', () => {
    if (!isStarterTemplateVisible) {
      return;
    }
    setStarterTemplateVisible(false);
  });

  bindHorizontalResize(sidebarResizer, (): number => paneLayout.sidebar, (startWidth: number, deltaX: number): number => {
    return constrainSidebarWidth(startWidth + deltaX);
  });

  bindHorizontalResize(previewResizer, (): number => paneLayout.preview, (startWidth: number, deltaX: number): number => {
    return constrainPreviewWidth(startWidth - deltaX);
  });

  sidebarResizer.addEventListener('dblclick', () => {
    toggleSidebarPane();
  });

  previewResizer.addEventListener('dblclick', () => {
    togglePreviewPane();
  });

  function renderStatusbarState(): void {
    statusbar = renderStatusbar(countWords(getCurrentContent()), {
      onSave(): void {
        void saveCurrentDocument();
      },
      onShare(): void {
        openShareModal();
      },
      onEncrypt(): void {
        void toggleEncryption();
      },
      onExport(): void {
        openExportModal();
      }
    });
    statusbarHost.replaceChildren(statusbar);
  }

  window.addEventListener('resize', () => {
    paneLayout = {
      sidebar: constrainSidebarWidth(paneLayout.sidebar),
      preview: constrainPreviewWidth(paneLayout.preview)
    };
    applyPaneLayout();
  });

  void (async (): Promise<void> => {
    settings = await loadSettings();
    renderStatusbarState();
    renderSidebarList();
    applyAppearance();

    const shared = decodeNote(window.location.hash);
    if (shared !== null) {
      guestPayload = shared;
      renderGuestBannerState();
      setEditorDocument(shared.content);
      return;
    }

    notes = await getNotes();
    if (notes.length === 0) {
      await createNote();
      renderStatusbarState();
      applyAppearance();
      return;
    }

    await selectNote(notes[0].id);
    renderStatusbarState();
    applyAppearance();
  })();
}
