import { describe, expect, it, vi } from 'vitest';
import { renderExportflow } from '../src/ui/exportflow';

describe('exportflow ui', () => {
  it('invokes the selected export format callback', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const element = renderExportflow('Design Notes', {
      onSelect,
      onClose
    });

    document.body.append(element);

    const htmlButton = [...element.querySelectorAll('button')].find((button) => button.textContent?.includes('HTML (.html)'));
    if (!(htmlButton instanceof HTMLButtonElement)) {
      throw new Error('html export button was not rendered');
    }

    htmlButton.click();

    expect(onSelect).toHaveBeenCalledWith('html');
    expect(onClose).not.toHaveBeenCalled();
  });
});
