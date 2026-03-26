import {
  DEFAULT_NOTE_TITLE,
  EXPORT_NOTE_FILENAME
} from '../constants';
import { renderMarkdownToHtml } from '../preview/render';

export type ExportFormat = 'markdown' | 'html' | 'pdf';

interface ExportPayload {
  title: string;
  content: string;
}

interface DownloadSpec {
  filename: string;
  mimeType: string;
  content: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

export function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9_-]+/giu, '-').replace(/^-+|-+$/gu, '').toLowerCase() || EXPORT_NOTE_FILENAME;
}

export function getExportFilename(title: string, format: ExportFormat): string {
  const safeTitle = sanitizeFilename(title.trim().length > 0 ? title : DEFAULT_NOTE_TITLE);
  switch (format) {
    case 'markdown':
      return `${safeTitle}.md`;
    case 'html':
      return `${safeTitle}.html`;
    case 'pdf':
      return `${safeTitle}.pdf`;
  }
}

function createExportStyles(): string {
  return `
    :root {
      color-scheme: light;
      --bg: #faf7f1;
      --surface: #ffffff;
      --surface-soft: #f2ebdf;
      --border: rgba(19, 23, 29, 0.12);
      --text: #1e2430;
      --text-muted: #5f697a;
      --accent: #8c6935;
      --code-bg: #171a21;
      --code-text: #f7ead3;
      --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Geist", "Segoe UI", Arial, sans-serif;
      line-height: 1.75;
    }

    body {
      padding: 48px 24px;
    }

    .document {
      max-width: 960px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 28px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .document__header {
      padding: 36px 40px 24px;
      border-bottom: 1px solid var(--border);
      background:
        radial-gradient(circle at top left, rgba(140, 105, 53, 0.12), transparent 28%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.85));
    }

    .document__eyebrow {
      margin: 0 0 8px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .document__title {
      margin: 0;
      font-family: "Playfair Display", Georgia, serif;
      font-size: clamp(2rem, 3vw, 3rem);
      line-height: 1.15;
    }

    .document__meta {
      margin: 12px 0 0;
      color: var(--text-muted);
      font-size: 14px;
    }

    .document__content {
      padding: 34px 40px 40px;
      font-size: 16px;
    }

    .document__content > :first-child {
      margin-top: 0;
    }

    .document__content a {
      color: var(--accent);
    }

    .document__content h1,
    .document__content h2,
    .document__content h3,
    .document__content h4,
    .document__content h5,
    .document__content h6 {
      color: #161a22;
      font-family: "Playfair Display", Georgia, serif;
      line-height: 1.2;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
    }

    .document__content p,
    .document__content li,
    .document__content blockquote,
    .document__content td,
    .document__content th {
      word-break: break-word;
    }

    .document__content pre {
      overflow-x: auto;
      padding: 18px 20px;
      border-radius: 20px;
      background: var(--code-bg);
      color: var(--code-text);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .document__content code {
      font-family: "DM Mono", "Cascadia Code", Consolas, monospace;
      font-size: 0.94em;
    }

    .document__content :not(pre) > code {
      padding: 0.18em 0.4em;
      border-radius: 8px;
      background: var(--surface-soft);
      color: #3c2e17;
    }

    .document__content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      border: 1px solid var(--border);
      border-radius: 18px;
      overflow: hidden;
    }

    .document__content th,
    .document__content td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .document__content th {
      background: var(--surface-soft);
      font-family: "DM Mono", "Cascadia Code", Consolas, monospace;
      font-size: 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .document__content tr:last-child td {
      border-bottom: none;
    }

    .document__content blockquote {
      margin: 1.5em 0;
      padding: 0 0 0 18px;
      border-left: 4px solid rgba(140, 105, 53, 0.35);
      color: var(--text-muted);
    }

    .document__content hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2em 0;
    }

    @page {
      size: A4;
      margin: 16mm;
    }

    @media print {
      body {
        padding: 0;
        background: #fff;
      }

      .document {
        max-width: none;
        border: none;
        border-radius: 0;
        box-shadow: none;
      }

      .document__header,
      .document__content {
        padding-left: 0;
        padding-right: 0;
      }
    }
  `;
}

function formatExportTimestamp(): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date());
}

export function buildHtmlExportDocument(payload: ExportPayload, sourceDocument: Document = document): string {
  const title = payload.title.trim().length > 0 ? payload.title : DEFAULT_NOTE_TITLE;
  const renderedHtml = renderMarkdownToHtml(payload.content, sourceDocument);
  const escapedTitle = escapeHtml(title);
  const exportedAt = escapeHtml(formatExportTimestamp());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedTitle}</title>
    <meta name="generator" content="DevPad" />
    <style>${createExportStyles()}</style>
  </head>
  <body>
    <article class="document">
      <header class="document__header">
        <p class="document__eyebrow">Exported from DevPad</p>
        <h1 class="document__title">${escapedTitle}</h1>
        <p class="document__meta">Generated ${exportedAt}</p>
      </header>
      <main class="document__content">
        ${renderedHtml.length > 0 ? renderedHtml : '<p></p>'}
      </main>
    </article>
  </body>
</html>`;
}

function buildDownloadSpec(payload: ExportPayload, format: 'markdown' | 'html', sourceDocument: Document): DownloadSpec {
  if (format === 'markdown') {
    return {
      filename: getExportFilename(payload.title, format),
      mimeType: 'text/markdown;charset=utf-8',
      content: payload.content
    };
  }

  return {
    filename: getExportFilename(payload.title, format),
    mimeType: 'text/html;charset=utf-8',
    content: buildHtmlExportDocument(payload, sourceDocument)
  };
}

function downloadFile(spec: DownloadSpec, sourceDocument: Document): void {
  const blob = new Blob([spec.content], { type: spec.mimeType });
  const urlApi = sourceDocument.defaultView?.URL ?? URL;
  const objectUrl = urlApi.createObjectURL(blob);
  const anchor = sourceDocument.createElement('a');
  anchor.href = objectUrl;
  anchor.download = spec.filename;
  anchor.click();
  urlApi.revokeObjectURL(objectUrl);
}

export function printHtmlDocument(title: string, html: string, sourceDocument: Document = document): Promise<void> {
  const sourceWindow = sourceDocument.defaultView ?? window;

  return new Promise((resolve, reject) => {
    const iframe = sourceDocument.createElement('iframe');
    let completionTimer = 0;
    let settled = false;

    const finish = (error?: Error): void => {
      if (settled) {
        return;
      }

      settled = true;
      sourceWindow.clearTimeout(completionTimer);
      iframe.remove();

      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    };

    iframe.setAttribute('aria-hidden', 'true');
    iframe.title = `Print ${title || DEFAULT_NOTE_TITLE}`;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    iframe.addEventListener('load', () => {
      const frameWindow = iframe.contentWindow;

      if (frameWindow === null) {
        finish(new Error('PDF export is unavailable in this browser'));
        return;
      }

      if (typeof frameWindow.addEventListener === 'function') {
        frameWindow.addEventListener('afterprint', () => {
          finish();
        }, { once: true });
      }

      completionTimer = sourceWindow.setTimeout(() => {
        finish();
      }, 1000);

      try {
        frameWindow.focus?.();
        frameWindow.print();
      } catch (error) {
        finish(new Error(error instanceof Error ? error.message : 'PDF export failed'));
      }
    }, { once: true });

    sourceDocument.body.append(iframe);
    iframe.srcdoc = html;
  });
}

export async function exportNote(payload: ExportPayload, format: ExportFormat, sourceDocument: Document = document): Promise<void> {
  if (format === 'pdf') {
    await printHtmlDocument(payload.title, buildHtmlExportDocument(payload, sourceDocument), sourceDocument);
    return;
  }

  downloadFile(buildDownloadSpec(payload, format, sourceDocument), sourceDocument);
}
