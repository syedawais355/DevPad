import {
  ERROR_DISPLAY_MS,
  SAVE_MESSAGE_MS
} from '../constants';

interface StatusbarCallbacks {
  onSave: () => void;
  onShare: () => void;
  onEncrypt: () => void;
  onExport: () => void;
}

export interface StatusbarElement extends HTMLElement {
  showSaved: () => void;
  showMessage: (message: string) => void;
}

function createActionButton(label: string, callback: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'statusbar__button';
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', callback);
  return button;
}

export function renderStatusbar(
  wordCount: number,
  callbacks: StatusbarCallbacks
): StatusbarElement {
  const element = document.createElement('div') as unknown as StatusbarElement;
  element.className = 'statusbar';

  const left = document.createElement('div');
  left.className = 'statusbar__left';

  const words = document.createElement('span');
  words.className = 'statusbar__words';
  words.textContent = `${wordCount} words`;

  const saved = document.createElement('span');
  saved.className = 'statusbar__saved';
  saved.hidden = true;
  saved.textContent = 'saved';
  saved.setAttribute('aria-live', 'polite');

  const message = document.createElement('span');
  message.className = 'statusbar__message';
  message.hidden = true;
  message.setAttribute('aria-live', 'polite');

  left.append(words, saved, message);

  const right = document.createElement('div');
  right.className = 'statusbar__right';

  const saveButton = createActionButton('Save', callbacks.onSave);
  const shareButton = createActionButton('Share', callbacks.onShare);
  const encryptButton = createActionButton('Encrypt', callbacks.onEncrypt);
  const exportButton = createActionButton('Export', callbacks.onExport);

  right.append(saveButton, shareButton, encryptButton, exportButton);
  element.append(left, right);

  let savedTimer = 0;
  let messageTimer = 0;

  element.showSaved = (): void => {
    window.clearTimeout(savedTimer);
    saved.hidden = false;
    savedTimer = window.setTimeout(() => {
      saved.hidden = true;
    }, SAVE_MESSAGE_MS);
  };

  element.showMessage = (text: string): void => {
    window.clearTimeout(messageTimer);
    message.textContent = text;
    message.hidden = false;
    messageTimer = window.setTimeout(() => {
      message.hidden = true;
    }, ERROR_DISPLAY_MS);
  };

  return element;
}
