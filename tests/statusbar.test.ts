import { describe, expect, it, vi } from 'vitest';
import { renderStatusbar } from '../src/ui/statusbar';

describe('statusbar', () => {
  it('renders save action and triggers its callback', () => {
    const onSave = vi.fn();
    const element = renderStatusbar(42, {
      onSave,
      onShare: vi.fn(),
      onEncrypt: vi.fn(),
      onExport: vi.fn()
    });

    document.body.append(element);

    const saveButton = [...element.querySelectorAll('button')].find((button) => button.textContent === 'Save');
    if (!(saveButton instanceof HTMLButtonElement)) {
      throw new Error('save button was not rendered');
    }

    saveButton.click();

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
