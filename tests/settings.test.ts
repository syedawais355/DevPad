import { describe, expect, it, vi } from 'vitest';
import { renderSettings } from '../src/ui/settings';
import type { AppSettings } from '../src/types';

const settings: AppSettings = {
  theme: 'dark',
  fontSize: 13,
  lineHeight: 1.8
};

describe('settings ui', () => {
  it('saves appearance settings', () => {
    const onSave = vi.fn();
    const element = renderSettings(settings, {
      onSave,
      onClose: vi.fn(),
      onClearData: vi.fn(),
      onExportAll: vi.fn(),
      onImportAll: vi.fn()
    });

    document.body.append(element);

    const selects = element.querySelectorAll('select');
    const inputs = element.querySelectorAll('input');
    const saveButton = [...element.querySelectorAll('button')].find((button) => button.textContent === 'Save settings');

    const themeSelect = selects[0];
    const fontSizeInput = inputs[0];
    const lineHeightInput = inputs[1];

    if (
      !(themeSelect instanceof HTMLSelectElement) ||
      !(fontSizeInput instanceof HTMLInputElement) ||
      !(lineHeightInput instanceof HTMLInputElement) ||
      !(saveButton instanceof HTMLButtonElement)
    ) {
      throw new Error('settings ui was not rendered as expected');
    }

    themeSelect.value = 'light';
    fontSizeInput.value = '16';
    lineHeightInput.value = '2';
    saveButton.click();

    expect(onSave).toHaveBeenCalledWith({
      theme: 'light',
      fontSize: 16,
      lineHeight: 2
    });
  });

  it('passes the selected import file to the import callback', () => {
    const onImportAll = vi.fn();
    const element = renderSettings(settings, {
      onSave: vi.fn(),
      onClose: vi.fn(),
      onClearData: vi.fn(),
      onExportAll: vi.fn(),
      onImportAll
    });

    document.body.append(element);

    const importButton = [...element.querySelectorAll('button')].find((button) => button.textContent === 'Import notes from file');
    const fileInput = element.querySelector('input[type="file"]');

    if (!(importButton instanceof HTMLButtonElement) || !(fileInput instanceof HTMLInputElement)) {
      throw new Error('import controls were not rendered');
    }

    const file = new File(['{"version":1,"notes":[]}'], 'devpad-export.json', {
      type: 'application/json'
    });
    const files = {
      0: file,
      length: 1,
      item(index: number): File | null {
        return index === 0 ? file : null;
      }
    };

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: files
    });

    importButton.click();
    fileInput.dispatchEvent(new Event('change'));

    expect(onImportAll).toHaveBeenCalledWith(file);
  });
});
