import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportNote } from '../src/export/files';

describe('export files', () => {
  let originalCreateObjectUrl: typeof URL.createObjectURL | undefined;
  let originalRevokeObjectUrl: typeof URL.revokeObjectURL | undefined;

  beforeEach(() => {
    originalCreateObjectUrl = URL.createObjectURL;
    originalRevokeObjectUrl = URL.revokeObjectURL;
  });

  afterEach(() => {
    document.body.replaceChildren();

    if (originalCreateObjectUrl === undefined) {
      Reflect.deleteProperty(URL, 'createObjectURL');
    } else {
      Object.defineProperty(URL, 'createObjectURL', {
        value: originalCreateObjectUrl,
        configurable: true
      });
    }

    if (originalRevokeObjectUrl === undefined) {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    } else {
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: originalRevokeObjectUrl,
        configurable: true
      });
    }

    vi.restoreAllMocks();
  });

  it('exports markdown as a downloadable .md file', async () => {
    let exportedBlob: Blob | undefined;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn((blob: Blob) => {
        exportedBlob = blob;
        return 'blob:markdown';
      }),
      configurable: true
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true
    });

    await exportNote(
      {
        title: 'Architecture Notes',
        content: '# Hello DevPad'
      },
      'markdown'
    );

    const downloadAnchor = click.mock.instances[0] as HTMLAnchorElement | undefined;

    expect(downloadAnchor?.download).toBe('architecture-notes.md');
    expect(await exportedBlob?.text()).toBe('# Hello DevPad');
    expect(exportedBlob?.type).toContain('text/markdown');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:markdown');
  });

  it('exports HTML as a standalone sanitized document', async () => {
    let exportedBlob: Blob | undefined;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn((blob: Blob) => {
        exportedBlob = blob;
        return 'blob:html';
      }),
      configurable: true
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true
    });

    await exportNote(
      {
        title: 'Client Report',
        content: '# Launch Plan\n\n[unsafe](javascript:alert(1))\n\n<script>alert(1)</script>\n\n```ts\nconsole.log("hi");\n```'
      },
      'html'
    );

    const downloadAnchor = click.mock.instances[0] as HTMLAnchorElement | undefined;
    const html = await exportedBlob?.text();

    expect(downloadAnchor?.download).toBe('client-report.html');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Exported from DevPad');
    expect(html).toContain('Client Report');
    expect(html).toContain('<h1>Launch Plan</h1>');
    expect(html).toContain('<pre><code>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('javascript:alert(1)');
  });

  it('opens a print-ready iframe for PDF export and cleans it up after printing', async () => {
    const exportPromise = exportNote(
      {
        title: 'Printable Note',
        content: '# Heading'
      },
      'pdf'
    );

    const iframe = document.querySelector('iframe');
    if (!(iframe instanceof HTMLIFrameElement)) {
      throw new Error('print iframe was not created');
    }

    let afterPrint: (() => void) | undefined;
    const print = vi.fn();
    const focus = vi.fn();

    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: {
        focus,
        print,
        addEventListener(event: string, callback: () => void): void {
          if (event === 'afterprint') {
            afterPrint = callback;
          }
        }
      }
    });

    iframe.dispatchEvent(new Event('load'));

    expect(focus).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledTimes(1);
    expect(iframe.srcdoc).toContain('Printable Note');
    expect(iframe.srcdoc).toContain('Heading');

    afterPrint?.();
    await exportPromise;

    expect(document.querySelector('iframe')).toBeNull();
  });
});
