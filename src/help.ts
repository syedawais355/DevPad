import './styles/tokens.css';
import './styles/help.css';

const root = document.getElementById('help-app');

if (root instanceof HTMLElement) {
  const page = document.createElement('div');
  page.className = 'help-page';

  const header = document.createElement('header');
  header.className = 'help-page__header';

  const brand = document.createElement('a');
  brand.className = 'help-page__brand';
  brand.href = '../';
  brand.textContent = 'DevPad';
  brand.setAttribute('aria-label', 'Go back to DevPad home');

  const nav = document.createElement('nav');
  nav.className = 'help-page__nav';
  nav.setAttribute('aria-label', 'Help page navigation');

  const homeLink = document.createElement('a');
  homeLink.className = 'help-page__link';
  homeLink.href = '../';
  homeLink.textContent = 'Home';

  const overviewLink = document.createElement('a');
  overviewLink.className = 'help-page__link help-page__link--ghost';
  overviewLink.href = '#getting-started';
  overviewLink.textContent = 'Start Here';

  nav.append(homeLink, overviewLink);
  header.append(brand, nav);

  const main = document.createElement('main');
  main.className = 'help-page__main';

  const hero = document.createElement('section');
  hero.className = 'help-page__hero';

  const heroTitle = document.createElement('h1');
  heroTitle.textContent = 'How to Use DevPad';

  const heroText = document.createElement('p');
  heroText.textContent =
    'DevPad is a secure online developer notepad built for private notes, markdown writing, code snippets, and browser-first productivity without a backend.';

  hero.append(heroTitle, heroText);

  const sections = document.createElement('div');
  sections.className = 'help-page__sections';

  function createSection(id: string, title: string, content: string[]): HTMLElement {
    const section = document.createElement('section');
    section.className = 'help-page__section';
    section.id = id;

    const heading = document.createElement('h2');
    heading.textContent = title;

    section.append(heading);

    for (const text of content) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      section.append(paragraph);
    }

    return section;
  }

  sections.append(
    createSection('getting-started', '1. Getting Started', [
      'Use the New button in the sidebar to create a note instantly. DevPad opens directly into a browser code editor with a markdown-ready starter template.',
      'Select any note from the sidebar to continue working. Everything is stored locally in your browser through IndexedDB.'
    ]),
    createSection('writing-notes', '2. Writing Notes', [
      'Write prose, technical documentation, or code snippets in the editor. DevPad acts as a markdown editor online with a live preview beside the writing surface.',
      'Use headings, lists, code fences, and tables to structure your notes. The preview is designed for developer-friendly formatting and syntax-highlighted code blocks.'
    ]),
    createSection('saving-notes', '3. Saving Notes', [
      'DevPad autosaves while you type, so your latest work is persisted locally without a backend call.',
      'Use the Save button when you want to explicitly rename the note title. DevPad updates the note heading and keeps the sidebar title aligned with the saved document.'
    ]),
    createSection('encryption', '4. Encryption', [
      'Use the Encrypt action to secure a note with a passphrase. Encryption is handled with AES-GCM in the browser through the Web Crypto API.',
      'Your passphrase is not stored as plaintext. Keep it safe, because encrypted notes require the correct passphrase to open.'
    ]),
    createSection('sharing-notes', '5. Sharing Notes', [
      'Use Share to generate a compressed URL hash that contains the note payload. This keeps sharing browser-first and server-independent.',
      'Shared notes can be opened and imported as new local notes. The URL fragment is the transport layer for this feature.'
    ]),
    createSection('data-privacy', '6. Data & Privacy', [
      'DevPad is a private notes app designed around local-first storage. Your notes stay in IndexedDB in your browser unless you export or share them yourself.',
      'There is no backend database and no application server that stores your notes. This makes DevPad suitable for privacy-conscious offline note taking and browser-based drafting.'
    ]),
    createSection('developer-tips', '7. Tips for Developers', [
      'Use Save to keep note titles intentional, especially for architecture notes or reusable snippets.',
      'Use fenced code blocks for snippets, markdown tables for references, and encryption for sensitive drafts or personal technical notes.'
    ])
  );

  const faq = document.createElement('section');
  faq.className = 'help-page__section';
  faq.id = 'faq';

  const faqTitle = document.createElement('h2');
  faqTitle.textContent = '8. FAQ';
  faq.append(faqTitle);

  const faqItems = [
    {
      question: 'What is DevPad?',
      answer:
        'DevPad is a secure online developer notepad and browser code editor for markdown notes, technical writing, and local-first note management.'
    },
    {
      question: 'Is DevPad secure?',
      answer:
        'Yes. DevPad keeps notes in your browser and offers optional per-note encryption. It is designed as a secure notepad for people who want privacy and control.'
    },
    {
      question: 'Does it work offline?',
      answer:
        'DevPad supports offline note taking for notes already stored in your browser because it uses IndexedDB and does not require a backend.'
    },
    {
      question: 'Is my data stored anywhere?',
      answer:
        'No application backend stores your notes. Data remains in your browser unless you export it or create a share link yourself.'
    }
  ];

  for (const item of faqItems) {
    const details = document.createElement('details');
    details.className = 'help-page__faq';

    const summary = document.createElement('summary');
    summary.textContent = item.question;

    const answer = document.createElement('p');
    answer.textContent = item.answer;

    details.append(summary, answer);
    faq.append(details);
  }

  const footer = document.createElement('footer');
  footer.className = 'help-page__footer';

  const footerText = document.createElement('p');
  footerText.textContent =
    'DevPad is built for developers who want a markdown editor online, a secure notepad, and a private browser code editor without backend complexity.';

  const footerLink = document.createElement('a');
  footerLink.className = 'help-page__link';
  footerLink.href = '../';
  footerLink.textContent = 'Back to DevPad';

  footer.append(footerText, footerLink);

  main.append(hero, sections, faq);
  page.append(header, main, footer);
  root.replaceChildren(page);
}
