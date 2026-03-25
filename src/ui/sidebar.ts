import {
  DEFAULT_NOTE_TITLE,
  SIDEBAR_NOTE_LIMIT
} from '../constants';
import type { Note } from '../types';

interface SidebarCallbacks {
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(timestamp);
}

export function renderSidebar(
  notes: Note[],
  activeId: string | null,
  callbacks: SidebarCallbacks
): HTMLElement {
  const aside = document.createElement('aside');
  aside.className = 'sidebar';
  aside.setAttribute('aria-label', 'DevPad note navigation');

  const header = document.createElement('div');
  header.className = 'sidebar__header';

  const brand = document.createElement('div');
  brand.className = 'sidebar__brand';
  brand.textContent = 'DevPad';

  const controls = document.createElement('div');
  controls.className = 'sidebar__controls';

  const newButton = document.createElement('button');
  newButton.className = 'sidebar__button';
  newButton.type = 'button';
  newButton.textContent = 'New';
  newButton.setAttribute('aria-label', 'Create a new note');
  newButton.addEventListener('click', callbacks.onCreate);

  const helpLink = document.createElement('a');
  helpLink.className = 'sidebar__button sidebar__button--ghost';
  helpLink.href = 'help/';
  helpLink.textContent = 'Help';
  helpLink.setAttribute('aria-label', 'Open DevPad help and usage guide');

  const settingsButton = document.createElement('button');
  settingsButton.className = 'sidebar__button sidebar__button--ghost';
  settingsButton.type = 'button';
  settingsButton.textContent = 'Settings';
  settingsButton.setAttribute('aria-label', 'Open settings');
  settingsButton.addEventListener('click', callbacks.onOpenSettings);

  controls.append(newButton, helpLink, settingsButton);
  header.append(brand, controls);

  const list = document.createElement('div');
  list.className = 'sidebar__list';

  for (const note of notes.slice(0, SIDEBAR_NOTE_LIMIT)) {
    const item = document.createElement('div');
    item.className = 'sidebar__item';
    item.dataset.active = String(note.id === activeId);

    const selectButton = document.createElement('button');
    selectButton.className = 'sidebar__item-button';
    selectButton.type = 'button';
    selectButton.setAttribute('aria-label', `Open note ${note.title || DEFAULT_NOTE_TITLE}`);
    selectButton.addEventListener('click', () => {
      callbacks.onSelect(note.id);
    });

    const title = document.createElement('div');
    title.className = 'sidebar__item-title';
    title.textContent = note.title || DEFAULT_NOTE_TITLE;

    const meta = document.createElement('div');
    meta.className = 'sidebar__item-meta';
    meta.textContent = `${formatDate(note.updatedAt)}${note.encrypted ? ' · locked' : ''}`;

    selectButton.append(title, meta);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'sidebar__delete';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete note ${note.title || DEFAULT_NOTE_TITLE}`);
    deleteButton.addEventListener('click', () => {
      callbacks.onDelete(note.id);
    });

    item.append(selectButton, deleteButton);
    list.append(item);
  }

  aside.append(header, list);
  return aside;
}
