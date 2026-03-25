interface ShareflowCallbacks {
  onClose: () => void;
}

export function renderShareflow(url: string, callbacks: ShareflowCallbacks): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'shareflow';

  const panel = document.createElement('div');
  panel.className = 'shareflow__panel';

  const title = document.createElement('h3');
  title.className = 'shareflow__title';
  title.textContent = 'Share note';

  const input = document.createElement('input');
  input.className = 'shareflow__input';
  input.readOnly = true;
  input.value = url;

  const actions = document.createElement('div');
  actions.className = 'shareflow__actions';

  const copyButton = document.createElement('button');
  copyButton.className = 'shareflow__button';
  copyButton.type = 'button';
  copyButton.textContent = 'Copy';
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      input.select();
      document.execCommand('copy');
    }
    copyButton.textContent = 'Copied';
  });

  const closeButton = document.createElement('button');
  closeButton.className = 'shareflow__button shareflow__button--ghost';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', callbacks.onClose);

  actions.append(copyButton, closeButton);
  panel.append(title, input, actions);
  overlay.append(panel);
  return overlay;
}
