import {
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_THEME
} from '../constants';
import type { AppSettings } from '../types';

interface SettingsCallbacks {
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onClearData: () => void;
  onExportAll: () => void;
}

function createSection(title: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'settings__section';

  const heading = document.createElement('h3');
  heading.className = 'settings__heading';
  heading.textContent = title;

  section.append(heading);
  return section;
}

function createField(labelText: string, input: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'settings__field';

  const text = document.createElement('span');
  text.className = 'settings__label';
  text.textContent = labelText;

  label.append(text, input);
  return label;
}

export function renderSettings(
  settings: AppSettings,
  callbacks: SettingsCallbacks
): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';

  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  const header = document.createElement('div');
  header.className = 'settings__header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'settings__title-wrap';

  const title = document.createElement('h2');
  title.className = 'settings__title';
  title.textContent = 'Settings';

  const subtitle = document.createElement('p');
  subtitle.className = 'settings__subtitle';
  subtitle.textContent = 'Tune the writing surface and manage local note data.';

  titleWrap.append(title, subtitle);

  const closeButton = document.createElement('button');
  closeButton.className = 'settings__close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', callbacks.onClose);

  header.append(titleWrap, closeButton);

  const appearance = createSection('Appearance');
  const themeSelect = document.createElement('select');
  themeSelect.className = 'settings__select';
  for (const optionValue of [DEFAULT_THEME, 'light'] as const) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    option.selected = settings.theme === optionValue;
    themeSelect.append(option);
  }

  const fontSizeInput = document.createElement('input');
  fontSizeInput.className = 'settings__input';
  fontSizeInput.type = 'number';
  fontSizeInput.min = String(DEFAULT_FONT_SIZE);
  fontSizeInput.max = '22';
  fontSizeInput.value = String(settings.fontSize);

  const lineHeightInput = document.createElement('input');
  lineHeightInput.className = 'settings__input';
  lineHeightInput.type = 'number';
  lineHeightInput.min = String(DEFAULT_LINE_HEIGHT);
  lineHeightInput.max = '2.4';
  lineHeightInput.step = '0.1';
  lineHeightInput.value = String(settings.lineHeight);

  appearance.append(
    createField('Theme', themeSelect),
    createField('Font size', fontSizeInput),
    createField('Line height', lineHeightInput)
  );

  const dataSection = createSection('Data');
  const exportAllButton = document.createElement('button');
  exportAllButton.className = 'settings__action';
  exportAllButton.type = 'button';
  exportAllButton.textContent = 'Export all notes';
  exportAllButton.addEventListener('click', callbacks.onExportAll);
  dataSection.append(exportAllButton);

  const dangerSection = createSection('Danger zone');
  const clearButton = document.createElement('button');
  clearButton.className = 'settings__action settings__action--danger';
  clearButton.type = 'button';
  clearButton.textContent = 'Clear all local data';
  clearButton.addEventListener('click', callbacks.onClearData);
  dangerSection.append(clearButton);

  const footer = document.createElement('div');
  footer.className = 'settings__footer';

  const footerHint = document.createElement('p');
  footerHint.className = 'settings__footer-text';
  footerHint.textContent = 'Everything stays in your browser via IndexedDB unless you export or share a note.';

  const saveButton = document.createElement('button');
  saveButton.className = 'settings__save';
  saveButton.type = 'button';
  saveButton.textContent = 'Save settings';
  saveButton.addEventListener('click', () => {
    callbacks.onSave({
      theme: themeSelect.value === 'light' ? 'light' : 'dark',
      fontSize: Number(fontSizeInput.value),
      lineHeight: Number(lineHeightInput.value)
    });
  });

  footer.append(footerHint, saveButton);
  panel.append(header, appearance, dataSection, dangerSection, footer);
  overlay.append(panel);
  return overlay;
}
