export function renderLanding(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'landing';
  section.setAttribute('aria-labelledby', 'landing-title');

  const intro = document.createElement('div');
  intro.className = 'landing__intro';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'landing__eyebrow';
  eyebrow.textContent = 'Private, browser-first writing';

  const title = document.createElement('h1');
  title.className = 'landing__title';
  title.id = 'landing-title';
  title.textContent = 'Secure Online Notepad for Developers';

  const copy = document.createElement('p');
  copy.className = 'landing__copy';
  copy.textContent =
    'DevPad is an online developer notepad built for fast markdown writing, secure notepad workflows, browser code editing, and private notes app usage without a backend.';

  const secondary = document.createElement('p');
  secondary.className = 'landing__copy landing__copy--secondary';
  secondary.textContent =
    'Use it as a markdown editor online for technical notes, snippets, architecture drafts, and offline note taking that stays in your browser unless you choose to share it.';

  const actions = document.createElement('div');
  actions.className = 'landing__actions';

  const helpLink = document.createElement('a');
  helpLink.className = 'landing__link';
  helpLink.href = 'help/';
  helpLink.textContent = 'Read the guide';

  const shareNote = document.createElement('a');
  shareNote.className = 'landing__link landing__link--ghost';
  shareNote.href = '#editor-workspace';
  shareNote.textContent = 'Start writing';

  actions.append(helpLink, shareNote);
  intro.append(eyebrow, title, copy, secondary, actions);

  const features = document.createElement('div');
  features.className = 'landing__features';

  const entries = [
    {
      title: 'Local-first storage',
      text: 'Every note stays in IndexedDB so your browser remains the source of truth.'
    },
    {
      title: 'Markdown + code editor',
      text: 'Write prose and code in one browser code editor with a live markdown preview.'
    },
    {
      title: 'Encryption',
      text: 'Protect sensitive notes with optional AES-GCM encryption and passphrase access.'
    },
    {
      title: 'Share via link',
      text: 'Create compressed URL-based note sharing without sending content to an application server.'
    }
  ];

  for (const entry of entries) {
    const article = document.createElement('article');
    article.className = 'landing__feature';

    const heading = document.createElement('h2');
    heading.className = 'landing__feature-title';
    heading.textContent = entry.title;

    const text = document.createElement('p');
    text.className = 'landing__feature-text';
    text.textContent = entry.text;

    article.append(heading, text);
    features.append(article);
  }

  section.append(intro, features);
  return section;
}
