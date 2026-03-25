import type { ExportFormat } from '../export/files';

interface ExportflowCallbacks {
  onSelect: (format: ExportFormat) => void;
  onClose: () => void;
}

function createOption(
  label: string,
  description: string,
  format: ExportFormat,
  callbacks: ExportflowCallbacks
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'exportflow__option';
  button.type = 'button';
  button.addEventListener('click', () => {
    callbacks.onSelect(format);
  });

  const title = document.createElement('span');
  title.className = 'exportflow__option-title';
  title.textContent = label;

  const copy = document.createElement('span');
  copy.className = 'exportflow__option-copy';
  copy.textContent = description;

  button.append(title, copy);
  return button;
}

export function renderExportflow(title: string, callbacks: ExportflowCallbacks): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'exportflow';

  const panel = document.createElement('div');
  panel.className = 'exportflow__panel';

  const heading = document.createElement('h3');
  heading.className = 'exportflow__title';
  heading.textContent = 'Export note';

  const subtitle = document.createElement('p');
  subtitle.className = 'exportflow__subtitle';
  subtitle.textContent = `Choose a format for "${title}".`;

  const options = document.createElement('div');
  options.className = 'exportflow__options';
  options.append(
    createOption('Markdown (.md)', 'Export the original note source for editing in any Markdown tool.', 'markdown', callbacks),
    createOption('HTML (.html)', 'Export a styled standalone document that matches DevPad rendering.', 'html', callbacks),
    createOption('PDF (.pdf)', 'Open a print-ready document for saving or printing as PDF.', 'pdf', callbacks)
  );

  const actions = document.createElement('div');
  actions.className = 'exportflow__actions';

  const closeButton = document.createElement('button');
  closeButton.className = 'exportflow__button exportflow__button--ghost';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', callbacks.onClose);

  actions.append(closeButton);
  panel.append(heading, subtitle, options, actions);
  overlay.append(panel);
  return overlay;
}
