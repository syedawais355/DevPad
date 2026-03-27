import { formatShortcut, type ShortcutCategory, type ShortcutDefinition } from '../shortcuts/definitions';

interface ShortcutsHelpCallbacks {
  onClose: () => void;
}

const CATEGORY_ORDER: ShortcutCategory[] = ['Core', 'Navigation', 'Editing', 'Power', 'Organization', 'UI'];

export function renderShortcutsHelp(
  shortcuts: ShortcutDefinition[],
  isMac: boolean,
  callbacks: ShortcutsHelpCallbacks
): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'shortcutshelp';

  const panel = document.createElement('div');
  panel.className = 'shortcutshelp__panel';

  const title = document.createElement('h3');
  title.className = 'shortcutshelp__title';
  title.textContent = 'Keyboard shortcuts';

  const subtitle = document.createElement('p');
  subtitle.className = 'shortcutshelp__subtitle';
  subtitle.textContent = isMac
    ? 'Showing Mac key labels (Cmd / Option).'
    : 'Showing Windows/Linux key labels (Ctrl / Alt).';

  const list = document.createElement('div');
  list.className = 'shortcutshelp__list';

  for (const category of CATEGORY_ORDER) {
    const categoryItems = shortcuts.filter((shortcut) => shortcut.category === category);
    if (categoryItems.length === 0) {
      continue;
    }

    const section = document.createElement('section');
    section.className = 'shortcutshelp__section';

    const heading = document.createElement('h4');
    heading.className = 'shortcutshelp__heading';
    heading.textContent = category;
    section.append(heading);

    for (const shortcut of categoryItems) {
      const row = document.createElement('div');
      row.className = 'shortcutshelp__row';

      const description = document.createElement('span');
      description.className = 'shortcutshelp__description';
      description.textContent = shortcut.description;

      const combo = document.createElement('kbd');
      combo.className = 'shortcutshelp__combo';
      combo.textContent = formatShortcut(shortcut.combo, isMac);

      row.append(description, combo);
      section.append(row);
    }

    list.append(section);
  }

  const closeButton = document.createElement('button');
  closeButton.className = 'shortcutshelp__button shortcutshelp__button--ghost';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', callbacks.onClose);

  const actions = document.createElement('div');
  actions.className = 'shortcutshelp__actions';
  actions.append(closeButton);

  panel.append(title, subtitle, list, actions);
  overlay.append(panel);

  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) {
      callbacks.onClose();
    }
  });

  return overlay;
}
