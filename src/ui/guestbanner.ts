interface GuestBannerCallbacks {
  onImport: () => void;
  onDismiss: () => void;
}

export function renderGuestBanner(
  title: string,
  callbacks: GuestBannerCallbacks
): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'guest-banner';

  const text = document.createElement('span');
  text.className = 'guest-banner__text';
  text.textContent = `Shared note loaded: ${title}`;

  const actions = document.createElement('div');
  actions.className = 'guest-banner__actions';

  const importButton = document.createElement('button');
  importButton.className = 'guest-banner__button';
  importButton.type = 'button';
  importButton.textContent = 'Import';
  importButton.addEventListener('click', callbacks.onImport);

  const dismissButton = document.createElement('button');
  dismissButton.className = 'guest-banner__button guest-banner__button--ghost';
  dismissButton.type = 'button';
  dismissButton.textContent = 'Dismiss';
  dismissButton.addEventListener('click', callbacks.onDismiss);

  actions.append(importButton, dismissButton);
  banner.append(text, actions);
  return banner;
}
