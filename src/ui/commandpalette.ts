export interface CommandPaletteItem {
  id: string;
  title: string;
  description: string;
  group: string;
  keywords: string[];
  shortcut?: string;
}

interface CommandPaletteCallbacks {
  onSelect: (id: string) => void;
  onClose: () => void;
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function itemMatchesQuery(item: CommandPaletteItem, query: string): boolean {
  if (query.length === 0) {
    return true;
  }
  if (item.title.toLowerCase().includes(query)) {
    return true;
  }
  if (item.description.toLowerCase().includes(query)) {
    return true;
  }
  return item.keywords.some((keyword) => keyword.toLowerCase().includes(query));
}

export function renderCommandPalette(items: CommandPaletteItem[], callbacks: CommandPaletteCallbacks): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'commandpalette';

  const panel = document.createElement('div');
  panel.className = 'commandpalette__panel';

  const title = document.createElement('h3');
  title.className = 'commandpalette__title';
  title.textContent = 'Command palette';

  const subtitle = document.createElement('p');
  subtitle.className = 'commandpalette__subtitle';
  subtitle.textContent = 'Jump to notes or run actions instantly.';

  const input = document.createElement('input');
  input.className = 'commandpalette__input';
  input.type = 'text';
  input.placeholder = 'Type a command or note title';
  input.setAttribute('aria-label', 'Command palette search');

  const list = document.createElement('div');
  list.className = 'commandpalette__list';
  list.setAttribute('role', 'listbox');

  const closeButton = document.createElement('button');
  closeButton.className = 'commandpalette__button commandpalette__button--ghost';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', callbacks.onClose);

  const actions = document.createElement('div');
  actions.className = 'commandpalette__actions';
  actions.append(closeButton);

  panel.append(title, subtitle, input, list, actions);
  overlay.append(panel);

  let filteredItems = [...items];
  let selectedIndex = 0;

  function selectIndex(index: number): void {
    if (filteredItems.length === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.max(0, Math.min(index, filteredItems.length - 1));
  }

  function renderList(): void {
    list.replaceChildren();
    if (filteredItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'commandpalette__empty';
      empty.textContent = 'No commands found.';
      list.append(empty);
      return;
    }

    filteredItems.forEach((item, index) => {
      const row = document.createElement('button');
      row.className = 'commandpalette__item';
      row.type = 'button';
      row.dataset.active = String(index === selectedIndex);
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(index === selectedIndex));
      row.addEventListener('click', () => {
        callbacks.onSelect(item.id);
      });

      const copy = document.createElement('div');
      copy.className = 'commandpalette__copy';

      const heading = document.createElement('div');
      heading.className = 'commandpalette__item-title';
      heading.textContent = item.title;

      const description = document.createElement('div');
      description.className = 'commandpalette__item-description';
      description.textContent = item.description;

      const group = document.createElement('span');
      group.className = 'commandpalette__group';
      group.textContent = item.group;

      copy.append(heading, description, group);

      if (item.shortcut !== undefined) {
        const shortcut = document.createElement('kbd');
        shortcut.className = 'commandpalette__shortcut';
        shortcut.textContent = item.shortcut;
        row.append(copy, shortcut);
      } else {
        row.append(copy);
      }

      list.append(row);
    });
  }

  function refreshFilteredItems(): void {
    const query = normalizeQuery(input.value);
    filteredItems = items.filter((item) => itemMatchesQuery(item, query));
    selectIndex(0);
    renderList();
  }

  function moveSelection(delta: number): void {
    if (filteredItems.length === 0) {
      return;
    }
    selectIndex((selectedIndex + delta + filteredItems.length) % filteredItems.length);
    renderList();
    const next = list.querySelector(`[data-active='true']`);
    if (next instanceof HTMLElement) {
      next.scrollIntoView({ block: 'nearest' });
    }
  }

  input.addEventListener('input', refreshFilteredItems);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected !== undefined) {
        callbacks.onSelect(selected.id);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      callbacks.onClose();
    }
  });

  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) {
      callbacks.onClose();
    }
  });

  renderList();
  window.requestAnimationFrame(() => {
    input.focus();
    input.select();
  });

  return overlay;
}
