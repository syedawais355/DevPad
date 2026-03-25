import { describe, expect, it } from 'vitest';
import { renderLanding } from '../src/ui/landing';

describe('landing', () => {
  it('renders the SEO hero content and help link', () => {
    const element = renderLanding();

    const heading = element.querySelector('h1');
    const helpLink = [...element.querySelectorAll('a')].find((link) => link.textContent === 'Read the guide');

    expect(heading?.textContent).toBe('Secure Online Notepad for Developers');
    expect(helpLink?.getAttribute('href')).toBe('help/');
  });
});
