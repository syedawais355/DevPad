import { describe, expect, it, vi } from 'vitest';
import { SHORTCUT_DEFINITIONS } from '../src/shortcuts/definitions';
import { renderShortcutsHelp } from '../src/ui/shortcutshelp';

describe('shortcuts help ui', () => {
  it('renders shortcuts with platform-specific labels', () => {
    const element = renderShortcutsHelp(SHORTCUT_DEFINITIONS, true, {
      onClose: vi.fn()
    });

    document.body.append(element);

    const heading = element.querySelector('.shortcutshelp__title');
    const combo = element.querySelector('.shortcutshelp__combo');

    expect(heading?.textContent).toBe('Keyboard shortcuts');
    expect(combo?.textContent?.includes('Cmd')).toBe(true);
  });

  it('closes through close action', () => {
    const onClose = vi.fn();
    const element = renderShortcutsHelp(SHORTCUT_DEFINITIONS, false, {
      onClose
    });

    document.body.append(element);

    const closeButton = [...element.querySelectorAll('button')].find((button) => button.textContent === 'Close');
    if (!(closeButton instanceof HTMLButtonElement)) {
      throw new Error('close button was not rendered');
    }

    closeButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
