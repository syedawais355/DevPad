import { describe, expect, it, vi } from 'vitest';
import { renderCommandPalette } from '../src/ui/commandpalette';

describe('command palette ui', () => {
  it('filters items and selects the highlighted entry with enter', () => {
    const onSelect = vi.fn();
    const element = renderCommandPalette(
      [
        {
          id: 'action:new',
          title: 'New note',
          description: 'Create a fresh note',
          group: 'Action',
          keywords: ['new', 'create']
        },
        {
          id: 'action:settings',
          title: 'Open settings',
          description: 'Open preferences',
          group: 'Action',
          keywords: ['settings', 'preferences']
        }
      ],
      {
        onSelect,
        onClose: vi.fn()
      }
    );

    document.body.append(element);
    const input = element.querySelector('input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('command palette input was not rendered');
    }

    input.value = 'settings';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    expect(onSelect).toHaveBeenCalledWith('action:settings');
  });

  it('closes when escape is pressed in search input', () => {
    const onClose = vi.fn();
    const element = renderCommandPalette(
      [
        {
          id: 'action:new',
          title: 'New note',
          description: 'Create a fresh note',
          group: 'Action',
          keywords: ['new', 'create']
        }
      ],
      {
        onSelect: vi.fn(),
        onClose
      }
    );

    document.body.append(element);
    const input = element.querySelector('input');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('command palette input was not rendered');
    }

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
